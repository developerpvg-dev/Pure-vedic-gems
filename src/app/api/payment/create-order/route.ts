import { NextRequest, NextResponse } from 'next/server';
import { PaymentCreateOrderSchema } from '@/lib/validators/order';
import { getRazorpayClient } from '@/lib/razorpay/client';
import {
  encodeGatewayReference,
  normalizeChargeCurrency,
  parseGatewayReference,
} from '@/lib/razorpay/charge-currency';
import { convertInrToGatewayCharge } from '@/lib/razorpay/convert-inr-charge';
import {
  resolveOrderChargeContext,
  withPaymentChargeFlags,
} from '@/lib/currency/format-charged';
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
 * Ledger amounts stay INR; the gateway charge uses the storefront currency.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`pay:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429 }
    );
  }

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

  const supabase = createAdminClient();
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(
      'id, order_number, total, amount_paid, payment_status, status, razorpay_order_id, payment_attempts, customer_id, guest_access_token, compliance_flags',
    )
    .eq('id', order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const isAuthorized = await canPayOrder(order);
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  if (isPaidPaymentStatus(order.payment_status)) {
    return NextResponse.json(
      { error: 'This order has already been paid' },
      { status: 400 }
    );
  }

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

  if (charge.kind !== 'full' && !order.customer_id) {
    return NextResponse.json(
      { error: 'Please sign in to your account to pay in advance. Guest checkout must be paid in full.' },
      { status: 401 }
    );
  }

  // Reuse the currency+rate from the first charge so advance and balance match.
  const { data: paidForLock } = await asUntypedSupabase(supabase)
    .from('order_payments')
    .select('amount, reference')
    .eq('order_id', order_id)
    .in('status', ['paid', 'pending']);
  const locked = resolveOrderChargeContext({
    complianceFlags: order.compliance_flags,
    payments: (paidForLock ?? []) as Array<{ amount?: number | null; reference?: string | null }>,
  });
  const currency = locked?.currency ?? normalizeChargeCurrency(parsed.data.currency);

  let gateway;
  try {
    gateway = await convertInrToGatewayCharge(charge.amount, currency, {
      lockedRate: locked?.rate,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Currency conversion failed' },
      { status: 400 }
    );
  }

  const amountMinor = gateway.minor;
  const gatewayRef = encodeGatewayReference(gateway.currency, amountMinor);
  const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;

  if (amountMinor < 100) {
    return NextResponse.json(
      { error: 'Order amount too low for payment processing' },
      { status: 400 }
    );
  }

  const pending = await findPendingAttempt(order.id);
  const pendingGateway = parseGatewayReference(pending?.reference);
  const samePending =
    !!pending?.razorpay_order_id &&
    Number(pending.amount) === Number(charge.amount) &&
    (pendingGateway
      ? pendingGateway.currency === gateway.currency && pendingGateway.minor === amountMinor
      : gateway.currency === 'INR' && Math.round(Number(pending.amount) * 100) === amountMinor);

  if (samePending && pending.razorpay_order_id) {
    await asUntypedSupabase(supabase)
      .from('orders')
      .update({ payment_attempts: (order.payment_attempts ?? 0) + 1 })
      .eq('id', order_id);

    return NextResponse.json({
      razorpay_order_id: pending.razorpay_order_id,
      amount: amountMinor,
      currency: gateway.currency,
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
      amount: amountMinor,
      currency: gateway.currency,
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
        ledger_inr: String(charge.amount),
        charge_currency: gateway.currency,
        fx_rate: String(gateway.rate),
      },
    });
  } catch (err) {
    console.error('[Payment] Razorpay order creation failed:', err);
    const msg = err instanceof Error ? err.message : String(err);
    const currencyHint =
      gateway.currency !== 'INR' && /currency|international/i.test(msg)
        ? ` Razorpay may not have multi-currency enabled for ${gateway.currency}.`
        : '';
    return NextResponse.json(
      { error: `Payment gateway error.${currencyHint} Please try again or switch to INR.` },
      { status: 502 }
    );
  }

  try {
    await openPaymentAttempt({
      orderId: order.id,
      amount: charge.amount,
      kind: charge.kind,
      razorpayOrderId: razorpayOrder.id,
      reference: gatewayRef,
    });
  } catch (err) {
    console.error('[Payment] Failed to open payment attempt:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not start the payment.' },
      { status: 500 }
    );
  }

  const nextFlags =
    gateway.currency !== 'INR'
      ? withPaymentChargeFlags(order.compliance_flags, {
          currency: gateway.currency,
          rate: gateway.rate,
        })
      : null;

  const { error: updateError } = await asUntypedSupabase(supabase)
    .from('orders')
    .update({
      razorpay_order_id: razorpayOrder.id,
      payment_attempts: (order.payment_attempts ?? 0) + 1,
      ...(nextFlags ? { compliance_flags: nextFlags } : {}),
      ...(charge.kind === 'balance'
        ? {}
        : { payment_status: 'pending', status: 'pending_payment' }),
    })
    .eq('id', order_id);

  if (updateError) {
    console.error('[Payment] Failed to store razorpay_order_id:', updateError);
  }

  return NextResponse.json({
    razorpay_order_id: razorpayOrder.id,
    amount: amountMinor,
    currency: gateway.currency,
    key_id: razorpayKeyId,
    order_number: order.order_number,
    pay_amount: charge.amount,
    payment_kind: charge.kind,
  });
}
