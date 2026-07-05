import { KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';

import { RUDRAKSHA_CONFIGURATOR_ENABLED } from '@/lib/utils/rudraksha-configurator';

const CONFIGURATOR_GEM_CATEGORIES = new Set(['navaratna', 'upratna', 'uparatna']);

/** Navaratna, Uparatna, and Rudraksha beads can be configured into jewellery. */
export function isGemConfiguratorEnabled(
  category?: string | null,
  configuratorEnabled?: boolean | null,
): boolean {
  const normalized = category?.toLowerCase().trim();
  if (normalized && CONFIGURATOR_GEM_CATEGORIES.has(normalized)) {
    return true;
  }
  if (RUDRAKSHA_CONFIGURATOR_ENABLED && normalized === 'rudraksha') {
    return true;
  }
  return Boolean(configuratorEnabled);
}

/** Rudraksha configurator bead browse — list like shop, not in-stock-only gem picks. */
export function isRudrakshaConfiguratorBrowseScope(
  category?: string | null,
  configuratorEnabled?: boolean,
): boolean {
  return (
    RUDRAKSHA_CONFIGURATOR_ENABLED &&
    Boolean(configuratorEnabled) &&
    category?.toLowerCase().trim() === 'rudraksha'
  );
}

/** Gem / Rudraksha catalog picks list like the shop, not only flagged SKUs. */
export function isConfiguratorGemCatalogScope(
  category?: string | null,
  subCategory?: string | null,
): boolean {
  const normalizedCategory = category?.toLowerCase().trim();
  const normalizedSubCategory = subCategory?.toLowerCase().trim();

  if (normalizedCategory && CONFIGURATOR_GEM_CATEGORIES.has(normalizedCategory)) {
    return true;
  }
  if (RUDRAKSHA_CONFIGURATOR_ENABLED && normalizedCategory === 'rudraksha') {
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
