'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { RING_SIZE_CONFIRM_COPY } from '@/lib/orders/ring-size-confirmation';

export function RingSizeConfirmForm({
  token,
  orderNumber,
  alreadyImageUrl,
  adminRemarks,
  round = 1,
}: {
  token: string;
  orderNumber: string;
  alreadyImageUrl?: string | null;
  adminRemarks?: string | null;
  round?: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [doneUrl, setDoneUrl] = useState<string | null>(alreadyImageUrl ?? null);

  const onFile = (next: File | null) => {
    setFile(next);
    setError('');
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const submit = async () => {
    if (!file || doneUrl) return;
    setSaving(true);
    setError('');
    try {
      const body = new FormData();
      body.set('token', token);
      body.set('file', file);
      const res = await fetch('/api/orders/ring-size-confirmation', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not upload');
        return;
      }
      setDoneUrl(data.image_url ?? preview);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  if (doneUrl) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Order {orderNumber}
        </p>
        <h2 className="mt-2 font-heading text-2xl text-stone-900">Thank you</h2>
        <p className="mt-2 text-sm text-stone-600">
          We received your ring diameter photo and will use it to double-check your size before making.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doneUrl}
          alt="Your ring diameter measurement"
          className="mt-5 w-full rounded-xl border border-stone-200 object-contain"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
          Order {orderNumber}
          {round > 1 ? ` · Revision ${round}` : ''}
        </p>
        <h2 className="mt-2 font-heading text-2xl text-stone-900">
          {adminRemarks ? 'Please re-upload your ring diameter photo' : 'Confirm your ring size'}
        </h2>
        {adminRemarks ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">What to fix</p>
            <p className="mt-1 whitespace-pre-wrap">{adminRemarks}</p>
          </div>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed text-stone-600">{RING_SIZE_CONFIRM_COPY}</p>

        <div className="mt-5 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          <Image
            src="/ringsizeguide.png"
            alt="How to measure internal ring diameter with a scale in millimetres"
            width={960}
            height={720}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Place a normal/standard scale across the centre of the ring band and photograph the internal diameter in mm.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
          Upload measurement photo
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Selected measurement preview"
            className="mt-4 max-h-72 w-full rounded-xl border border-stone-200 object-contain"
          />
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={!file || saving}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Uploading…' : adminRemarks ? 'Submit new photo' : 'Submit photo'}
        </button>
      </div>
    </div>
  );
}
