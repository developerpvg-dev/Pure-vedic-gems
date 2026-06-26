/**
 * Global labor rates for weight-based ring metals (from PVG Ring Designs 2026 sheet, column E).
 * Applied as a percentage of metal value (weight × admin rate per gram).
 */
export const JEWELRY_METAL_LABOR_RATES: Record<string, number> = {
  gold_22k: 20,
  gold_18k: 25,
  gold_14k: 25,
  platinum: 20,
};

/** Metals priced by fixed making charge from the design sheet (₹ total). */
export const FIXED_PRICE_JEWELRY_METALS = [
  'silver_925',
  'panchdhatu',
  'panchdhatu_with_gold',
] as const;

/** Metals priced by weight (grams) × market rate + labor %. */
export const WEIGHT_BASED_JEWELRY_METALS = [
  'gold_14k',
  'gold_18k',
  'gold_22k',
  'platinum',
] as const;

export type FixedPriceJewelryMetal = (typeof FIXED_PRICE_JEWELRY_METALS)[number];
export type WeightBasedJewelryMetal = (typeof WEIGHT_BASED_JEWELRY_METALS)[number];
