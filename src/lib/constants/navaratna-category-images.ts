/** Local nav/menu thumbnails — fast first paint for mega-menu and mobile nav. */
export const NAVARATNA_NAV_IMAGE_BY_SLUG: Record<string, string> = {
  ruby: '/home/navratnaimg/stone1.webp',
  pearl: '/home/navratnaimg/stone2.webp',
  'blue-sapphire': '/home/navratnaimg/stone3.webp',
  emerald: '/home/navratnaimg/stone4.webp',
  'yellow-sapphire': '/home/navratnaimg/stone5.webp',
  diamond: '/home/navratnaimg/stone6.webp',
  'white-sapphire': '/home/navratnaimg/stone6.webp',
  'red-coral': '/home/navratnaimg/stone7.webp',
  hessonite: '/home/navratnaimg/stone8.webp',
  'cats-eye': '/home/navratnaimg/stone9.webp',
  pitambari: '/home/upratna-cards/pitambari.webp',
};

export function navaratnaNavImage(slug: string): string | null {
  return NAVARATNA_NAV_IMAGE_BY_SLUG[slug] ?? null;
}

/** Hub hero — keep-local so proxy does not send it to the offloaded navratnaimg bucket. */
export const NAVARATNA_SET_HERO = '/home/hero/navaratna-set.png';
