/**
 * Pricing normalisation.
 *
 * Source meta keys:
 *   _regular_price, _sale_price, _price, price_carat, weight_carat
 *
 * Output:
 *   price            = effective sell price (INR)
 *   compare_price    = _regular_price when on sale, else null
 *   price_per_carat  = price_carat when present (sets price_mode='per_carat')
 *   price_mode       = 'per_carat' if price_per_carat present, else 'fixed'
 *
 * Rules:
 *   - Strip currency symbols, commas, and "Rs"/"INR" prefixes.
 *   - Reject negative or non-numeric values; emit a warning and leave null.
 *   - For per-carat priced rows, sanity-check that
 *     |price - price_per_carat * carat_weight| / price <= 0.05; warn otherwise.
 *
 * AUD/USD legacy fields (_australia_price, _usd_price) are NOT imported in
 * Phase 1. They will be carried in legacy_data only.
 *
 * PR-3 implements.
 */

export interface PricingResult {
  price: number | null;
  comparePrice: number | null;
  pricePerCarat: number | null;
  priceMode: 'fixed' | 'per_carat' | 'on_demand';
  warnings: string[];
}

export function normalisePricing(meta: Record<string, string | null | undefined>): PricingResult {
  const warnings: string[] = [];
  const reg = toNumber(meta._regular_price);
  const sale = toNumber(meta._sale_price);
  const explicit = toNumber(meta._price);
  const perCarat = toNumber(meta.price_carat);
  const caratWeight = toNumber(meta.weight_carat) ?? toNumber(meta.additional_info_weight);

  let price: number | null = null;
  let comparePrice: number | null = null;

  // Sale takes precedence; fall back to regular; fall back to _price.
  if (sale !== null && sale > 0) {
    price = sale;
    if (reg !== null && reg > sale) comparePrice = reg;
  } else if (reg !== null && reg > 0) {
    price = reg;
  } else if (explicit !== null && explicit > 0) {
    price = explicit;
  }

  const pricePerCarat = perCarat !== null && perCarat > 0 ? perCarat : null;

  // Derive total from per-carat × weight when Woo _price is empty (common for gems).
  if (
    (price === null || price <= 0) &&
    pricePerCarat !== null &&
    caratWeight !== null &&
    caratWeight > 0
  ) {
    price = Math.round(pricePerCarat * caratWeight);
  }

  if (price === null || price <= 0) {
    warnings.push('no usable price (regular/sale/_price and per-carat derivation all empty)');
  }

  const priceMode: 'fixed' | 'per_carat' | 'on_demand' =
    pricePerCarat !== null && caratWeight !== null && caratWeight > 0
      ? 'per_carat'
      : price !== null && price > 0
        ? 'fixed'
        : 'on_demand';

  // Sanity check: per-carat * weight should be within 5% of price.
  if (pricePerCarat !== null && caratWeight !== null && price !== null && price > 0) {
    const computed = pricePerCarat * caratWeight;
    const drift = Math.abs(price - computed) / price;
    if (drift > 0.05) {
      warnings.push(
        `per_carat sanity drift ${(drift * 100).toFixed(1)}% (price=${price}, per_carat=${pricePerCarat}, weight=${caratWeight})`,
      );
    }
  }

  return { price, comparePrice, pricePerCarat, priceMode, warnings };
}

export function isQuoteOnlyPriceMode(priceMode: string | null | undefined): boolean {
  return priceMode === 'on_demand' || priceMode === 'quote_required';
}

/** Map legacy Woo stock + price mode to storefront availability_status. */
export function resolveLegacyAvailabilityStatus(args: {
  priceMode: string;
  inStock: boolean;
  stockStatus: string;
}): 'on_demand' | 'in_stock' | 'out_of_stock' {
  if (isQuoteOnlyPriceMode(args.priceMode)) return 'on_demand';
  if (args.inStock || args.stockStatus === 'in_stock') return 'in_stock';
  return 'out_of_stock';
}

function toNumber(v: string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const cleaned = String(v).replace(/[^\d.\-]/g, '');
  if (cleaned === '' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
