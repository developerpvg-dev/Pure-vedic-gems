import type { Json } from '@/lib/types/database';

export const TAX_POLICY_VERSION = '2026-05-16';
export const SELLER_STATE = 'Delhi';

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
  { match: /jewel|jewellery|jewelry|ring|pendant|gold|silver/i, rate: 3, hsn: '7113', taxClass: 'jewellery' },
  { match: /service|consultation|puja|pooja|yagya|energ/i, rate: 18, hsn: null, taxClass: 'service' },
  { match: /rudraksha|mala|idol|yantra/i, rate: 12, hsn: null, taxClass: 'spiritual_goods' },
  { match: /gem|navratna|upratna|sapphire|ruby|emerald|coral|pearl|opal|diamond|hessonite|cat/i, rate: 0.25, hsn: '7103', taxClass: 'loose_gemstone' },
];

const TAX_CLASS_DEFAULTS: Record<string, { rate: number; hsn: string | null }> = {
  exempt: { rate: 0, hsn: null },
  loose_gemstone: { rate: 0.25, hsn: '7103' },
  gemstone: { rate: 0.25, hsn: '7103' },
  jewellery: { rate: 3, hsn: '7113' },
  jewelry: { rate: 3, hsn: '7113' },
  metal: { rate: 3, hsn: '7113' },
  making_charge: { rate: 5, hsn: null },
  certification: { rate: 18, hsn: null },
  energization: { rate: 18, hsn: null },
  service: { rate: 18, hsn: null },
  shipping: { rate: 18, hsn: '9968' },
  spiritual_goods: { rate: 12, hsn: null },
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

  return { rate_percent: 3, hsn_code: input.hsn_code ?? null, tax_class: 'standard_goods' };
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
      'Tax calculation is server-authoritative and uses product-level HSN/GST overrides when present.',
      'Rates should be verified with the business accountant before production invoicing.',
    ],
  };
}

export function taxBreakdownToJson(breakdown: TaxBreakdown): Json {
  return JSON.parse(JSON.stringify(breakdown)) as Json;
}

export function estimateClientTax(items: Array<{ price: number; quantity: number; category?: string | null }>, shippingCost: number) {
  const productTax = items.reduce((sum, item) => {
    const tax = resolveProductTax({ category: item.category });
    return sum + Math.max(item.price * item.quantity, 0) * (tax.rate_percent / 100);
  }, 0);
  const shippingTax = shippingCost > 0 ? shippingCost * (TAX_CLASS_DEFAULTS.shipping.rate / 100) : 0;
  return Math.round(productTax + shippingTax);
}