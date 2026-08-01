import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import type { OrderBalances } from '@/lib/orders/online-payments';
import { sendOrderConfirmationEmail } from '@/lib/resend/send-order-confirmation';
import { sendAdminOrderAlertEmail } from '@/lib/resend/send-admin-order-alert';
import { sendAdminOperationalAlertEmail } from '@/lib/resend/send-admin-alert';
import { getAdminNotificationEmail, getEmailSiteUrl } from '@/lib/resend/email-config';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import type { Json, Order, PaymentEvent } from '@/lib/types/database';
import { cancelRewardRedemption, confirmRewardRedemption } from '@/lib/rewards/service';
import {
  keepProductsReservedAfterPayment,
  releaseProductsForOrder,
} from '@/lib/inventory/order-availability';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { orderHasCustomDesignPricingPending } from '@/lib/utils/configuration-snapshot';
import {
  RING_SIZE_CONFIRM_COPY,
  beginRingSizeConfirmation,
  orderHasRingItem,
} from '@/lib/orders/ring-size-confirmation';
import { ringSizeConfirmPublicLink } from '@/lib/orders/ring-size-confirmation-token';

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
  const items = Array.isArray(order.items) ? (order.items as unknown as OrderItemSnapshot[]) : [];
  return items.map((item) => ({
    ...item,
    name: formatProductDisplayName(item.name),
    configuration_summary: item.configuration_summary
      ? formatProductDisplayName(item.configuration_summary)
      : item.configuration_summary,
  }));
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

/** Money already banked against this order — its advance must survive a later failure. */
function amountPaidOn(order: Order) {
  return Number(order.amount_paid ?? 0);
}

export async function markOrderPaymentFailed(order: Order, reason: string, razorpayPaymentId?: string | null) {
  const supabase = createAdminClient();

  // A failed *balance* attempt must not unwind a confirmed, part-paid order:
  // releasing the pieces or cancelling the reward redemption here would punish a
  // customer who already paid their advance and simply mistyped a card.
  if (amountPaidOn(order) > 0.009) {
    await asUntypedSupabase(supabase)
      .from('orders')
      .update({ payment_failure_reason: reason })
      .eq('id', order.id);
    return;
  }

  await supabase
    .from('orders')
    .update({
      razorpay_payment_id: razorpayPaymentId ?? order.razorpay_payment_id,
      payment_status: 'failed',
      payment_failure_reason: reason,
    })
    .eq('id', order.id);

  // Restore pieces held for this unpaid order
  await releaseProductsForOrder(order);
  await cancelRewardRedemption(order.id);
}

/**
 * Razorpay authorized the payment but server-side capture has not landed yet.
 * Shared by the client-verify and webhook paths so neither downgrades a
 * part-paid order's `payment_status` back to 'authorized'.
 */
export async function markOrderPaymentAuthorized(
  order: Order,
  input: {
    razorpayPaymentId: string;
    razorpaySignature?: string | null;
    method?: string | null;
    reason?: string | null;
  },
) {
  await asUntypedSupabase(createAdminClient())
    .from('orders')
    .update({
      razorpay_payment_id: input.razorpayPaymentId,
      ...(input.razorpaySignature ? { razorpay_signature: input.razorpaySignature } : {}),
      ...(amountPaidOn(order) > 0.009 ? {} : { payment_status: 'authorized' }),
      payment_method: input.method ?? 'razorpay',
      payment_failure_reason: null,
      payment_review_reason:
        input.reason ?? 'Payment authorized but server-side capture is still pending',
    })
    .eq('id', order.id);
}

