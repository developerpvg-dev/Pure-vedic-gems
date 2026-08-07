/**
 * Format what the customer was actually charged vs INR ledger.
 * Used by emails, account pages, admin, confirmation UIs.
 */

import { parseGatewayReference, razorpayMinorFactor } from '@/lib/razorpay/charge-currency';

export type ChargedMoneyInput = {
  amount_inr?: number | null;
  /** Gateway minor units when currency !== INR (consultations / yagyas). */
  amount_paise?: number | null;
  currency?: string | null;
};

export function formatInrMoney(amount: number | null | undefined): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

export function formatFxMoney(amountMajor: number, currency: string): string {
  const code = currency.toUpperCase();
  return new Intl.NumberFormat(code === 'JPY' ? 'ja-JP' : 'en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'JPY' ? 0 : 2,
  }).format(amountMajor);
}

/** Prefer charged currency when present; never label INR ledger as USD. */
export function formatChargedMoney(input: ChargedMoneyInput): string {
  const inr = formatInrMoney(input.amount_inr);
  const code = String(input.currency || 'INR').toUpperCase();
  if (code === 'INR' || input.amount_paise == null) return inr;

  const major = Number(input.amount_paise) / razorpayMinorFactor(code);
  if (!Number.isFinite(major)) return inr;
  return `${formatFxMoney(major, code)} (${inr})`;
}

/** Shop ledger row: INR amount + optional `CURRENCY:minor` reference. */
export function formatPaymentCharge(amountInr: number, reference?: string | null): string {
  const gateway = parseGatewayReference(reference);
  if (!gateway || gateway.currency === 'INR') return formatInrMoney(amountInr);
  const major = gateway.minor / razorpayMinorFactor(gateway.currency);
  return `${formatFxMoney(major, gateway.currency)} (${formatInrMoney(amountInr)})`;
}

/** First FX charge label from payment rows, or null if all INR. */
export function chargedLabelFromPayments(
  payments: Array<{ amount?: number | null; reference?: string | null }>,
): string | null {
  for (const p of payments) {
    const gateway = parseGatewayReference(p.reference);
    if (!gateway || gateway.currency === 'INR') continue;
    return formatPaymentCharge(Number(p.amount ?? 0), p.reference);
  }
  return null;
}
