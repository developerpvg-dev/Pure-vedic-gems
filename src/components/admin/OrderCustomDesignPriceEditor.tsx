'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Loader2, Save, Send } from 'lucide-react';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const METAL_OPTS = [
  { value: 'gold_22k', label: '22K Gold' },
  { value: 'gold_18k', label: '18K Gold' },
  { value: 'gold_14k', label: '14K Gold' },
  { value: 'silver_925', label: '925 Silver' },
  { value: 'panchdhatu', label: 'Panchdhatu' },
  { value: 'panchdhatu_with_gold', label: 'Panchdhatu (With Gold)' },
  { value: 'copper_pital', label: 'Copper/Pital' },
  { value: 'platinum', label: 'Platinum' },
];

export function OrderCustomDesignPriceEditor({
  orderId,
  itemIndex,
  preferredMetal,
  pending,
  itemName,
}: {
  orderId: string;
  itemIndex: number;
  preferredMetal?: string | null;
  pending: boolean;
  itemName?: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<'weight' | 'fixed'>('weight');
  const [metal, setMetal] = useState(preferredMetal && METAL_OPTS.some((m) => m.value === preferredMetal) ? preferredMetal : 'gold_18k');
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState('');
  const [laborPct, setLaborPct] = useState('20');
  const [making, setMaking] = useState('');
  const [metalPrice, setMetalPrice] = useState('');
  const [diamond, setDiamond] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const preview = useMemo(() => {
    if (mode === 'weight') {
      const w = Number(weight);
      const r = Number(rate);
      const labor = Number(laborPct);
      if (!(w > 0) || !(r > 0)) return null;
      const metalAmt = Math.round(w * r);
      const makingAmt = labor > 0 ? Math.round((metalAmt * labor) / 100) : 0;
      const diamondAmt = Math.round(Number(diamond) || 0);
      return { metalAmt, makingAmt, diamondAmt, total: metalAmt + makingAmt + diamondAmt };
    }
    const makingAmt = Math.round(Number(making) || 0);
    const metalAmt = Math.round(Number(metalPrice) || 0);
    const diamondAmt = Math.round(Number(diamond) || 0);
    if (!(makingAmt > 0) && !(metalAmt > 0)) return null;
    return { metalAmt, makingAmt, diamondAmt, total: metalAmt + makingAmt + diamondAmt };
  }, [mode, weight, rate, laborPct, making, metalPrice, diamond]);

  async function save(notify: boolean) {
    setSaving(true);
    setError('');
    setMessage('');
    const body =
      mode === 'weight'
        ? {
            item_index: itemIndex,
            mode,
            metal,
            metal_weight_grams: Number(weight),
            gold_rate_per_gram: Number(rate),
            labor_rate_percent: Number(laborPct) || 0,
            diamond_charge: Number(diamond) || 0,
            notify,
            note: note.trim() || undefined,
          }
        : {
            item_index: itemIndex,
            mode,
            metal,
            making_charge: Number(making) || 0,
            metal_price: Number(metalPrice) || 0,
            diamond_charge: Number(diamond) || 0,
            notify,
            note: note.trim() || undefined,
          };

    const res = await fetch(`/api/admin/orders/${orderId}/custom-design-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to save custom design price');
      return;
    }
    setMessage(
      notify
        ? `Saved. Balance due ${fmt(Number(data.money?.amount_due ?? 0))}${data.email_sent ? ' — customer notified.' : '.'}`
        : `Saved. Balance due ${fmt(Number(data.money?.amount_due ?? 0))}.`,
    );
    router.refresh();
  }

  return (
    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 text-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-indigo-800">
        {pending ? 'Set custom design mounting price' : 'Update custom design mounting price'}
      </p>
      {itemName ? <p className="mt-1 text-xs text-indigo-700">{itemName}</p> : null}
      {preferredMetal && !METAL_OPTS.some((m) => m.value === preferredMetal) ? (
        <p className="mt-1 text-xs text-indigo-700">Customer preferred: {preferredMetal}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('weight')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === 'weight' ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-800 border border-indigo-200'}`}
        >
          Weight + labour %
        </button>
        <button
          type="button"
          onClick={() => setMode('fixed')}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === 'fixed' ? 'bg-indigo-700 text-white' : 'bg-white text-indigo-800 border border-indigo-200'}`}
        >
          Fixed making
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block text-xs">
          <span className="font-medium text-indigo-900">Metal</span>
          <select
            value={metal}
            onChange={(e) => setMetal(e.target.value)}
            className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
          >
            {METAL_OPTS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {mode === 'weight' ? (
          <>
            <label className="block text-xs">
              <span className="font-medium text-indigo-900">Weight (g)</span>
              <input
                type="number"
                step="0.001"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="font-medium text-indigo-900">Rate / g (₹)</span>
              <input
                type="number"
                step="1"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="font-medium text-indigo-900">Labour %</span>
              <input
                type="number"
                step="1"
                min="0"
                value={laborPct}
                onChange={(e) => setLaborPct(e.target.value)}
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
              />
            </label>
          </>
        ) : (
          <>
            <label className="block text-xs">
              <span className="font-medium text-indigo-900">Making (₹)</span>
              <input
                type="number"
                step="1"
                min="0"
                value={making}
                onChange={(e) => setMaking(e.target.value)}
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="font-medium text-indigo-900">Metal price (₹)</span>
              <input
                type="number"
                step="1"
                min="0"
                value={metalPrice}
                onChange={(e) => setMetalPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
              />
            </label>
          </>
        )}

        <label className="block text-xs">
          <span className="font-medium text-indigo-900">Diamond / stone add-on (₹)</span>
          <input
            type="number"
            step="1"
            min="0"
            value={diamond}
            onChange={(e) => setDiamond(e.target.value)}
            className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="mt-2 block text-xs">
        <span className="font-medium text-indigo-900">Note to customer (optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-md border border-indigo-200 bg-white px-2 py-1.5 text-sm"
          placeholder="e.g. Quoted after reviewing your sketch"
        />
      </label>

      {preview ? (
        <p className="mt-2 text-xs text-indigo-900">
          Preview mounting: metal {fmt(preview.metalAmt)} + making {fmt(preview.makingAmt)}
          {preview.diamondAmt > 0 ? ` + stones ${fmt(preview.diamondAmt)}` : ''} ={' '}
          <span className="font-semibold">{fmt(preview.total)}</span>
          <span className="text-indigo-600"> (+ GST on metal/making when saved)</span>
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-emerald-800">{message}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !preview}
          onClick={() => save(false)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save price
        </button>
        <button
          type="button"
          disabled={saving || !preview}
          onClick={() => save(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Save &amp; notify customer
        </button>
      </div>
    </div>
  );
}
