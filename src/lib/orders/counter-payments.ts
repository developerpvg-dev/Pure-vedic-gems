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
  console.log('order counter-payments self-check ok');
}
