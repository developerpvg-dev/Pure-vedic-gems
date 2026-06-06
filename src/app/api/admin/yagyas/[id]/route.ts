import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { yagyaUpdateSchema } from '@/lib/validators/yagya';

const YAGYA_COLUMNS =
  'id, sku, name, slug, price, short_desc, description, benefits, images, thumbnail_url, planet, service_duration, service_delivery_mode, display_order, is_active, created_at, updated_at';

// ── GET: single yagya ───────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .select(YAGYA_COLUMNS)
    .eq('id', id)
    .eq('product_type', 'service')
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Yagya not found' }, { status: 404 });
  }
  return NextResponse.json({ yagya: data });
}

// ── PATCH: update a yagya ───────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = yagyaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('products')
    .select('sku, name, price, is_active')
    .eq('id', id)
    .eq('product_type', 'service')
    .maybeSingle();

  if (!before) {
    return NextResponse.json({ error: 'Yagya not found' }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
  if (!('thumbnail_url' in parsed.data) && Array.isArray(parsed.data.images)) {
    updatePayload.thumbnail_url = parsed.data.images[0] ?? null;
  }

  const { data: product, error } = await (admin.from('products') as ReturnType<typeof admin.from>)
    .update(updatePayload)
    .eq('id', id)
    .select(YAGYA_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Duplicate SKU or slug' }, { status: 409 });
    }
    console.error('Yagya update error:', error);
    return NextResponse.json({ error: 'Failed to update yagya' }, { status: 500 });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: before.price !== product.price ? 'product_price_edit' : 'product_edit',
    resourceType: 'product',
    resourceId: id,
    details: { previous: before, updated: { name: product.name, price: product.price, is_active: product.is_active } },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ yagya: product });
}

// ── DELETE: archive a yagya (soft delete) ───────────────────────────
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: product, error } = await (admin.from('products') as ReturnType<typeof admin.from>)
    .update({ is_active: false, availability_status: 'archived', updated_at: new Date().toISOString() } as Record<string, unknown>)
    .eq('id', id)
    .eq('product_type', 'service')
    .select('id, name')
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Yagya not found' }, { status: 404 });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'product_archive',
    resourceType: 'product',
    resourceId: id,
    details: { yagya: product.name },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true });
}
