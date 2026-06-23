/** Local nav/menu thumbnails — optimized WebP cards in public/home/upratna-cards/ */
export const UPRATNA_CARDS_BASE = '/home/upratna-cards';

const card = (slug: string) => `${UPRATNA_CARDS_BASE}/${slug}.webp`;

export const UPRATNA_NAV_IMAGE_BY_SLUG: Record<string, string> = {
  opal: card('opal'),
  pitambari: card('pitambari'),
  turquoise: card('turquoise'),
  amethyst: card('amethyst'),
  moonstone: card('moonstone'),
  garnet: card('garnet'),
  peridot: card('peridot'),
  tanzanite: card('tanzanite'),
  'lapis-lazuli': card('lapis-lazuli'),
  citrine: card('citrine'),
  aquamarine: card('aquamarine'),
  'blue-topaz': card('blue-topaz'),
  'white-topaz': card('white-topaz'),
  zircon: card('zircon'),
  iolite: card('iolite'),
  diopside: card('diopside'),
  malachite: card('malachite'),
  'tiger-eye': card('tiger-eye'),
  kyanite: card('kyanite'),
  sunstone: card('sunstone'),
  hakik: card('hakik'),
  'rose-quartz': card('rose-quartz'),
  'white-coral': card('white-coral'),
};

export function upratnaNavImage(slug: string): string | null {
  return UPRATNA_NAV_IMAGE_BY_SLUG[slug] ?? null;
}
