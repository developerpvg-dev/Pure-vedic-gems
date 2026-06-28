import {
  JEWELRY_DESIGN_METALS,
  type MetalPricingMode as RowPricingMode,
} from '@/lib/constants/jewelry-design-metals';
import type { MetalCatalogEntry } from '@/lib/utils/metal-pricing-config';

export type MetalRowStatus = 'available' | 'on_request' | 'unavailable';

export interface DesignMetalRow {
  slug: string;
  label: string;
  pricingMode: RowPricingMode;
  laborRatePercent: number | null;
  gstRatePercent: number | null;
  status: MetalRowStatus;
  fixedPrice: number | null;
  weightGrams: number | null;
  diamondCharge: number | null;
  note: string;
}

function asNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) out[key] = raw;
  }
  return out;
}

function asFlagRecord(value: unknown): Record<string, 'on_request' | 'unavailable'> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, 'on_request' | 'unavailable'> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw === 'on_request' || raw === 'unavailable') out[key] = raw;
  }
  return out;
}

function fallbackCatalog(): MetalCatalogEntry[] {
  return JEWELRY_DESIGN_METALS.map((metal, index) => ({
    slug: metal.slug,
    name: metal.label,
    price_per_gram: 0,
    labor_rate_percent: metal.laborRatePercent,
    gst_rate_percent: null,
    pricing_mode: metal.pricingMode === 'fixed' ? 'fixed_sheet' : 'weight',
    sort_order: index,
    is_active: true,
  }));
}

function resolveCatalog(catalog?: MetalCatalogEntry[]): MetalCatalogEntry[] {
  const active = (catalog ?? []).filter((entry) => entry.is_active !== false);
  return active.length > 0 ? active : fallbackCatalog();
}

function rowTemplateFromCatalogEntry(entry: MetalCatalogEntry): Omit<
  DesignMetalRow,
  'status' | 'fixedPrice' | 'weightGrams' | 'diamondCharge' | 'note' | 'laborRatePercent' | 'pricingMode'
> {
  return {
    slug: entry.slug,
    label: entry.name ?? entry.slug.replace(/_/g, ' '),
    gstRatePercent: entry.gst_rate_percent,
  };
}

function defaultPricingModeForMetal(
  slug: string,
  laborRates?: Record<string, number>
): 'fixed' | 'weight' {
  if (laborRates && typeof laborRates[slug] === 'number') return 'weight';
  return 'fixed';
}

function statusForMetal(
  slug: string,
  pricingMode: RowPricingMode,
  charges: Record<string, number>,
  weights: Record<string, number>,
  flags: Record<string, 'on_request' | 'unavailable'>
): MetalRowStatus {
  const flag = flags[slug];
  if (flag === 'on_request') return 'on_request';
  if (flag === 'unavailable') return 'unavailable';
  if (pricingMode === 'fixed' && charges[slug]) return 'available';
  if (pricingMode === 'weight' && weights[slug]) return 'available';
  return 'unavailable';
}

export const DEFAULT_STONE_ADDON_LABEL = 'Diamond';

export function getDesignDiamondChargeFromDesign(diamondCharges: unknown): number | null {
  const diamonds = asNumberRecord(diamondCharges);
  const values = Object.values(diamonds);
  if (values.length === 0) return null;
  return Math.round(Math.max(...values));
}

export function getStoneAddonLabelFromDesign(design: {
  stone_addon_label?: string | null;
  diamond_charges?: unknown;
}): string | null {
  const amount = getDesignDiamondChargeFromDesign(design.diamond_charges);
  const explicit = design.stone_addon_label?.trim();
  if (explicit) return explicit;
  if (amount && amount > 0) return DEFAULT_STONE_ADDON_LABEL;
  return null;
}

export function getStoneAddonFromDesign(design: {
  stone_addon_label?: string | null;
  diamond_charges?: unknown;
}): { label: string | null; amount: number | null } {
  const amount = getDesignDiamondChargeFromDesign(design.diamond_charges);
  const label = getStoneAddonLabelFromDesign(design);
  return { label, amount };
}