async function updateInventoryForCapturedOrder(order: Order) {
  // ponytail: stay Reserved on site until admin marks sold after billing — do not flip to Sold here
  await keepProductsReservedAfterPayment(order);
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

async function sendVerifiedOrderNotifications(order: Order, balances: OrderBalances) {
  const supabase = createAdminClient();
  const partial = balances.amount_due > 0.009;
  const dueLabel = `₹${balances.amount_due.toLocaleString('en-IN')}`;
  const paidLabel = `₹${balances.amount_paid.toLocaleString('en-IN')}`;
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
    const needsRingConfirm = orderHasRingItem(order.items);
    let ringSizeConfirmUrl: string | undefined;
    let nextComplianceFlags: Record<string, unknown> | null = null;

    if (needsRingConfirm) {
      const { data: flagsRow } = await supabase
        .from('orders')
        .select('compliance_flags')
        .eq('id', order.id)
        .single();
      const started = beginRingSizeConfirmation(flagsRow?.compliance_flags ?? order.compliance_flags);
      nextComplianceFlags = started.flags;
      ringSizeConfirmUrl = ringSizeConfirmPublicLink(order.id, siteUrl);
    }

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
      charges: {
        subtotal: order.subtotal,
        jewelry_charges: order.jewelry_charges,
        metal_charges: order.metal_charges,
        certification_charges: order.certification_charges,
        energization_charges: order.energization_charges,
        shipping_cost: order.shipping_cost,
        discount: order.discount,
        coupon_discount: order.coupon_discount,
        coupon_code: order.coupon_code,
        reward_discount: order.reward_discount,
        reward_points_redeemed: order.reward_points_redeemed,
        gst_amount: order.gst_amount,
        total: order.total,
      },
      amountPaid: balances.amount_paid,
      amountDue: balances.amount_due,
      shippingAddress: order.shipping_address as {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
      },
      siteUrl,
      ringSizeConfirmUrl,
      ringSizeConfirmCopy: ringSizeConfirmUrl ? RING_SIZE_CONFIRM_COPY : undefined,
    });

    if (messageId) {
      await asUntypedSupabase(supabase)
        .from('orders')
        .update({
          confirmation_email_sent_at: new Date().toISOString(),
          ...(nextComplianceFlags ? { compliance_flags: nextComplianceFlags } : {}),
        })
        .eq('id', order.id);
      await supabase.from('notification_log').insert({
        type: 'email',
        recipient: recipient.email,
        template: 'order_confirmation',
        context: {
          order_id: order.id,
          order_number: order.order_number,
          resend_message_id: messageId,
          ring_size_confirm: Boolean(ringSizeConfirmUrl),
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
        paymentMethod: partial
          ? `${order.payment_method ?? 'razorpay'} — advance ${paidLabel}, ${dueLabel} due`
          : order.payment_method,
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
      title: partial ? 'Advance received — order confirmed' : 'Order confirmed',
      message: partial
        ? `We received your advance of ${paidLabel} for order ${order.order_number}. The remaining ${dueLabel} is payable once your order is ready — we will notify you.`
        : `Payment received for order ${order.order_number}. You can track the order from your dashboard.`,
      href: '/account/orders',
      entityType: 'order',
      entityId: order.id,
      metadata: {
        order_number: order.order_number,
        total: order.total,
        amount_paid: balances.amount_paid,
        amount_due: balances.amount_due,
      },
    }] : []),
    ...(!adminNotificationSentAt ? [{
      audience: 'admin' as const,
      type: 'order_paid',
      title: partial ? 'Order advance paid' : 'Order paid',
      message: partial
        ? `Order ${order.order_number}: advance ${paidLabel} received, ${dueLabel} still due.`
        : `Order ${order.order_number} was paid for ₹${Number(order.total ?? 0).toLocaleString('en-IN')}.`,
      href: `/admin/orders/${order.id}`,
      entityType: 'order',
      entityId: order.id,
      metadata: {
        order_number: order.order_number,
        total: order.total,
        amount_paid: balances.amount_paid,
        amount_due: balances.amount_due,
      },
    }] : []),
  ]);
}

/** Customer settled the remaining balance — tell them and unblock fulfillment. */
async function sendBalanceSettledNotifications(order: Order, balances: OrderBalances) {
  await createInAppNotifications([
    ...(order.customer_id ? [{
      audience: 'user' as const,
      recipientUserId: order.customer_id,
      type: 'order_paid',
      title: 'Balance payment received',
      message: `Order ${order.order_number} is now fully paid (₹${balances.amount_paid.toLocaleString('en-IN')}). We are preparing it for dispatch.`,
      href: '/account/orders',
      entityType: 'order',
      entityId: order.id,
      metadata: { order_number: order.order_number, amount_paid: balances.amount_paid },
    }] : []),
    {
      audience: 'admin' as const,
      type: 'order_paid',
      title: 'Balance paid — ready to ship',
      message: `Order ${order.order_number} is fully paid. Remaining balance settled online.`,
      href: `/admin/orders/${order.id}`,
      entityType: 'order',
      entityId: order.id,
      metadata: { order_number: order.order_number, amount_paid: balances.amount_paid },
    },
  ]);
}

