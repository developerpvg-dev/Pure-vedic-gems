/**
 * Counter payment ledger helpers for offline / advance-balance orders.
 */

export type CounterPaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';
export type CounterPaymentKind = 'advance' | 'balance' | 'full' | 'refund_adjustment';

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

/** amount_due after applying a payment; rejects overpay. */
export function applyPaymentToBalances(total: number, amountPaid: number, paymentAmount: number) {
  const totalR = roundMoney(total);
  const paidR = roundMoney(amountPaid);
  const payR = roundMoney(paymentAmount);
  if (payR <= 0) throw new Error('Payment amount must be greater than zero.');
  const nextPaid = roundMoney(paidR + payR);
  if (nextPaid > totalR + 0.009) {
    throw new Error(`Payment exceeds balance due (₹${roundMoney(totalR - paidR).toLocaleString('en-IN')}).`);
  }
  const nextDue = roundMoney(Math.max(0, totalR - nextPaid));
  const paymentStatus: 'partial' | 'captured' = nextDue > 0.009 ? 'partial' : 'captured';
  return { amount_paid: nextPaid, amount_due: nextDue, payment_status: paymentStatus };
}

export function inferPaymentKind(amount: number, total: number, priorPaid: number): CounterPaymentKind {
  const a = roundMoney(amount);
  const t = roundMoney(total);
  const p = roundMoney(priorPaid);
  if (p <= 0.009 && a >= t - 0.009) return 'full';
  if (p <= 0.009) return 'advance';
  return 'balance';
}

/** Smallest share of the order total an online customer may pay upfront. */
export const ADVANCE_MIN_PERCENT = 20;

/** Advance floor in INR, rounded up to the rupee so it never lands under 20%. */
export function minAdvanceAmount(total: number) {
  return Math.min(roundMoney(total), Math.ceil((roundMoney(total) * ADVANCE_MIN_PERCENT) / 100));
}

/**
 * Amount to charge for the next online payment on an order.
 *
 * First leg: customer picks anything from the 20% floor up to the full total.
 * Second leg: always settles the whole remaining balance — no third payment.
 * Throws with a customer-safe message when the requested amount is not allowed.
 */
export function resolveOnlinePaymentAmount(
  total: number,
  amountPaid: number,
  requested?: number | null,
): { amount: number; kind: Extract<CounterPaymentKind, 'advance' | 'balance' | 'full'> } {
  const totalR = roundMoney(total);
  const due = roundMoney(totalR - roundMoney(amountPaid));
  if (due <= 0.009) throw new Error('This order is already fully paid.');
  if (roundMoney(amountPaid) > 0.009) return { amount: due, kind: 'balance' };

  const amount = requested == null ? totalR : roundMoney(requested);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid payment amount.');
  if (amount > totalR + 0.009) throw new Error('Payment amount exceeds the order total.');

  const floor = minAdvanceAmount(totalR);
  if (amount < floor - 0.009) {
    throw new Error(
      `Minimum advance for this order is ₹${floor.toLocaleString('en-IN')} (${ADVANCE_MIN_PERCENT}% of the total).`,
    );
  }
  return { amount, kind: amount >= totalR - 0.009 ? 'full' : 'advance' };
}

// ponytail: `npx tsx -e "import { __orderPaymentsSelfCheck } from './src/lib/orders/counter-payments.ts'; __orderPaymentsSelfCheck()"`
export function __orderPaymentsSelfCheck() {
  const a = applyPaymentToBalances(10000, 0, 3000);
  console.assert(a.amount_paid === 3000 && a.amount_due === 7000 && a.payment_status === 'partial');
  const b = applyPaymentToBalances(10000, 3000, 7000);
  console.assert(b.amount_paid === 10000 && b.amount_due === 0 && b.payment_status === 'captured');
  let threw = false;
  try {
    applyPaymentToBalances(10000, 3000, 8000);
  } catch {
    threw = true;
  }
  console.assert(threw, 'overpay must throw');
  console.assert(inferPaymentKind(10000, 10000, 0) === 'full');
  console.assert(inferPaymentKind(3000, 10000, 0) === 'advance');
  console.assert(inferPaymentKind(7000, 10000, 3000) === 'balance');

  // ── Online advance rules ──────────────────────────────────────────────
  console.assert(minAdvanceAmount(10000) === 2000, '20% of 10000');
  console.assert(minAdvanceAmount(1001) === 201, 'floor rounds up, never under 20%');
  console.assert(minAdvanceAmount(50) === 10, 'small totals still 20%');

  const adv = resolveOnlinePaymentAmount(10000, 0, 2000);
  console.assert(adv.amount === 2000 && adv.kind === 'advance', 'exact 20% allowed');
  console.assert(resolveOnlinePaymentAmount(10000, 0, 10000).kind === 'full', '100% is full');
  console.assert(resolveOnlinePaymentAmount(10000, 0).amount === 10000, 'no request = pay in full');

  console.assert(resolveOnlinePaymentAmount(10000, 2000, 500).amount === 8000, 'balance settles all');

  // Partial bank-transfer verify must never invent a full settlement.
  const half = applyPaymentToBalances(9450, 0, 4725);
  console.assert(half.payment_status === 'partial' && half.amount_paid === 4725 && half.amount_due === 4725);
  console.assert(resolveOnlinePaymentAmount(9450, 0, 4725).kind === 'advance');
  console.assert(resolveOnlinePaymentAmount(9450, 4725).kind === 'balance');

  for (const [total, paid, req, why] of [
    [10000, 0, 1999, 'below 20% floor'],
    [10000, 0, 10001, 'above total'],
    [10000, 0, 0, 'zero'],
    [10000, 10000, 100, 'already paid'],
  ] as const) {
    let rejected = false;
    try {
      resolveOnlinePaymentAmount(total, paid, req);
    } catch {
      rejected = true;
    }
    console.assert(rejected, `must reject: ${why}`);
  }

  console.log('order counter-payments self-check ok');
}
