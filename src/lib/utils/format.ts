/**
 * Price & weight formatting utilities for PureVedicGems
 */

import {
  convertFromInr,
  getCurrencyDisplayState,
  localeForCurrency,
} from '@/lib/currency/display-store';

/**
 * Format a price. Amounts are INR unless `currency` is passed explicitly
 * (then the amount is treated as already in that currency — no FX).
 * With no second arg, converts using the storefront display currency.
 */
export function formatPrice(amount: number, currency?: string): string {
  const display = getCurrencyDisplayState();
  // Explicit currency = format amount as-is. Otherwise convert when storefront FX is on.
  let code = (currency ?? (display.enabled ? display.currency : 'INR')).toUpperCase();
  if (currency == null && display.enabled && code !== 'INR') {
    const rate = display.rates[code];
    if (!rate || rate <= 0) code = 'INR'; // no rate → don't mislabel INR amounts as USD
  }
  const value = currency != null ? amount : convertFromInr(amount, code);
  const maxFrac = code === 'JPY' ? 0 : code === 'INR' ? 0 : 2;
  return new Intl.NumberFormat(localeForCurrency(code), {
    style: 'currency',
    currency: code,
    maximumFractionDigits: maxFrac,
  }).format(value);
}

export type {
  ProductPricingInput as ProductPriceFields,
} from '@/lib/shop/product-pricing';

export {
  formatProductListPrice,
  isProductPriceOnRequest,
  isProductPurchasable,
  isProductStockUnavailable,
  productOfferAvailability,
  productStructuredOfferPrice,
  resolveProductCartPrice,
  resolveProductDisplayPrice,
} from '@/lib/shop/product-pricing';

/**
 * Format EMI — calculates monthly instalment across given months.
 * Default: 12 months.
 */
export function formatEMI(price: number, months = 12): string {
  return formatPrice(Math.ceil(price / months));
}

/** Catalog / Vedic trade convention: 1 carat = 1.09 ratti (≈ 0.91 ct per ratti). */
export const RATTI_PER_CARAT = 1.09;

export function caratToRatti(carat: number): number {
  return Math.round(carat * RATTI_PER_CARAT * 1000) / 1000;
}

export function rattiToCarat(ratti: number): number {
  return Math.round((ratti / RATTI_PER_CARAT) * 1000) / 1000;
}

/** "None" / empty means the product has no lab certificate. */
export function isNoCertification(value?: string | null): boolean {
  return !value?.trim() || value.trim().toLowerCase() === 'none';
}

/** Clear lab fields when certification is None (mutates; use before insert/update). */
export function applyNoCertificationFields(payload: Record<string, unknown>): void {
  if (!('certification' in payload)) return;
  if (!isNoCertification(typeof payload.certification === 'string' ? payload.certification : null)) return;
  payload.certification = null;
  payload.certificate_number = null;
  payload.certificate_lab = null;
  payload.certificate_status = 'not_required';
  payload.certificate_display_enabled = false;
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
  if (fields.certification && !isNoCertification(fields.certification)) parts.push(fields.certification);
  return parts.join(' · ');
}
