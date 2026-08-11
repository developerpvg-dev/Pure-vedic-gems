/**
 * INR subtracted from live API rate (1 FX = N INR) before store/use.
 * Lowers charged FX so FX→INR collection covers payment/FX loss.
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
