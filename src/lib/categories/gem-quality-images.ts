import type { HomeManagedCategory } from '@/components/home/PvgManagedCategorySections';

/** Gem quality guide slug → Navaratna category slug in admin (`gem_categories`). */
export const GEM_QUALITY_TO_NAVARATNA_SLUG: Record<string, string> = {
  ruby: 'ruby',
  pearl: 'pearl',
  'red-coral': 'red-coral',
  emerald: 'emerald',
  'yellow-sapphire': 'yellow-sapphire',
  'blue-sapphire': 'blue-sapphire',
  hessonite: 'hessonite',
  catseye: 'cats-eye',
  'white-sapphire': 'white-sapphire',
};

const NAVARATNA_STONE_FALLBACK: Record<string, string> = {
  ruby: '/home/navratnaimg/stone1.webp',
  pearl: '/home/navratnaimg/stone2.webp',
  'red-coral': '/home/navratnaimg/stone7.webp',
  emerald: '/home/navratnaimg/stone4.webp',
  'yellow-sapphire': '/home/navratnaimg/stone5.webp',
  'blue-sapphire': '/home/navratnaimg/stone3.webp',
  hessonite: '/home/navratnaimg/stone8.webp',
  'cats-eye': '/home/navratnaimg/stone9.webp',
  'white-sapphire': '/home/navratnaimg/stone6.webp',
};

export function gemQualityCardImage(
  gemSlug: string,
  navaratnaCategories: HomeManagedCategory[],
  heroFallback: string,
): string {
  const navSlug = GEM_QUALITY_TO_NAVARATNA_SLUG[gemSlug];
  if (!navSlug) return heroFallback;
  const category = navaratnaCategories.find((item) => item.slug === navSlug);
  return category?.image_url ?? NAVARATNA_STONE_FALLBACK[navSlug] ?? heroFallback;
}