/** Customer-facing note when a design has a qualitative pricing remark (e.g. Design-34). */
export function getDesignConfiguratorNote(design: {
  description?: string | null;
}): string | null {
  const text = design.description?.trim();
  if (!text || !/remark/i.test(text)) return null;

  const afterRemark = text.split(/remark[:\s]*/i)[1]?.trim();
  if (afterRemark) return afterRemark.charAt(0).toUpperCase() + afterRemark.slice(1);

  return text.replace(/^[^:]+:\s*/i, '').trim() || text;
}

export function resolveStoneAddonLabelForSave(
  label: string | null | undefined,
  amount: number | null | undefined
): string | null {
  const trimmed = label?.trim() || null;
  if (!amount || amount <= 0) return null;
  return trimmed || DEFAULT_STONE_ADDON_LABEL;
}

export function laborRatesFromMetalRows(rows: DesignMetalRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    if (
      row.pricingMode === 'weight' &&
      row.laborRatePercent != null &&
      Number.isFinite(row.laborRatePercent) &&
      row.laborRatePercent >= 0
    ) {
      out[row.slug] = row.laborRatePercent;
    }
  }
  return out;
}

export function laborRatesFromDesignRecord(design: { labor_rates?: unknown }): Record<string, number> {
  return asNumberRecord(design.labor_rates ?? {});
}

export function getAvailableMetalSlugsFromRows(rows: DesignMetalRow[]): string[] {
  return rows
    .filter((row) => row.status === 'available')
    .filter((row) =>
      row.pricingMode === 'fixed'
        ? !!(row.fixedPrice && row.fixedPrice > 0)
        : !!(row.weightGrams && row.weightGrams > 0)
    )
    .map((row) => row.slug);
}

export function syncMetalRowsWithCatalog(
  rows: DesignMetalRow[],
  catalog: MetalCatalogEntry[]
): DesignMetalRow[] {
  const resolved = resolveCatalog(catalog);
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const merged: DesignMetalRow[] = [];

  for (const entry of resolved) {
    const template = rowTemplateFromCatalogEntry(entry);
    const existing = bySlug.get(entry.slug);
    merged.push(
      existing
        ? {
            ...existing,
            label: template.label,
            gstRatePercent: template.gstRatePercent ?? existing.gstRatePercent,
          }
        : {
            ...template,
            pricingMode: 'fixed',
            laborRatePercent: null,
            status: 'unavailable',
            fixedPrice: null,
            weightGrams: null,
            diamondCharge: null,
            note: '',
          }
    );
    bySlug.delete(entry.slug);
  }

  for (const orphan of bySlug.values()) {
    merged.push(orphan);
  }

  return merged;
}

export function applyLaborRatesToMetalRows(
  rows: DesignMetalRow[],
  laborRates: Record<string, number>
): DesignMetalRow[] {
  return rows.map((row) => {
    if (row.pricingMode !== 'weight') return row;
    const fromDb = laborRates[row.slug];
    if (typeof fromDb === 'number' && Number.isFinite(fromDb)) {
      return { ...row, laborRatePercent: fromDb };
    }
    return row;
  });
}

export function catalogMetalsAddableToDesign(
  catalog: MetalCatalogEntry[],
  rows: DesignMetalRow[]
): MetalCatalogEntry[] {
  const rowBySlug = new Map(rows.map((row) => [row.slug, row]));
  return catalog.filter((entry) => {
    if (entry.is_active === false) return false;
    const row = rowBySlug.get(entry.slug);
    if (!row) return true;
    return row.status !== 'available';
  });
}

export function createMetalRowDraftFromProfile(
  entry: MetalCatalogEntry,
  settingLaborRates: Record<string, number>,
  defaultGstPercent: number
): {
  pricingMode: RowPricingMode;
  laborRatePercent: number | null;
  fixedPrice: number | null;
  weightGrams: number | null;
  note: string;
  gstRatePercent: number;
} {
  const profileLabor = settingLaborRates[entry.slug];
  return {
    pricingMode: profileLabor != null ? 'weight' : 'fixed',
    laborRatePercent: profileLabor ?? null,
    fixedPrice: null,
    weightGrams: null,
    note: '',
    gstRatePercent: defaultGstPercent,
  };
}

