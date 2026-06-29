import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const updateSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        display_order: z.coerce.number().int().min(0),
      })
    )
    .min(1),
});

const pickColumns =
  'id, sku, name, slug, category, sub_category, price, carat_weight, origin, display_order, curator_note, thumbnail_url, images, is_active, configurator_enabled';

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db
    .from('products')
    .select(pickColumns)
    .eq('is_directors_pick', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load Director\'s Pick products' }, { status: 500 });
  }

  return NextResponse.json({ picks: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { items } = parsed.data;
  const db = asUntypedSupabase(createAdminClient());
  const ids = items.map((item) => item.id);

  const { data: existing, error: loadError } = await db
    .from('products')
    .select('id')
    .eq('is_directors_pick', true)
    .in('id', ids);

  if (loadError) {
    return NextResponse.json({ error: 'Failed to validate products' }, { status: 500 });
  }

  const existingRows = Array.isArray(existing) ? existing : [];
  if (existingRows.length !== ids.length) {
    return NextResponse.json({ error: 'One or more products are not in Director\'s Pick' }, { status: 400 });
  }

  const now = new Date().toISOString();
  for (const item of items) {
    const { error } = await db
      .from('products')
      .update({ display_order: item.display_order, updated_at: now })
      .eq('id', item.id)
      .eq('is_directors_pick', true);

    if (error) {
      return NextResponse.json({ error: 'Failed to save display order' }, { status: 500 });
    }
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'directors_pick_order_update',
    resourceType: 'product',
    resourceId: 'directors_pick',
    details: { count: items.length },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true, updated: items.length });
}
