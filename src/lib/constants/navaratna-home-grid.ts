/** Legacy homepage Navaratna grid order (includes Pitambari after the nine classics). */
export const NAVARATNA_HOME_GRID_SLUGS = [
  'ruby',
  'pearl',
  'red-coral',
  'emerald',
  'yellow-sapphire',
  'white-sapphire',
  'blue-sapphire',
  'hessonite',
  'cats-eye',
  'pitambari',
] as const;

export const NAVARATNA_HOME_GRID_LIMIT = NAVARATNA_HOME_GRID_SLUGS.length;

export type NavaratnaHomeGridCategory = {
  slug: string;
  name: string;
  featured_on_homepage?: boolean | null;
  sort_order?: number;
};

/** Picks homepage Navaratna cards in legacy grid order, respecting admin visibility. */
export function pickNavaratnaHomeGridCategories<T extends NavaratnaHomeGridCategory>(
  items: T[],
  fallbackBySlug: Map<string, T>,
): T[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const picked: T[] = [];

  for (const slug of NAVARATNA_HOME_GRID_SLUGS) {
    const item = bySlug.get(slug) ?? fallbackBySlug.get(slug);
    const featured = item?.featured_on_homepage ?? true;
    if (!featured) continue;
    if (item) picked.push(item);
    if (picked.length >= NAVARATNA_HOME_GRID_LIMIT) break;
  }

  return picked.slice(0, NAVARATNA_HOME_GRID_LIMIT);
}
