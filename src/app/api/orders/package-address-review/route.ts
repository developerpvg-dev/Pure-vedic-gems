import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { openPackageAddressReviewToken } from '@/lib/orders/package-address-review-token';
import {
  parsePackageAddressReview,
  recordPackageAddressReviewResponse,
} from '@/lib/orders/package-address-review';
import { notifyAdmins } from '@/lib/notifications/in-app';

/**
 * POST /api/orders/package-address-review
 * Body: { token, decision: 'approved' | 'changes_requested', remarks?: string }
 * Token-gated — no login required (same pattern as product-video review).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const decision = body.decision;
  const remarks = typeof body.remarks === 'string' ? body.remarks : '';

  if (!token) {
    return NextResponse.json({ error: 'Invalid review link' }, { status: 400 });
  }
  if (decision !== 'approved' && decision !== 'changes_requested') {
    return NextResponse.json({ error: 'Choose confirm or report address issue' }, { status: 400 });
  }

  const opened = openPackageAddressReviewToken(token);
  if (!opened) {
    return NextResponse.json({ error: 'This review link is invalid or expired' }, { status: 400 });
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data: orderRaw, error } = await db
    .from('orders')
    .select('id, order_number, compliance_flags')
    .eq('id', opened.orderId)
    .single();

  if (error || !orderRaw) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const order = orderRaw as {
    id: string;
    order_number: string;
    compliance_flags: unknown;
  };

  const current = parsePackageAddressReview(order.compliance_flags);
  if (!current) {
    return NextResponse.json(
      { error: 'No package address review found for this order' },
      { status: 400 },
    );
  }
  if (current.round !== opened.round) {
    return NextResponse.json(
      { error: 'This review link is for an older packing photo set. Please use the latest email link.' },
      { status: 400 },
    );
  }
  if (current.status !== 'pending') {
    return NextResponse.json({
      success: true,
      already_responded: true,
      status: current.status,
      remarks: current.remarks ?? null,
    });
  }

  let result: ReturnType<typeof recordPackageAddressReviewResponse>;
  try {
    result = recordPackageAddressReviewResponse(order.compliance_flags, {
      decision,
      remarks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not save response' },
      { status: 400 },
    );
  }

  const { error: updateError } = await db
    .from('orders')
    .update({ compliance_flags: result.flags })
    .eq('id', order.id);

  if (updateError) {
    console.error('[package-address-review]', updateError);
    return NextResponse.json({ error: 'Could not save your response' }, { status: 500 });
  }

  await db.from('order_tracking_events').insert({
    order_id: order.id,
    status: decision === 'approved' ? 'package_address_confirmed' : 'package_address_issue',
    event_time: new Date().toISOString(),
    note:
      decision === 'approved'
        ? 'Customer confirmed the packed package and address label.'
        : `Customer reported an address issue: ${remarks.trim().slice(0, 200)}`,
    is_customer_visible: true,
  });

  await notifyAdmins({
    type: 'package_address_review',
    title:
      decision === 'approved'
        ? 'Package & address confirmed'
        : 'Package address — issue reported',
    message:
      decision === 'approved'
        ? `Customer confirmed packing photos for order ${order.order_number} (round ${current.round}).`
        : `Customer reported an address issue on order ${order.order_number}: ${remarks.trim().slice(0, 160)}`,
    href: `/admin/orders/${order.id}`,
    entityType: 'order',
    entityId: order.id,
    recipientRole: 'fulfillment',
    metadata: {
      order_number: order.order_number,
      status: decision,
      round: current.round,
    },
  });

  return NextResponse.json({
    success: true,
    already_responded: false,
    status: result.review.status,
    remarks: result.review.remarks ?? null,
  });
}