/**
 * Order statuses that mean "money has not confirmed this order yet".
 *
 * Used as the atomic claim for the one-time confirmation side effects. Claiming
 * on the *order* status rather than payment_status is what lets an advance
 * payment confirm the order once, while the later balance payment updates the
 * money columns without re-running inventory holds or coupon redemption.
 */
const PRE_CONFIRM_STATUSES = ['pending_payment', 'payment_review', 'placed'];

export async function finalizeCapturedPayment({
  order,
  eventId,
  razorpayPaymentId,
  razorpaySignature,
  method,
  balances,
  paymentKind,
}: {
  order: Order;
  eventId?: string | null;
  /** Optional for manual / bank-transfer capture. */
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  method?: string | null;
  /**
   * Ledger-derived balances. Required — never invent a full settlement here.
   * Callers that omit this used to mark every bank-transfer verify as fully paid.
   */
  balances: OrderBalances;
  /** Which leg of the payment this is; 'balance' switches the customer receipt. */
  paymentKind?: 'advance' | 'balance' | 'full';
}) {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);
  // Known subtotal may be fully paid while custom mounting is still TBD
  const settled =
    orderHasCustomDesignPricingPending(orderItems(order)) && balances.payment_status === 'captured'
      ? { ...balances, payment_status: 'partial' as const }
      : balances;
  // ── Money columns — derived from the ledger, so replays converge ───────
  // Safe to run on every finalization attempt: recomputed sums are idempotent,
  // unlike the increment-in-place this used to be.
  const { error: balanceError } = await db
    .from('orders')
    .update({
      ...(razorpayPaymentId ? { razorpay_payment_id: razorpayPaymentId } : {}),
      ...(razorpaySignature != null ? { razorpay_signature: razorpaySignature } : {}),
      payment_status: settled.payment_status,
      payment_method: method ?? order.payment_method ?? 'razorpay',
      amount_paid: settled.amount_paid,
      amount_due: settled.amount_due,
      amount_verified_at: new Date().toISOString(),
      last_payment_event_id: eventId ?? order.last_payment_event_id,
    })
    .eq('id', order.id);

  if (balanceError) {
    console.error('[Payment] Failed to write order balances:', balanceError);
    // Cannot prove the money landed on the order — do not run side effects.
    if (eventId) await markPaymentEventProcessed(eventId);
    return;
  }

  // ── Atomic claim — only ONE finalizer confirms the order.
  //
  // The client-verify path and the webhook path use DIFFERENT payment-event
  // idempotency keys (`client:<paymentId>` vs `webhook:...`), so the
  // upsertPaymentEvent dedupe does not prevent both from finalizing the same
  // payment. A guard that reads the order snapshot fetched before any write is
  // stale, so two concurrent finalizers would both pass it and run the one-time
  // side effects twice:
  //   • double inventory decrement (lost update → phantom stock),
  //   • double coupon redemption + used_count bump,
  //   • double reward-points award.
  //
  // The conditional UPDATE below is the single source of truth: the row moves
  // to "confirmed" only from a pre-confirmation status, and Postgres row-level
  // locking serializes concurrent claims. The caller that affects the row is
  // the "winner" and owns the one-time side effects.
  const { data: claimed, error: claimError } = await db
    .from('orders')
    .update({
      status: 'confirmed',
      payment_failure_reason: null,
      payment_review_reason: null,
    })
    .eq('id', order.id)
    .in('status', PRE_CONFIRM_STATUSES)
    .select('id')
    .maybeSingle();

  if (claimError) {
    console.error('[Payment] Failed to claim order for confirmation:', claimError);
    if (eventId) await markPaymentEventProcessed(eventId);
    return;
  }

  if (claimed) {
    // One-time side effects — only the winning finalizer runs these.
    await updateInventoryForCapturedOrder(order);
    await markCouponRedeemed(order);
  }

  // Idempotent side effects — safe to run on every finalization attempt,
  // including replays where another path already claimed the confirmation.
  // (confirmRewardRedemption is gated on status='pending'; notifications guard on their
  // own *_sent_at flags.)
  await confirmRewardRedemption(order.id);
  // Note: reward-points earning is admin-controlled now (no automatic point awards).

  if (paymentKind === 'balance') {
    // The confirmation receipt already went out with the advance; this leg only
    // needs the "fully paid, moving to dispatch" notice.
    await sendBalanceSettledNotifications(order, settled);
  } else {
    await sendVerifiedOrderNotifications(order, settled);
  }

  if (eventId) {
    await markPaymentEventProcessed(eventId);
  }
}