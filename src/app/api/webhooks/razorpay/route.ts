import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay/verify';
import { captureAuthorizedRazorpayPayment, fetchRazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  finalizeCapturedPayment,
  markOrderPaymentFailed,
  markOrderPaymentReview,
  markPaymentEventProcessed,
  upsertPaymentEvent,
} from '@/lib/orders/payment-finalization';
import type { Json, Order } from '@/lib/types/database';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function paymentEntity(payload: UnknownRecord) {
  const payloadRecord = asRecord(payload.payload);
  const paymentRecord = asRecord(payloadRecord?.payment);
  return asRecord(paymentRecord?.entity);
}

function refundEntity(payload: UnknownRecord) {
  const payloadRecord = asRecord(payload.payload);
  const refundRecord = asRecord(payloadRecord?.refund);
  return asRecord(refundRecord?.entity);
}

function webhookEventId(payload: UnknownRecord, event: string, entityId: string | null) {
  const explicitId = typeof payload.id === 'string' ? payload.id : null;
  if (explicitId) return explicitId;

  const accountId = typeof payload.account_id === 'string' ? payload.account_id : 'account';
  const createdAt =
    typeof payload.created_at === 'number' || typeof payload.created_at === 'string'
      ? String(payload.created_at)
      : 'unknown-time';

  return `webhook:${accountId}:${event}:${entityId ?? 'unknown'}:${createdAt}`;
}

async function findOrderByRazorpayOrderId(razorpayOrderId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .single();

  if (error || !data) return null;
  return data as Order;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is missing; refusing to process Razorpay webhook.');
    return NextResponse.json({ error: 'Webhook verification is not configured' }, { status: 503 });
  }

  let validSignature = false;
  try {
    validSignature = verifyWebhookSignature(rawBody, signature);
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error);
  }

  if (!validSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: UnknownRecord;
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const record = asRecord(parsed);
    if (!record) throw new Error('payload is not an object');
    payload = record;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = typeof payload.event === 'string' ? payload.event : 'unknown';

  switch (event) {
    case 'payment.captured':
    case 'payment.authorized':
      return handlePaymentWebhook(event, payload);
    case 'payment.failed':
      return handlePaymentFailed(payload);
    case 'refund.processed':
      return handleRefundProcessed(payload);
    default: {
      const { event: paymentEvent } = await upsertPaymentEvent({
        eventId: webhookEventId(payload, event, null),
        eventType: event,
        signatureValid: true,
        status: 'ignored',
        payload: payload as Json,
      });
      await markPaymentEventProcessed(paymentEvent.id, 'ignored');
      return NextResponse.json({ status: 'ignored' });
    }
  }
}

async function handlePaymentWebhook(eventType: string, payload: UnknownRecord) {
  const entity = paymentEntity(payload);
  const razorpayOrderId = typeof entity?.order_id === 'string' ? entity.order_id : null;
  const razorpayPaymentId = typeof entity?.id === 'string' ? entity.id : null;
  const amountPaise = typeof entity?.amount === 'number' ? entity.amount : null;
  const method = typeof entity?.method === 'string' ? entity.method : null;

  if (!razorpayOrderId || !razorpayPaymentId) {
    return NextResponse.json({ error: 'Missing payment entity identifiers' }, { status: 400 });
  }

  const order = await findOrderByRazorpayOrderId(razorpayOrderId);
  const expectedPaise = order ? Math.round(order.total * 100) : null;
  const { event, alreadyProcessed } = await upsertPaymentEvent({
    eventId: webhookEventId(payload, eventType, razorpayPaymentId),
    eventType,
    orderId: order?.id ?? null,
    razorpayOrderId,
    razorpayPaymentId,
    signatureValid: true,
    amountPaise,
    expectedPaise,
    status: 'received',
    payload: payload as Json,
  });

  if (alreadyProcessed) return NextResponse.json({ status: 'duplicate' });
  if (!order) {
    await markPaymentEventProcessed(event.id, 'order_not_found');
    return NextResponse.json({ status: 'order_not_found' });
  }

  let facts;
  try {
    facts = await fetchRazorpayPaymentFacts(razorpayOrderId, razorpayPaymentId);
  } catch (error) {
    console.error('[Webhook] Could not verify Razorpay payment facts:', error);
    return NextResponse.json({ error: 'Razorpay lookup failed' }, { status: 502 });
  }

  const amountMatches =
    facts.razorpayOrderAmountPaise === expectedPaise &&
    facts.razorpayPaymentAmountPaise === expectedPaise &&
    facts.currency === 'INR';

  if (!amountMatches) {
    const reason = `Expected ${expectedPaise} paise INR, got order ${facts.razorpayOrderAmountPaise}, payment ${facts.razorpayPaymentAmountPaise}, currency ${facts.currency}.`;
    await markOrderPaymentReview({
      order,
      eventId: event.id,
      razorpayPaymentId,
      reason,
      expectedPaise,
      amountPaise: facts.razorpayPaymentAmountPaise,
    });
    await markPaymentEventProcessed(event.id, 'amount_mismatch');
    return NextResponse.json({ status: 'amount_mismatch' });
  }

  if (!facts.captured && facts.paymentStatus === 'authorized') {
    try {
      facts = await captureAuthorizedRazorpayPayment(facts, razorpayPaymentId, expectedPaise, 'INR');
    } catch (error) {
      console.error('[Webhook] Razorpay capture failed after authorization:', error);
      const supabase = createAdminClient();
      await supabase
        .from('orders')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          payment_status: 'authorized',
          payment_method: method ?? facts.method ?? 'razorpay',
          payment_failure_reason: null,
          payment_review_reason: 'Payment authorized but server-side capture is still pending',
        })
        .eq('id', order.id);
      await markPaymentEventProcessed(event.id, 'capture_pending');
      return NextResponse.json({ status: 'capture_pending' });
    }
  }

  if (!facts.captured) {
    const supabase = createAdminClient();
    await supabase
      .from('orders')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        payment_status: 'authorized',
        payment_method: method ?? facts.method ?? 'razorpay',
      })
      .eq('id', order.id);
    await markPaymentEventProcessed(event.id, 'authorized');
    return NextResponse.json({ status: 'authorized' });
  }

  await finalizeCapturedPayment({
    order,
    eventId: event.id,
    razorpayPaymentId,
    method: method ?? facts.method,
  });

  return NextResponse.json({ status: 'captured' });
}

