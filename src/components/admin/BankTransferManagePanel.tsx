'use client';

import { useState } from 'react';
import { Banknote, ExternalLink, Loader2, XCircle } from 'lucide-react';
import {
  canAdminReviewBankTransfer,
  parseBankTransferProof,
  type BankTransferProof,
} from '@/lib/orders/bank-transfer-proof';

type Props = {
  orderId: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  complianceFlags: unknown;
  paymentReviewReason?: string | null;
};

export function BankTransferManagePanel({
  orderId,
  paymentMethod,
  paymentStatus,
  complianceFlags: initialFlags,
  paymentReviewReason,
}: Props) {
  const [flags, setFlags] = useState(initialFlags);
  const [status, setLocalPaymentStatus] = useState(paymentStatus);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [verifyAmount, setVerifyAmount] = useState('');

  const proof = parseBankTransferProof(flags);
  if (!proof && paymentMethod !== 'bank_transfer') return null;

  const reviewable = canAdminReviewBankTransfer(proof, status);
  const claimedDefault =
    proof?.amount_claimed != null && Number.isFinite(proof.amount_claimed)
      ? String(proof.amount_claimed)
      : '';

  async function run(
    action: 'verify_bank_transfer' | 'reject_bank_transfer' | 'correct_bank_transfer_amount',
  ) {
    if (action === 'reject_bank_transfer' && rejectReason.trim().length < 5) {
      setMessage({ type: 'err', text: 'Enter a rejection note (at least 5 characters).' });
      return;
    }
    const amountToVerify = Number((verifyAmount || claimedDefault).trim());
    if (action === 'verify_bank_transfer' || action === 'correct_bank_transfer_amount') {
      if (!Number.isFinite(amountToVerify) || amountToVerify <= 0) {
        setMessage({
          type: 'err',
          text: 'Enter the exact INR amount credited on the bank statement before verifying.',
        });
        return;
      }
      const verb = action === 'correct_bank_transfer_amount' ? 'Correct recorded amount to' : 'Verify';
      if (
        !confirm(
          `${verb} ₹${amountToVerify.toLocaleString('en-IN')} for this transfer?`,
        )
      ) {
        return;
      }
    } else if (!confirm('Reject this proof and ask the customer to resubmit?')) {
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'reject_bank_transfer'
            ? { action, reason: rejectReason.trim() }
            : { action, verified_amount: amountToVerify },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'err', text: data.error || 'Action failed' });
        return;
      }
      if (data.compliance_flags) setFlags(data.compliance_flags);
      if (data.payment_status) setLocalPaymentStatus(data.payment_status);
      if (action === 'verify_bank_transfer' || action === 'correct_bank_transfer_amount') {
        const partial = data.payment_status === 'partial';
        setMessage({
          type: 'ok',
          text: partial
            ? `Recorded ₹${Number(data.amount_paid).toLocaleString('en-IN')} paid, ₹${Number(data.amount_due).toLocaleString('en-IN')} due.`
            : 'Payment recorded as fully paid.',
        });
        setTimeout(() => window.location.reload(), 800);
      } else {
        setMessage({
          type: 'ok',
          text: 'Proof rejected. Customer was emailed with your notes.',
        });
        setShowReject(false);
        setRejectReason('');
        // Refresh so sidebar status matches
        setTimeout(() => window.location.reload(), 900);
      }
    } catch {
      setMessage({ type: 'err', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <div className="flex items-center justify-between gap-2 border-b border-amber-100 bg-amber-50/70 px-5 py-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-3.5 w-3.5 text-amber-700" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-900">
            Bank transfer
          </h2>
        </div>
        <StatusPill proof={proof} paymentStatus={status} />
      </div>

      <div className="space-y-4 px-5 py-4">
        {proof ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Bank">{proof.bank_label}</Field>
            <Field label="UTR / reference">
              <code className="break-all font-mono text-[12px] text-stone-700">{proof.reference}</code>
            </Field>
            {proof.amount_claimed != null ? (
              <Field label="Amount claimed">
                ₹{proof.amount_claimed.toLocaleString('en-IN')}
              </Field>
            ) : null}
            {proof.notes ? (
              <div className="sm:col-span-2">
                <Field label="Customer notes">{proof.notes}</Field>
              </div>
            ) : null}
            <Field label="Submitted">
              {new Date(proof.submitted_at).toLocaleString('en-IN')}
            </Field>
            {proof.status === 'rejected' && proof.reject_reason ? (
              <div className="sm:col-span-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-900">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">
                  Last rejection
                </p>
                <p className="mt-0.5">{proof.reject_reason}</p>
              </div>
            ) : null}
            {!proof.reject_reason && paymentReviewReason ? (
              <div className="sm:col-span-2">
                <Field label="Review note">{paymentReviewReason}</Field>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-stone-500">
            Bank transfer selected — waiting for customer proof.
          </p>
        )}

        {proof?.proof_urls?.length ? (
          <div className="flex flex-wrap gap-2">
            {proof.proof_urls.map((url, i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Proof {i + 1}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        ) : null}

        {message ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              message.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </p>
        ) : null}

        {reviewable && proof ? (
          <div className="space-y-3 border-t border-stone-100 pt-3">
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Amount credited (INR) — must match bank statement
              <input
                type="number"
                min={1}
                step="0.01"
                value={verifyAmount || claimedDefault}
                onChange={(e) => setVerifyAmount(e.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-500"
              />
            </label>
            <p className="text-[11px] text-stone-500">
              Customer claimed{' '}
              {proof.amount_claimed != null
                ? `₹${proof.amount_claimed.toLocaleString('en-IN')}`
                : 'no amount'}
              . Only the amount you enter here is recorded as paid.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void run('verify_bank_transfer')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              Verify payment & confirm order
            </button>

            {!showReject ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowReject(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject proof
              </button>
            ) : (
              <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-red-800">
                  Why doesn&apos;t this match?
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. UTR not found in ICICI statement / amount mismatch / screenshot unclear"
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-red-400"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void run('reject_bank_transfer')}
                    className="flex-1 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    Send rejection
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setShowReject(false);
                      setRejectReason('');
                    }}
                    className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-red-800/80">
                  Customer gets an email + in-app notice, then can edit UTR/proof and resubmit.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {proof?.status === 'verified' ? (
          <div className="space-y-3 border-t border-stone-100 pt-3">
            <p className="text-[11px] text-stone-500">
              Already verified. If the recorded paid amount is wrong, correct it to the INR on the
              bank statement (does not re-send confirmation email).
            </p>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-stone-500">
              Correct recorded amount (INR)
              <input
                type="number"
                min={1}
                step="0.01"
                value={verifyAmount || claimedDefault}
                onChange={(e) => setVerifyAmount(e.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-900 outline-none focus:border-emerald-500"
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void run('correct_bank_transfer_amount')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              Correct paid amount
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-800">{children}</dd>
    </div>
  );
}

function StatusPill({
  proof,
  paymentStatus,
}: {
  proof: BankTransferProof | null;
  paymentStatus: string | null;
}) {
  if (paymentStatus === 'partial' && proof?.status === 'verified') {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
        Advance verified — balance due
      </span>
    );
  }
  if (paymentStatus === 'captured' || proof?.status === 'verified') {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
        Verified — fully paid
      </span>
    );
  }
  if (proof?.status === 'rejected') {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
        Rejected — awaiting resubmit
      </span>
    );
  }
  if (proof) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
        Needs review
      </span>
    );
  }
  return (
    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
      Awaiting proof
    </span>
  );
}
