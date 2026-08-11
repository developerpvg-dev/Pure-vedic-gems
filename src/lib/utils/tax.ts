import type { Json } from '@/lib/types/database';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';

export const TAX_POLICY_VERSION = '2026-08-11';
export const SELLER_STATE = 'Delhi';

/**
 * Business GST rates (2026-08-11):
 * - Products / gems / rudraksha / ready jewellery SKUs / cert / energization / shipping: 0%
 * - Fixed-sheet jewellery prices: 0% auto GST (staff enter tax-inclusive ₹)
 * - Weight + labour % jewellery only: 3% on (metal + labour + stone add-on + custom fee)
 * - No hidden GST on anything else (online or offline)
 */
export const GST_LOOSE_STONE_PERCENT = 0;
export const GST_LOOSE_RUDRAKSHA_PERCENT = 0;
export const GST_METAL_MOUNTED_PERCENT = 3;
export const GST_SPIRITUAL_GOODS_PERCENT = 0;
export const GST_SHIPPING_PERCENT = 0;

/** Configurator / order snapshot mode for jewellery mounting math. */
export type JewelryPricingMode = 'weight' | 'fixed';

export type TaxJurisdiction = 'intra_state' | 'inter_state';

export interface ProductTaxInput {
  category?: string | null;
  tax_status?: string | null;
  tax_class?: string | null;
  hsn_code?: string | null;
  gst_rate?: number | string | null;
}

export interface GstComponent {
  label: string;
  component: 'product' | 'metal' | 'making_charge' | 'certification' | 'energization' | 'shipping' | 'service';
  taxable_amount: number;
  hsn_code: string | null;
  rate_percent: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
}

export interface TaxBreakdown {
  policy_version: string;
  seller_state: string;
  destination_state: string;
  jurisdiction: TaxJurisdiction;
  components: GstComponent[];
  totals: {
    taxable_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
    gst_amount: number;
  };
  notes: string[];
}

const CATEGORY_DEFAULTS: Array<{ match: RegExp; rate: number; hsn: string | null; taxClass: string }> = [
  // Ready jewellery / product lines: 0% — auto 3% only on weight+labour configs (see gstOnJewellery).
  { match: /jewel|jewellery|jewelry|ring|pendant|gold|silver/i, rate: 0, hsn: '7113', taxClass: 'jewellery' },
  { match: /service|consultation|puja|pooja|yagya|energ/i, rate: 18, hsn: null, taxClass: 'service' },
  { match: /rudraksha/i, rate: GST_LOOSE_RUDRAKSHA_PERCENT, hsn: null, taxClass: 'rudraksha' },
  { match: /mala|idol|yantra/i, rate: GST_SPIRITUAL_GOODS_PERCENT, hsn: null, taxClass: 'spiritual_goods' },
  { match: /gem|navaratna|navratna|upratna|sapphire|ruby|emerald|coral|pearl|opal|diamond|hessonite|cat/i, rate: GST_LOOSE_STONE_PERCENT, hsn: '7103', taxClass: 'loose_gemstone' },
];

