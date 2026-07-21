'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';

type PaymentRow = {
  id: string;
  amount: number;
  method: string;
  kind: string;
  reference: string | null;
  notes: string | null;
  paid_at: string;
};

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderPaymentLedger({
  orderId,
  total,
  amountPaid,
  amountDue,
  paymentStatus,
}: {
  orderId: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: string;
}) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [paid, setPaid] = useState(amountPaid);
  const [due, setDue] = useState(amountDue);
  const [status, setStatus] = useState(paymentStatus);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/payments`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Failed to load payments');
      return;
    }
    setPayments(data.payments ?? []);
    setNeedsMigration(Boolean(data.needsMigration));
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPaid(amountPaid);
    setDue(amountDue);
    setStatus(paymentStatus);
    if (amountDue > 0.009) setAmount(String(amountDue));
  }, [amountPaid, amountDue, paymentStatus]);

  async function recordPayment() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/orders/${orderId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        method,
        reference: reference.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to record payment');
      return;
    }
    setPaid(Number(data.amount_paid));
    setDue(Number(data.amount_due));
    setStatus(String(data.payment_status));
    setOpen(false);
    setReference('');
    await load();
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Payment ledger</h2>
          <p className="mt-1 text-sm text-gray-600">
            Paid <strong className="tabular-nums text-emerald-700">{fmt(paid)}</strong>
            {' · '}
            Due <strong className={`tabular-nums ${due > 0.009 ? 'text-amber-700' : 'text-gray-700'}`}>{fmt(due)}</strong>
            {' · '}
            Total {fmt(total)}
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-700">
              {status.replace(/_/g, ' ')}
            </span>
          </p>
        </div>
        {due > 0.009 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-200"
          >
            <Plus className="h-4 w-4" />
            Record payment
          </button>
        ) : null}
      </div>

      {needsMigration ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Run <code className="font-mono text-xs">supabase/week40_offline_orders.sql</code> to enable the payment ledger.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {open ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Amount (₹)</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-gray-600">Reference</span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2"
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="button"
              disabled={saving || !(Number(amount) > 0)}
              onClick={() => void recordPayment()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save payment
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-gray-500">No counter payments recorded yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Kind</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-3 text-gray-600">{fmtDate(p.paid_at)}</td>
                  <td className="py-2 pr-3 capitalize">{p.kind.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-3 uppercase">{p.method.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-3 font-semibold tabular-nums">{fmt(Number(p.amount))}</td>
                  <td className="py-2 text-gray-500">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
