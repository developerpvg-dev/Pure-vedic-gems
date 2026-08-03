/**
 * Parse stored orders.tax_breakdown (JSON) for admin / print / POS display.
 */

export type OrderTaxComponentView = {
  label: string;
  ratePercent: number;
  taxableAmount: number;
  totalTax: number;
  hsnCode: string | null;
};

export type OrderTaxBreakdownView = {
  jurisdiction: string | null;
  destinationState: string | null;
  sellerState: string | null;
  cgst: number;
  sgst: number;
  igst: number;
  gstAmount: number;
  components: OrderTaxComponentView[];
};

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Rate label for staff: "0.25%", "3%", "18%". */
export function formatGstRatePercent(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return '0%';
  // Keep one decimal for 0.25; drop trailing .0 for whole numbers.
  const rounded = Math.round(rate * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded}%`;
}

export function parseOrderTaxBreakdown(raw: unknown): OrderTaxBreakdownView | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const totals =
    obj.totals && typeof obj.totals === 'object' && !Array.isArray(obj.totals)
      ? (obj.totals as Record<string, unknown>)
      : null;
  const componentsRaw = Array.isArray(obj.components) ? obj.components : [];
  const components: OrderTaxComponentView[] = componentsRaw
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === 'object')
    .map((c) => ({
      label: String(c.label || 'Taxable component'),
      ratePercent: num(c.rate_percent),
      taxableAmount: num(c.taxable_amount),
      totalTax: num(c.total_tax),
      hsnCode: c.hsn_code != null && String(c.hsn_code).trim() ? String(c.hsn_code) : null,
    }))
    .filter((c) => c.taxableAmount > 0 || c.totalTax > 0);

  const cgst = num(totals?.cgst);
  const sgst = num(totals?.sgst);
  const igst = num(totals?.igst);
  const gstAmount = num(totals?.gst_amount);

  if (components.length === 0 && cgst <= 0 && sgst <= 0 && igst <= 0 && gstAmount <= 0) {
    return null;
  }

  return {
    jurisdiction: obj.jurisdiction != null ? String(obj.jurisdiction) : null,
    destinationState: obj.destination_state != null ? String(obj.destination_state) : null,
    sellerState: obj.seller_state != null ? String(obj.seller_state) : null,
    cgst,
    sgst,
    igst,
    gstAmount,
    components,
  };
}

/** Human label for the rolled-up GST line when rates are known. */
export function gstSummaryLabel(view: OrderTaxBreakdownView | null): string {
  if (!view || view.components.length === 0) return 'GST';
  const rates = [...new Set(view.components.map((c) => c.ratePercent).filter((r) => r > 0))]
    .sort((a, b) => a - b)
    .map(formatGstRatePercent);
  if (rates.length === 0) return 'GST';
  if (rates.length === 1) return `GST (${rates[0]})`;
  return `GST (${rates.join(' + ')})`;
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * After metal/making admin adjusts: keep tax_breakdown in sync with gst_amount.
 * Applies delta to the jewellery (3%) component when present; otherwise rebuilds a single line.
 */
export function applyJewelleryGstDeltaToTaxBreakdown(
  raw: unknown,
  args: { gstDelta: number; jewelleryTaxableDelta: number; nextGstAmount: number },
): Record<string, unknown> | null {
  const gstDelta = Number(args.gstDelta) || 0;
  const taxableDelta = Number(args.jewelleryTaxableDelta) || 0;
  const nextGst = Math.round(Number(args.nextGstAmount) || 0);

  if ((!raw || typeof raw !== 'object') && nextGst <= 0 && gstDelta === 0) return null;

  const base: Record<string, unknown> =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? { ...(raw as Record<string, unknown>) }
      : {
          policy_version: '2026-08-03',
          seller_state: 'Delhi',
          destination_state: 'Unknown',
          jurisdiction: 'inter_state',
          components: [] as Record<string, unknown>[],
          totals: {} as Record<string, unknown>,
          notes: [] as string[],
        };

  const components: Record<string, unknown>[] = Array.isArray(base.components)
    ? (base.components as Record<string, unknown>[]).map((c) => ({ ...c }))
    : [];

  const jewelleryIdx = components.findIndex((c) => {
    const rate = num(c.rate_percent);
    const label = String(c.label || '').toLowerCase();
    const kind = String(c.component || '');
    return (
      rate === 3 &&
      (kind === 'metal' ||
        label.includes('jewellery') ||
        label.includes('jewelry') ||
        label.includes('metal'))
    );
  });

  if (jewelleryIdx >= 0) {
    const c = components[jewelleryIdx]!;
    const nextTaxable = Math.max(0, round2(num(c.taxable_amount) + taxableDelta));
    const nextTax = Math.max(0, round2(num(c.total_tax) + gstDelta));
    c.taxable_amount = nextTaxable;
    c.total_tax = nextTax;
    // Keep IGST/CGST/SGST proportional for this component when only one of them was set.
    if (num(c.igst) > 0) c.igst = nextTax;
    else if (num(c.cgst) > 0 || num(c.sgst) > 0) {
      const half = round2(nextTax / 2);
      c.cgst = half;
      c.sgst = round2(nextTax - half);
    }
  } else if (Math.abs(gstDelta) > 0.009 || nextGst > 0) {
    components.push({
      label: 'Jewellery (gem/bead + metal + labour + stone add-on)',
      component: 'metal',
      taxable_amount: Math.max(0, taxableDelta),
      hsn_code: '7113',
      rate_percent: 3,
      cgst: 0,
      sgst: 0,
      igst: Math.max(0, round2(gstDelta)),
      total_tax: Math.max(0, round2(gstDelta)),
    });
  }

  const prevTotals =
    base.totals && typeof base.totals === 'object' && !Array.isArray(base.totals)
      ? { ...(base.totals as Record<string, unknown>) }
      : {};

  const sumTax = round2(components.reduce((s, c) => s + num(c.total_tax), 0));
  const sumTaxable = round2(components.reduce((s, c) => s + num(c.taxable_amount), 0));
  const wasIntra = num(prevTotals.cgst) > 0 || num(prevTotals.sgst) > 0;
  const half = round2(nextGst / 2);

  base.components = components.filter((c) => num(c.taxable_amount) > 0 || num(c.total_tax) > 0);
  base.totals = {
    ...prevTotals,
    taxable_amount: sumTaxable,
    gst_amount: nextGst > 0 ? nextGst : sumTax,
    cgst: wasIntra ? half : 0,
    sgst: wasIntra ? round2((nextGst > 0 ? nextGst : sumTax) - half) : 0,
    igst: wasIntra ? 0 : nextGst > 0 ? nextGst : sumTax,
  };

  return base;
}

/** Flat rows for email when React components aren't available. Prefer rate lines. */
export function taxBreakdownEmailRows(raw: unknown): Array<{ label: string; amount: number }> {
  const view = parseOrderTaxBreakdown(raw);
  if (!view) return [];
  const rows: Array<{ label: string; amount: number }> = [];
  for (const c of view.components) {
    if (c.totalTax <= 0) continue;
    rows.push({
      label: `${c.label} @ ${formatGstRatePercent(c.ratePercent)}`,
      amount: c.totalTax,
    });
  }
  if (rows.length > 0) return rows;
  if (view.cgst > 0) rows.push({ label: 'CGST', amount: view.cgst });
  if (view.sgst > 0) rows.push({ label: 'SGST', amount: view.sgst });
  if (view.igst > 0) rows.push({ label: 'IGST', amount: view.igst });
  return rows;
}
