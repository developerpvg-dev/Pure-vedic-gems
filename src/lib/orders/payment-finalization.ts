import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/resend/send-order-confirmation';
import { sendAdminOrderAlertEmail } from '@/lib/resend/send-admin-order-alert';
import { sendAdminOperationalAlertEmail } from '@/lib/resend/send-admin-alert';
import { getAdminNotificationEmail, getEmailSiteUrl } from '@/lib/resend/email-config';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { notifyLowStockProduct } from '@/lib/inventory/stock-alerts';
import type { Json, Order, PaymentEvent } from '@/lib/types/database';
import { awardOrderRewardPoints, cancelRewardRedemption, confirmRewardRedemption } from '@/lib/rewards/service';
import { queueErpOutboundSale } from '@/lib/erp/sync';

interface OrderItemSnapshot {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  image_url?: string;
  carat_weight?: number | null;
  origin?: string | null;
  configuration_summary?: string;
  configuration_snapshot?: unknown;
  tag_number?: string | null;
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

  const adminRecipient = getAdminNotificationEmail() ?? 'admin';
  const messageId = await sendAdminOperationalAlertEmail({
    subject: `Payment review required — ${order.order_number}`,
    preview: `Order ${order.order_number} needs payment review`,
    heading: 'Payment Amount Mismatch',
    paragraphs: [
      'A paid order could not be auto-finalized because the gateway amount did not match the expected order total.',
      'Please review the payment in Razorpay and the admin order panel before fulfilling.',
    ],
    details: [
      { label: 'Order number', value: order.order_number },
      { label: 'Expected (paise)', value: expectedPaise ?? null },
      { label: 'Received (paise)', value: amountPaise ?? null },
      { label: 'Razorpay payment ID', value: razorpayPaymentId ?? null },
      { label: 'Reason', value: reason },
    ],
    cta: { label: 'Review order', href: `${getEmailSiteUrl()}/admin/orders/${order.id}` },
  });

