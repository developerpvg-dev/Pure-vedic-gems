import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/utils/admin-log';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { sendTrackingUpdateEmail } from '@/lib/resend/send-tracking-update';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { createInAppNotifications } from '@/lib/notifications/in-app';

const VALID_STATUSES = [
  'pending_payment', 'placed', 'confirmed', 'processing',
  'design_assigned', 'design_in_progress', 'design_completed',
  'jewelry_making', 'certification', 'energization',
  'quality_check', 'shipped', 'delivered', 'cancelled', 'refunded',
  'payment_review',
];

const VALID_DELIVERY_STATUSES = ['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed'];

/**
 * GET /api/admin/orders/[id]
 * Single order detail.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

/**
 * PUT /api/admin/orders/[id]
 * Update order status, tracking, notes, and other admin-editable fields.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json();

  const {
    status,
    tracking_number,
    tracking_url,
    carrier,
    estimated_delivery,
    shipped_at,
    delivery_status,
    admin_notes,
    assigned_to,
    notify_customer,
    product_video_url,
    puja_video_url,
  } = body;

  // Validate status if provided
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }
  if (delivery_status && !VALID_DELIVERY_STATUSES.includes(delivery_status)) {
    return NextResponse.json({ error: `Invalid delivery_status. Must be one of: ${VALID_DELIVERY_STATUSES.join(', ')}` }, { status: 400 });
  }

  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  // Fetch current order for logging
  const { data: currentRaw } = await db
    .from('orders')
    .select('id, order_number, guest_email, guest_name, customer_id, status, tracking_number, tracking_url, internal_notes, assigned_to, product_video_url, puja_video_url')
    .eq('id', id)
    .single();

  type CurrentOrderRow = {
    id: string;
    order_number: string;
    guest_email: string | null;
    guest_name: string | null;
    customer_id: string | null;
    status: string;
    tracking_number: string | null;
    tracking_url: string | null;
    product_video_url?: string | null;
    puja_video_url?: string | null;
  };

  const current = currentRaw as CurrentOrderRow | null;

  if (!current) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const { data: customerProfile } = current.customer_id
    ? await supabase
        .from('customer_profiles')
        .select('full_name, email, phone')
        .eq('id', current.customer_id)
        .single()
    : { data: null };
  const customerEmail = current.guest_email || customerProfile?.email || null;
  const customerName = current.guest_name || customerProfile?.full_name || customerProfile?.email || null;

  // Build update object — only include provided fields
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (tracking_number !== undefined) updates.tracking_number = tracking_number;
  if (tracking_url !== undefined) updates.tracking_url = tracking_url;
  if (carrier !== undefined) updates.carrier = carrier;
  if (estimated_delivery !== undefined) updates.estimated_delivery = estimated_delivery;
  if (shipped_at !== undefined) updates.shipped_at = shipped_at;
  if (delivery_status !== undefined) updates.delivery_status = delivery_status;
  if (admin_notes !== undefined) updates.internal_notes = admin_notes;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;
  if (product_video_url !== undefined) updates.product_video_url = product_video_url || null;
  if (puja_video_url !== undefined) updates.puja_video_url = puja_video_url || null;

  const preShipStatuses = new Set([
    'pending_payment', 'placed', 'confirmed', 'processing',
    'design_assigned', 'design_in_progress', 'design_completed',
    'jewelry_making', 'certification', 'energization', 'quality_check',
  ]);
  if (
    tracking_number !== undefined &&
    tracking_number &&
    status === undefined &&
    preShipStatuses.has(current.status)
  ) {
    updates.status = 'shipped';
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await db
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/orders] Update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
  const updatedOrder = updated as { status: string };

  // Log the activity
  const ip = getRequestIp(request);
  const trackingChanged =
    tracking_number !== undefined ||
    tracking_url !== undefined ||
    carrier !== undefined ||
    estimated_delivery !== undefined ||
    shipped_at !== undefined ||
    delivery_status !== undefined;

  const productVideoAdded =
    product_video_url !== undefined &&
    product_video_url &&
    product_video_url !== current.product_video_url;
  const pujaVideoAdded =
    puja_video_url !== undefined &&
    puja_video_url &&
    puja_video_url !== current.puja_video_url;

  if (trackingChanged || (status && status !== current.status)) {
    await db.from('order_tracking_events').insert({
      order_id: id,
      status: delivery_status || status || updatedOrder.status,
      carrier: carrier ?? null,
      tracking_number: tracking_number ?? current.tracking_number ?? null,
      tracking_url: tracking_url ?? current.tracking_url ?? null,
      event_time: new Date().toISOString(),
      note: notify_customer ? 'Tracking update sent to customer' : 'Admin tracking/status update',
      created_by: auth.user.id,
      is_customer_visible: true,
    });
  }

  if (productVideoAdded) {
    await db.from('order_tracking_events').insert({
      order_id: id,
      status: 'product_video',
      event_time: new Date().toISOString(),
      note: 'Your product video is ready to view.',
      created_by: auth.user.id,
      is_customer_visible: true,
    });
  }

  if (pujaVideoAdded) {
    await db.from('order_tracking_events').insert({
      order_id: id,
      status: 'puja_video',
      event_time: new Date().toISOString(),
      note: 'Your puja / energization video is ready to view.',
      created_by: auth.user.id,
      is_customer_visible: true,
    });
  }

  let trackingEmailId: string | null = null;
  if (notify_customer && customerEmail) {
    trackingEmailId = await sendTrackingUpdateEmail({
      to: customerEmail,
      customerName,
      orderNumber: current.order_number,
      status: status || updatedOrder.status,
      carrier: carrier ?? null,
      trackingNumber: tracking_number ?? current.tracking_number ?? null,
      trackingUrl: tracking_url ?? current.tracking_url ?? null,
      estimatedDelivery: estimated_delivery ?? null,
    });
  }

  if (trackingChanged || productVideoAdded || pujaVideoAdded || (status && status !== current.status)) {
    await createInAppNotifications([
      ...(current.customer_id ? [{
        audience: 'user' as const,
        recipientUserId: current.customer_id,
        type: productVideoAdded
          ? 'order_video_ready'
          : pujaVideoAdded
            ? 'order_video_ready'
            : trackingChanged
              ? 'order_tracking_update'
              : 'order_status_update',
        title: productVideoAdded
          ? 'Product video ready'
          : pujaVideoAdded
            ? 'Puja video ready'
            : trackingChanged
              ? 'Tracking updated'
              : 'Order status updated',
        message: productVideoAdded
          ? `Your product video for order ${current.order_number} is ready.`
          : pujaVideoAdded
            ? `Your puja video for order ${current.order_number} is ready.`
            : `Order ${current.order_number} is now ${(status || updatedOrder.status).replace(/_/g, ' ')}.`,
        href: '/account/orders',
        entityType: 'order',
        entityId: id,
        metadata: {
          order_number: current.order_number,
          status: status || updatedOrder.status,
          tracking_number: tracking_number ?? current.tracking_number ?? null,
        },
      }] : []),
      {
        audience: 'admin' as const,
        recipientRole: trackingChanged ? 'fulfillment' : null,
        type: trackingChanged ? 'order_tracking_update' : 'order_status_update',
        title: trackingChanged ? 'Order tracking updated' : 'Order status changed',
        message: `Order ${current.order_number} changed from ${current.status.replace(/_/g, ' ')} to ${(status || updatedOrder.status).replace(/_/g, ' ')}.`,
        href: `/admin/orders/${id}`,
        entityType: 'order',
        entityId: id,
        metadata: {
          order_number: current.order_number,
          previous_status: current.status,
          status: status || updatedOrder.status,
          tracking_number: tracking_number ?? current.tracking_number ?? null,
        },
      },
    ]);
  }

  await logAdminAction({
    userId: auth.user.id,
    action: trackingChanged ? 'tracking_update' : status && status !== current.status ? 'order_status_change' : 'order_update',
    resourceType: 'order',
    resourceId: id,
    details: {
      previous: { status: current.status, tracking: current.tracking_number },
      updated: updates,
      trackingEmailId,
    },
    ipAddress: ip,
  });

  return NextResponse.json({ order: updated });
}