const TAX_CLASS_DEFAULTS: Record<string, { rate: number; hsn: string | null }> = {
  exempt: { rate: 0, hsn: null },
  loose_gemstone: { rate: GST_LOOSE_STONE_PERCENT, hsn: '7103' },
  gemstone: { rate: GST_LOOSE_STONE_PERCENT, hsn: '7103' },
  navaratna: { rate: GST_LOOSE_STONE_PERCENT, hsn: '7103' },
  upratna: { rate: GST_LOOSE_STONE_PERCENT, hsn: '7103' },
  rudraksha: { rate: GST_LOOSE_RUDRAKSHA_PERCENT, hsn: null },
  jewellery: { rate: 0, hsn: '7113' },
  jewelry: { rate: 0, hsn: '7113' },
  jewellery_mounted_gem: { rate: 0, hsn: '7113' },
  metal: { rate: 0, hsn: '7113' },
  making_charge: { rate: 0, hsn: null },
  certification: { rate: 0, hsn: null },
  energization: { rate: 0, hsn: null },
  service: { rate: 18, hsn: null },
  shipping: { rate: GST_SHIPPING_PERCENT, hsn: '9968' },
  spiritual_goods: { rate: GST_SPIRITUAL_GOODS_PERCENT, hsn: null },
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Same rounding as server `calculateGstComponent.total_tax` — use for client estimates. */
export function gstOnAmount(amount: number, ratePercent: number): number {
  const taxableAmount = roundCurrency(Math.max(amount, 0));
  if (taxableAmount <= 0 || ratePercent <= 0) return 0;
  return roundCurrency(taxableAmount * (ratePercent / 100));
}

function normalizeState(value?: string | null) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Stone/bead has a metal mount / fixed making when any jewellery charge is present. */
export function isMetalMounted(parts: {
  metal?: number | null;
  making?: number | null;
  diamond?: number | null;
  custom?: number | null;
}): boolean {
  return (
    Number(parts.metal ?? 0) > 0 ||
    Number(parts.making ?? 0) > 0 ||
    Number(parts.diamond ?? 0) > 0 ||
    Number(parts.custom ?? 0) > 0
  );
}

/** Taxable jewellery base ONLY — never includes gem/bead. */
export function jewelleryTaxableBase(parts: {
  metal?: number | null;
  making?: number | null;
  diamond?: number | null;
  custom?: number | null;
}): number {
  return Math.max(
    0,
    Number(parts.metal ?? 0) +
      Number(parts.making ?? 0) +
      Number(parts.diamond ?? 0) +
      Number(parts.custom ?? 0),
  );
}

/** Auto 3% only for weight + labour % maths. Fixed sheet prices are already staff-inclusive. */
export function appliesAutoJewelleryGst(mode: JewelryPricingMode | null | undefined): boolean {
  return mode === 'weight';
}

/**
 * Resolve mounting mode from a config snapshot pricing block.
 * Unknown / missing → fixed (no auto GST — avoids hidden tax).
 */
export function resolveJewelryPricingMode(pricing?: {
  jewelry_pricing_mode?: string | null;
  metal_weight_grams?: number | null;
  metal_price?: number | null;
} | null): JewelryPricingMode {
  const mode = pricing?.jewelry_pricing_mode;
  if (mode === 'weight') return 'weight';
  if (mode === 'fixed') return 'fixed';
  if (Number(pricing?.metal_weight_grams ?? 0) > 0 && Number(pricing?.metal_price ?? 0) > 0) {
    return 'weight';
  }
  return 'fixed';
}

type SnapshotPricingBits = {
  metal_price?: number | null;
  making_charge?: number | null;
  diamond_charge?: number | null;
  custom_design_fee?: number | null;
  jewelry_pricing_mode?: string | null;
  metal_weight_grams?: number | null;
};

/**
 * Single source for auto-jewellery taxable base (online + offline + international).
 * Snapshot prefers separate metal / making / diamond / custom.
 * DB fallback: `making_charge` already folds diamond from configurator save.
 * Returns 0 taxable when mode is not weight.
 */
export function weightJewelleryTaxableFromConfig(input: {
  snapshotPricing?: SnapshotPricingBits | null;
  db?: {
    metal_price?: number | null;
    making_charge?: number | null;
    custom_design_fee?: number | null;
  } | null;
}): { mode: JewelryPricingMode; taxable: number } {
  const snap = input.snapshotPricing ?? null;
  const mode = resolveJewelryPricingMode(
    snap ?? {
      metal_weight_grams: null,
      metal_price: input.db?.metal_price,
      jewelry_pricing_mode: null,
    },
  );
  if (!appliesAutoJewelleryGst(mode)) return { mode, taxable: 0 };

  const hasSnapParts =
    snap != null &&
    (snap.metal_price != null ||
      snap.making_charge != null ||
      snap.diamond_charge != null ||
      snap.custom_design_fee != null);

  if (hasSnapParts) {
    return {
      mode,
      taxable: jewelleryTaxableBase({
        metal: snap!.metal_price,
        making: snap!.making_charge,
        diamond: snap!.diamond_charge,
        custom: snap!.custom_design_fee,
      }),
    };
  }

  return {
    mode,
    taxable: jewelleryTaxableBase({
      metal: input.db?.metal_price,
      making: input.db?.making_charge,
      diamond: 0,
      custom: input.db?.custom_design_fee,
    }),
  };
}

/** 3% GST on jewellery portion — weight + labour % only. */
export function gstOnJewellery(
  parts: {
    metal?: number | null;
    making?: number | null;
    diamond?: number | null;
    custom?: number | null;
  },
  mode: JewelryPricingMode | null | undefined = 'fixed',
): number {
  if (!appliesAutoJewelleryGst(mode)) return 0;
  return gstOnAmount(jewelleryTaxableBase(parts), GST_METAL_MOUNTED_PERCENT);
}

/** Bake 3% into display amount only for weight + labour % jewellery. */
export function jewelleryPriceInclGst(
  exGstAmount: number,
  mode: JewelryPricingMode | null | undefined = 'fixed',
): number {
  const ex = Math.max(0, Number(exGstAmount) || 0);
  if (ex <= 0) return 0;
  if (!appliesAutoJewelleryGst(mode)) return roundCurrency(ex);
  return roundCurrency(ex + gstOnAmount(ex, GST_METAL_MOUNTED_PERCENT));
}

/** Gem/bead never attracts GST. */
export function resolveGemOrBeadTaxRate(
  _category?: string | null,
  _mounted?: boolean,
): number {
  return 0;
}

export function getTaxJurisdiction(destinationState?: string | null): TaxJurisdiction {
  return normalizeState(destinationState) === normalizeState(SELLER_STATE) ? 'intra_state' : 'inter_state';
}

export function resolveProductTax(input: ProductTaxInput) {
  if (input.tax_status === 'none' || input.tax_status === 'exempt') {
    return { rate_percent: 0, hsn_code: input.hsn_code ?? null, tax_class: input.tax_class ?? 'exempt' };
  }

  // ponytail: ignore products.gst_rate override — auto GST only on weight+labour jewellery configs.
  // Staff-inclusive fixed prices / product list prices must not pick up a hidden catalog rate.

  const taxClass = input.tax_class?.trim().toLowerCase();
  if (taxClass && TAX_CLASS_DEFAULTS[taxClass]) {
    return {
      rate_percent: TAX_CLASS_DEFAULTS[taxClass].rate,
      hsn_code: input.hsn_code ?? TAX_CLASS_DEFAULTS[taxClass].hsn,
      tax_class: taxClass,
    };
  }

  const category = String(input.category ?? '');
  const categoryDefault = CATEGORY_DEFAULTS.find((rule) => rule.match.test(category));
  if (categoryDefault) {
    return {
      rate_percent: categoryDefault.rate,
      hsn_code: input.hsn_code ?? categoryDefault.hsn,
      tax_class: categoryDefault.taxClass,
    };
  }

  return { rate_percent: 0, hsn_code: input.hsn_code ?? null, tax_class: 'standard_goods' };
}

export function calculateGstComponent({
  label,
  component,
  amount,
  ratePercent,
  hsnCode,
  destinationState,
}: {
  label: string;
  component: GstComponent['component'];
  amount: number;
  ratePercent: number;
  hsnCode?: string | null;
  destinationState?: string | null;
}): GstComponent | null {
  const taxableAmount = roundCurrency(Math.max(amount, 0));
  if (taxableAmount <= 0 || ratePercent <= 0) return null;

  const totalTax = roundCurrency(taxableAmount * (ratePercent / 100));
  const jurisdiction = getTaxJurisdiction(destinationState);
  const halfTax = roundCurrency(totalTax / 2);

  return {
    label,
    component,
    taxable_amount: taxableAmount,
    hsn_code: hsnCode ?? null,
    rate_percent: ratePercent,
    cgst: jurisdiction === 'intra_state' ? halfTax : 0,
    sgst: jurisdiction === 'intra_state' ? roundCurrency(totalTax - halfTax) : 0,
    igst: jurisdiction === 'inter_state' ? totalTax : 0,
    total_tax: totalTax,
  };
}

export function buildTaxBreakdown(destinationState: string | null | undefined, components: Array<GstComponent | null>): TaxBreakdown {
  const cleanComponents = components.filter((component): component is GstComponent => Boolean(component));
  const totals = cleanComponents.reduce(
    (acc, component) => ({
      taxable_amount: roundCurrency(acc.taxable_amount + component.taxable_amount),
      cgst: roundCurrency(acc.cgst + component.cgst),
      sgst: roundCurrency(acc.sgst + component.sgst),
      igst: roundCurrency(acc.igst + component.igst),
      gst_amount: roundCurrency(acc.gst_amount + component.total_tax),
    }),
    { taxable_amount: 0, cgst: 0, sgst: 0, igst: 0, gst_amount: 0 },
  );

  return {
    policy_version: TAX_POLICY_VERSION,
    seller_state: SELLER_STATE,
    destination_state: destinationState || 'Unknown',
    jurisdiction: getTaxJurisdiction(destinationState),
    components: cleanComponents,
    totals,
    notes: [
      'Products, gems, ready jewellery, fixed-sheet mounting, cert, energization, shipping: 0% auto GST.',
      'Weight + labour % jewellery: 3% once on metal + labour + stone add-on (+ custom fee). Same amount online, offline, and international (export still charged; split is IGST when destination state ≠ Delhi).',
      'Fixed sheet ₹ are staff tax-inclusive. Tax calculation is server-authoritative.',
    ],
  };
}

export function taxBreakdownToJson(breakdown: TaxBreakdown): Json {
  return JSON.parse(JSON.stringify(breakdown)) as Json;
}

/**
 * Client GST estimate matching `recalculateOrderTotal`:
 * weight + labour % configs: 3% once on (metal + making + diamond + custom);
 * fixed sheet / products / shipping: 0%.
 * Amount does not depend on country (international same as India); jurisdiction split is server-side.
 */
export function estimateClientTax(
  items: Array<{
    price: number;
    quantity: number;
    category?: string | null;
    configuration_snapshot?: unknown;
  }>,
  shippingCost: number,
) {
  let gst = 0;
  for (const item of items) {
    const qty = Math.max(item.quantity, 0);
    const snap = parseConfigurationSnapshot(item.configuration_snapshot);
    const pricing = snap?.pricing;
    if (pricing && (pricing.gem_price != null || pricing.total != null || pricing.making_charge != null)) {
      const { mode, taxable } = weightJewelleryTaxableFromConfig({
        snapshotPricing: {
          metal_price: pricing.metal_price,
          making_charge: pricing.making_charge,
          diamond_charge: pricing.diamond_charge,
          custom_design_fee: pricing.custom_design_fee,
          jewelry_pricing_mode: pricing.jewelry_pricing_mode,
          metal_weight_grams: pricing.metal_weight_grams,
        },
      });
      gst += gstOnAmount(taxable * qty, appliesAutoJewelleryGst(mode) ? GST_METAL_MOUNTED_PERCENT : 0);
      continue;
    }
    const tax = resolveProductTax({ category: item.category });
    gst += gstOnAmount(Math.max(item.price * qty, 0), tax.rate_percent);
  }
  gst += gstOnAmount(shippingCost, GST_SHIPPING_PERCENT);
  return Math.round(gst);
}
