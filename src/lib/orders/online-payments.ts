/**
 * Online (Razorpay) payment attempts on the Week 40 counter ledger.
 *
 * Every Razorpay order for a storefront order gets one `order_payments` row:
 * `pending` when the gateway order is created, `paid` once captured. That row —
 * not `orders.total` — is the expected amount for signature/amount checks, which
 * is what makes 20-100% advance payments verifiable, and it keeps the ledger the
 * single audit trail for counter and online money alike.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { roundMoney } from '@/lib/orders/counter-payments';
import { parseGatewayReference } from '@/lib/razorpay/charge-currency';
import type { Order } from '@/lib/types/database';

export type PaymentAttempt = {
  id: string;
  order_id: string;
  /** Ledger amount in INR (books stay INR). */
  amount: number;
  kind: string;
  method: string;
  status: 'pending' | 'paid' | 'failed';
  /** Gateway charge as `CURRENCY:minor` (e.g. USD:1234). Null = legacy INR paise. */
  reference: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
};

function db() {
  return asUntypedSupabase(createAdminClient());
}

/** The in-flight attempt for an order, if the customer already opened checkout. */
export async function findPendingAttempt(orderId: string): Promise<PaymentAttempt | null> {
  const { data } = await db()
    .from('order_payments')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .maybeSingle();
  return (data as PaymentAttempt | null) ?? null;
}

/**
 * Resolve a Razorpay order id to its attempt + order.
 *
 * Falls back to `orders.razorpay_order_id` so payments started before this
 * feature shipped (or by the legacy full-amount path) still finalize.
 */
export async function findAttemptByRazorpayOrderId(
  razorpayOrderId: string,
): Promise<{ attempt: PaymentAttempt | null; order: Order } | null> {
  const client = db();
  const { data: attempt } = await client
    .from('order_payments')
    .select('*')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle();

  const orderId = (attempt as PaymentAttempt | null)?.order_id;
  const { data: order } = orderId
    ? await client.from('orders').select('*').eq('id', orderId).maybeSingle()
    : await client.from('orders').select('*').eq('razorpay_order_id', razorpayOrderId).maybeSingle();

  if (!order) return null;
  return { attempt: (attempt as PaymentAttempt | null) ?? null, order: order as Order };
}

/** Expected Razorpay amount in minor units; legacy rows without reference are INR paise. */
export function expectedPaiseFor(order: Order, attempt: PaymentAttempt | null) {
  const gateway = parseGatewayReference(attempt?.reference);
  if (gateway) return gateway.minor;
  return Math.round(Number(attempt?.amount ?? order.total) * 100);
}

/** Expected Razorpay currency for this attempt. */
export function expectedCurrencyFor(attempt: PaymentAttempt | null) {
  return parseGatewayReference(attempt?.reference)?.currency ?? 'INR';
}

/**
 * Open a ledger row for a new Razorpay order, replacing any stale pending row.
 * The partial unique index on `(order_id) WHERE status = 'pending'` keeps this
 * to one in-flight attempt even if two tabs race.
 */
export async function openPaymentAttempt(input: {
  orderId: string;
  /** INR ledger amount. */
  amount: number;
  kind: 'advance' | 'balance' | 'full';
  razorpayOrderId: string;
  /** `CURRENCY:minor` from encodeGatewayReference. */
  reference: string;
}) {
  const client = db();
  await client
    .from('order_payments')
    .update({ status: 'failed', notes: 'Superseded by a newer payment attempt' })
    .eq('order_id', input.orderId)
    .eq('status', 'pending');

  const { data, error } = await client
    .from('order_payments')
    .insert({
      order_id: input.orderId,
      amount: roundMoney(input.amount),
      method: 'razorpay',
      kind: input.kind,
      provider: 'razorpay',
      status: 'pending',
      razorpay_order_id: input.razorpayOrderId,
      reference: input.reference,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(
      String(error?.message ?? '').includes('order_payments')
        ? 'Run supabase/week45_online_advance_payments.sql to enable online advance payments.'
        : 'Could not start the payment. Please try again.',
    );
  }
  return data as PaymentAttempt;
}

/**
 * Atomically claim an attempt as captured. Returns null when another finalizer
 * (client verify vs webhook) already claimed it, so one-time side effects and
 * receipts run exactly once.
 */
export async function settlePaymentAttempt(input: {
  attemptId: string;
  razorpayPaymentId: string;
  method?: string | null;
}): Promise<PaymentAttempt | null> {
  const { data } = await db()
    .from('order_payments')
    .update({
      status: 'paid',
      razorpay_payment_id: input.razorpayPaymentId,
      method: input.method || 'razorpay',
      paid_at: new Date().toISOString(),
    })
    .eq('id', input.attemptId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  return (data as PaymentAttempt | null) ?? null;
}

export async function failPaymentAttempt(attemptId: string, reason: string) {
  await db()
    .from('order_payments')
    .update({ status: 'failed', notes: reason.slice(0, 500) })
    .eq('id', attemptId)
    .eq('status', 'pending');
}

export type OrderBalances = {
  amount_paid: number;
  amount_due: number;
  payment_status: 'partial' | 'captured';
};

/**
 * Recompute balances from settled ledger rows.
 *
 * Derived rather than incremented on purpose: replays and out-of-order webhook
 * retries converge on the same numbers instead of double-counting.
 */
export async function recomputeOrderBalances(orderId: string, total: number): Promise<OrderBalances> {
  const { data } = await db()
    .from('order_payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('status', 'paid');

  const rows = (data ?? []) as Array<{ amount: number | string }>;
  const totalR = roundMoney(total);
  const paid = roundMoney(rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0));
  const due = roundMoney(Math.max(0, totalR - paid));

  return {
    amount_paid: paid,
    amount_due: due,
    payment_status: due > 0.009 ? 'partial' : 'captured',
  };
}
