import { createOptionalPublicClient } from '@/lib/supabase/public';
import {
  AVAILABILITY_STATUS_OPTIONS,
  CANONICAL_CATEGORY_OPTIONS,
  PRICE_MODES,
  PRODUCT_TYPE_OPTIONS,
} from '@/lib/constants/product-taxonomy';
import type { ProductFilters } from '@/lib/types/product';

export type ShopFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type ShopFilterOptions = {
  categories: ShopFilterOption[];
  subcategories: ShopFilterOption[];
  productTypes: ShopFilterOption[];
  availabilityStatuses: ShopFilterOption[];
  priceRanges: ShopFilterOption[];
  caratRanges: ShopFilterOption[];
  origins: ShopFilterOption[];
  planets: ShopFilterOption[];
  shapes: ShopFilterOption[];
  certifications: ShopFilterOption[];
  certificateLabs: ShopFilterOption[];
  treatments: ShopFilterOption[];
  qualityLabels: ShopFilterOption[];
  priceModes: ShopFilterOption[];
  configuratorOptions: ShopFilterOption[];
};

export type ShopFilterScope = {
  category?: string;
  subCategory?: string;
  directorsPick?: boolean;
  primaryGemSlugs?: string[];
};

type FacetRow = {
  category: string | null;
  sub_category: string | null;
  product_type: string | null;
  availability_status: string | null;
  price: number | null;
  carat_weight: number | null;
  origin: string | null;
  planet: string | null;
  shape: string | null;
  certification: string | null;
  certificate_lab: string | null;
  treatment: string | null;
  quality_label: string | null;
  price_mode: string | null;
  configurator_enabled: boolean | null;
};

const EMPTY_FILTER_OPTIONS: ShopFilterOptions = {
  categories: [],
  subcategories: [],
  productTypes: [],
  availabilityStatuses: [],
  priceRanges: [],
  caratRanges: [],
  origins: [],
  planets: [],
  shapes: [],
  certifications: [],
  certificateLabs: [],
  treatments: [],
  qualityLabels: [],
  priceModes: [],
  configuratorOptions: [],
};

const CATEGORY_LABELS = Object.fromEntries(CANONICAL_CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const PRODUCT_TYPE_LABELS = Object.fromEntries(PRODUCT_TYPE_OPTIONS.map((option) => [option.value, option.label]));
const AVAILABILITY_LABELS = Object.fromEntries(AVAILABILITY_STATUS_OPTIONS.map((option) => [option.value, option.label]));

const PRICE_RANGE_PRESETS = [
  { label: 'Under ₹25,000', value: '0-25000', min: 0, max: 25000 },
  { label: '₹25,000 - ₹1,00,000', value: '25000-100000', min: 25000, max: 100000 },
  { label: '₹1,00,000 - ₹5,00,000', value: '100000-500000', min: 100000, max: 500000 },
  { label: '₹5,00,000+', value: '500000-', min: 500000, max: null },
];

const CARAT_RANGE_PRESETS = [
  { label: 'Under 2 ct', value: '0-2', min: 0, max: 2 },
  { label: '2 - 5 ct', value: '2-5', min: 2, max: 5 },
  { label: '5 - 10 ct', value: '5-10', min: 5, max: 10 },
  { label: '10 ct+', value: '10-', min: 10, max: null },
];

function buildSearchTerm(query: string) {
  return `%${query.replace(/[%,]/g, ' ').trim()}%`;
}

function titleize(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortedOptions(counts: Map<string, number>, labels: Record<string, string> = {}) {
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count, label: labels[value] ?? titleize(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function collectOptions(rows: FacetRow[], key: keyof FacetRow, labels: Record<string, string> = {}) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return sortedOptions(counts, labels);
}

function rangeOptions(rows: FacetRow[], key: 'price' | 'carat_weight', ranges: typeof PRICE_RANGE_PRESETS) {
  const values = rows
    .map((row) => row[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);

  if (values.length < 2) return [];

  return ranges
    .map((range) => {
      const count = values.filter((value) => value >= range.min && (range.max == null || value <= range.max)).length;
      return { value: range.value, label: range.label, count };
    })
    .filter((option) => option.count > 0);
}

function configuratorOptions(rows: FacetRow[]) {
  const count = rows.filter((row) => row.configurator_enabled).length;
  return count > 0 ? [{ value: 'true', label: 'Configurable jewellery', count }] : [];
}

export async function getShopFilterOptions(
  scope: ShopFilterScope,
  filters: Pick<ProductFilters, 'q' | 'directors_pick'> = {}
): Promise<ShopFilterOptions> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return EMPTY_FILTER_OPTIONS;

  let query = supabase
    .from('products')
    .select('category, sub_category, product_type, availability_status, price, carat_weight, origin, planet, shape, certification, certificate_lab, treatment, quality_label, price_mode, configurator_enabled')
    .eq('is_active', true)
    .limit(2000);

  if (scope.category) query = query.eq('category', scope.category);
  if (scope.subCategory) query = query.eq('sub_category', scope.subCategory);
  if (scope.directorsPick || filters.directors_pick) query = query.eq('is_directors_pick', true);
  if (scope.primaryGemSlugs?.length) query = query.in('sub_category', scope.primaryGemSlugs);
  if (filters.q) {
    const searchTerm = buildSearchTerm(filters.q);
    query = query.or(
      `name.ilike.${searchTerm},sku.ilike.${searchTerm},tag_number.ilike.${searchTerm},vedic_name.ilike.${searchTerm},origin.ilike.${searchTerm},planet.ilike.${searchTerm},short_desc.ilike.${searchTerm}`
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as FacetRow[];

  return {
    categories: scope.category ? [] : collectOptions(rows, 'category', CATEGORY_LABELS),
    subcategories: scope.subCategory ? [] : collectOptions(rows, 'sub_category'),
    productTypes: collectOptions(rows, 'product_type', PRODUCT_TYPE_LABELS),
    availabilityStatuses: collectOptions(rows, 'availability_status', AVAILABILITY_LABELS),
    priceRanges: rangeOptions(rows, 'price', PRICE_RANGE_PRESETS),
    caratRanges: rangeOptions(rows, 'carat_weight', CARAT_RANGE_PRESETS),
    origins: collectOptions(rows, 'origin'),
    planets: collectOptions(rows, 'planet'),
    shapes: collectOptions(rows, 'shape'),
    certifications: collectOptions(rows, 'certification'),
    certificateLabs: collectOptions(rows, 'certificate_lab'),
    treatments: collectOptions(rows, 'treatment'),
    qualityLabels: collectOptions(rows, 'quality_label'),
    priceModes: collectOptions(rows, 'price_mode', Object.fromEntries(PRICE_MODES.map((mode) => [mode, titleize(mode)]))),
    configuratorOptions: configuratorOptions(rows),
  };
}