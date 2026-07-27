/** Customer bank-transfer proof stored on orders.compliance_flags.bank_transfer. */

export type BankTransferProofStatus = 'pending_review' | 'verified' | 'rejected';

export type BankTransferProof = {
  bank_id: string;
  bank_label: string;
  reference: string;
  /** INR the customer says they transferred (advance or balance leg). */
  amount_claimed?: number;
  notes?: string;
  proof_urls: string[];
  submitted_at: string;
  status?: BankTransferProofStatus;
  verified_at?: string;
  verified_by?: string;
  rejected_at?: string;
  reject_reason?: string;
  rejected_by?: string;
};

export function parseBankTransferProof(complianceFlags: unknown): BankTransferProof | null {
  if (!complianceFlags || typeof complianceFlags !== 'object' || Array.isArray(complianceFlags)) {
    return null;
  }
  const raw = (complianceFlags as { bank_transfer?: unknown }).bank_transfer;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const bt = raw as Partial<BankTransferProof>;
  if (!bt.bank_id || !bt.reference || !Array.isArray(bt.proof_urls) || !bt.submitted_at) return null;

  let status: BankTransferProofStatus | undefined = bt.status;
  if (!status) {
    if (bt.verified_at) status = 'verified';
    else if (bt.rejected_at) status = 'rejected';
    else status = 'pending_review';
  }

  return {
    bank_id: String(bt.bank_id),
    bank_label: String(bt.bank_label || bt.bank_id),
    reference: String(bt.reference),
    amount_claimed:
      bt.amount_claimed != null && Number.isFinite(Number(bt.amount_claimed))
        ? Number(bt.amount_claimed)
        : undefined,
    notes: bt.notes ? String(bt.notes) : undefined,
    proof_urls: bt.proof_urls.filter((u): u is string => typeof u === 'string' && /^https?:\/\//i.test(u)),
    submitted_at: String(bt.submitted_at),
    status,
    verified_at: bt.verified_at ? String(bt.verified_at) : undefined,
    verified_by: bt.verified_by ? String(bt.verified_by) : undefined,
    rejected_at: bt.rejected_at ? String(bt.rejected_at) : undefined,
    reject_reason: bt.reject_reason ? String(bt.reject_reason) : undefined,
    rejected_by: bt.rejected_by ? String(bt.rejected_by) : undefined,
  };
}

export function mergeBankTransferProof(
  complianceFlags: unknown,
  proof: BankTransferProof,
): Record<string, unknown> {
  const base =
    complianceFlags && typeof complianceFlags === 'object' && !Array.isArray(complianceFlags)
      ? { ...(complianceFlags as Record<string, unknown>) }
      : {};
  return { ...base, bank_transfer: proof };
}

/** Safe subset for customer/track APIs (includes reject reason + proof URLs they uploaded). */
export function publicBankTransferSummary(proof: BankTransferProof | null) {
  if (!proof) return null;
  return {
    bank_id: proof.bank_id,
    bank_label: proof.bank_label,
    reference: proof.reference,
    amount_claimed: proof.amount_claimed ?? null,
    notes: proof.notes ?? null,
    proof_urls: proof.proof_urls,
    submitted_at: proof.submitted_at,
    status: proof.status ?? 'pending_review',
    reject_reason: proof.reject_reason ?? null,
    rejected_at: proof.rejected_at ?? null,
    verified_at: proof.verified_at ?? null,
  };
}

export function canAdminReviewBankTransfer(
  proof: BankTransferProof | null,
  paymentStatus: string | null | undefined,
) {
  return (
    Boolean(proof?.proof_urls.length) &&
    paymentStatus !== 'captured' &&
    proof?.status === 'pending_review'
  );
}

export function canCustomerResubmitBankTransfer(
  proof: BankTransferProof | null,
  orderStatus: string,
  paymentStatus: string | null | undefined,
) {
  if (paymentStatus === 'captured') return false;
  // Balance leg on a confirmed, part-paid order
  if (orderStatus === 'confirmed' && paymentStatus === 'partial') {
    return !proof || proof.status !== 'pending_review';
  }
  if (!['pending_payment', 'payment_review'].includes(orderStatus)) return false;
  // First submit never reaches customer UI with null proof from checkout; resubmit after reject or while still pending
  if (!proof) return orderStatus === 'pending_payment';
  return proof.status === 'rejected' || proof.status === 'pending_review';
}

// ponytail: `npx tsx -e "import { __bankTransferProofSelfCheck } from './src/lib/orders/bank-transfer-proof.ts'; __bankTransferProofSelfCheck()"`
export function __bankTransferProofSelfCheck() {
  const proof: BankTransferProof = {
    bank_id: 'icici',
    bank_label: 'ICICI Bank',
    reference: 'UTR123',
    proof_urls: ['https://example.com/ss.jpg'],
    submitted_at: '2026-01-01T00:00:00.000Z',
    status: 'rejected',
    reject_reason: 'UTR not found',
    rejected_at: '2026-01-02T00:00:00.000Z',
  };
  const merged = mergeBankTransferProof({ gst_invoice_requested: true }, proof);
  const parsed = parseBankTransferProof(merged);
  console.assert(parsed?.status === 'rejected', 'status');
  console.assert(canCustomerResubmitBankTransfer(parsed, 'pending_payment', 'pending'), 'resubmit');
  console.assert(!canCustomerResubmitBankTransfer(parsed, 'confirmed', 'captured'), 'no resubmit paid');
  console.assert(canAdminReviewBankTransfer({ ...proof, status: 'pending_review' }, 'pending'), 'admin review');
  console.assert(!canAdminReviewBankTransfer({ ...proof, status: 'verified' }, 'partial'), 'no review verified');
  console.assert(publicBankTransferSummary(parsed)?.reject_reason === 'UTR not found', 'public');
  console.log('bank-transfer-proof self-check ok');
}
