import { CANONICAL_CATEGORY_OPTIONS } from '@/lib/constants/product-taxonomy';
import {
  IDOL_SUB_CATEGORIES,
  JEWELLERY_SUB_CATEGORIES,
  NAVRATNA_SUB_CATEGORIES,
  RUDRAKSHA_SUB_CATEGORIES,
  UPRATNA_SUB_CATEGORIES,
} from '@/components/admin/product-form/kinds';
import { KNOWN_CATALOG_SUBCATEGORIES, KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';
import {
  productCategoryToStorefrontGroupSlug,
  storefrontSubcategoryHref,
  type StorefrontCategoryGroupSlug,
} from '@/lib/categories/storefront';

export type CatalogOrderSubcategory = { slug: string; label: string };

/** Canonical sub-categories per product `category` column. */
export const CATALOG_ORDER_SUBCATEGORIES: Record<string, CatalogOrderSubcategory[]> = {
  navaratna: [
    ...NAVRATNA_SUB_CATEGORIES.map((item) => ({ slug: item.value, label: item.label })),
    { slug: 'exclusive-gems', label: 'Exclusive Gems' },
  ],
  upratna: UPRATNA_SUB_CATEGORIES.map((item) => ({ slug: item.value, label: item.label })),
  rudraksha: RUDRAKSHA_SUB_CATEGORIES.map((item) => ({ slug: item.value, label: item.label })),
  idol: IDOL_SUB_CATEGORIES.map((item) => ({ slug: item.value, label: item.label })),
  jewelry: JEWELLERY_SUB_CATEGORIES.map((item) => ({ slug: item.value, label: item.label })),
  mala: [
    { slug: 'rudraksha-mala', label: 'Rudraksha Mala' },
    { slug: 'siddha-mala', label: 'Siddha Mala' },
    { slug: 'indrakshi-mala', label: 'Indrakshi Mala' },
    { slug: 'gemstone-mala', label: 'Gemstone Mala' },
  ],
  gemstone: [],
};

export const CATALOG_ORDER_CATEGORIES = CANONICAL_CATEGORY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function getCatalogOrderSubcategories(category: string): CatalogOrderSubcategory[] {
  const canonical = CATALOG_ORDER_SUBCATEGORIES[category] ?? [];
  const seen = new Set(canonical.map((item) => item.slug));
  const extras: CatalogOrderSubcategory[] = [];

  for (const [slug, meta] of Object.entries(KNOWN_GEM_SUBCATEGORIES)) {
    if (meta.category !== category || seen.has(slug)) continue;
    extras.push({ slug, label: meta.label });
    seen.add(slug);
  }

  for (const [slug, meta] of Object.entries(KNOWN_CATALOG_SUBCATEGORIES)) {
    if (meta.category !== category || seen.has(slug)) continue;
    extras.push({ slug, label: meta.label });
    seen.add(slug);
  }

  return [...canonical, ...extras.sort((a, b) => a.label.localeCompare(b.label))];
}

export function resolveCatalogOrderPair(
  category: string,
  subCategory: string
): { label: string } | null {
  const match = getCatalogOrderSubcategories(category).find((item) => item.slug === subCategory);
  if (match) return { label: match.label };

  const gem = KNOWN_GEM_SUBCATEGORIES[subCategory];
  if (gem && gem.category === category) return { label: gem.label };

  const catalog = KNOWN_CATALOG_SUBCATEGORIES[subCategory];
  if (catalog && catalog.category === category) return { label: catalog.label };

  return null;
}

export function catalogOrderStorefrontHref(category: string, subCategory: string) {
  const groupSlug = productCategoryToStorefrontGroupSlug(category);
  if (!groupSlug || groupSlug === 'gemstones') {
    return `/shop/${category}/${subCategory}`;
  }
  return storefrontSubcategoryHref(groupSlug as StorefrontCategoryGroupSlug, subCategory);
}

/** Move item from `fromIndex` to 1-based `targetPosition`, shifting others. */
export function reorderWithInsertAt<T>(list: T[], fromIndex: number, targetPosition: number): T[] {
  if (list.length === 0) return list;
  const clampedPosition = Math.max(1, Math.min(list.length, Math.floor(targetPosition)));
  const toIndex = clampedPosition - 1;
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= list.length) return list;

  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
