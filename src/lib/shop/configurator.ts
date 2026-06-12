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