export function applyMetalRowToDesign(
  rows: DesignMetalRow[],
  entry: MetalCatalogEntry,
  draft: {
    pricingMode: RowPricingMode;
    laborRatePercent: number | null;
    fixedPrice: number | null;
    weightGrams: number | null;
    note: string;
    gstRatePercent: number | null;
  }
): DesignMetalRow[] {
  const template = rowTemplateFromCatalogEntry(entry);
  const newRow: DesignMetalRow = {
    ...template,
    pricingMode: draft.pricingMode,
    laborRatePercent:
      draft.pricingMode === 'weight' ? draft.laborRatePercent : null,
    gstRatePercent: draft.gstRatePercent,
    status: 'available',
    fixedPrice: draft.pricingMode === 'fixed' ? draft.fixedPrice : null,
    weightGrams: draft.pricingMode === 'weight' ? draft.weightGrams : null,
    diamondCharge: null,
    note: draft.note ?? '',
  };

  const idx = rows.findIndex((row) => row.slug === entry.slug);
  if (idx >= 0) {
    return rows.map((row, i) => (i === idx ? newRow : row));
  }
  return [...rows, newRow];
}

export function removeMetalRowFromDesign(
  rows: DesignMetalRow[],
  slug: string
): DesignMetalRow[] {
  return rows.filter((row) => row.slug !== slug);
}

/** Add or re-enable a catalog metal on this design's pricing matrix. */
export function enableMetalOnDesign(
  rows: DesignMetalRow[],
  entry: MetalCatalogEntry,
  catalog?: MetalCatalogEntry[],
  options?: { laborRates?: Record<string, number> }
): DesignMetalRow[] {
  const synced = catalog?.length ? syncMetalRowsWithCatalog(rows, catalog) : rows;
  const profileLabor = options?.laborRates?.[entry.slug] ?? null;
  const pricingMode = defaultPricingModeForMetal(entry.slug, options?.laborRates);

  const existing = synced.find((row) => row.slug === entry.slug);
  if (existing) {
    return synced.map((row) =>
      row.slug === entry.slug
        ? {
            ...row,
            status: 'available' as const,
            pricingMode: row.pricingMode ?? pricingMode,
            laborRatePercent: row.laborRatePercent ?? profileLabor,
          }
        : row
    );
  }
  return appendNewMetalRow(synced, entry, options);
}

export function appendNewMetalRow(
  rows: DesignMetalRow[],
  entry: MetalCatalogEntry,
  options?: { laborRates?: Record<string, number> }
): DesignMetalRow[] {
  if (rows.some((row) => row.slug === entry.slug)) {
    return syncMetalRowsWithCatalog(rows, [entry]);
  }
  const template = rowTemplateFromCatalogEntry(entry);
  const profileLabor = options?.laborRates?.[entry.slug] ?? null;
  const pricingMode = defaultPricingModeForMetal(entry.slug, options?.laborRates);
  return [
    ...rows,
    {
      ...template,
      pricingMode,
      laborRatePercent: profileLabor,
      status: 'available',
      fixedPrice: null,
      weightGrams: null,
      diamondCharge: null,
      note: '',
    },
  ];
}

export function createEmptyMetalRows(catalog?: MetalCatalogEntry[]): DesignMetalRow[] {
  return resolveCatalog(catalog).map((entry) => ({
    ...rowTemplateFromCatalogEntry(entry),
    pricingMode: 'fixed' as const,
    laborRatePercent: null,
    status: 'unavailable' as const,
    fixedPrice: null,
    weightGrams: null,
    diamondCharge: null,
    note: '',
  }));
}

