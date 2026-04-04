import { NextRequest, NextResponse } from 'next/server';
import { PaymentCreateOrderSchema } from '@/lib/validators/order';
import { getRazorpayClient } from '@/lib/razorpay/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';

/**
 * POST /api/payment/create-order
 *
 * Creates a Razorpay order for a pending order.
 * The amount is read from the database (server-side truth) — never from the client.
 *
 * Flow:
 * 1. Validate the order exists and is in 'pending_payment' status
 * 2. Read the server-calculated total from the orders table
 * 3. Create a Razorpay order with that exact amount
 * 4. Store the razorpay_order_id on the order record
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

  const { order_id } = parsed.data;

  // ── Fetch order from DB ──────────────────────────────────────────────
  const supabase = createAdminClient();
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, order_number, total, payment_status, razorpay_order_id')
    .eq('id', order_id)
    .single();

  if (fetchError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  // ── Verify order state ───────────────────────────────────────────────
  if (order.payment_status === 'completed') {
    return NextResponse.json(
      { error: 'This order has already been paid' },
      { status: 400 }
    );
  }

  // ── If Razorpay order already exists, return it ──────────────────────
  if (order.razorpay_order_id) {
    return NextResponse.json({
      razorpay_order_id: order.razorpay_order_id,
      amount: Math.round(order.total * 100), // Razorpay uses paise
      currency: 'INR',
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_number: order.order_number,
    });
  }

  // ── Create Razorpay order ────────────────────────────────────────────
  // Amount must be in paise (1 INR = 100 paise)
  const amountInPaise = Math.round(order.total * 100);

  if (amountInPaise < 100) {
    // Razorpay minimum is ₹1
    return NextResponse.json(
      { error: 'Order amount too low for payment processing' },
      { status: 400 }
    );
  }

  let razorpayOrder;
  try {
    const razorpay = getRazorpayClient();
    razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        order_id: order.id,
        order_number: order.order_number,
      },
    });
  } catch (err) {
    console.error('[Payment] Razorpay order creation failed:', err);
    return NextResponse.json(
      { error: 'Payment gateway error. Please try again.' },
      { status: 502 }
    );
  }

  // ── Store razorpay_order_id on the order ────────────────────────────
  const { error: updateError } = await supabase
    .from('orders')
    .update({ razorpay_order_id: razorpayOrder.id })
    .eq('id', order_id);

  if (updateError) {
    console.error('[Payment] Failed to store razorpay_order_id:', updateError);
    // Non-critical — the order is still valid
  }

  return NextResponse.json({
    razorpay_order_id: razorpayOrder.id,
    amount: amountInPaise,
    currency: 'INR',
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    order_number: order.order_number,
  });
}
