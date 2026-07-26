import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/utils/admin-log';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { sendTrackingUpdateEmail } from '@/lib/resend/send-tracking-update';
import { sendOrderCancelledEmail } from '@/lib/resend/send-order-cancelled';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { releaseProductsForOrder } from '@/lib/inventory/order-availability';
import { cancelRewardRedemption } from '@/lib/rewards/service';
import { mergeComplianceFlags, parseComplianceFlags } from '@/lib/orders/returns';
import { OrderCommissionSchema } from '@/lib/validators/order';
import { ORDER_STATUSES } from '@/lib/constants/order-status';

const VALID_STATUSES = ORDER_STATUSES as readonly string[];
const AUTO_CUSTOMER_NOTIFY_STATUSES = new Set(['shipped', 'out_for_delivery', 'delivered']);

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
    commission_source,
    commission_name,
    commission_amount,
    commissions,
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
  if (
    commission_source !== undefined &&
    commission_source !== null &&
    commission_source !== '' &&
    commission_source !== 'salesperson' &&
    commission_source !== 'astrologer'
  ) {
    return NextResponse.json(
      { error: 'commission_source must be salesperson, astrologer, or empty' },
      { status: 400 },
    );
  }
  if (commission_amount !== undefined && commission_amount !== null && commission_amount !== '') {
    const amt = Number(commission_amount);
    if (!Number.isFinite(amt) || amt < 0) {
      return NextResponse.json({ error: 'commission_amount must be a non-negative number' }, { status: 400 });
    }
  }
  const parsedCommissions =
    commissions === undefined ? null : OrderCommissionSchema.array().max(20).safeParse(commissions);
  if (parsedCommissions && !parsedCommissions.success) {
    return NextResponse.json({ error: 'Invalid commission recipients' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  // Fetch current order for logging
  const { data: currentRaw } = await db
    .from('orders')
    .select('id, order_number, guest_email, guest_name, guest_phone, customer_id, status, tracking_number, tracking_url, carrier, estimated_delivery, internal_notes, assigned_to, product_video_url, puja_video_url, items, delivery_status, compliance_flags, design_completed_at')
    .eq('id', id)
    .single();

  type CurrentOrderRow = {
    id: string;
    order_number: string;
    guest_email: string | null;
    guest_name: string | null;
    guest_phone?: string | null;
    customer_id: string | null;
    status: string;
    tracking_number: string | null;
    tracking_url: string | null;
    carrier?: string | null;
    estimated_delivery?: string | null;
    product_video_url?: string | null;
    puja_video_url?: string | null;
    items?: unknown;
    delivery_status?: string | null;
    compliance_flags?: unknown;
    design_completed_at?: string | null;
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
  if (status !== undefined) {
    updates.status = status;
    if (status === 'design_completed') {
      updates.design_completed_at = new Date().toISOString();
    }
    if (status === 'design_assigned' && current.design_completed_at) {
      updates.design_completed_at = null;
    }
    if (status === 'delivered' && current.status !== 'delivered') {
      const flags = parseComplianceFlags(current.compliance_flags);
      if (!flags.delivered_at) {
        updates.compliance_flags = mergeComplianceFlags(flags, {
          delivered_at: new Date().toISOString(),
        });
      }
    }
    // Keep courier delivery_status in sync when order status advances through ship/OFD/delivered
    if (status === 'shipped' && delivery_status === undefined) updates.delivery_status = 'in_transit';
    if (status === 'out_for_delivery' && delivery_status === undefined) updates.delivery_status = 'out_for_delivery';
    if (status === 'delivered' && delivery_status === undefined) updates.delivery_status = 'delivered';
  }
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
  if (commission_source !== undefined) {
    updates.commission_source =
      commission_source === '' || commission_source === null ? null : commission_source;
  }
  if (commission_name !== undefined) {
    updates.commission_name =
      typeof commission_name === 'string' ? commission_name.trim() || null : commission_name;
  }
  if (commission_amount !== undefined) {
    updates.commission_amount =
      commission_amount === '' || commission_amount === null
        ? null
        : Number(commission_amount);
  }
  if (parsedCommissions?.success) {
    const first = parsedCommissions.data[0];
    updates.commissions = parsedCommissions.data;
    updates.commission_source = first?.source ?? null;
    updates.commission_name = first?.name ?? null;
    updates.commission_amount = first?.amount ?? null;
  }

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
    const detail = error.message || '';
    const hint = detail.includes('commissions')
      ? ' Run supabase/week44_offline_order_manual_designs.sql in Supabase.'
      : detail.includes('commission_')
        ? ' Run supabase/week39_order_commission.sql in Supabase.'
      : '';
    return NextResponse.json(
      { error: `Failed to update order.${hint}` },
      { status: 500 },
    );
  }
  const updatedOrder = updated as { status: string };

  // Cancel / refund / return → put unique pieces back in stock
  const becameCancelledOrRefunded =
    status &&
    status !== current.status &&
    (status === 'cancelled' || status === 'refunded');
  const becameReturned =
    delivery_status === 'returned' && current.delivery_status !== 'returned';

  if (becameCancelledOrRefunded || becameReturned) {
    await releaseProductsForOrder(current);
    if (becameCancelledOrRefunded) {
      await cancelRewardRedemption(id);
    }
  }

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

  if (trackingChanged || productVideoAdded || pujaVideoAdded || (status && status !== current.status)) {
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

  const nextStatus = updatedOrder.status;
  const statusChanged = nextStatus !== current.status;
  // Always email customer when order hits ship / OFD / delivered (plus opt-in notify_customer)
  const shouldEmailCustomer =
    Boolean(customerEmail) &&
    (notify_customer || (statusChanged && AUTO_CUSTOMER_NOTIFY_STATUSES.has(nextStatus)));

  let trackingEmailId: string | null = null;
  if (shouldEmailCustomer && customerEmail) {
    if (becameCancelledOrRefunded && nextStatus === 'cancelled') {
      trackingEmailId = await sendOrderCancelledEmail({
        to: customerEmail,
        customerName,
        orderNumber: current.order_number,
        reason: 'Cancelled by Pure Vedic Gems',
        cancelledBy: 'admin',
      });
    } else {
      trackingEmailId = await sendTrackingUpdateEmail({
        to: customerEmail,
        customerName,
        orderNumber: current.order_number,
        status: nextStatus,
        carrier: carrier ?? current.carrier ?? null,
        trackingNumber: tracking_number ?? current.tracking_number ?? null,
        trackingUrl: tracking_url ?? current.tracking_url ?? null,
        estimatedDelivery: estimated_delivery ?? current.estimated_delivery ?? null,
      });
    }
  }

  if (trackingChanged || productVideoAdded || pujaVideoAdded || statusChanged) {
    const customerTitle =
      nextStatus === 'shipped'
        ? 'Order shipped'
        : nextStatus === 'out_for_delivery'
          ? 'Out for delivery'
          : nextStatus === 'delivered'
            ? 'Order delivered'
            : trackingChanged
              ? 'Tracking updated'
              : 'Order status updated';
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
            : customerTitle,
        message: productVideoAdded
          ? `Your product video for order ${current.order_number} is ready.`
          : pujaVideoAdded
            ? `Your puja video for order ${current.order_number} is ready.`
            : `Order ${current.order_number} is now ${nextStatus.replace(/_/g, ' ')}.`,
        href: '/account/orders',
        entityType: 'order',
        entityId: id,
        metadata: {
          order_number: current.order_number,
          status: nextStatus,
          tracking_number: tracking_number ?? current.tracking_number ?? null,
        },
      }] : []),
      {
        audience: 'admin' as const,
        recipientRole: trackingChanged || AUTO_CUSTOMER_NOTIFY_STATUSES.has(nextStatus) ? 'fulfillment' : null,
        type: trackingChanged ? 'order_tracking_update' : 'order_status_update',
        title: trackingChanged ? 'Order tracking updated' : 'Order status changed',
        message: `Order ${current.order_number} changed from ${current.status.replace(/_/g, ' ')} to ${nextStatus.replace(/_/g, ' ')}.`,
        href: `/admin/orders/${id}`,
        entityType: 'order',
        entityId: id,
        metadata: {
          order_number: current.order_number,
          previous_status: current.status,
          status: nextStatus,
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
