import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';

const querySchema = z.object({
  category: z.string().trim().min(1),
  sub_category: z.string().trim().min(1),
});

const updateSchema = z.object({
  category: z.string().trim().min(1),
  sub_category: z.string().trim().min(1),
  items: z.array(z.object({
    id: z.string().uuid(),
    display_order: z.coerce.number().int().min(0),
  })).min(1),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { category, sub_category } = parsed.data;
  const known = KNOWN_GEM_SUBCATEGORIES[sub_category];
  if (!known || known.category !== category) {
    return NextResponse.json({ error: 'Unknown category / sub_category pair' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('products')
    .select('id, name, slug, display_order, legacy_woo_id, in_stock, availability_status, stock_status, thumbnail_url, price, carat_weight, is_active')
    .eq('category', category)
    .eq('sub_category', sub_category)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('legacy_woo_id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }

  return NextResponse.json({
    category,
    sub_category,
    label: known.label,
    products: data ?? [],
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { category, sub_category, items } = parsed.data;
  const known = KNOWN_GEM_SUBCATEGORIES[sub_category];
  if (!known || known.category !== category) {
    return NextResponse.json({ error: 'Unknown category / sub_category pair' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const ids = items.map((item) => item.id);
  const { data: existing, error: loadError } = await db
    .from('products')
    .select('id')
    .eq('category', category)
    .eq('sub_category', sub_category)
    .eq('is_active', true)
    .in('id', ids);

  if (loadError) {
    return NextResponse.json({ error: 'Failed to validate products' }, { status: 500 });
  }

  if ((existing?.length ?? 0) !== ids.length) {
    return NextResponse.json({ error: 'One or more products do not belong to this category' }, { status: 400 });
  }

  const now = new Date().toISOString();
  for (const item of items) {
    const { error } = await db
      .from('products')
      .update({ display_order: item.display_order, updated_at: now })
      .eq('id', item.id)
      .eq('category', category)
      .eq('sub_category', sub_category);

    if (error) {
      return NextResponse.json({ error: 'Failed to save display order' }, { status: 500 });
    }
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'catalog_order_update',
    resourceType: 'product_category',
    resourceId: `${category}/${sub_category}`,
    details: { category, sub_category, count: items.length },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true, updated: items.length });
}
