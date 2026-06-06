import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { yagyaCreateSchema } from '@/lib/validators/yagya';

const YAGYA_COLUMNS =
  'id, sku, name, slug, price, short_desc, description, benefits, images, thumbnail_url, planet, service_duration, service_delivery_mode, display_order, is_active, created_at, updated_at';

// ── GET: list all yagyas (services) ─────────────────────────────────
export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .select(YAGYA_COLUMNS)
    .eq('product_type', 'service')
    .eq('category', 'service')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Yagya list error:', error);
    return NextResponse.json({ error: 'Failed to load yagyas' }, { status: 500 });
  }

  return NextResponse.json({ yagyas: data ?? [] });
}

// ── POST: create a new yagya ────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = yagyaCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const admin = createAdminClient();

  // Resolve the yagyas service category for the primary assignment.
  const { data: category } = await admin
    .from('product_categories')
    .select('id')
    .eq('slug', 'yagyas')
    .maybeSingle();

  const insertPayload = {
    sku: input.sku,
    name: input.name,
    slug: input.slug,
    category: 'service',
    product_type: 'service',
    price: input.price,
    price_mode: 'fixed',
    currency: 'INR',
    tax_status: 'taxable',
    short_desc: input.short_desc ?? null,
    description: input.description ?? null,
    benefits: input.benefits,
    images: input.images,
    thumbnail_url: input.thumbnail_url ?? input.images[0] ?? null,
    planet: input.planet ?? null,
    service_duration: input.service_duration ?? null,
    service_delivery_mode: input.service_delivery_mode ?? null,
    display_order: input.display_order,
    is_active: input.is_active,
    in_stock: true,
    stock_quantity: 999,
    stock_status: 'in_stock',
    availability_status: 'in_stock',
    sold_individually: false,
  };

  const { data: product, error } = await (admin.from('products') as ReturnType<typeof admin.from>)
    .insert(insertPayload as Record<string, unknown>)
    .select(YAGYA_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Duplicate SKU or slug' }, { status: 409 });
    }
    console.error('Yagya create error:', error);
    return NextResponse.json({ error: 'Failed to create yagya' }, { status: 500 });
  }

  if (category?.id) {
    await (admin.from('product_category_assignments') as ReturnType<typeof admin.from>)
      .upsert(
        {
          product_id: product.id,
          category_id: category.id,
          is_primary: true,
          sort_order: input.display_order,
        } as Record<string, unknown>,
        { onConflict: 'product_id,category_id' }
      );
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'product_create',
    resourceType: 'product',
    resourceId: product.id,
    details: { yagya: product.name },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ yagya: product }, { status: 201 });
}
