import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/resend/send-order-confirmation';
import type { Json, Order, PaymentEvent } from '@/lib/types/database';

interface OrderItemSnapshot {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url?: string;
  carat_weight?: number | null;
  origin?: string | null;
}

export interface PaymentEventInput {
  eventId: string;
  eventType: string;
  orderId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  signatureValid?: boolean | null;
  amountPaise?: number | null;
  expectedPaise?: number | null;
  status?: string;
  payload?: Json;
}

function orderItems(order: Order): OrderItemSnapshot[] {
  return Array.isArray(order.items) ? (order.items as unknown as OrderItemSnapshot[]) : [];
}

function emailHash(email: string | null) {
  if (!email) return null;
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export async function upsertPaymentEvent(input: PaymentEventInput) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from('payment_events')
    .select('*')
    .eq('provider', 'razorpay')
    .eq('event_id', input.eventId)
    .maybeSingle();

  if (existing) {
    const existingEvent = existing as PaymentEvent;
    return { event: existingEvent, alreadyProcessed: existingEvent.status === 'processed' };
  }

  const { data, error } = await supabase
    .from('payment_events')
    .insert({
      provider: 'razorpay',
      event_id: input.eventId,
      event_type: input.eventType,
      order_id: input.orderId ?? null,
      razorpay_order_id: input.razorpayOrderId ?? null,
      razorpay_payment_id: input.razorpayPaymentId ?? null,
      signature_valid: input.signatureValid ?? null,
      amount_paise: input.amountPaise ?? null,
      expected_paise: input.expectedPaise ?? null,
      status: input.status ?? 'received',
      payload: input.payload ?? {},
    })
    .select('*')
    .single();

  if (error || !data) {
    const { data: raced } = await supabase
      .from('payment_events')
      .select('*')
      .eq('provider', 'razorpay')
      .eq('event_id', input.eventId)
      .single();
    if (raced) {
      const racedEvent = raced as PaymentEvent;
      return { event: racedEvent, alreadyProcessed: racedEvent.status === 'processed' };
    }
    throw new Error('Failed to record payment event.');
  }

  return { event: data as PaymentEvent, alreadyProcessed: false };
}

export async function markPaymentEventProcessed(eventId: string, status = 'processed') {
  const supabase = createAdminClient();
  await supabase
    .from('payment_events')
    .update({ status, processed_at: new Date().toISOString() })
    .eq('id', eventId)
    .then(null, () => undefined);
}

export async function markOrderPaymentReview({
  order,
  eventId,
  razorpayPaymentId,
  reason,
  expectedPaise,
  amountPaise,
}: {
  order: Order;
  eventId?: string | null;
  razorpayPaymentId?: string | null;
  reason: string;
  expectedPaise?: number | null;
  amountPaise?: number | null;
}) {
  const supabase = createAdminClient();
  await supabase
    .from('orders')
    .update({
      razorpay_payment_id: razorpayPaymentId ?? order.razorpay_payment_id,
      payment_status: 'amount_mismatch',
      status: 'payment_review',
      payment_review_reason: reason,
      last_payment_event_id: eventId ?? order.last_payment_event_id,
    })
    .eq('id', order.id);

  await supabase.from('notification_log').insert({
    type: 'amount_mismatch',
    recipient: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin',
    template: 'amount_mismatch_alert',
    context: {
      order_id: order.id,
      order_number: order.order_number,
      expected_paise: expectedPaise ?? null,
      received_paise: amountPaise ?? null,
      razorpay_payment_id: razorpayPaymentId ?? null,
      reason,
    },
    status: 'queued',
  });
}

export async function markOrderPaymentFailed(order: Order, reason: string, razorpayPaymentId?: string | null) {
  const supabase = createAdminClient();
  await supabase
    .from('orders')
    .update({
      razorpay_payment_id: razorpayPaymentId ?? order.razorpay_payment_id,
      payment_status: 'failed',
      payment_failure_reason: reason,
    })
    .eq('id', order.id);

  for (const item of orderItems(order)) {
    if (!item.product_id) continue;
    await supabase
      .from('products')
      .update({
        availability_status: 'in_stock',
        reserved_until: null,
        reserved_by_customer_id: null,
        reserved_quantity: 0,
        reservation_note: null,
      })
      .eq('id', item.product_id)
      .eq('reservation_note', `Payment hold for ${order.order_number}`)
      .then(null, () => undefined);
  }
}

