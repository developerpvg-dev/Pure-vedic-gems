'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Prefill = 'approve' | 'changes' | null;

export function PackageAddressReviewForm({
  token,
  orderNumber,
  imageUrls,
  round,
  prefill,
  alreadyStatus,
  alreadyRemarks,
}: {
  token: string;
  orderNumber: string;
  imageUrls: string[];
  round: number;
  prefill: Prefill;
  alreadyStatus?: 'approved' | 'changes_requested' | null;
  alreadyRemarks?: string | null;
}) {
  const [decision, setDecision] = useState<'approved' | 'changes_requested' | null>(() => {
    if (alreadyStatus) return alreadyStatus;
    if (prefill === 'approve') return 'approved';
    if (prefill === 'changes') return 'changes_requested';
    return null;
  });
  const [remarks, setRemarks] = useState(alreadyRemarks ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{
    status: 'approved' | 'changes_requested';
    remarks?: string | null;
  } | null>(() =>
    alreadyStatus ? { status: alreadyStatus, remarks: alreadyRemarks ?? null } : null,
  );

  const canSubmit = useMemo(() => {
    if (!decision || done) return false;
    if (decision === 'changes_requested' && !remarks.trim()) return false;
    return true;
  }, [decision, remarks, done]);

  const submit = async () => {
    if (!decision || !canSubmit) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/orders/package-address-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          decision,
          remarks: decision === 'changes_requested' ? remarks.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not submit');
        return;
      }
      setDone({
        status: data.status,
        remarks: data.remarks ?? null,
      });
    } catch {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Order {orderNumber}
        </p>
        <h2 className="mt-2 font-heading text-2xl text-stone-900">
          {done.status === 'approved' ? 'Thank you — package confirmed' : 'Address note received'}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {done.status === 'approved'
            ? 'We will proceed with shipping this package to the address shown.'
            : 'Our team will review your note and correct the address before dispatch.'}
        </p>
        {done.status === 'changes_requested' && done.remarks ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span className="font-semibold">Your note:</span> {done.remarks}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        Order {orderNumber}
        {round > 1 ? ` · Update ${round}` : ''}
      </p>
      <h2 className="mt-2 font-heading text-2xl text-stone-900">Confirm package & address</h2>
      <p className="mt-2 text-sm text-stone-600">
        Check the packed package and the address written on it. Confirm if correct, or report an
        address issue with a short note.
      </p>

      {imageUrls.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {imageUrls.map((url, index) => (
            <a
              key={`${url}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Packing photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setDecision('approved')}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            decision === 'approved'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
              : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
          }`}
        >
          Confirm package & address
        </button>
        <button
          type="button"
          onClick={() => setDecision('changes_requested')}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            decision === 'changes_requested'
              ? 'border-amber-600 bg-amber-50 text-amber-950'
              : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'
          }`}
        >
          Report address issue
        </button>
      </div>

      {decision === 'changes_requested' ? (
        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
            What is wrong with the address?
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="e.g. Flat number is 12B not 12A, landmark missing…"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5"
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit || saving}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving
          ? 'Submitting…'
          : decision === 'approved'
            ? 'Submit confirmation'
            : decision === 'changes_requested'
              ? 'Submit address note'
              : 'Select an option above'}
      </button>
    </div>
  );
}
