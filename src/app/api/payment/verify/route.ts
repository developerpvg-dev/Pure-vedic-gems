import { NextRequest, NextResponse } from 'next/server';
import { PaymentVerifySchema } from '@/lib/validators/order';
import { verifyPaymentSignature } from '@/lib/razorpay/verify';
import { captureAuthorizedRazorpayPayment, fetchRazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  finalizeCapturedPayment,
  markOrderPaymentFailed,
  markOrderPaymentReview,
  markPaymentEventProcessed,
  upsertPaymentEvent,
} from '@/lib/orders/payment-finalization';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { Order } from '@/lib/types/database';

/**
 * POST /api/payment/verify
 *
 * Verifies a Razorpay payment after the checkout modal closes.
 * This is the client-side verification path (webhook is the server-side fallback).
 *
 * SECURITY: The signature is verified using HMAC-SHA256 with the Razorpay key secret.
 * This ensures the payment callback is authentic and not forged.
 *
 * Flow:
 * 1. Validate input fields
 * 2. Verify HMAC-SHA256 signature (order_id|payment_id)
 * 3. Fetch Razorpay order/payment and cross-check amount/status
 * 4. Confirm only captured payments with matching amount
 * 5. Otherwise leave order pending/failed/review, never falsely confirmed
 */
export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`verify:${ip}`, 15, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429 }
    );
  }

  // ── Parse & validate ─────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const parsed = PaymentVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    order_id,
  } = parsed.data;

  // ── Verify HMAC-SHA256 signature ─────────────────────────────────────
  let isValid = false;
  try {
    isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
  } catch (error) {
    console.error('[Payment] Signature verification unavailable:', error);
    return NextResponse.json(
      { error: 'Payment verification is not configured. Please contact support.' },
      { status: 500 }
    );
  }

  if (!isValid) {
    console.error(
      `[Payment] Invalid signature for order ${order_id}, razorpay_order ${razorpay_order_id}`
    );
    return NextResponse.json(
      { error: 'Payment verification failed. Invalid signature.' },
      { status: 400 }
    );
  }

  // ── Fetch and validate the order ─────────────────────────────────────
  const supabase = createAdminClient();
  const rawResult = await supabase
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single();
  const order = rawResult.data as Order | null;
  const fetchError = rawResult.error;

  if (fetchError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // Verify the Razorpay order ID matches
  if (order.razorpay_order_id !== razorpay_order_id) {
    console.error(
      `[Payment] Razorpay order ID mismatch: expected ${order.razorpay_order_id}, got ${razorpay_order_id}`
    );
    return NextResponse.json(
      { error: 'Payment verification failed. Order mismatch.' },
      { status: 400 }
    );
  }

  // Don't re-process already captured payments (idempotency)
  if (order.payment_status === 'captured') {
    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      already_verified: true,
    });
  }

  const expectedPaise = Math.round(order.total * 100);
  const eventId = `client:${razorpay_payment_id}`;
  const { event, alreadyProcessed } = await upsertPaymentEvent({
    eventId,
    eventType: 'client.payment.verify',
    orderId: order.id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    signatureValid: true,
    expectedPaise,
    status: 'received',
    payload: {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
    },
  });

  if (alreadyProcessed) {
    return NextResponse.json({
      success: order.payment_status === 'captured',
      order_id: order.id,
      order_number: order.order_number,
      already_verified: order.payment_status === 'captured',
    });
  }

  let facts;
  try {
    facts = await fetchRazorpayPaymentFacts(razorpay_order_id, razorpay_payment_id);
  } catch (error) {
    console.error('[Payment] Failed to fetch Razorpay payment facts:', error);
    return NextResponse.json(
      { error: 'Payment could not be verified with Razorpay. Please retry or contact support.' },
      { status: 502 }
    );
  }

  await supabase
    .from('payment_events')
    .update({
      amount_paise: facts.razorpayPaymentAmountPaise,
      expected_paise: expectedPaise,
    })
    .eq('id', event.id);

  const amountMatches =
    facts.razorpayOrderAmountPaise === expectedPaise &&
    facts.razorpayPaymentAmountPaise === expectedPaise &&
    facts.currency === 'INR';

  if (!amountMatches) {
    const reason = `Expected ${expectedPaise} paise INR, got order ${facts.razorpayOrderAmountPaise}, payment ${facts.razorpayPaymentAmountPaise}, currency ${facts.currency}.`;
    await markOrderPaymentReview({
      order,
      eventId: event.id,
      razorpayPaymentId: razorpay_payment_id,
      reason,
      expectedPaise,
      amountPaise: facts.razorpayPaymentAmountPaise,
    });
    await markPaymentEventProcessed(event.id, 'amount_mismatch');
    return NextResponse.json(
      { error: 'Payment amount mismatch. Our team will review this payment before confirming the order.' },
      { status: 409 }
    );
  }

  if (!facts.captured) {
    if (facts.paymentStatus === 'authorized') {
      try {
        facts = await captureAuthorizedRazorpayPayment(facts, razorpay_payment_id, expectedPaise, 'INR');
      } catch (error) {
        console.error('[Payment] Razorpay capture failed after authorization:', error);
        await supabase
          .from('orders')
          .update({
            razorpay_payment_id,
            razorpay_signature,
            payment_status: 'authorized',
            payment_method: facts.method ?? 'razorpay',
            payment_failure_reason: null,
            payment_review_reason: 'Payment authorized but server-side capture is still pending',
          })
          .eq('id', order.id);
        await markPaymentEventProcessed(event.id, 'capture_pending');
        return NextResponse.json(
          {
            success: false,
            pending: true,
            retry_after_ms: 2500,
            order_id: order.id,
            order_number: order.order_number,
          },
          { status: 202 }
        );
      }
    }
  }

  if (!facts.captured) {

    await markOrderPaymentFailed(order, `Razorpay payment status: ${facts.paymentStatus}`, razorpay_payment_id);
    await markPaymentEventProcessed(event.id, 'failed');
    return NextResponse.json(
      { error: 'Payment was not captured. Please retry payment or contact support.' },
      { status: 402 }
    );
  }

  await finalizeCapturedPayment({
    order,
    eventId: event.id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    method: facts.method,
  });

  return NextResponse.json({
    success: true,
    order_id: order.id,
    order_number: order.order_number,
  });
}
