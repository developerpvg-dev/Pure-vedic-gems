import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { cancelOrderAndReleaseInventory } from '@/lib/inventory/order-availability';
import { notifyAdmins, notifyUser } from '@/lib/notifications/in-app';

const CANCELLABLE = new Set(['pending_payment', 'placed', 'confirmed']);

/**
 * POST /api/orders/[id]/cancel
 * Customer cancels their own order (pre-shipping). Restores stock automatically.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to cancel this order' }, { status: 401 });
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: order, error } = await db
    .from('orders')
    .select('id, order_number, status, customer_id, guest_phone, guest_name, guest_email, items')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const orderRow = order as {
    id: string;
    order_number: string;
    status: string;
    customer_id: string | null;
    guest_phone: string | null;
    guest_name: string | null;
    guest_email: string | null;
    items: unknown;
  };

  if (orderRow.customer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!CANCELLABLE.has(orderRow.status)) {
    return NextResponse.json(
      {
        error:
          'This order can no longer be cancelled online. Please contact us and we will help with a return or refund.',
      },
      { status: 400 },
    );
  }

  await cancelOrderAndReleaseInventory(orderRow, 'Cancelled by customer');

  await notifyAdmins({
    type: 'order_cancelled',
    title: 'Order cancelled by customer',
    message: `Order ${orderRow.order_number} was cancelled by the customer. Review and process any refund if payment was captured.`,
    href: `/admin/orders/${id}`,
    entityType: 'order',
    entityId: id,
    recipientRole: 'fulfillment',
    metadata: { order_number: orderRow.order_number, cancelled_by: 'customer' },
  });

  await notifyUser({
    recipientUserId: user.id,
    type: 'order_cancelled',
    title: 'Order cancelled',
    message: `Your order ${orderRow.order_number} has been cancelled.`,
    href: '/account/orders',
    entityType: 'order',
    entityId: id,
    metadata: { order_number: orderRow.order_number, status: 'cancelled' },
  });

  return NextResponse.json({ success: true, status: 'cancelled' });
}
