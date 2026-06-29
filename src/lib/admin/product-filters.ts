import { createAdminClient } from '@/lib/supabase/admin';
import {
  AVAILABILITY_STATUS_OPTIONS,
  CANONICAL_CATEGORY_OPTIONS,
  PRICE_MODES,
  PRODUCT_TYPE_OPTIONS,
} from '@/lib/constants/product-taxonomy';
import {
  IDOL_SUB_CATEGORIES,
  JEWELLERY_SUB_CATEGORIES,
  NAVRATNA_SUB_CATEGORIES,
  RUDRAKSHA_SUB_CATEGORIES,
  UPRATNA_SUB_CATEGORIES,
} from '@/components/admin/product-form/kinds';
import { KNOWN_CATALOG_SUBCATEGORIES, KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';
import type { ShopFilterOption, ShopFilterOptions } from '@/lib/shop/filters';

export type AdminFilterOptions = ShopFilterOptions;

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

/** Canonical sub-category slugs + labels per parent category. */
const CANONICAL_SUBCATEGORIES: Record<string, Array<{ value: string; label: string }>> = {
  navaratna: [...NAVRATNA_SUB_CATEGORIES, { value: 'exclusive-gems', label: 'Exclusive Gems' }],
  upratna: UPRATNA_SUB_CATEGORIES,
  rudraksha: RUDRAKSHA_SUB_CATEGORIES,
  idol: IDOL_SUB_CATEGORIES,
  jewelry: JEWELLERY_SUB_CATEGORIES,
  mala: [
    { value: 'rudraksha-mala', label: 'Rudraksha Mala' },
    { value: 'siddha-mala', label: 'Siddha Mala' },
    { value: 'indrakshi-mala', label: 'Indrakshi Mala' },
    { value: 'gemstone-mala', label: 'Gemstone Mala' },
  ],
  gemstone: [],
};

function titleize(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function subcategoryLabel(slug: string, parentCategory?: string) {
  const canonical = parentCategory ? CANONICAL_SUBCATEGORIES[parentCategory] : undefined;
  const fromCanonical = canonical?.find((item) => item.value === slug);
  if (fromCanonical) return fromCanonical.label;

  const gemMeta = KNOWN_GEM_SUBCATEGORIES[slug];
  if (gemMeta && (!parentCategory || gemMeta.category === parentCategory)) return gemMeta.label;

  const catalogMeta = KNOWN_CATALOG_SUBCATEGORIES[slug];
  if (catalogMeta && (!parentCategory || catalogMeta.category === parentCategory)) return catalogMeta.label;

  return titleize(slug);
}

function sortedOptions(counts: Map<string, number>, labels: Record<string, string> = {}): ShopFilterOption[] {
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

async function countByField(field: 'category' | 'sub_category', categoryFilter?: string) {
  const admin = createAdminClient();
  let query = admin.from('products').select(field);
  if (categoryFilter && field === 'sub_category') {
    query = query.eq('category', categoryFilter);
  }
  const { data } = await query;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const value = String((row as Record<string, string | null>)[field] ?? '').trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function mergeCanonicalSubcategories(category: string, dbCounts: Map<string, number>): ShopFilterOption[] {
  const canonical = CANONICAL_SUBCATEGORIES[category] ?? [];
  const seen = new Set<string>();
  const options: ShopFilterOption[] = [];

  for (const item of canonical) {
    seen.add(item.value);
    options.push({
      value: item.value,
      label: item.label,
      count: dbCounts.get(item.value) ?? 0,
    });
  }

  for (const [slug, count] of dbCounts.entries()) {
    if (seen.has(slug)) continue;
    options.push({
      value: slug,
      label: subcategoryLabel(slug, category),
      count,
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function buildCategoryOptions(dbCounts: Map<string, number>): ShopFilterOption[] {
  const options: ShopFilterOption[] = CANONICAL_CATEGORY_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    count: dbCounts.get(option.value) ?? 0,
  }));

  for (const [value, count] of dbCounts.entries()) {
    if (options.some((option) => option.value === value)) continue;
    options.push({
      value,
      label: CATEGORY_LABELS[value] ?? titleize(value),
      count,
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
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

export async function getAdminFilterOptions(category?: string): Promise<AdminFilterOptions> {
  const admin = createAdminClient();

  const [categoryCounts, subcategoryCounts, facetResult] = await Promise.all([
    category ? Promise.resolve(new Map<string, number>()) : countByField('category'),
    category ? countByField('sub_category', category) : Promise.resolve(new Map<string, number>()),
    (() => {
      let query = admin
        .from('products')
        .select(
          'category, sub_category, product_type, availability_status, price, carat_weight, origin, planet, shape, certification, certificate_lab, treatment, quality_label, price_mode, configurator_enabled'
        );
      if (category) query = query.eq('category', category);
      return query;
    })(),
  ]);

  const { data } = await facetResult;
  const rows = (data ?? []) as FacetRow[];

  const gemLabels = Object.fromEntries(
    Object.entries(KNOWN_GEM_SUBCATEGORIES).map(([slug, meta]) => [slug, meta.label])
  );

  const subcategories = category
    ? mergeCanonicalSubcategories(category, subcategoryCounts)
    : collectOptions(rows, 'sub_category', gemLabels);

  return {
    categories: category ? [] : buildCategoryOptions(categoryCounts),
    subcategories,
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
