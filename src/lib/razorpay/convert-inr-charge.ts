/**
 * Server-only: INR → gateway charge using cached storefront rates.
 * Keep out of charge-currency.ts so client formatters stay browser-safe.
 */

import { getCachedStorefrontRates } from '@/lib/currency/cached-rates';
import { roundMoney } from '@/lib/orders/counter-payments';
import {
  ceilToChargeMajor,
  normalizeChargeCurrency,
  toRazorpayMinor,
  type ChargeConversion,
} from '@/lib/razorpay/charge-currency';

export type { ChargeConversion };

/**
 * INR → charge-currency using admin storefront rates (1 FX = N INR).
 * Pass `lockedRate` on balance legs so advance + balance share one FX lock.
 * Throws when the rate is missing so we never guess an amount.
 */
export async function convertInrToGatewayCharge(
  amountInr: number,
  currency: string,
  opts?: { lockedRate?: number },
): Promise<ChargeConversion> {
  const code = normalizeChargeCurrency(currency);
  if (code === 'INR') {
    const major = roundMoney(amountInr);
    return { currency: 'INR', major, minor: toRazorpayMinor(major, 'INR'), rate: 1 };
  }

  let rate = Number(opts?.lockedRate ?? 0);
  if (!(rate > 0)) {
    const { rates } = await getCachedStorefrontRates();
    rate = Number(rates.find((r) => r.currency === code)?.rate ?? 0);
  }
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
