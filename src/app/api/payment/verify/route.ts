import { NextRequest, NextResponse } from 'next/server';
import { PaymentVerifySchema } from '@/lib/validators/order';
import { verifyPaymentSignature } from '@/lib/razorpay/verify';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/resend/send-order-confirmation';
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
 * 3. Cross-check amount: Razorpay order amount === DB order total
 * 4. Update order: payment_status → 'completed', status → 'confirmed'
 * 5. Send order confirmation email
 * 6. Return order details for confirmation page
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
  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

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

  // Don't re-process already completed payments (idempotency)
  if (order.payment_status === 'completed') {
    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      already_verified: true,
    });
  }

  // ── Update order: mark as paid and confirmed ─────────────────────────
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      razorpay_payment_id,
      razorpay_signature,
      payment_status: 'completed',
      payment_method: 'razorpay',
      status: 'confirmed',
    })
    .eq('id', order_id);

  if (updateError) {
    console.error('[Payment] Failed to update order after verification:', updateError);
    return NextResponse.json(
      { error: 'Order update failed. Please contact support.' },
      { status: 500 }
    );
  }

  // ── Log notification ─────────────────────────────────────────────────
  await supabase
    .from('notification_log')
    .insert({
      type: 'payment_verified',
      recipient: order.customer_id ?? order.guest_email ?? 'unknown',
      template: 'payment_verification',
      context: {
        order_id: order.id,
        order_number: order.order_number,
        razorpay_payment_id,
        amount: order.total,
      },
      status: 'sent',
    })
    .then(null, () => {
      // Non-critical logging
    });

  // ── Send confirmation email (non-blocking) ───────────────────────────
  const customerEmail = order.customer_id
    ? null // Will be fetched below
    : order.guest_email;

  let emailTo = customerEmail;
  if (!emailTo && order.customer_id) {
    // Fetch email from auth user
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('email, full_name')
      .eq('id', order.customer_id)
      .single();
    emailTo = profile?.email ?? null;
  }

  if (emailTo) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
    const orderItems = (order.items as Array<{
      name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }>) ?? [];

    // Fire-and-forget — don't block the response
    sendOrderConfirmationEmail(emailTo, {
      customerName: order.guest_name ?? 'Valued Customer',
      orderNumber: order.order_number,
      orderId: order.id,
      items: orderItems,
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      gstAmount: order.gst_amount,
      total: order.total,
      shippingAddress: order.shipping_address as {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
      },
      siteUrl,
    }).then((messageId) => {
      if (messageId) {
        // Log email sent
        supabase
          .from('notification_log')
          .insert({
            type: 'email',
            recipient: emailTo!,
            template: 'order_confirmation',
            context: {
              order_id: order.id,
              order_number: order.order_number,
              resend_message_id: messageId,
            },
            status: 'sent',
          })
          .then(null, () => {});
      }
    });
  }

  return NextResponse.json({
    success: true,
    order_id: order.id,
    order_number: order.order_number,
  });
}
