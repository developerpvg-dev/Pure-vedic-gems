/**
 * Recover storefront orders Razorpay already captured when the checkout
 * handler never called /api/payment/verify and the webhook never landed.
 * Consultations already do this; gem orders did not (PVG-2026-00129).
 */
import { findCapturedPaymentOnOrder, type RazorpayPaymentFacts } from '@/lib/razorpay/transactions';
import {
  expectedCurrencyFor,
  expectedPaiseFor,
  findAttemptByRazorpayOrderId,
  recomputeOrderBalances,
  settlePaymentAttempt,
  type PaymentAttempt,
} from '@/lib/orders/online-payments';
import {
  finalizeCapturedPayment,
  markOrderPaymentReview,
} from '@/lib/orders/payment-finalization';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const WINDOW_MS = 21 * 24 * 60 * 60 * 1000;
const MIN_AGE_MS = 2 * 60 * 1000;
const LIMIT = 20;

export function capturedChargeMatches(
  facts: Pick<
    RazorpayPaymentFacts,
    'captured' | 'razorpayOrderAmountPaise' | 'razorpayPaymentAmountPaise' | 'currency'
  >,
  expectedMinor: number,
  expectedCurrency: string,
) {
  return (
    facts.captured &&
    facts.razorpayOrderAmountPaise === expectedMinor &&
    facts.razorpayPaymentAmountPaise === expectedMinor &&
    facts.currency.toUpperCase() === expectedCurrency.toUpperCase()
  );
}

type PendingAttempt = PaymentAttempt & { created_at?: string };

export async function reconcilePendingRazorpayOrders() {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data } = await asUntypedSupabase(createAdminClient())
    .from('order_payments')
    .select('*')
    .eq('status', 'pending')
    .eq('method', 'razorpay')
    .like('razorpay_order_id', 'order_%')
    .gte('created_at', since)
    .order('created_at', { ascending: true })
    .limit(LIMIT);

  let checked = 0;
  let finalized = 0;
  let mismatched = 0;

  for (const row of (data ?? []) as PendingAttempt[]) {
    if (!row.razorpay_order_id) continue;
    const created = row.created_at ? Date.parse(row.created_at) : 0;
    if (created && Date.now() - created < MIN_AGE_MS) continue;

    checked += 1;
    const resolved = await findAttemptByRazorpayOrderId(row.razorpay_order_id);
    if (!resolved?.order || resolved.attempt?.status !== 'pending') continue;

    let facts: RazorpayPaymentFacts | null = null;
    try {
      facts = await findCapturedPaymentOnOrder(row.razorpay_order_id);
    } catch (error) {
      console.error('[Razorpay reconcile] lookup failed', row.razorpay_order_id, error);
      continue;
    }
    if (!facts) continue;

    const expectedMinor = expectedPaiseFor(resolved.order, resolved.attempt);
    const expectedCurrency = expectedCurrencyFor(resolved.attempt);
    if (!capturedChargeMatches(facts, expectedMinor, expectedCurrency)) {
      await markOrderPaymentReview({
        order: resolved.order,
        razorpayPaymentId: facts.razorpayPaymentId,
        reason: `Reconcile: expected ${expectedMinor} minor ${expectedCurrency}, got order ${facts.razorpayOrderAmountPaise}, payment ${facts.razorpayPaymentAmountPaise}, currency ${facts.currency}.`,
        expectedPaise: expectedMinor,
        amountPaise: facts.razorpayPaymentAmountPaise,
      });
      mismatched += 1;
      continue;
    }

    const claimed = await settlePaymentAttempt({
      attemptId: resolved.attempt.id,
      razorpayPaymentId: facts.razorpayPaymentId,
      method: facts.method,
    });
    if (!claimed) continue;

    await finalizeCapturedPayment({
      order: resolved.order,
      razorpayPaymentId: facts.razorpayPaymentId,
      method: facts.method ?? 'razorpay',
      balances: await recomputeOrderBalances(resolved.order.id, resolved.order.total),
      paymentKind: (claimed.kind as 'advance' | 'balance' | 'full' | undefined) ?? 'full',
    });
    finalized += 1;
  }

  return { checked, finalized, mismatched };
}
