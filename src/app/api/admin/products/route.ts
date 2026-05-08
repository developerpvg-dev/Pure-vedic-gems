import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { productCreateSchema } from '@/lib/validators/product';
import type { ProductCreateInput } from '@/lib/validators/product';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';

type RelatedProductPayload = Pick<
  ProductCreateInput,
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
const AVAILABILITY_FILTERS = ['in_stock', 'out_of_stock', 'sold', 'reserved', 'on_demand', 'archived'] as const;

function splitProductPayload(payload: ProductCreateInput) {
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

// ── GET: list all products for admin (includes inactive) ────────────
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth && auth.error) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20')));
  const search = searchParams.get('search')?.trim();
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  const availability = searchParams.get('availability_status');

  const admin = createAdminClient();
  let query = admin
    .from('products')
    .select('id, sku, tag_number, legacy_woo_id, name, slug, category, sub_category, price, carat_weight, origin, in_stock, stock_status, availability_status, reserved_until, reservation_note, is_active, featured, is_directors_pick, display_order, images, created_at', { count: 'exact' });

  if (search) {
    const searchClauses = [
      `name.ilike.%${search}%`,
      `sku.ilike.%${search}%`,
      `tag_number.ilike.%${search}%`,
      `slug.ilike.%${search}%`,
      `category.ilike.%${search}%`,
    ];
    const legacyId = Number(search);
    if (Number.isInteger(legacyId) && legacyId > 0) searchClauses.push(`legacy_woo_id.eq.${legacyId}`);
    query = query.or(searchClauses.join(','));
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);
  if (availability && (AVAILABILITY_FILTERS as readonly string[]).includes(availability)) {
    query = query.eq('availability_status', availability as (typeof AVAILABILITY_FILTERS)[number]);
  }

  query = query.order('created_at', { ascending: false });

  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data: products, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  return NextResponse.json({
    products: products ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  });
}

// ── POST: create a product ──────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = productCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { productPayload, relatedPayload } = splitProductPayload(parsed.data);
  const { data: product, error } = await (admin
    .from('products') as ReturnType<typeof admin.from>)
    .insert(productPayload as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A product with this SKU or slug already exists' }, { status: 409 });
    }
    console.error('Product creation error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }

  try {
    await persistRelatedProductData(admin as unknown as UntypedDb, product.id, relatedPayload);
  } catch (relatedError) {
    console.error('Product related data save error:', relatedError);
    return NextResponse.json(
      { error: relatedError instanceof Error ? relatedError.message : 'Product created but related data failed to save' },
      { status: 500 }
    );
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'product_create',
    resourceType: 'product',
    resourceId: product.id,
    details: { sku: product.sku, name: product.name, price: product.price },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ product }, { status: 201 });
}