export function decodeMetalRowsFromDesign(
  design: {
    making_charges?: unknown;
    estimated_metal_weight?: unknown;
    diamond_charges?: unknown;
    metal_flags?: unknown;
    labor_rates?: unknown;
  },
  catalog?: MetalCatalogEntry[]
): DesignMetalRow[] {
  const charges = asNumberRecord(design.making_charges);
  const weights = asNumberRecord(design.estimated_metal_weight);
  const flags = asFlagRecord(design.metal_flags);
  const laborRates = asNumberRecord(design.labor_rates);
  const resolved = resolveCatalog(catalog);
  const catalogSlugs = new Set(resolved.map((entry) => entry.slug));

  const rows = resolved.map((entry) => {
    const template = rowTemplateFromCatalogEntry(entry);
    const fixedPrice = charges[entry.slug] ?? null;
    const weightGrams = weights[entry.slug] ?? null;
    const pricingMode: RowPricingMode =
      fixedPrice && !weightGrams ? 'fixed' : weightGrams ? 'weight' : 'fixed';
    return {
      ...template,
      pricingMode,
      laborRatePercent: laborRates[entry.slug] ?? null,
      status: statusForMetal(entry.slug, pricingMode, charges, weights, flags),
      fixedPrice,
      weightGrams,
      diamondCharge: null,
      note: '',
    };
  });

  for (const slug of new Set([...Object.keys(charges), ...Object.keys(weights)])) {
    if (catalogSlugs.has(slug)) continue;
    const fixedPrice = charges[slug] ?? null;
    const weightGrams = weights[slug] ?? null;
    const pricingMode: RowPricingMode =
      fixedPrice && !weightGrams ? 'fixed' : 'weight';
    rows.push({
      slug,
      label: slug.replace(/_/g, ' '),
      pricingMode,
      laborRatePercent: laborRates[slug] ?? null,
      gstRatePercent: null,
      status: statusForMetal(slug, pricingMode, charges, weights, flags),
      fixedPrice,
      weightGrams,
      diamondCharge: null,
      note: '',
    });
  }

  return rows.filter((row) => row.status !== 'unavailable');
}

export function encodeMetalRowsToDesignFields(
  rows: DesignMetalRow[],
  designDiamondCharge?: number | null
): {
  making_charges: Record<string, number>;
  estimated_metal_weight: Record<string, number> | null;
  diamond_charges: Record<string, number>;
  metal_flags: Record<string, 'on_request' | 'unavailable'>;
  labor_rates: Record<string, number>;
} {
  const making_charges: Record<string, number> = {};
  const estimated_metal_weight: Record<string, number> = {};
  const diamond_charges: Record<string, number> = {};
  const metal_flags: Record<string, 'on_request' | 'unavailable'> = {};
  const labor_rates: Record<string, number> = {};

  for (const row of rows) {
    if (row.status === 'on_request') {
      metal_flags[row.slug] = 'on_request';
      continue;
    }

    if (row.status === 'unavailable') {
      metal_flags[row.slug] = 'unavailable';
      continue;
    }

    if (row.status === 'available') {
      if (row.pricingMode === 'fixed' && row.fixedPrice && row.fixedPrice > 0) {
        making_charges[row.slug] = Math.round(row.fixedPrice);
      }

      if (row.pricingMode === 'weight' && row.weightGrams && row.weightGrams > 0) {
        estimated_metal_weight[row.slug] = Number(row.weightGrams);
        if (
          row.laborRatePercent != null &&
          Number.isFinite(row.laborRatePercent) &&
          row.laborRatePercent >= 0
        ) {
          labor_rates[row.slug] = row.laborRatePercent;
        }
      }

      const hasPricing =
        (row.pricingMode === 'fixed' && making_charges[row.slug]) ||
        (row.pricingMode === 'weight' && estimated_metal_weight[row.slug]);

      if (!hasPricing) {
        metal_flags[row.slug] = 'unavailable';
      }
    }
  }

  const diamondAmount =
    designDiamondCharge && designDiamondCharge > 0
      ? Math.round(designDiamondCharge)
      : 0;

  if (diamondAmount > 0) {
    for (const slug of getAvailableMetalSlugsFromRows(rows)) {
      diamond_charges[slug] = diamondAmount;
    }
  }

  return {
    making_charges,
    estimated_metal_weight:
      Object.keys(estimated_metal_weight).length > 0 ? estimated_metal_weight : null,
    diamond_charges,
    metal_flags,
    labor_rates,
  };
}

export function isMetalSelectableFromRows(slug: string, rows: DesignMetalRow[]): boolean {
  const row = rows.find((entry) => entry.slug === slug);
  if (!row || row.status !== 'available') return false;
  if (row.pricingMode === 'fixed') return !!(row.fixedPrice && row.fixedPrice > 0);
  return !!(row.weightGrams && row.weightGrams > 0);
}

export function getMetalFlag(
  metal: string,
  metalFlags: unknown
): 'on_request' | 'unavailable' | null {
  const flags = asFlagRecord(metalFlags);
  return flags[metal] ?? null;
}

export function isMetalExplicitlyBlocked(metal: string, metalFlags: unknown): boolean {
  const flag = getMetalFlag(metal, metalFlags);
  return flag === 'on_request' || flag === 'unavailable';
}
