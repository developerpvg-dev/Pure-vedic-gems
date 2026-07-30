import {
  FIXED_PRICE_JEWELRY_METALS,
  JEWELRY_METAL_LABOR_RATES,
  WEIGHT_BASED_JEWELRY_METALS,
} from '@/lib/constants/jewelry-labor-rates';

/** GST on jewellery metal (HSN 7113) — making/labor uses 5% separately at checkout. */
export const JEWELRY_GST_RATE_PERCENT = 3;

export const JEWELRY_DESIGN_SETTING_TYPES = ['ring', 'pendant', 'bracelet'] as const;
export type JewelryDesignSettingType = (typeof JEWELRY_DESIGN_SETTING_TYPES)[number];

export const JEWELRY_PRODUCT_SCOPES = ['gemstone', 'rudraksha'] as const;
export type JewelryProductScope = (typeof JEWELRY_PRODUCT_SCOPES)[number];

export const RUDRAKSHA_MOUNTING_CATEGORIES = [
  { value: 'one_mukhi', label: 'One Mukhi' },
  { value: 'standard_mukhi', label: '2–17 Mukhi, Ganesh & Gauri Shankar' },
  { value: 'multiple_beads', label: 'Multiple Rudraksha (3+ beads)' },
] as const;

export type RudrakshaMountingCategory = (typeof RUDRAKSHA_MOUNTING_CATEGORIES)[number]['value'];

export type MetalAvailabilityFlag = 'on_request' | 'unavailable';

export type MetalPricingMode = 'fixed' | 'weight';

export interface JewelryDesignMetalDefinition {
  slug: string;
  label: string;
  pricingMode: MetalPricingMode;
  laborRatePercent: number | null;
  rateKey: string | null;
}

export const JEWELRY_DESIGN_METALS: JewelryDesignMetalDefinition[] = [
  {
    slug: 'silver_925',
    label: 'Silver (925)',
    pricingMode: 'fixed',
    laborRatePercent: null,
    rateKey: 'silver_per_gram',
  },
  {
    slug: 'gold_14k',
    label: '14K Gold',
    pricingMode: 'weight',
    laborRatePercent: JEWELRY_METAL_LABOR_RATES.gold_14k,
    rateKey: 'gold_14k_per_gram',
  },
  {
    slug: 'gold_18k',
    label: '18K Gold',
    pricingMode: 'weight',
    laborRatePercent: JEWELRY_METAL_LABOR_RATES.gold_18k,
    rateKey: 'gold_18k_per_gram',
  },
  {
    slug: 'gold_22k',
    label: '22K Gold',
    pricingMode: 'weight',
    laborRatePercent: JEWELRY_METAL_LABOR_RATES.gold_22k,
    rateKey: 'gold_22k_per_gram',
  },
  {
    slug: 'platinum',
    label: 'Platinum',
    pricingMode: 'weight',
    laborRatePercent: JEWELRY_METAL_LABOR_RATES.platinum,
    rateKey: 'platinum_per_gram',
  },
  {
    slug: 'panchdhatu',
    label: 'Panchdhatu (without gold)',
    pricingMode: 'fixed',
    laborRatePercent: null,
    rateKey: 'panchdhatu_per_gram',
  },
  {
    slug: 'panchdhatu_with_gold',
    label: 'Panchdhatu (with gold)',
    pricingMode: 'fixed',
    laborRatePercent: null,
    rateKey: null,
  },
  {
    slug: 'copper_pital',
    label: 'Copper/Pital',
    pricingMode: 'fixed',
    laborRatePercent: null,
    rateKey: null,
  },
];

export function isFixedPriceMetal(slug: string): boolean {
  return (FIXED_PRICE_JEWELRY_METALS as readonly string[]).includes(slug);
}

export function isWeightBasedMetal(slug: string): boolean {
  return (WEIGHT_BASED_JEWELRY_METALS as readonly string[]).includes(slug);
}

export function getJewelryMetalDefinition(slug: string): JewelryDesignMetalDefinition | undefined {
  return JEWELRY_DESIGN_METALS.find((metal) => metal.slug === slug);
}
