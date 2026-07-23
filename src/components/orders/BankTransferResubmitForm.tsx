'use client';

import { useState } from 'react';
import { Building2, Check, Copy, Loader2, Upload } from 'lucide-react';
import { BANK_ACCOUNTS, type BankAccountId } from '@/lib/constants/bank-accounts';
import type { BankTransferProof } from '@/lib/orders/bank-transfer-proof';

type Props = {
  orderId: string;
  orderTotalLabel?: string;
  existing?: BankTransferProof | null;
  /** Guest recovery when cookie expired */
  requireContactConfirm?: boolean;
  onSubmitted?: (result: { status: string }) => void;
};

export function BankTransferResubmitForm({
  orderId,
  orderTotalLabel,
  existing = null,
  requireContactConfirm = false,
  onSubmitted,
}: Props) {
  const [bankId, setBankId] = useState<BankAccountId>(
    (existing?.bank_id as BankAccountId) || 'icici',
  );
  const [reference, setReference] = useState(existing?.reference ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedBank = BANK_ACCOUNTS.find((b) => b.id === bankId) ?? BANK_ACCOUNTS[0];
  const hasExistingProofs = (existing?.proof_urls.length ?? 0) > 0;

  async function copyField(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // ignore
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reference.trim().length < 4) {
      setError('Enter a valid UTR / transaction reference.');
      return;
    }
    if (!proofFiles?.length && !hasExistingProofs) {
      setError('Upload a payment screenshot or receipt.');
      return;
    }
    if (requireContactConfirm && !confirmEmail.trim() && !confirmPhone.trim()) {
      setError('Enter the email or phone used at checkout to confirm it is your order.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('order_id', orderId);
      form.set('bank_id', bankId);
      form.set('reference', reference.trim());
      if (notes.trim()) form.set('notes', notes.trim());
      if (confirmEmail.trim()) form.set('confirm_email', confirmEmail.trim());
      if (confirmPhone.trim()) form.set('confirm_phone', confirmPhone.trim());
      if (proofFiles) {
        Array.from(proofFiles).forEach((f) => form.append('proofs', f));
      }

      const res = await fetch('/api/payment/bank-transfer/submit', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit proof');

      setDone(true);
      onSubmitted?.({ status: data.status || 'payment_review' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Proof submitted. We&apos;ll review it and confirm your order once the transfer matches.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-[var(--pvg-border)] bg-white p-4">
      <div className="flex items-start gap-2">
        <Building2 className="mt-0.5 h-4 w-4 text-[#8a6400]" />
        <div>
          <p className="text-sm font-semibold text-[var(--pvg-text)]">Update bank transfer proof</p>
          <p className="mt-0.5 text-xs text-[var(--pvg-muted)]">
            {orderTotalLabel
              ? `Transfer exactly ${orderTotalLabel}, then update UTR and screenshot below.`
              : 'Update UTR / bank details and screenshot, then resubmit for verification.'}
          </p>
        </div>
      </div>

      {existing?.status === 'rejected' && existing.reject_reason ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">
            Why it was rejected
          </p>
          <p className="mt-0.5">{existing.reject_reason}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {BANK_ACCOUNTS.map((bank) => (
          <button
            key={bank.id}
            type="button"
            onClick={() => setBankId(bank.id)}
            disabled={saving}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              bankId === bank.id
                ? 'border-[#C9A84C] bg-[#C9A84C]/15 text-[#3d2b1f]'
                : 'border-stone-200 text-stone-600'
            }`}
          >
            {bank.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50/80 p-3 text-sm">
        {(
          [
            ['Account name', selectedBank.account_name],
            ['Account number', selectedBank.account_number],
            ['IFSC', selectedBank.ifsc],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                {label}
              </p>
              <p className="font-medium text-stone-800">{value}</p>
            </div>
            <button
              type="button"
              onClick={() => void copyField(label, value)}
              className="rounded p-1 text-stone-400 hover:bg-white"
              aria-label={`Copy ${label}`}
            >
              {copied === label ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--pvg-text)]">
          UTR / transaction reference
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          disabled={saving}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--pvg-text)]">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
          rows={2}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-[var(--pvg-text)]">
          Payment screenshot {hasExistingProofs ? '(optional — leave empty to keep current)' : ''}
        </label>
        {hasExistingProofs ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {existing!.proof_urls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#8a6400] underline"
              >
                Current proof {i + 1}
              </a>
            ))}
          </div>
        ) : null}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 px-3 py-3 text-sm text-stone-600 hover:border-[#C9A84C]">
          <Upload className="h-4 w-4" />
          <span>
            {proofFiles?.length
              ? `${proofFiles.length} new file${proofFiles.length > 1 ? 's' : ''} selected`
              : 'JPG, PNG, WebP, or PDF'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            disabled={saving}
            className="hidden"
            onChange={(e) => setProofFiles(e.target.files)}
          />
        </label>
      </div>

      {requireContactConfirm ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--pvg-text)]">
              Checkout email
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--pvg-text)]">
              Or checkout phone
            </label>
            <input
              type="tel"
              value={confirmPhone}
              onChange={(e) => setConfirmPhone(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2b1f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a1d15] disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Resubmit for verification
      </button>
    </form>
  );
}
