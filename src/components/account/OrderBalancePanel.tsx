'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import { runRazorpayCheckout, type CheckoutStage } from '@/lib/razorpay/checkout-client';

export type CustomerPaymentRow = {
  id: string;
  amount: number;
  method: string;
  kind: string;
  status: string;
  reference: string | null;
  paid_at: string | null;
};

const KIND_LABELS: Record<string, string> = {
  advance: 'Advance payment',
  balance: 'Balance payment',
  full: 'Full payment',
  refund_adjustment: 'Refund adjustment',
};

const STAGE_LABELS: Record<CheckoutStage, string> = {
  creating_payment: 'Connecting to payment gateway…',
  paying: 'Complete payment in the Razorpay window',
  verifying: 'Verifying your payment…',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Advance / balance summary on a customer's own order, with the receipt trail
 * and a Razorpay button when money is still owed.
 */
export function OrderBalancePanel({
  orderId,
  orderNumber,
  total,
  amountPaid,
  amountDue,
  balanceRequested,
  canPay,
  payments,
  prefill,
}: {
  orderId: string;
  orderNumber: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  /** Admin has told the customer the order is ready. */
  balanceRequested: boolean;
  /** False for cancelled/refunded orders. */
  canPay: boolean;
  payments: CustomerPaymentRow[];
  prefill: { name: string; email: string; contact: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<CheckoutStage | null>(null);
  const [error, setError] = useState('');
  const settled = payments.filter((p) => p.status === 'paid');

  async function payBalance() {
    setBusy(true);
    setError('');
    await runRazorpayCheckout({
      orderId,
      orderNumber,
      // Balance leg always settles the full remainder — the server enforces it.
      payAmount: null,
      prefill,
      onStage: setStage,
      onSuccess: () => {
        setStage(null);
        setBusy(false);
        router.refresh();
      },
      onDismiss: () => {
        setStage(null);
        setBusy(false);
        setError('Payment was cancelled. You can pay the balance any time.');
      },
      onError: (message) => {
        setStage(null);
        setBusy(false);
        setError(message);
      },
    });
  }

  const owing = amountDue > 0.009;

  return (
    <div
      className={`border-b px-5 py-4 md:px-6 ${
        owing ? 'border-amber-100 bg-amber-50/70' : 'border-emerald-100 bg-emerald-50/60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--pvg-primary)]">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            {owing ? 'Part-paid order' : 'Fully paid'}
          </p>
          <p className="mt-1 text-sm text-[var(--pvg-muted)]">
            Paid <strong className="text-emerald-800">{formatPrice(amountPaid)}</strong> of{' '}
            {formatPrice(total)}
            {owing ? (
              <>
                {' · '}
                Balance due <strong className="text-amber-800">{formatPrice(amountDue)}</strong>
              </>
            ) : null}
          </p>
          {owing ? (
            <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
              {balanceRequested
                ? 'Your order is ready. Pay the balance to schedule dispatch.'
                : 'We will notify you by email and here when your order is ready for the balance payment. You can also pay it early.'}
            </p>
          ) : null}
        </div>

        {owing && canPay ? (
          <button
            type="button"
            onClick={() => void payBalance()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--pvg-primary)' }}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Pay balance {formatPrice(amountDue)}
          </button>
        ) : null}
      </div>

      {stage ? (
        <p className="mt-2 text-xs font-medium text-amber-900">{STAGE_LABELS[stage]}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}

      {settled.length > 0 ? (
        <table className="mt-3 w-full text-left text-xs">
          <caption className="sr-only">Payments recorded for order {orderNumber}</caption>
          <thead className="text-[10px] uppercase tracking-wide text-[var(--pvg-muted)]">
            <tr>
              <th scope="col" className="py-1 pr-3 font-semibold">When</th>
              <th scope="col" className="py-1 pr-3 font-semibold">Type</th>
              <th scope="col" className="py-1 pr-3 font-semibold">Method</th>
              <th scope="col" className="py-1 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="text-[var(--pvg-text)]">
            {settled.map((p) => (
              <tr key={p.id} className="border-t border-black/5">
                <td className="py-1.5 pr-3 text-[var(--pvg-muted)]">{fmtDate(p.paid_at)}</td>
                <td className="py-1.5 pr-3">{KIND_LABELS[p.kind] ?? p.kind}</td>
                <td className="py-1.5 pr-3 uppercase">{p.method.replace(/_/g, ' ')}</td>
                <td className="py-1.5 font-semibold tabular-nums">{formatPrice(Number(p.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
