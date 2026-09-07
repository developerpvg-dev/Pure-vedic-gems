/**
 * Single settlement path for PayGlocal callback + webhook.
 * Always re-reads status from PayGlocal — never trusts the inbound payload alone.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import type { Consultation, Json, Order, YagyaBooking } from '@/lib/types/database';
import {
  expectedCurrencyFor,
  expectedPaiseFor,
  failPaymentAttempt,
  findAttemptByRazorpayOrderId,
  recomputeOrderBalances,
  settlePaymentAttempt,
} from '@/lib/orders/online-payments';
import {
  finalizeCapturedPayment,
  markOrderPaymentAuthorized,
  markOrderPaymentFailed,
  markOrderPaymentReview,
  markPaymentEventProcessed,
  upsertPaymentEvent,
} from '@/lib/orders/payment-finalization';
import { applyRazorpayFactsToConsultation } from '@/lib/consultation/finalize-captured-payment';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import { sendYagyaBookingEmails } from '@/lib/resend/send-yagya-booking';
import { formatChargedMoney } from '@/lib/currency/format-charged';
import type { RazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import { fetchPayGlocalStatus } from './client';
import { getPayGlocalConfig, isPayGlocalConfigured, parseMerchantTxnId } from './config';
import {
  isPayGlocalAuthorized,
  isPayGlocalCaptured,
  isPayGlocalFailed,
  isPayGlocalPending,
  payGlocalAmountToMinor,
  payGlocalChargeMatches,
} from './status';

export type PayGlocalReconcileOutcome =
  | 'captured'
  | 'authorized'
  | 'failed'
  | 'pending'
  | 'amount_mismatch'
  | 'not_found'
  | 'duplicate'
  | 'misconfigured';

export type PayGlocalReconcileResult = {
  outcome: PayGlocalReconcileOutcome;
  kind: ReturnType<typeof parseMerchantTxnId>;
  entityId: string | null;
  redirectPath: string;
};

function factsFromStatus(
  merchantTxnId: string,
  gid: string,
  expectedMinor: number,
  actualMinor: number | null,
  currency: string,
  method: string | null,
  captured: boolean,
  status: string,
): RazorpayPaymentFacts {
  return {
    razorpayOrderId: merchantTxnId,
    razorpayPaymentId: gid,
    razorpayOrderAmountPaise: expectedMinor,
    razorpayPaymentAmountPaise: actualMinor ?? expectedMinor,
    currency,
    paymentStatus: captured ? 'captured' : status.toLowerCase(),
    captured,
    method: method ? method.toLowerCase() : 'payglocal',
  };
}

function resultPath(
  kind: ReturnType<typeof parseMerchantTxnId>,
  id: string | null,
  outcome: PayGlocalReconcileOutcome,
  merchantTxnId?: string,
) {
  if (kind === 'order' && id && (outcome === 'captured' || outcome === 'duplicate')) {
    return `/order-confirmation/${id}`;
  }
  const status =
    outcome === 'captured' || outcome === 'duplicate'
      ? 'success'
      : outcome === 'pending' || outcome === 'authorized'
        ? 'pending'
        : 'failed';
  const q = new URLSearchParams({ kind: kind ?? 'order', status });
  if (id) q.set('id', id);
  if (merchantTxnId) q.set('txn', merchantTxnId);
  return `/pay/result?${q.toString()}`;
}

async function finalizeYagya(booking: YagyaBooking, gid: string, facts: RazorpayPaymentFacts) {
  const admin = createAdminClient();
  if (booking.payment_status === 'captured') return 'duplicate' as const;

  if (!facts.captured) {
    await admin
      .from('yagya_bookings')
      .update({
        payment_status: facts.paymentStatus === 'authorized' ? 'authorized' : 'failed',
        status: facts.paymentStatus === 'authorized' ? 'pending_payment' : 'payment_review',
        payment_failure_reason:
          facts.paymentStatus === 'authorized' ? null : `PayGlocal status: ${facts.paymentStatus}`,
        razorpay_payment_id: gid,
        payment_method: 'payglocal',
        payment_metadata: facts as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    return facts.paymentStatus === 'authorized' ? ('authorized' as const) : ('failed' as const);
  }

  const { data: updatedRow, error } = await admin
    .from('yagya_bookings')
    .update({
      payment_status: 'captured',
      status: 'confirmed',
      payment_method: facts.method || 'payglocal',
      razorpay_payment_id: gid,
      payment_failure_reason: null,
      payment_review_reason: null,
      amount_verified_at: new Date().toISOString(),
      payment_metadata: facts as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
    .neq('payment_status', 'captured')
    .select('*')
    .maybeSingle();

  const updated = updatedRow as YagyaBooking | null;
  if (error) return 'failed' as const;
  if (!updated) return 'duplicate' as const;

  void sendYagyaBookingEmails({
    id: updated.id,
    bookingNumber: updated.booking_number,
    fullName: updated.full_name,
    email: updated.email,
    phone: updated.phone,
    yagyaTitle: updated.yagya_title_snapshot,
    amountInr: updated.amount_inr,
    amountPaise: updated.amount_paise,
    currency: updated.currency,
    razorpayPaymentId: updated.razorpay_payment_id,
    preferredDate: updated.preferred_date,
    sankalpName: updated.sankalp_name,
    gotra: updated.gotra,
    rashi: updated.rashi,
    nakshatra: updated.nakshatra,
    message: updated.message,
  });

  await createInAppNotifications([
    ...(updated.customer_id
      ? [{
          audience: 'user' as const,
          recipientUserId: updated.customer_id,
          type: 'yagya_confirmed',
          title: 'Yagya booking confirmed',
          message: `${updated.yagya_title_snapshot} is confirmed (${formatChargedMoney({
            amount_inr: updated.amount_inr,
            amount_paise: updated.amount_paise,
            currency: updated.currency,
          })}). Our priests will coordinate the next steps.`,
          href: '/account/yagyas',
          entityType: 'yagya_booking' as const,
          entityId: updated.id,
          metadata: { yagya_title: updated.yagya_title_snapshot, amount_inr: updated.amount_inr },
        }]
      : []),
    {
      audience: 'admin',
      recipientRole: 'sales',
      type: 'yagya_confirmed',
      title: 'Yagya paid',
      message: `${updated.full_name} paid ${formatChargedMoney({
        amount_inr: updated.amount_inr,
        amount_paise: updated.amount_paise,
        currency: updated.currency,
      })} for ${updated.yagya_title_snapshot}.`,
      href: '/admin/yagya-bookings',
      entityType: 'yagya_booking',
      entityId: updated.id,
      metadata: { yagya_title: updated.yagya_title_snapshot, amount_inr: updated.amount_inr },
    },
  ]);

  return 'captured' as const;
}

export async function reconcilePayGlocalPayment(
  merchantTxnId: string,
  source: 'callback' | 'webhook',
  inboundGid?: string | null,
  jwtStatus?: string | null,
): Promise<PayGlocalReconcileResult> {
  const kind = parseMerchantTxnId(merchantTxnId);
  const empty = (outcome: PayGlocalReconcileOutcome, entityId: string | null = null): PayGlocalReconcileResult => ({
    outcome,
    kind,
    entityId,
    redirectPath: resultPath(kind, entityId, outcome, merchantTxnId),
  });

  if (!isPayGlocalConfigured()) return empty('misconfigured');

  let status;
  try {
    status = await fetchPayGlocalStatus(inboundGid || merchantTxnId);
    if (source === 'callback' && isPayGlocalPending(status.status)) {
      await new Promise((r) => setTimeout(r, 2000));
      status = await fetchPayGlocalStatus(status.gid || inboundGid || merchantTxnId);
    }
  } catch (error) {
    console.error('[PayGlocal] Status poll failed:', error);
    // Docs: verified callback JWT is enough; Get Status is when the token is missing.
    if (source === 'callback' && jwtStatus) {
      status = {
        gid: inboundGid || merchantTxnId,
        status: jwtStatus,
        merchantTxnId,
        amount: null,
        currency: null,
        txnCurrency: null,
        paymentMethod: null,
        raw: { source: 'callback_jwt', status: jwtStatus },
      };
    } else {
      return empty('pending');
    }
  }

  if (jwtStatus && isPayGlocalCaptured(jwtStatus) && isPayGlocalPending(status.status)) {
    status = { ...status, status: jwtStatus };
  }

  const gid = status.gid || inboundGid || merchantTxnId;
  const eventId = `${source}:${gid}:${status.status}`;
  const { event, alreadyProcessed } = await upsertPaymentEvent({
    provider: 'payglocal',
    eventId,
    eventType: `payglocal.${source}.${status.status || 'unknown'}`,
    razorpayOrderId: merchantTxnId,
    razorpayPaymentId: gid,
    signatureValid: true,
    status: 'received',
    payload: status.raw as Json,
  });

  if (alreadyProcessed) {
    const resolved = await resolveEntity(merchantTxnId);
    return empty('duplicate', resolved.entityId);
  }

  if (isPayGlocalCaptured(status.status)) {
    const settled = await settleCaptured(merchantTxnId, gid, status, event.id);
    return empty(settled.outcome, settled.entityId);
  }

  if (isPayGlocalAuthorized(status.status)) {
    const settled = await markAuthorized(merchantTxnId, gid, event.id);
    return empty(settled, (await resolveEntity(merchantTxnId)).entityId);
  }

  if (isPayGlocalFailed(status.status) || !isPayGlocalPending(status.status)) {
    const settled = await markFailed(merchantTxnId, gid, status.status, event.id);
    return empty(settled, (await resolveEntity(merchantTxnId)).entityId);
  }

  await markPaymentEventProcessed(event.id, 'pending');
  return empty('pending', (await resolveEntity(merchantTxnId)).entityId);
}

async function resolveEntity(merchantTxnId: string) {
  const kind = parseMerchantTxnId(merchantTxnId);
  const admin = createAdminClient();
  if (kind === 'order') {
    const found = await findAttemptByRazorpayOrderId(merchantTxnId);
    return { entityId: found?.order.id ?? null };
  }
  if (kind === 'consultation') {
    const { data } = await admin.from('consultations').select('id').eq('razorpay_order_id', merchantTxnId).maybeSingle();
    return { entityId: (data as { id: string } | null)?.id ?? null };
  }
  const { data } = await admin.from('yagya_bookings').select('id').eq('razorpay_order_id', merchantTxnId).maybeSingle();
  return { entityId: (data as { id: string } | null)?.id ?? null };
}

async function settleCaptured(
  merchantTxnId: string,
  gid: string,
  status: Awaited<ReturnType<typeof fetchPayGlocalStatus>>,
  eventId: string,
): Promise<{ outcome: PayGlocalReconcileOutcome; entityId: string | null }> {
  const kind = parseMerchantTxnId(merchantTxnId);
  const admin = createAdminClient();

  if (kind === 'order' || !kind) {
    const found = await findAttemptByRazorpayOrderId(merchantTxnId);
    if (!found) {
      await markPaymentEventProcessed(eventId, 'order_not_found');
      return { outcome: 'not_found', entityId: null };
    }
    const { order, attempt } = found;
    const expectedMinor = expectedPaiseFor(order, attempt);
    const expectedCurrency = expectedCurrencyFor(attempt);
    const ledgerInrMinor = Math.round(Number(attempt?.amount ?? order.total) * 100);
    if (
      !payGlocalChargeMatches({
        expectedMinor,
        expectedCurrency,
        amount: status.amount,
        currencies: [status.currency, status.txnCurrency],
        ledgerInrMinor,
      })
    ) {
      const actualMinor = payGlocalAmountToMinor(status.amount, status.currency ?? expectedCurrency);
      await markOrderPaymentReview({
        order,
        eventId,
        razorpayPaymentId: gid,
        reason: `PayGlocal amount mismatch: expected ${expectedMinor} ${expectedCurrency}, got ${actualMinor} ${status.currency ?? status.txnCurrency}`,
        expectedPaise: expectedMinor,
        amountPaise: actualMinor,
      });
      await markPaymentEventProcessed(eventId, 'amount_mismatch');
      return { outcome: 'amount_mismatch', entityId: order.id };
    }

    const claimed = attempt
      ? await settlePaymentAttempt({
          attemptId: attempt.id,
          razorpayPaymentId: gid,
          method: 'payglocal',
        })
      : null;

    if (attempt && !claimed) {
      if (attempt.status === 'paid' || (await findAttemptByRazorpayOrderId(merchantTxnId))?.attempt?.status === 'paid') {
        await markPaymentEventProcessed(eventId, 'duplicate');
        return { outcome: 'duplicate', entityId: order.id };
      }
      console.error('[PayGlocal] Could not mark order_payments paid; order stays unsettled', attempt.id);
      await markPaymentEventProcessed(eventId, 'settle_failed');
      return { outcome: 'pending', entityId: order.id };
    }

    await finalizeCapturedPayment({
      order,
      eventId,
      razorpayPaymentId: gid,
      method: 'payglocal',
      balances: claimed
        ? await recomputeOrderBalances(order.id, order.total)
        : { amount_paid: Number(order.total), amount_due: 0, payment_status: 'captured' },
      paymentKind: (claimed?.kind as 'advance' | 'balance' | 'full' | undefined) ?? 'full',
    });
    return { outcome: 'captured', entityId: order.id };
  }

  if (kind === 'consultation') {
    const { data } = await admin.from('consultations').select('*').eq('razorpay_order_id', merchantTxnId).maybeSingle();
    const consultation = data as Consultation | null;
    if (!consultation) {
      await markPaymentEventProcessed(eventId, 'order_not_found');
      return { outcome: 'not_found', entityId: null };
    }
    const expectedMinor =
      consultation.amount_paise ?? Math.round(Number(consultation.amount_inr ?? 0) * 100);
    const expectedCurrency = String(consultation.currency || 'INR').toUpperCase();
    if (
      !payGlocalChargeMatches({
        expectedMinor,
        expectedCurrency,
        amount: status.amount,
        currencies: [status.currency, status.txnCurrency],
        ledgerInrMinor: Math.round(Number(consultation.amount_inr ?? 0) * 100),
      })
    ) {
      const actualMinor = payGlocalAmountToMinor(status.amount, status.currency ?? expectedCurrency);
      const facts = factsFromStatus(
        merchantTxnId,
        gid,
        expectedMinor,
        actualMinor,
        expectedCurrency,
        'payglocal',
        false,
        status.status,
      );
      const result = await applyRazorpayFactsToConsultation({
        admin,
        consultation,
        facts,
        razorpayPaymentId: gid,
      });
      await markPaymentEventProcessed(eventId, result.status);
      return { outcome: 'amount_mismatch', entityId: consultation.id };
    }
    const facts = factsFromStatus(
      merchantTxnId,
      gid,
      expectedMinor,
      expectedMinor,
      expectedCurrency,
      'payglocal',
      true,
      status.status,
    );
    const result = await applyRazorpayFactsToConsultation({
      admin,
      consultation,
      facts,
      razorpayPaymentId: gid,
    });
    await markPaymentEventProcessed(eventId, result.status === 'captured' ? 'processed' : result.status);
    return {
      outcome:
        result.status === 'captured'
          ? 'captured'
          : result.status === 'amount_mismatch'
            ? 'amount_mismatch'
            : 'failed',
      entityId: consultation.id,
    };
  }

  const { data } = await admin.from('yagya_bookings').select('*').eq('razorpay_order_id', merchantTxnId).maybeSingle();
  const booking = data as YagyaBooking | null;
  if (!booking) {
    await markPaymentEventProcessed(eventId, 'order_not_found');
    return { outcome: 'not_found', entityId: null };
  }
  const expectedMinor = booking.amount_paise ?? Math.round(Number(booking.amount_inr ?? 0) * 100);
  const expectedCurrency = String(booking.currency || 'INR').toUpperCase();
  if (
    !payGlocalChargeMatches({
      expectedMinor,
      expectedCurrency,
      amount: status.amount,
      currencies: [status.currency, status.txnCurrency],
      ledgerInrMinor: Math.round(Number(booking.amount_inr ?? 0) * 100),
    })
  ) {
    await admin
      .from('yagya_bookings')
      .update({
        payment_status: 'amount_mismatch',
        status: 'payment_review',
        payment_review_reason: 'PayGlocal amount or currency did not match booking amount',
        razorpay_payment_id: gid,
        payment_metadata: status.raw as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    await markPaymentEventProcessed(eventId, 'amount_mismatch');
    return { outcome: 'amount_mismatch', entityId: booking.id };
  }
  const facts = factsFromStatus(
    merchantTxnId,
    gid,
    expectedMinor,
    expectedMinor,
    expectedCurrency,
    'payglocal',
    true,
    status.status,
  );
  const outcome = await finalizeYagya(booking, gid, facts);
  await markPaymentEventProcessed(eventId, outcome);
  return { outcome, entityId: booking.id };
}

async function markAuthorized(merchantTxnId: string, gid: string, eventId: string) {
  const found = await findAttemptByRazorpayOrderId(merchantTxnId);
  if (found?.order) {
    await markOrderPaymentAuthorized(found.order, { razorpayPaymentId: gid, method: 'payglocal' });
    await markPaymentEventProcessed(eventId, 'authorized');
    return 'authorized' as const;
  }
  const admin = createAdminClient();
  await asUntypedSupabase(admin)
    .from('consultations')
    .update({
      payment_status: 'authorized',
      payment_review_reason: 'PayGlocal authorized; capture pending',
      razorpay_payment_id: gid,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', merchantTxnId);
  await asUntypedSupabase(admin)
    .from('yagya_bookings')
    .update({
      payment_status: 'authorized',
      payment_review_reason: 'PayGlocal authorized; capture pending',
      razorpay_payment_id: gid,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', merchantTxnId);
  await markPaymentEventProcessed(eventId, 'authorized');
  return 'authorized' as const;
}

async function markFailed(merchantTxnId: string, gid: string, status: string, eventId: string) {
  const found = await findAttemptByRazorpayOrderId(merchantTxnId);
  if (found?.attempt) await failPaymentAttempt(found.attempt.id, `PayGlocal status: ${status}`);
  if (found?.order) await markOrderPaymentFailed(found.order, `PayGlocal status: ${status}`, gid);
  const admin = createAdminClient();
  await asUntypedSupabase(admin)
    .from('consultations')
    .update({
      payment_status: 'failed',
      payment_failure_reason: `PayGlocal status: ${status}`,
      razorpay_payment_id: gid,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', merchantTxnId)
    .neq('payment_status', 'captured');
  await asUntypedSupabase(admin)
    .from('yagya_bookings')
    .update({
      payment_status: 'failed',
      payment_failure_reason: `PayGlocal status: ${status}`,
      razorpay_payment_id: gid,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', merchantTxnId)
    .neq('payment_status', 'captured');
  await markPaymentEventProcessed(eventId, 'failed');
  return 'failed' as const;
}

/** Docs often omit merchantId on callback JWT — only reject when present and wrong. */
export function callbackMerchantIdMatches(merchantId: string | null | undefined) {
  if (!merchantId?.trim()) return true;
  return merchantId.trim().toLowerCase() === getPayGlocalConfig().merchantId.toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function claimStr(claims: Record<string, unknown>, ...keys: string[]) {
  const nested = asRecord(claims.data);
  for (const key of keys) {
    for (const bag of [claims, nested]) {
      const value = bag?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
  }
  return '';
}

/** PayGlocal JWT uses merchantUniqueId / x-gl-* more often than merchantTxnId. */
export function txnIdFromPayGlocalClaims(claims: Record<string, unknown>) {
  return {
    merchantTxnId: claimStr(claims, 'merchantTxnId', 'merchantUniqueId'),
    gid: claimStr(claims, 'gid', 'x-gl-gid') || null,
    merchantId: claimStr(claims, 'merchantId', 'x-gl-merchantId') || null,
    status: claimStr(claims, 'status') || null,
  };
}

export async function lookupMerchantTxnIdByGid(gid: string) {
  const admin = createAdminClient();
  for (const table of ['orders', 'consultations', 'yagya_bookings'] as const) {
    const { data } = await admin.from(table).select('razorpay_order_id').eq('razorpay_payment_id', gid).maybeSingle();
    const id = (data as { razorpay_order_id?: string | null } | null)?.razorpay_order_id;
    if (id) return id;
  }
  return null;
}