async function updateInventoryForCapturedOrder(order: Order) {
  const supabase = createAdminClient();
  for (const item of orderItems(order)) {
    if (!item.product_id) continue;

    const { data: product } = await supabase
      .from('products')
      .select('id, stock_quantity, sold_individually')
      .eq('id', item.product_id)
      .single();

    if (!product) continue;

    if (product.sold_individually) {
      await supabase
        .from('products')
        .update({
          in_stock: false,
          stock_quantity: 0,
          availability_status: 'sold',
          reserved_until: null,
          reserved_by_customer_id: null,
          reserved_quantity: 0,
          reservation_note: null,
        })
        .eq('id', item.product_id)
        .then(null, () => undefined);
      continue;
    }

    const nextQuantity = Math.max(0, Number(product.stock_quantity ?? 0) - item.quantity);
    await supabase
      .from('products')
      .update({
        stock_quantity: nextQuantity,
        in_stock: nextQuantity > 0,
        stock_status: nextQuantity > 0 ? 'in_stock' : 'out_of_stock',
        availability_status: nextQuantity > 0 ? 'in_stock' : 'out_of_stock',
        reserved_until: null,
        reserved_by_customer_id: null,
        reserved_quantity: 0,
        reservation_note: null,
      })
      .eq('id', item.product_id)
      .then(null, () => undefined);
  }
}

async function markCouponRedeemed(order: Order) {
  if (!order.coupon_code || !order.discount || order.discount <= 0) return;
  const supabase = createAdminClient();
  const { data: coupon } = await supabase
    .from('coupons')
    .select('id, used_count')
    .eq('code', order.coupon_code)
    .single();

  if (!coupon) return;

  const { error: redemptionError } = await supabase.from('coupon_redemptions').insert({
    coupon_id: coupon.id,
    order_id: order.id,
    customer_id: order.customer_id,
    guest_email_hash: emailHash(order.guest_email),
    discount_amount: order.discount,
  });

  if (!redemptionError) {
    await supabase
      .from('coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', coupon.id)
      .then(null, () => undefined);
  }
}

async function resolveOrderEmail(order: Order) {
  if (order.guest_email) {
    return { email: order.guest_email, name: order.guest_name ?? 'Valued Customer' };
  }
  if (!order.customer_id) return null;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('email, full_name')
    .eq('id', order.customer_id)
    .single();

  if (!profile?.email) return null;
  return { email: profile.email, name: profile.full_name ?? 'Valued Customer' };
}

async function sendVerifiedOrderNotifications(order: Order) {
  const supabase = createAdminClient();
  const { data: latestOrder } = await supabase
    .from('orders')
    .select('confirmation_email_sent_at, admin_notification_sent_at')
    .eq('id', order.id)
    .single();
  const recipient = await resolveOrderEmail(order);
  const confirmationEmailSentAt = latestOrder?.confirmation_email_sent_at ?? order.confirmation_email_sent_at;
  const adminNotificationSentAt = latestOrder?.admin_notification_sent_at ?? order.admin_notification_sent_at;

  if (recipient && !confirmationEmailSentAt) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
    const messageId = await sendOrderConfirmationEmail(recipient.email, {
      customerName: recipient.name,
      orderNumber: order.order_number,
      orderId: order.id,
      items: orderItems(order).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      })),
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

    if (messageId) {
      await supabase
        .from('orders')
        .update({ confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', order.id);
      await supabase.from('notification_log').insert({
        type: 'email',
        recipient: recipient.email,
        template: 'order_confirmation',
        context: {
          order_id: order.id,
          order_number: order.order_number,
          resend_message_id: messageId,
        },
        status: 'sent',
      });
    }
  }

  if (!adminNotificationSentAt) {
    await supabase.from('notification_log').insert({
      type: 'admin_order',
      recipient: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin',
      template: 'verified_order_received',
      context: {
        order_id: order.id,
        order_number: order.order_number,
        total: order.total,
        customer: order.guest_name ?? order.customer_id ?? 'unknown',
      },
      status: 'queued',
    });
    await supabase
      .from('orders')
      .update({ admin_notification_sent_at: new Date().toISOString() })
      .eq('id', order.id);
  }
}

export async function finalizeCapturedPayment({
  order,
  eventId,
  razorpayPaymentId,
  razorpaySignature,
  method,
}: {
  order: Order;
  eventId?: string | null;
  razorpayPaymentId: string;
  razorpaySignature?: string | null;
  method?: string | null;
}) {
  const supabase = createAdminClient();

  if (order.payment_status !== 'captured') {
    await supabase
      .from('orders')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature ?? order.razorpay_signature,
        payment_status: 'captured',
        payment_method: method ?? 'razorpay',
        status: 'confirmed',
        amount_verified_at: new Date().toISOString(),
        payment_failure_reason: null,
        payment_review_reason: null,
        last_payment_event_id: eventId ?? order.last_payment_event_id,
      })
      .eq('id', order.id);

    await updateInventoryForCapturedOrder(order);
    await markCouponRedeemed(order);
  }

  await sendVerifiedOrderNotifications(order);

  if (eventId) {
    await markPaymentEventProcessed(eventId);
  }
}