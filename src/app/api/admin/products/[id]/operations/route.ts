import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { notifyLowStockProduct } from '@/lib/inventory/stock-alerts';

const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('archive'), note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal('restore'), availability_status: z.enum(['in_stock', 'on_demand', 'out_of_stock']).default('in_stock') }),
  z.object({ action: z.literal('reserve'), note: z.string().trim().max(500).optional(), reserved_until: z.string().trim().optional(), quantity: z.coerce.number().int().positive().default(1) }),
  z.object({ action: z.literal('release') }),
  z.object({ action: z.literal('directors_pick'), enabled: z.coerce.boolean(), display_order: z.coerce.number().int().default(0), curator_note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal('stock_update'), stock_quantity: z.coerce.number().int().min(0), note: z.string().trim().max(500).optional() }),
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = operationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  if (parsed.data.action === 'archive') {
    updates.is_active = false;
    updates.in_stock = false;
    updates.stock_status = 'out_of_stock';
    updates.availability_status = 'archived';
    updates.reservation_note = parsed.data.note ?? 'Archived by admin';
  } else if (parsed.data.action === 'restore') {
    updates.is_active = true;
    updates.in_stock = parsed.data.availability_status === 'in_stock';
    updates.stock_status = parsed.data.availability_status === 'out_of_stock' ? 'out_of_stock' : 'in_stock';
    updates.availability_status = parsed.data.availability_status;
  } else if (parsed.data.action === 'reserve') {
    updates.availability_status = 'reserved';
    updates.manual_reserve_enabled = true;
    updates.reserved_quantity = parsed.data.quantity;
    updates.reserved_by_admin_id = auth.user.id;
    updates.reserved_until = parsed.data.reserved_until || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    updates.reservation_note = parsed.data.note ?? 'Reserved by admin';
  } else if (parsed.data.action === 'release') {
    updates.availability_status = 'in_stock';
    updates.manual_reserve_enabled = false;
    updates.reserved_quantity = 0;
    updates.reserved_by_admin_id = null;
    updates.reserved_by_customer_id = null;
    updates.reserved_until = null;
    updates.reservation_note = null;
  } else if (parsed.data.action === 'directors_pick') {
    updates.is_directors_pick = parsed.data.enabled;
    updates.display_order = parsed.data.display_order;
    updates.curator_note = parsed.data.curator_note ?? null;
    if (parsed.data.enabled) updates.configurator_enabled = true;
  } else if (parsed.data.action === 'stock_update') {
    const stockQuantity = parsed.data.stock_quantity;
    updates.stock_quantity = stockQuantity;
    updates.in_stock = stockQuantity > 0;
    updates.stock_status = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    updates.availability_status = stockQuantity > 0 ? 'in_stock' : 'out_of_stock';
    updates.reservation_note = parsed.data.note ?? null;
  }

  const { data, error } = await db.from('products').update(updates).eq('id', id).select('id, sku, name, category, stock_quantity').single();
  if (error || !data) return NextResponse.json({ error: 'Failed to update product workflow' }, { status: 500 });

  await logAdminAction({
    userId: auth.user.id,
    action: `product_${parsed.data.action}`,
    resourceType: 'product',
    resourceId: id,
    details: { updates, product: data },
    ipAddress: getRequestIp(request),
  });

  if (parsed.data.action === 'stock_update' || parsed.data.action === 'restore') {
    await notifyLowStockProduct(data as { id: string; sku: string | null; name: string; category: string | null; stock_quantity: number | null }, `product_${parsed.data.action}`);
  }

  return NextResponse.json({ success: true, product: data });
}