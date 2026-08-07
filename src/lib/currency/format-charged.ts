/**
 * Format what the customer was actually charged vs INR ledger.
 * Used by emails, account pages, admin, confirmation UIs.
 *
 * Orders lock FX at first gateway create: compliance_flags.payment_charge = { currency, rate }
 * where rate means 1 FX = N INR (same as currency_rates).
 */

import {
  ceilToChargeMajor,
  parseGatewayReference,
  razorpayMinorFactor,
} from '@/lib/razorpay/charge-currency';

export type ChargedMoneyInput = {
  amount_inr?: number | null;
  /** Gateway minor units when currency !== INR (consultations / yagyas). */
  amount_paise?: number | null;
  currency?: string | null;
};

/** Locked storefront FX for a shop order (persist across advance + balance). */
export type OrderChargeContext = {
  currency: string;
  /** 1 foreign unit = N INR */
  rate: number;
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

export function isOrderChargeContext(value: unknown): value is OrderChargeContext {
  if (!value || typeof value !== 'object') return false;
  const row = value as OrderChargeContext;
  return (
    typeof row.currency === 'string' &&
    /^[A-Z]{3}$/.test(row.currency) &&
    row.currency !== 'INR' &&
    Number(row.rate) > 0
  );
}

/** Read locked FX from compliance_flags.payment_charge. */
export function chargeContextFromFlags(complianceFlags: unknown): OrderChargeContext | null {
  if (!complianceFlags || typeof complianceFlags !== 'object') return null;
  const raw = (complianceFlags as { payment_charge?: unknown }).payment_charge;
  if (!isOrderChargeContext(raw)) return null;
  return { currency: raw.currency.toUpperCase(), rate: Number(raw.rate) };
}

/** Infer locked FX from a settled/pending gateway reference (legacy orders). */
export function chargeContextFromPayments(
  payments: Array<{ amount?: number | null; reference?: string | null }>,
): OrderChargeContext | null {
  for (const p of payments) {
    const gateway = parseGatewayReference(p.reference);
    if (!gateway || gateway.currency === 'INR') continue;
    const major = gateway.minor / razorpayMinorFactor(gateway.currency);
    const inr = Number(p.amount ?? 0);
    if (!(major > 0) || !(inr > 0)) continue;
    return { currency: gateway.currency, rate: inr / major };
  }
  return null;
}

export function resolveOrderChargeContext(input: {
  complianceFlags?: unknown;
  payments?: Array<{ amount?: number | null; reference?: string | null }>;
}): OrderChargeContext | null {
  return chargeContextFromFlags(input.complianceFlags) ?? chargeContextFromPayments(input.payments ?? []);
}

/** Merge payment_charge into compliance_flags without clobbering other keys. */
export function withPaymentChargeFlags(
  complianceFlags: unknown,
  charge: OrderChargeContext,
): Record<string, unknown> {
  const base =
    complianceFlags && typeof complianceFlags === 'object' && !Array.isArray(complianceFlags)
      ? { ...(complianceFlags as Record<string, unknown>) }
      : {};
  // Keep first lock — balance legs must reuse advance rate.
  if (isOrderChargeContext(base.payment_charge)) return base;
  return {
    ...base,
    payment_charge: { currency: charge.currency.toUpperCase(), rate: Number(charge.rate) },
  };
}

/**
 * Format any INR ledger amount in the order's locked currency (primary) + ₹.
 * Falls back to INR-only when no FX lock.
 */
export function formatOrderMoney(amountInr: number, ctx: OrderChargeContext | null | undefined): string {
  const inr = formatInrMoney(amountInr);
  if (!ctx || ctx.currency === 'INR' || !(ctx.rate > 0)) return inr;
  const major = ceilToChargeMajor(Number(amountInr) / ctx.rate, ctx.currency);
  return `${formatFxMoney(major, ctx.currency)} (${inr})`;
}
