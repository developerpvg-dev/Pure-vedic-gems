import {
  FIXED_PRICE_JEWELRY_METALS,
  JEWELRY_METAL_LABOR_RATES,
  WEIGHT_BASED_JEWELRY_METALS,
} from '@/lib/constants/jewelry-labor-rates';
import { JEWELRY_GST_RATE_PERCENT } from '@/lib/constants/jewelry-design-metals';

export type MetalPricingMode = 'weight' | 'fixed_sheet';

export interface MetalCatalogEntry {
  id?: string;
  slug: string;
  price_per_gram: number;
  labor_rate_percent: number | null;
  gst_rate_percent: number | null;
  pricing_mode: MetalPricingMode;
  purity?: string | null;
  name?: string;
  sort_order?: number;
  is_active?: boolean;
}

export function catalogPricingModeToRowMode(
  mode: MetalPricingMode
): 'fixed' | 'weight' {
  return mode === 'fixed_sheet' ? 'fixed' : 'weight';
}

export function rowModeToCatalogPricingMode(
  mode: 'fixed' | 'weight'
): MetalPricingMode {
  return mode === 'fixed' ? 'fixed_sheet' : 'weight';
}

export function resolveMetalPricingMode(
  slug: string,
  pricingModes?: Record<string, MetalPricingMode> | null
): MetalPricingMode {
  const fromDb = pricingModes?.[slug];
  if (fromDb === 'fixed_sheet' || fromDb === 'weight') return fromDb;
  // Defensive: older rows / callers may pass 'fixed'
  if ((fromDb as string | undefined) === 'fixed') return 'fixed_sheet';
  if ((FIXED_PRICE_JEWELRY_METALS as readonly string[]).includes(slug)) {
    return 'fixed_sheet';
  }
  if ((WEIGHT_BASED_JEWELRY_METALS as readonly string[]).includes(slug)) {
    return 'weight';
  }
  return 'weight';
}

export function isWeightBasedMetalSlug(
  slug: string,
  pricingModes?: Record<string, MetalPricingMode> | null
): boolean {
  return resolveMetalPricingMode(slug, pricingModes) === 'weight';
}

export function isFixedSheetMetalSlug(
  slug: string,
  pricingModes?: Record<string, MetalPricingMode> | null
): boolean {
  return resolveMetalPricingMode(slug, pricingModes) === 'fixed_sheet';
}

export function resolveLaborRatePercent(
  metal: string,
  laborRates?: Record<string, number> | null
): number {
  // Explicit 0 on the map means "no labor" for that metal. Missing key falls back
  // to sheet defaults so empty profile/design maps don't silently zero labor.
  if (laborRates && Object.prototype.hasOwnProperty.call(laborRates, metal)) {
    const fromMap = laborRates[metal];
    if (typeof fromMap === 'number' && Number.isFinite(fromMap) && fromMap >= 0) {
      return fromMap;
    }
  }
  return JEWELRY_METAL_LABOR_RATES[metal] ?? 0;
}

export function resolveJewelryGstPercent(
  metalSlug: string,
  catalog?: MetalCatalogEntry[],
  globalRate?: number | null
): number {
  const entry = catalog?.find((row) => row.slug === metalSlug);
  if (entry?.gst_rate_percent != null && entry.gst_rate_percent >= 0) {
    return entry.gst_rate_percent;
  }
  if (globalRate != null && globalRate >= 0) return globalRate;
  return JEWELRY_GST_RATE_PERCENT;
}

export function laborRatesFromCatalog(catalog: MetalCatalogEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const entry of catalog) {
    if (entry.labor_rate_percent != null && entry.labor_rate_percent >= 0) {
      out[entry.slug] = entry.labor_rate_percent;
    }
  }
  return out;
}

export function pricingModesFromCatalog(
  catalog: MetalCatalogEntry[]
): Record<string, MetalPricingMode> {
  const out: Record<string, MetalPricingMode> = {};
  for (const entry of catalog) {
    out[entry.slug] = entry.pricing_mode;
  }
  return out;
}

export function ratesBySlugFromCatalog(catalog: MetalCatalogEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const entry of catalog) {
    if (entry.price_per_gram > 0) out[entry.slug] = entry.price_per_gram;
  }
  return out;
}

export function parseMetalCatalogFromApi(rows: unknown): MetalCatalogEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      id: row.id != null ? String(row.id) : undefined,
      slug: String(row.slug ?? ''),
      price_per_gram: Number(row.price_per_gram ?? 0),
      labor_rate_percent:
        row.labor_rate_percent == null ? null : Number(row.labor_rate_percent),
      gst_rate_percent:
        row.gst_rate_percent == null ? null : Number(row.gst_rate_percent),
      pricing_mode:
        row.pricing_mode === 'fixed_sheet' || row.pricing_mode === 'fixed'
          ? 'fixed_sheet'
          : ('weight' as MetalPricingMode),
      purity: row.purity != null ? String(row.purity) : null,
      name: row.name != null ? String(row.name) : undefined,
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : undefined,
      is_active: typeof row.is_active === 'boolean' ? row.is_active : true,
    }))
    .filter((entry) => entry.slug)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function parseAdminMetalCatalogFromApi(data: unknown): MetalCatalogEntry[] {
  if (Array.isArray(data)) return parseMetalCatalogFromApi(data);
  if (data && typeof data === 'object' && Array.isArray((data as { metals?: unknown }).metals)) {
    return parseMetalCatalogFromApi((data as { metals: unknown }).metals);
  }
  return [];
}
