/**
 * Razorpay charge currency: convert INR ledger amounts → storefront FX at pay time.
 * Ledger stays INR; only the gateway order uses the display currency.
 */

import { getCachedStorefrontRates } from '@/lib/currency/cached-rates';
import { isStorefrontCurrency } from '@/lib/currency/catalog';
import { roundMoney } from '@/lib/orders/counter-payments';

/** Razorpay zero-decimal currencies (amount is major units, not ×100). */
const ZERO_DECIMAL = new Set(['JPY']);

export function normalizeChargeCurrency(raw: string | undefined | null): string {
  const code = String(raw ?? 'INR').toUpperCase();
  return isStorefrontCurrency(code) ? code : 'INR';
}

export function razorpayMinorFactor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
}

export function toRazorpayMinor(amountMajor: number, currency: string): number {
  return Math.round(Number(amountMajor) * razorpayMinorFactor(currency));
}

/** Encode on order_payments.reference for verify/webhook (no schema change). */
export function encodeGatewayReference(currency: string, minor: number): string {
  return `${currency.toUpperCase()}:${minor}`;
}

export function parseGatewayReference(
  reference: string | null | undefined,
): { currency: string; minor: number } | null {
  if (!reference) return null;
  const m = /^([A-Z]{3}):(\d+)$/.exec(reference.trim());
  if (!m) return null;
  return { currency: m[1], minor: Number(m[2]) };
}

/**
 * Round UP to the charge currency's minor unit so FX never under-collects vs INR.
 * (Half-up round can leave the merchant short by a few paise equivalent.)
 */
export function ceilToChargeMajor(amountMajor: number, currency: string): number {
  const factor = razorpayMinorFactor(currency);
  return Math.ceil(Number(amountMajor) * factor - Number.EPSILON) / factor;
}

export type ChargeConversion = {
  currency: string;
  /** Major units in charge currency (ceiled). */
  major: number;
  /** Minor units sent to Razorpay. */
  minor: number;
  /** 1 FX = N INR rate used (1 for INR). */
  rate: number;
};

/**
 * INR → charge-currency using admin storefront rates (1 FX = N INR).
 * Throws when the rate is missing so we never guess an amount.
 */
export async function convertInrToGatewayCharge(
  amountInr: number,
  currency: string,
): Promise<ChargeConversion> {
  const code = normalizeChargeCurrency(currency);
  if (code === 'INR') {
    const major = roundMoney(amountInr);
    return { currency: 'INR', major, minor: toRazorpayMinor(major, 'INR'), rate: 1 };
  }

  const { rates } = await getCachedStorefrontRates();
  const rate = Number(rates.find((r) => r.currency === code)?.rate ?? 0);
  if (!rate || rate <= 0) {
    throw new Error(`No exchange rate configured for ${code}. Choose INR or update currency rates.`);
  }

  const major = ceilToChargeMajor(amountInr / rate, code);
  return { currency: code, major, minor: toRazorpayMinor(major, code), rate };
}

/** @deprecated prefer convertInrToGatewayCharge — kept for call sites that only need major. */
export async function inrToChargeMajor(amountInr: number, currency: string): Promise<number> {
  return (await convertInrToGatewayCharge(amountInr, currency)).major;
}
