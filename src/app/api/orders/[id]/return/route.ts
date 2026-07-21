import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { notifyAdmins, notifyUser } from '@/lib/notifications/in-app';
import {
  evaluateReturnEligibility,
  getDeliveredAt,
  mergeComplianceFlags,
  normalizeReturnImageUrls,
  resolveReturnWindowDays,
} from '@/lib/orders/returns';
import { parseOrderItems } from '@/lib/customer/orders';

/**
 * POST /api/orders/[id]/return
 * Customer requests a return within the product return window after delivery.
 * Requires at least one product photo — admin must verify images before refund.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to request a return' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (!reason) {
    return NextResponse.json({ error: 'Please share a reason for the return' }, { status: 400 });
  }

  const imageUrls = normalizeReturnImageUrls(body.image_urls);
  if (!imageUrls.length) {
    return NextResponse.json(
      { error: 'Upload at least one clear photo of the product before requesting a return' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data: order, error } = await db
    .from('orders')
    .select('id, order_number, status, customer_id, return_status, compliance_flags, updated_at, items')
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
    return_status: string;
    compliance_flags: unknown;
    updated_at: string;
    items: unknown;
  };

  if (orderRow.customer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const items = parseOrderItems(orderRow.items as never);
  const productIds = [...new Set(items.map((item) => item.product_id).filter(Boolean))] as string[];

  let products: Array<{ return_eligibility?: string | null; return_window_days?: number | null }> = [];
  if (productIds.length) {
    const { data } = await db
      .from('products')
      .select('id, return_eligibility, return_window_days')
      .in('id', productIds);
    products = (data ?? []) as typeof products;
  }

  const { windowDays, allNonReturnable } = resolveReturnWindowDays(products);
  const deliveredAt = getDeliveredAt(orderRow);
  const eligibility = evaluateReturnEligibility({
    orderStatus: orderRow.status,
    returnStatus: orderRow.return_status || 'none',
    deliveredAt,
    windowDays,
    allNonReturnable,
  });

  if (!eligibility.eligible) {
    return NextResponse.json({ error: eligibility.reason }, { status: 400 });
  }

  const now = new Date().toISOString();
  const compliance_flags = mergeComplianceFlags(orderRow.compliance_flags, {
    return_reason: reason,
    return_requested_at: now,
    return_image_urls: imageUrls,
    return_images_verified: false,
    return_images_verified_at: undefined,
  });

  const { error: updateError } = await db
    .from('orders')
    .update({
      return_status: 'requested',
      refund_status: 'requested',
      compliance_flags,
    })
    .eq('id', id)
    .eq('return_status', 'none');

  if (updateError) {
    console.error('[orders/return]', updateError);
    return NextResponse.json({ error: 'Could not submit return request' }, { status: 500 });
  }

  await notifyAdmins({
    type: 'order_return_requested',
    title: 'Return requested',
    message: `Customer requested a return for order ${orderRow.order_number}: ${reason}`,
    href: `/admin/orders/${id}`,
    entityType: 'order',
    entityId: id,
    recipientRole: 'fulfillment',
    metadata: { order_number: orderRow.order_number, reason },
  });

  await notifyUser({
    recipientUserId: user.id,
    type: 'order_return_update',
    title: 'Return request received',
    message: `We received your return request for order ${orderRow.order_number}. Our team will review it shortly.`,
    href: '/account/orders',
    entityType: 'order',
    entityId: id,
    metadata: { order_number: orderRow.order_number, return_status: 'requested' },
  });

  return NextResponse.json({
    success: true,
    return_status: 'requested',
    days_left: eligibility.daysLeft,
  });
}
