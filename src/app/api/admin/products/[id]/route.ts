import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { productUpdateSchema } from '@/lib/validators/product';
import type { ProductUpdateInput } from '@/lib/validators/product';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';

type RelatedProductPayload = Pick<
  ProductUpdateInput,
  'category_assignments' | 'currency_prices' | 'option_rules'
>;

type UntypedMutationResult = Promise<{ error: { message?: string } | null }>;
type UntypedSingleResult = Promise<{ data: { id: string } | null; error: unknown }>;

type UntypedTable = {
  upsert: (payload: unknown, options?: unknown) => UntypedMutationResult;
  insert: (payload: unknown) => UntypedMutationResult;
  delete: () => { eq: (column: string, value: unknown) => UntypedMutationResult };
  select: (columns: string) => {
    eq: (column: string, value: unknown) => { single: () => UntypedSingleResult };
  };
};

type UntypedDb = { from: (table: string) => UntypedTable };

function splitProductPayload(payload: ProductUpdateInput) {
  const { category_assignments, currency_prices, option_rules, ...productPayload } = payload;
  return {
    productPayload,
    relatedPayload: { category_assignments, currency_prices, option_rules },
  };
}

async function resolveCategoryId(db: UntypedDb, categoryId?: string, categorySlug?: string) {
  if (categoryId) return categoryId;
  if (!categorySlug) return null;

  const { data } = await db
    .from('product_categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  return data?.id ?? null;
}

async function persistRelatedProductData(
  db: UntypedDb,
  productId: string,
  relatedPayload: RelatedProductPayload
) {
  const { option_rules, currency_prices, category_assignments } = relatedPayload;

  if (option_rules) {
    const { error } = await db
      .from('product_option_rules')
      .upsert({ product_id: productId, ...option_rules }, { onConflict: 'product_id' });
    if (error) throw new Error(error.message ?? 'Failed to save product option rules');
  }

  if (currency_prices?.length) {
    const rows = currency_prices.map((price) => ({ product_id: productId, ...price }));
    const { error } = await db
      .from('product_currency_prices')
      .upsert(rows, { onConflict: 'product_id,currency' });
    if (error) throw new Error(error.message ?? 'Failed to save product currency prices');
  }

  if (category_assignments) {
    const deleteResult = await db
      .from('product_category_assignments')
      .delete()
      .eq('product_id', productId);
    if (deleteResult.error) {
      throw new Error(deleteResult.error.message ?? 'Failed to reset product categories');
    }

    const rows = [];
    for (const assignment of category_assignments) {
      const categoryId = await resolveCategoryId(
        db,
        assignment.category_id,
        assignment.category_slug
      );
      if (!categoryId) continue;
      rows.push({
        product_id: productId,
        category_id: categoryId,
        is_primary: assignment.is_primary,
        sort_order: assignment.sort_order,
        legacy_path: assignment.legacy_path ?? null,
      });
    }

    if (rows.length) {
      const { error } = await db.from('product_category_assignments').insert(rows);
      if (error) throw new Error(error.message ?? 'Failed to save product categories');
    }
  }
}

// ── GET: single product (admin view — includes inactive) ────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { data: product, error } = await admin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product });
}

// ── PUT: update product ─────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('products')
    .select('sku, name, price, availability_status, is_active')
    .eq('id', id)
    .single();

  const { productPayload, relatedPayload } = splitProductPayload(parsed.data);
  const updatePayload = { ...productPayload, updated_at: new Date().toISOString() };
  const { data: product, error } = await (admin
    .from('products') as ReturnType<typeof admin.from>)
    .update(updatePayload as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Duplicate SKU or slug' }, { status: 409 });
    }
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }

  try {
    await persistRelatedProductData(admin as unknown as UntypedDb, id, relatedPayload);
  } catch (relatedError) {
    console.error('Product related data save error:', relatedError);
    return NextResponse.json(
      { error: relatedError instanceof Error ? relatedError.message : 'Product updated but related data failed to save' },
      { status: 500 }
    );
  }

  await logAdminAction({
    userId: auth.user.id,
    action: before?.price !== product.price ? 'product_price_edit' : 'product_edit',
    resourceType: 'product',
    resourceId: id,
    details: { previous: before, updated: product },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ product });
}

// ── DELETE: soft-delete (deactivate) product ────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('products.delete');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { error } = await (admin
    .from('products') as ReturnType<typeof admin.from>)
    .update({ is_active: false, availability_status: 'archived', stock_status: 'out_of_stock', updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to deactivate product' }, { status: 500 });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'product_archive',
    resourceType: 'product',
    resourceId: id,
  });

  return NextResponse.json({ success: true });
}
