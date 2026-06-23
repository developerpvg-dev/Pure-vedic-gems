/** Canonical Rudraksha storefront subcategories (legacy site order). */
export const RUDRAKSHA_MUKHI_SLUGS = Array.from({ length: 21 }, (_, index) => `${index + 1}-mukhi`);

export const RUDRAKSHA_SPECIAL_SLUGS = [
  'gauri-shankar',
  'ganesh-rudraksha',
  'nir-mukhi',
  'garbh-gauri',
  'sawar-rudraksha',
] as const;

export type RudrakshaSpecialSlug = (typeof RUDRAKSHA_SPECIAL_SLUGS)[number];

export const RUDRAKSHA_STOREFRONT_SLUGS = [...RUDRAKSHA_MUKHI_SLUGS, ...RUDRAKSHA_SPECIAL_SLUGS] as const;

export const RUDRAKSHA_SUBCATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(RUDRAKSHA_MUKHI_SLUGS.map((slug) => {
    const n = slug.replace('-mukhi', '');
    return [slug, `${n} Mukhi Rudraksha`];
  })),
  'gauri-shankar': 'Gauri Shankar Rudrakshas',
  'ganesh-rudraksha': 'Ganesh Rudrakshas',
  'nir-mukhi': 'Nir Mukhi Rudraksha',
  'garbh-gauri': 'Garbh Gauri',
  'sawar-rudraksha': 'Sawar Rudraksha',
};

export function isRudrakshaMukhiSlug(slug: string) {
  return /^\d+-mukhi$/.test(slug);
}

export function rudrakshaMukhiSortOrder(slug: string) {
  return Number.parseInt(slug, 10) || 0;
}

const RUDRAKSHA_SPECIAL_SORT_ORDER: Record<string, number> = {
  'gauri-shankar': 22,
  'ganesh-rudraksha': 23,
  'nir-mukhi': 24,
  'garbh-gauri': 25,
  'sawar-rudraksha': 26,
};

export function rudrakshaStorefrontSortOrder(slug: string) {
  if (isRudrakshaMukhiSlug(slug)) return rudrakshaMukhiSortOrder(slug);
  return RUDRAKSHA_SPECIAL_SORT_ORDER[slug] ?? 999;
}

export function isRudrakshaStorefrontSlug(slug: string) {
  return isRudrakshaMukhiSlug(slug) || (RUDRAKSHA_SPECIAL_SLUGS as readonly string[]).includes(slug);
}

export function rudrakshaSubcategoryLabel(slug: string) {
  return RUDRAKSHA_SUBCATEGORY_LABELS[slug] ?? slug.replace(/-/g, ' ');
}

/** Fixed homepage Rudraksha grid: row 1 = 1–6 Mukhi, row 2 = 10–15 Mukhi. */
export const RUDRAKSHA_HOME_GRID_SLUGS = [
  '1-mukhi',
  '2-mukhi',
  '3-mukhi',
  '4-mukhi',
  '5-mukhi',
  '6-mukhi',
  '10-mukhi',
  '11-mukhi',
  '12-mukhi',
  '13-mukhi',
  '14-mukhi',
  '15-mukhi',
] as const;

export const RUDRAKSHA_HOME_GRID_LIMIT = 12;

/** @deprecated Use RUDRAKSHA_HOME_GRID_SLUGS */
export const RUDRAKSHA_HOME_DISPLAY_SLUGS = RUDRAKSHA_HOME_GRID_SLUGS;

export function isRudrakshaHomeGridSlug(slug: string) {
  return (RUDRAKSHA_HOME_GRID_SLUGS as readonly string[]).includes(slug);
}

export type RudrakshaHomeGridCategory = {
  slug: string;
  name: string;
  featured_on_homepage?: boolean | null;
  image_url?: string | null;
  hover_image_url?: string | null;
  display_locations?: string | null;
  is_rare?: boolean | null;
  sort_order?: number;
};

/** Picks up to 12 homepage Rudraksha cards in legacy grid order, respecting admin visibility. */
export function pickRudrakshaHomeGridCategories<T extends RudrakshaHomeGridCategory>(
  items: T[],
  fallbackBySlug: Map<string, T>,
): T[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const picked: T[] = [];

  for (const slug of RUDRAKSHA_HOME_GRID_SLUGS) {
    const item = bySlug.get(slug) ?? fallbackBySlug.get(slug);
    const featured = item?.featured_on_homepage ?? true;
    if (!featured) continue;
    if (item) {
      picked.push(item);
    }
    if (picked.length >= RUDRAKSHA_HOME_GRID_LIMIT) break;
  }

  return picked.slice(0, RUDRAKSHA_HOME_GRID_LIMIT);
}

/** Homepage grid: legacy second-row categories (13–15 mukhi + special forms). */
export const RUDRAKSHA_HOME_HIGHLIGHT_SLUGS = [
  '13-mukhi',
  '14-mukhi',
  '15-mukhi',
  'gauri-shankar',
  'ganesh-rudraksha',
  'nir-mukhi',
  'garbh-gauri',
  'sawar-rudraksha',
] as const;