async function handlePaymentFailed(payload: UnknownRecord) {
  const entity = paymentEntity(payload);
  const razorpayOrderId = typeof entity?.order_id === 'string' ? entity.order_id : null;
  const razorpayPaymentId = typeof entity?.id === 'string' ? entity.id : null;
  const errorDescription = typeof entity?.error_description === 'string'
    ? entity.error_description
    : 'Razorpay reported payment failure.';

  if (!razorpayOrderId || !razorpayPaymentId) {
    return NextResponse.json({ error: 'Missing failed payment identifiers' }, { status: 400 });
  }

  const order = await findOrderByRazorpayOrderId(razorpayOrderId);
  const { event, alreadyProcessed } = await upsertPaymentEvent({
    eventId: webhookEventId(payload, 'payment.failed', razorpayPaymentId),
    eventType: 'payment.failed',
    orderId: order?.id ?? null,
    razorpayOrderId,
    razorpayPaymentId,
    signatureValid: true,
    status: 'received',
    payload: payload as Json,
  });

  if (alreadyProcessed) return NextResponse.json({ status: 'duplicate' });
  if (order) {
    await markOrderPaymentFailed(order, errorDescription, razorpayPaymentId);
  }
  await markPaymentEventProcessed(event.id, 'failed');
  return NextResponse.json({ status: 'failed' });
}

async function handleRefundProcessed(payload: UnknownRecord) {
  const entity = refundEntity(payload);
  const paymentId = typeof entity?.payment_id === 'string' ? entity.payment_id : null;
  const refundId = typeof entity?.id === 'string' ? entity.id : null;
  const eventId = webhookEventId(payload, 'refund.processed', refundId ?? paymentId);
  const supabase = createAdminClient();
  const { data: order } = paymentId
    ? await supabase.from('orders').select('*').eq('razorpay_payment_id', paymentId).single()
    : { data: null };
  const refundOrder = order as Order | null;

  const { event, alreadyProcessed } = await upsertPaymentEvent({
    eventId,
    eventType: 'refund.processed',
    orderId: refundOrder?.id ?? null,
    razorpayPaymentId: paymentId,
    signatureValid: true,
    status: 'received',
    payload: payload as Json,
  });

  if (alreadyProcessed) return NextResponse.json({ status: 'duplicate' });

  if (refundOrder) {
    await supabase
      .from('orders')
      .update({ payment_status: 'refunded', status: 'refunded' })
      .eq('id', refundOrder.id);

    await supabase.from('notification_log').insert({
      type: 'webhook',
      recipient: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin',
      template: 'refund_processed',
      context: {
        order_id: refundOrder.id,
        order_number: refundOrder.order_number,
        refund_id: refundId,
        refund_amount: typeof entity?.amount === 'number' ? entity.amount : null,
      },
      status: 'queued',
    });
  }

  await markPaymentEventProcessed(event.id, 'refunded');
  return NextResponse.json({ status: 'refunded' });
}