'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Scale, Send } from 'lucide-react';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function OrderMetalWeightEditor({
  orderId,
  itemIndex,
  currentWeightGrams,
  quotedWeightGrams,
  goldRatePerGram,
  metalPrice,
  itemName,
}: {
  orderId: string;
  itemIndex: number;
  currentWeightGrams: number;
  quotedWeightGrams?: number | null;
  goldRatePerGram: number;
  metalPrice: number;
  itemName?: string | null;
}) {
  const router = useRouter();
  const [weight, setWeight] = useState(String(currentWeightGrams || ''));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const parsedWeight = Number(weight);
  const previewMetal =
    Number.isFinite(parsedWeight) && parsedWeight > 0 && goldRatePerGram > 0
      ? Math.round(parsedWeight * goldRatePerGram)
      : null;
  const delta =
    previewMetal != null && Number.isFinite(metalPrice) ? previewMetal - Math.round(metalPrice) : null;

  async function save(notify: boolean) {
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/orders/${orderId}/metal-weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        item_index: itemIndex,
        metal_weight_grams: Number(weight),
        notify,
        note: note.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to update metal weight');
      return;
    }
    const money = data.money as
      | { total?: number; amount_due?: number; refund_due?: number }
      | undefined;
    const bits = [
      `Weight saved: ${data.adjust?.oldWeightGrams} g → ${data.adjust?.newWeightGrams} g`,
      money?.total != null ? `New total ${fmt(money.total)}` : null,
      money && money.amount_due != null && money.amount_due > 0.009
        ? `Due ${fmt(money.amount_due)}`
        : null,
      money && money.refund_due != null && money.refund_due > 0.009
        ? `Refund ${fmt(money.refund_due)}`
        : null,
      notify
        ? data.email_sent || data.in_app_sent
          ? 'Customer notified'
          : 'Saved (no customer contact to notify)'
        : 'Saved without notifying',
    ].filter(Boolean);
    setMessage(bits.join(' · '));
    router.refresh();
  }

  async function sendNotification() {
    setNotifying(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/orders/${orderId}/metal-weight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'notify',
        item_index: itemIndex,
        note: note.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setNotifying(false);
    if (!res.ok) {
      setError(data.error || 'Failed to send notification');
      return;
    }
    setMessage(
      data.email_sent || data.in_app_sent
        ? 'Notification sent (email + in-app where available).'
        : 'No customer email/account to notify.',
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-amber-800" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-900">
          Actual metal weight
        </p>
        {itemName ? (
          <span className="ml-auto truncate text-[10px] text-amber-800/70">{itemName}</span>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <label className="block text-xs text-stone-600">
          Weight (g)
          <input
            type="number"
            min={0.001}
            step={0.001}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 outline-none focus:border-amber-400"
          />
        </label>
        <div className="text-xs text-stone-500 sm:pt-5">
          {quotedWeightGrams != null && quotedWeightGrams > 0 ? (
            <p>
              Quoted <span className="font-medium text-stone-700">{quotedWeightGrams} g</span>
            </p>
          ) : null}
          <p>
            Rate{' '}
            <span className="font-medium text-stone-700">
              {fmt(goldRatePerGram)}/g
            </span>
          </p>
          {previewMetal != null ? (
            <p>
              Metal{' '}
              <span className="font-medium text-stone-700">{fmt(previewMetal)}</span>
              {delta != null && Math.abs(delta) >= 1 ? (
                <span className={delta > 0 ? 'text-amber-800' : 'text-emerald-700'}>
                  {' '}
                  ({delta > 0 ? '+' : ''}
                  {fmt(delta)})
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>

      <label className="mt-2 block text-xs text-stone-600">
        Note to customer (optional)
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="e.g. Final weight after casting"
          className="mt-1 w-full rounded-md border border-stone-200 bg-white px-2 py-1.5 text-sm text-stone-900 outline-none focus:border-amber-400"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scale className="h-3.5 w-3.5" />}
          Save &amp; notify
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(false)}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60"
        >
          Save only
        </button>
        <button
          type="button"
          disabled={notifying}
          onClick={() => void sendNotification()}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-60"
        >
          {notifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send notification
        </button>
      </div>

      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-800">{message}</p> : null}
    </div>
  );
}
