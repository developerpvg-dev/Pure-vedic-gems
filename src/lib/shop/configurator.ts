import { KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';

const CONFIGURATOR_GEM_CATEGORIES = new Set(['navaratna', 'upratna', 'uparatna']);

/** Navaratna and Uparatna gemstones can always be configured into jewellery. */
export function isGemConfiguratorEnabled(
  category?: string | null,
  configuratorEnabled?: boolean | null,
): boolean {
  const normalized = category?.toLowerCase().trim();
  if (normalized && CONFIGURATOR_GEM_CATEGORIES.has(normalized)) {
    return true;
  }
  return Boolean(configuratorEnabled);
}

/** Gem catalog picks (navaratna / upratna) should list like the shop, not only flagged SKUs. */
export function isConfiguratorGemCatalogScope(
  category?: string | null,
  subCategory?: string | null,
): boolean {
  const normalizedCategory = category?.toLowerCase().trim();
  const normalizedSubCategory = subCategory?.toLowerCase().trim();

  if (normalizedCategory && CONFIGURATOR_GEM_CATEGORIES.has(normalizedCategory)) {
    return true;
  }
  if (normalizedSubCategory && normalizedSubCategory in KNOWN_GEM_SUBCATEGORIES) {
    return true;
  }
  if (normalizedCategory && normalizedCategory in KNOWN_GEM_SUBCATEGORIES) {
    return true;
  }
  return false;
}
