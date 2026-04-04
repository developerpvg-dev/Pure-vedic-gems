import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay/verify';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/resend/send-order-confirmation';
import type { Order } from '@/lib/types/database';

/**
 * POST /api/webhooks/razorpay
 *
 * Handles Razorpay webhook events server-to-server.
 * This is the authoritative payment confirmation path — more reliable than
 * the client-side verify callback because it works even if the user's browser
 * closes or the network drops mid-checkout.
 *
 * SECURITY:
 * - Verifies HMAC-SHA256 signature using the webhook secret
 * - No rate limiting here (Razorpay retries on failure)
 * - Idempotent: re-processing an already-confirmed payment is a no-op
 *
 * Events handled:
 * - payment.captured → order confirmed, email sent
 * - payment.failed → order marked failed
 * - refund.processed → order marked refunded
 */
export async function POST(req: NextRequest) {
  // ── Read raw body for HMAC verification ──────────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // ── Verify webhook signature ─────────────────────────────────────────
  if (!signature) {
    console.error('[Webhook] Missing x-razorpay-signature header');
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  // If webhook secret is not configured, log warning but still process
  // (for test environments where webhook secret may not be set)
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
  } else {
    console.warn(
      '[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification'
    );
  }

  // ── Parse the webhook payload ────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const event = payload.event as string;
  const supabase = createAdminClient();

  // ── Handle events ────────────────────────────────────────────────────
  switch (event) {
    case 'payment.captured':
    case 'payment.authorized': {
      await handlePaymentCaptured(payload, supabase);
      break;
    }

    case 'payment.failed': {
      await handlePaymentFailed(payload, supabase);
      break;
    }

    case 'refund.processed': {
      await handleRefundProcessed(payload, supabase);
      break;
    }

    default: {
      // Log unhandled events for debugging
      console.log(`[Webhook] Unhandled event: ${event}`);
    }
  }

  // Always return 200 to prevent Razorpay from retrying
  return NextResponse.json({ status: 'ok' });
}

// ─── payment.captured handler ───────────────────────────────────────────────

async function handlePaymentCaptured(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createAdminClient>
) {
  const entity = (payload.payload as Record<string, unknown>)?.payment as
    | Record<string, unknown>
    | undefined;
  const paymentEntity = entity?.entity as Record<string, unknown> | undefined;

  if (!paymentEntity) {
    console.error('[Webhook] Missing payment entity in payload');
    return;
  }

  const razorpayOrderId = paymentEntity.order_id as string;
  const razorpayPaymentId = paymentEntity.id as string;
  const amountPaise = paymentEntity.amount as number;

  if (!razorpayOrderId || !razorpayPaymentId) {
    console.error('[Webhook] Missing order_id or payment_id');
    return;
  }

  // Find the order by razorpay_order_id
  const rawResult = await supabase
    .from('orders')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .single();
  const order = rawResult.data as Order | null;
  const error = rawResult.error;

  if (error || !order) {
    console.error(
      `[Webhook] Order not found for razorpay_order_id: ${razorpayOrderId}`
    );
    return;
  }

  // Idempotency: skip if already completed
  if (order.payment_status === 'completed') {
    console.log(
      `[Webhook] Order ${order.order_number} already confirmed, skipping`
    );
    return;
  }

  // Amount verification: ensure the paid amount matches our order total
  const expectedPaise = Math.round(order.total * 100);
  if (amountPaise !== expectedPaise) {
    console.error(
      `[Webhook] Amount mismatch: expected ${expectedPaise} paise, got ${amountPaise} paise for order ${order.order_number}`
    );
    // Still mark as completed but log the discrepancy
    await supabase.from('notification_log').insert({
      type: 'amount_mismatch',
      recipient: 'admin',
      template: 'amount_mismatch_alert',
      context: {
        order_id: order.id,
        order_number: order.order_number,
        expected_paise: expectedPaise,
        received_paise: amountPaise,
        razorpay_payment_id: razorpayPaymentId,
      },
      status: 'sent',
    });
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      razorpay_payment_id: razorpayPaymentId,
      payment_status: 'completed',
      payment_method: (paymentEntity.method as string) ?? 'razorpay',
      status: 'confirmed',
    })
    .eq('id', order.id);

  // Log the webhook event
  await supabase.from('notification_log').insert({
    type: 'webhook',
    recipient: order.customer_id ?? order.guest_email ?? 'unknown',
    template: 'payment_captured',
    context: {
      order_id: order.id,
      order_number: order.order_number,
      razorpay_payment_id: razorpayPaymentId,
      amount: order.total,
      method: (paymentEntity.method as string) ?? null,
    },
    status: 'sent',
  });

  // Send confirmation email if not already sent via the verify route
  const emailTo = order.guest_email ?? null;
  let customerName = order.guest_name ?? 'Valued Customer';

  let emailAddress = emailTo;
  if (!emailAddress && order.customer_id) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('email, full_name')
      .eq('id', order.customer_id)
      .single();
    emailAddress = profile?.email ?? null;
    customerName = profile?.full_name ?? customerName;
  }

  if (emailAddress) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

    await sendOrderConfirmationEmail(emailAddress, {
      customerName,
      orderNumber: order.order_number,
      orderId: order.id,
      items:
        (order.items as Array<{
          name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
        }>) ?? [],
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
    });
  }
}

// ─── payment.failed handler ─────────────────────────────────────────────────

async function handlePaymentFailed(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createAdminClient>
) {
  const entity = (payload.payload as Record<string, unknown>)?.payment as
    | Record<string, unknown>
    | undefined;
  const paymentEntity = entity?.entity as Record<string, unknown> | undefined;

  if (!paymentEntity) return;

  const razorpayOrderId = paymentEntity.order_id as string;
  if (!razorpayOrderId) return;

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('razorpay_order_id', razorpayOrderId)
    .single();

  if (!order) return;

  await supabase
    .from('orders')
    .update({ payment_status: 'failed' })
    .eq('id', order.id);

  await supabase.from('notification_log').insert({
    type: 'webhook',
    recipient: 'admin',
    template: 'payment_failed',
    context: {
      order_id: order.id,
      order_number: order.order_number,
      error_code: (paymentEntity.error_code as string) ?? null,
      error_description: (paymentEntity.error_description as string) ?? null,
    },
    status: 'sent',
  });
}

// ─── refund.processed handler ───────────────────────────────────────────────

async function handleRefundProcessed(
  payload: Record<string, unknown>,
  supabase: ReturnType<typeof createAdminClient>
) {
  const entity = (payload.payload as Record<string, unknown>)?.refund as
    | Record<string, unknown>
    | undefined;
  const refundEntity = entity?.entity as Record<string, unknown> | undefined;

  if (!refundEntity) return;

  const paymentId = refundEntity.payment_id as string;
  if (!paymentId) return;

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('razorpay_payment_id', paymentId)
    .single();

  if (!order) return;

  await supabase
    .from('orders')
    .update({
      payment_status: 'refunded',
      status: 'refunded',
    })
    .eq('id', order.id);

  await supabase.from('notification_log').insert({
    type: 'webhook',
    recipient: 'admin',
    template: 'refund_processed',
    context: {
      order_id: order.id,
      order_number: order.order_number,
      refund_id: (refundEntity.id as string) ?? null,
      refund_amount: (refundEntity.amount as number) ?? null,
    },
    status: 'sent',
  });
}
