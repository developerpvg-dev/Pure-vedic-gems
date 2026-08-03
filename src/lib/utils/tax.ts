import type { Json } from '@/lib/types/database';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';

export const TAX_POLICY_VERSION = '2026-08-03';
export const SELLER_STATE = 'Delhi';

/** Business GST rates. */
export const GST_LOOSE_STONE_PERCENT = 0.25;
export const GST_LOOSE_RUDRAKSHA_PERCENT = 0;
/** Metal-mounted / fixed-price jewellery: 3% once on (gem/bead + metal + labour + diamond). */
export const GST_METAL_MOUNTED_PERCENT = 3;
/** Malas / idols / yantras — GST exempt. */
export const GST_SPIRITUAL_GOODS_PERCENT = 0;

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
  { match: /jewel|jewellery|jewelry|ring|pendant|gold|silver/i, rate: GST_METAL_MOUNTED_PERCENT, hsn: '7113', taxClass: 'jewellery' },
  { match: /service|consultation|puja|pooja|yagya|energ/i, rate: 18, hsn: null, taxClass: 'service' },
  // Loose rudraksha is GST-exempt; metal+rudraksha uses mounted 3% on bead+metal+making.
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
  jewellery: { rate: GST_METAL_MOUNTED_PERCENT, hsn: '7113' },
  jewelry: { rate: GST_METAL_MOUNTED_PERCENT, hsn: '7113' },
  metal: { rate: GST_METAL_MOUNTED_PERCENT, hsn: '7113' },
  // ponytail: making/diamond share metal-mounted 3% (no separate 5% slab)
  making_charge: { rate: GST_METAL_MOUNTED_PERCENT, hsn: null },
  certification: { rate: 0, hsn: null },
  energization: { rate: 0, hsn: null },
  service: { rate: 18, hsn: null },
  shipping: { rate: 18, hsn: '9968' },
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

function parseRate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 28) return null;
  return parsed;
}

/** Stone/bead is jewellery (mounted or fixed making) when any jewellery charge is present. */
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

/** Taxable jewellery base: gem/bead + metal + labour/making + diamond + custom design fee. */
export function jewelleryTaxableBase(parts: {
  gem?: number | null;
  metal?: number | null;
  making?: number | null;
  diamond?: number | null;
  custom?: number | null;
}): number {
  return Math.max(
    0,
    Number(parts.gem ?? 0) +
      Number(parts.metal ?? 0) +
      Number(parts.making ?? 0) +
      Number(parts.diamond ?? 0) +
      Number(parts.custom ?? 0),
  );
}

/** Single 3% GST on the full jewellery base (mounted / fixed-price). */
export function gstOnJewellery(parts: {
  gem?: number | null;
  metal?: number | null;
  making?: number | null;
  diamond?: number | null;
  custom?: number | null;
}): number {
  return gstOnAmount(jewelleryTaxableBase(parts), GST_METAL_MOUNTED_PERCENT);
}

/**
 * Rate on the gem/bead line itself (display / loose only).
 * Loose → category rate (stone 0.25% / rudraksha 0%).
 * Mounted → folded into jewellery 3% (not taxed separately).
 */
export function resolveGemOrBeadTaxRate(
  category: string | null | undefined,
  mounted: boolean,
): number {
  if (mounted) return GST_METAL_MOUNTED_PERCENT;
  return resolveProductTax({ category }).rate_percent;
}

export function getTaxJurisdiction(destinationState?: string | null): TaxJurisdiction {
  return normalizeState(destinationState) === normalizeState(SELLER_STATE) ? 'intra_state' : 'inter_state';
}

export function resolveProductTax(input: ProductTaxInput) {
  if (input.tax_status === 'none' || input.tax_status === 'exempt') {
    return { rate_percent: 0, hsn_code: input.hsn_code ?? null, tax_class: input.tax_class ?? 'exempt' };
  }

  const productRate = parseRate(input.gst_rate);
  if (productRate !== null) {
    return { rate_percent: productRate, hsn_code: input.hsn_code ?? null, tax_class: input.tax_class ?? 'product_override' };
  }

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

  return { rate_percent: GST_METAL_MOUNTED_PERCENT, hsn_code: input.hsn_code ?? null, tax_class: 'standard_goods' };
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
      'Loose stone 0.25%; jewellery (gem/bead + metal + labour + diamond, incl. fixed price) 3% once on that total; loose rudraksha / malas / idols 0%; cert/energ exempt; shipping 18%.',
      'Tax calculation is server-authoritative. Verify with the business accountant before production invoicing.',
    ],
  };
}

export function taxBreakdownToJson(breakdown: TaxBreakdown): Json {
  return JSON.parse(JSON.stringify(breakdown)) as Json;
}

/**
 * Client-side GST estimate matching `recalculateOrderTotal`:
 * loose stone 0.25% / loose rudraksha 0% / mala·idol 0%;
 * jewellery (weight or fixed): one 3% on (gem + metal + labour + diamond + custom);
 * cert/energ exempt; shipping 18%.
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
      const gem = Number(pricing.gem_price ?? 0) * qty;
      const metal = Number(pricing.metal_price ?? 0) * qty;
      const making = Number(pricing.making_charge ?? 0) * qty;
      const diamond = Number(pricing.diamond_charge ?? 0) * qty;
      const custom = Number(pricing.custom_design_fee ?? 0) * qty;
      const category = snap?.product?.category ?? item.category;
      const mounted = isMetalMounted({ metal, making, diamond, custom });
      if (mounted) {
        // One 3% on full jewellery base (gem + metal + labour + diamond + custom).
        gst += gstOnJewellery({ gem, metal, making, diamond, custom });
      } else {
        gst += gstOnAmount(gem, resolveGemOrBeadTaxRate(category, false));
      }
      continue;
    }
    const tax = resolveProductTax({ category: item.category });
    gst += gstOnAmount(Math.max(item.price * qty, 0), tax.rate_percent);
  }
  gst += gstOnAmount(shippingCost, TAX_CLASS_DEFAULTS.shipping.rate);
  return Math.round(gst);
}
