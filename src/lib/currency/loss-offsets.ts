/**
 * INR subtracted from live API rate (1 FX = N INR) before store/use.
 * Lowers the stored rate → storefront/checkout charge MORE foreign currency
 * for the same ₹ price, covering payment/FX loss.
 *
 * Contract: stored = applyLossOffset(api_rate, code); convert with amountInr / stored.
 */

export const FX_LOSS_OFFSETS_INR: Readonly<Record<string, number>> = {
  USD: 1.7,
  EUR: 2.0,
  GBP: 2.5,
  AED: 0.5,
  QAR: 0.5,
  SAR: 0.5,
  CAD: 1.0,
  SGD: 1.2,
  CHF: 2.0,
};

export function lossOffsetInr(code: string): number {
  return FX_LOSS_OFFSETS_INR[code.toUpperCase()] ?? 0;
}

/** Apply loss offset; never return non-positive. */
export function applyLossOffset(apiRate: number, code: string): number {
  const offset = lossOffsetInr(code);
  if (!Number.isFinite(apiRate) || apiRate <= 0) return apiRate;
  if (offset <= 0) return apiRate;
  const adjusted = apiRate - offset;
  // ponytail: floor at 0.0001 if offset ever exceeds mid-market (won't for current map)
  return Number(Math.max(adjusted, 0.0001).toFixed(6));
}

/** True when stored rate matches api − configured offset (within 1e-6). */
export function isBufferedRate(apiRate: number, storedRate: number, code: string): boolean {
  if (!Number.isFinite(apiRate) || !Number.isFinite(storedRate)) return false;
  return Math.abs(applyLossOffset(apiRate, code) - storedRate) < 1e-6;
}
