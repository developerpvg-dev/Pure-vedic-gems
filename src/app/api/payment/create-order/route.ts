import { NextRequest, NextResponse } from 'next/server';
import { PaymentCreateOrderSchema } from '@/lib/validators/order';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { rateLimit } from '@/lib/utils/rate-limit';
import { isPaidPaymentStatus } from '@/lib/constants/order-status';
import { canPayOrder } from '@/lib/orders/order-ownership';
import { resolveOnlinePaymentAmount } from '@/lib/orders/counter-payments';
import { findPendingAttempt, openPaymentAttempt } from '@/lib/orders/online-payments';

/**
 * POST /api/payment/create-order
 *
 * Creates a Razorpay order for a pending order.
 * The amount is read from the database (server-side truth) — never from the client.
 * The client may only *request* an advance amount; the 20% floor, the order
 * total ceiling, and the remaining balance are all enforced here.
 *
 * Flow:
 * 1. Validate the order exists and still owes money
 * 2. Resolve the charge from the DB total and what is already paid
 * 3. Create a Razorpay order with that exact amount
 * 4. Open a pending ledger row holding the expected amount for verification
 * 5. Return Razorpay order details to the client
 */
export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`pay:${ip}`, 10, 60 * 1000)) {
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

  const parsed = PaymentCreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid order ID', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { order_id, pay_amount } = parsed.data;

  // ── Fetch order from DB ──────────────────────────────────────────────
  const supabase = createAdminClient();
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, order_number, total, amount_paid, payment_status, status, razorpay_order_id, payment_attempts, customer_id, guest_access_token')
    .eq('id', order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // ── Ownership check: only the order's owner may initiate payment ──────
  // Prevents IDOR — without this, any caller with an order_id could create a
  // Razorpay order against someone else's pending order. Generic 404 avoids
  // confirming the order exists to a non-owner.
  const isAuthorized = await canPayOrder(order);
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // ── Verify order state ───────────────────────────────────────────────
  if (isPaidPaymentStatus(order.payment_status)) {
    return NextResponse.json(
      { error: 'This order has already been paid' },
      { status: 400 }
    );
  }

  // 'partial' = advance paid, customer is back to settle the balance.
  if (!['pending', 'authorized', 'failed', 'partial'].includes(order.payment_status)) {
    return NextResponse.json(
      { error: 'This order is not eligible for payment at the moment' },
      { status: 409 }
    );
  }

  if (['cancelled', 'refunded'].includes(order.status)) {
    return NextResponse.json(
      { error: `This order is ${order.status} and can no longer be paid` },
      { status: 409 }
    );
  }

  // ── Resolve what to charge (server-side truth) ───────────────────────
  const amountPaid = Number(order.amount_paid ?? 0);
  let charge;
  try {
    charge = resolveOnlinePaymentAmount(order.total, amountPaid, pay_amount);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid payment amount' },
      { status: 400 }
    );
  }

  // Part-payment creates an outstanding balance we must be able to chase later,
  // so it is account-holders only — a guest cookie is not an identity we can
  // email, notify, or hold accountable for the remainder.
  if (charge.kind !== 'full' && !order.customer_id) {
    return NextResponse.json(
      { error: 'Please sign in to your account to pay in advance. Guest checkout must be paid in full.' },
      { status: 401 }
    );
  }

  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;

  // Amount must be in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(charge.amount * 100);

  if (amountInPaise < 100) {
    // Razorpay minimum is ₹1
    return NextResponse.json(
      { error: 'Order amount too low for payment processing' },
      { status: 400 }
    );
  }

  // ── Reuse the in-flight attempt when the customer retries the same amount ──
  // Reuse is keyed on the pending ledger row, not orders.razorpay_order_id:
  // after an advance, that column still holds the *settled* advance order, and
  // reopening it would charge against an already-paid Razorpay order.
  const pending = await findPendingAttempt(order.id);
  if (pending?.razorpay_order_id && Math.round(Number(pending.amount) * 100) === amountInPaise) {
    await asUntypedSupabase(supabase)
      .from('orders')
      .update({ payment_attempts: (order.payment_attempts ?? 0) + 1 })
      .eq('id', order_id);

    return NextResponse.json({
      razorpay_order_id: pending.razorpay_order_id,
      amount: amountInPaise,
      currency: 'INR',
      key_id: razorpayKeyId,
      order_number: order.order_number,
      pay_amount: charge.amount,
      payment_kind: charge.kind,
    });
  }

  let razorpayOrder;
  try {
    const razorpay = getRazorpayClient();
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.order_number,
      payment: {
        capture: 'automatic',
        capture_options: {
          automatic_expiry_period: 12,
          manual_expiry_period: 7200,
          refund_speed: 'normal',
        },
      },
      notes: {
        order_id: order.id,
        order_number: order.order_number,
        payment_kind: charge.kind,
      },
    });
  } catch (err) {
    console.error('[Payment] Razorpay order creation failed:', err);
    return NextResponse.json(
      { error: 'Payment gateway error. Please try again.' },
      { status: 502 }
    );
  }

  // ── Record the expected amount before the customer can pay ───────────
  // This row is what /api/payment/verify and the webhook check the captured
  // amount against, so it must exist before the Razorpay modal opens.
  try {
    await openPaymentAttempt({
      orderId: order.id,
      amount: charge.amount,
      kind: charge.kind,
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (err) {
    console.error('[Payment] Failed to open payment attempt:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start the payment.' },
      { status: 500 }
    );
  }

  // Mirror onto the order for the legacy webhook lookup and admin display.
  // A balance payment keeps payment_status 'partial' — the advance is still paid.
  const { error: updateError } = await asUntypedSupabase(supabase)
    .from('orders')
    .update({
      razorpay_order_id: razorpayOrder.id,
      payment_attempts: (order.payment_attempts ?? 0) + 1,
      ...(charge.kind === 'balance'
        ? {}
        : { payment_status: 'pending', status: 'pending_payment' }),
    })
    .eq('id', order_id);

  if (updateError) {
    console.error('[Payment] Failed to store razorpay_order_id:', updateError);
    // Non-critical — the ledger attempt already holds the expected amount.
  }

  return NextResponse.json({
    razorpay_order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    key_id: razorpayKeyId,
    order_number: order.order_number,
    pay_amount: charge.amount,
    payment_kind: charge.kind,
  });
}