  await supabase.from('notification_log').insert({
    type: 'amount_mismatch',
    recipient: adminRecipient,
    template: 'amount_mismatch_alert',
    context: {
      order_id: order.id,
      order_number: order.order_number,
      expected_paise: expectedPaise ?? null,
      received_paise: amountPaise ?? null,
      razorpay_payment_id: razorpayPaymentId ?? null,
      reason,
      resend_message_id: messageId,
    },
    status: messageId ? 'sent' : getAdminNotificationEmail() ? 'failed' : 'skipped',
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

  await cancelRewardRedemption(order.id);
}

async function updateInventoryForCapturedOrder(order: Order) {
  const supabase = createAdminClient();
  for (const item of orderItems(order)) {
    if (!item.product_id) continue;

    const { data: product } = await supabase
      .from('products')
      .select('id, sku, name, category, stock_quantity, sold_individually, tag_number')
      .eq('id', item.product_id)
      .single();

    if (!product) continue;

    const tagNumber = item.tag_number ?? product.tag_number;

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
      if (tagNumber) {
        await queueErpOutboundSale({
          tagNumber,
          orderId: order.id,
          productId: product.id,
          payload: {
            order_number: order.order_number,
            source: 'website_payment',
            mobile: order.guest_phone,
            customer_name: order.guest_name,
            email: order.guest_email,
            quantity: item.quantity,
          },
        }).catch(() => undefined);
        // ponytail: no MMI API — staff confirms on /admin/erp-sync ack list
      }
      await notifyLowStockProduct({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        stock_quantity: 0,
      }, 'order_captured');
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
    if (nextQuantity === 0 && tagNumber) {
      await queueErpOutboundSale({
        tagNumber,
        orderId: order.id,
        productId: product.id,
        payload: {
          order_number: order.order_number,
          source: 'website_payment',
          quantity: item.quantity,
          mobile: order.guest_phone,
          customer_name: order.guest_name,
          email: order.guest_email,
        },
      }).catch(() => undefined);
    }
    await notifyLowStockProduct({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      stock_quantity: nextQuantity,
    }, 'order_captured');
  }
}

async function markCouponRedeemed(order: Order) {
  const couponDiscount = order.coupon_discount || Math.max(0, Number(order.discount ?? 0) - Number(order.reward_discount ?? 0));
  if (!order.coupon_code || couponDiscount <= 0) return;
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
    discount_amount: couponDiscount,
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
    const siteUrl = getEmailSiteUrl();
    const messageId = await sendOrderConfirmationEmail(recipient.email, {
      customerName: recipient.name,
      orderNumber: order.order_number,
      orderId: order.id,
      items: orderItems(order).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        configuration_summary: item.configuration_summary,
        configuration_snapshot: item.configuration_snapshot,
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
    let adminMessageId: string | null = null;
    if (recipient) {
      adminMessageId = await sendAdminOrderAlertEmail({
        orderId: order.id,
        orderNumber: order.order_number,
        total: Number(order.total ?? 0),
        customerName: recipient.name,
        customerEmail: recipient.email,
        itemCount: orderItems(order).length,
        paymentMethod: order.payment_method,
      });
    }

    const adminRecipient = getAdminNotificationEmail() ?? 'admin';
    await supabase.from('notification_log').insert({
      type: 'admin_order',
      recipient: adminRecipient,
      template: 'verified_order_received',
      context: {
        order_id: order.id,
        order_number: order.order_number,
        total: order.total,
        customer: recipient?.name ?? order.guest_name ?? order.customer_id ?? 'unknown',
        customer_email: recipient?.email ?? order.guest_email ?? null,
        resend_message_id: adminMessageId,
      },
      status: adminMessageId ? 'sent' : getAdminNotificationEmail() ? 'failed' : 'skipped',
    });

    if (adminMessageId || !getAdminNotificationEmail()) {
      await supabase
        .from('orders')
        .update({ admin_notification_sent_at: new Date().toISOString() })
        .eq('id', order.id);
    }
  }

  await createInAppNotifications([
    ...(order.customer_id && !confirmationEmailSentAt ? [{
      audience: 'user' as const,
      recipientUserId: order.customer_id,
      type: 'order_confirmed',
      title: 'Order confirmed',
      message: `Payment received for order ${order.order_number}. You can track the order from your dashboard.`,
      href: '/account/orders',
      entityType: 'order',
      entityId: order.id,
      metadata: { order_number: order.order_number, total: order.total },
    }] : []),
    ...(!adminNotificationSentAt ? [{
      audience: 'admin' as const,
      type: 'order_paid',
      title: 'Order paid',
      message: `Order ${order.order_number} was paid for ₹${Number(order.total ?? 0).toLocaleString('en-IN')}.`,
      href: `/admin/orders/${order.id}`,
      entityType: 'order',
      entityId: order.id,
      metadata: { order_number: order.order_number, total: order.total },
    }] : []),
  ]);
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

  // ── Atomic claim — only ONE finalizer transitions the order to "captured".
  //
  // The client-verify path and the webhook path use DIFFERENT payment-event
  // idempotency keys (`client:<paymentId>` vs `webhook:...`), so the
  // upsertPaymentEvent dedupe does not prevent both from finalizing the same
  // payment. The previous guard (`order.payment_status !== 'captured'`) read
  // a stale snapshot fetched before any write, so two concurrent finalizers
  // would both pass it and run the one-time side effects twice:
  //   • double inventory decrement (lost update → phantom stock),
  //   • double coupon redemption + used_count bump,
  //   • double reward-points award.
  //
  // The conditional UPDATE below is the single source of truth: the row is
  // flipped to "captured" only if it is not already captured, and Postgres
  // row-level locking serializes concurrent claims. The caller that affects
  // the row is the "winner" and owns the one-time side effects.
  const { data: claimed, error: claimError } = await supabase
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
    .eq('id', order.id)
    .neq('payment_status', 'captured')
    .select('id')
    .maybeSingle();

  if (claimError) {
    console.error('[Payment] Failed to claim order for finalization:', claimError);
    // Cannot prove we own the transition — do not run side effects.
    if (eventId) await markPaymentEventProcessed(eventId);
    return;
  }

  if (claimed) {
    // One-time side effects — only the winning finalizer runs these.
    await updateInventoryForCapturedOrder(order);
    await markCouponRedeemed(order);
  }

  // Idempotent side effects — safe to run on every finalization attempt,
  // including replays where another path already claimed the capture.
  // (confirmRewardRedemption is gated on status='pending'; awardOrderRewardPoints
  // is internally idempotent; notifications guard on their own *_sent_at flags.)
  await confirmRewardRedemption(order.id);
  await awardOrderRewardPoints(order);

  await sendVerifiedOrderNotifications(order);

  if (eventId) {
    await markPaymentEventProcessed(eventId);
  }
}