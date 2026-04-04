/**
 * Price & weight formatting utilities for PureVedicGems
 */

/**
 * Format a price in INR with Indian comma grouping (₹2,41,000)
 */
export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format EMI — calculates monthly instalment across given months.
 * Default: 12 months.
 */
export function formatEMI(price: number, months = 12): string {
  return formatPrice(Math.ceil(price / months));
}

/**
 * Format carat weight with up to 2 decimal places, e.g. "4.22 ct"
 */
export function formatCarats(carat: number | null | undefined): string {
  if (carat == null) return '';
  return `${carat.toFixed(2)} ct`;
}

/**
 * Format ratti weight, e.g. "4.64 ratti"
 */
export function formatRatti(ratti: number | null | undefined): string {
  if (ratti == null) return '';
  return `${ratti.toFixed(2)} ratti`;
}

/**
 * Build a short product meta string: "4.22 ct · Sri Lanka · Oval · Unheated"
 */
export function buildProductMeta(fields: {
  carat_weight?: number | null;
  origin?: string | null;
  shape?: string | null;
  treatment?: string | null;
  certification?: string | null;
}): string {
  const parts: string[] = [];
  if (fields.carat_weight) parts.push(formatCarats(fields.carat_weight));
  if (fields.origin) parts.push(fields.origin);
  if (fields.shape) parts.push(fields.shape);
  if (fields.treatment && fields.treatment !== 'none') parts.push(fields.treatment);
  if (fields.certification) parts.push(fields.certification);
  return parts.join(' · ');
}
