export type HomeService = {
  slug: string;
  title: string;
  imageAlt: string;
  href: string;
};

export const HOME_SERVICES: HomeService[] = [
  {
    slug: 'horoscope-consultation',
    title:
      'Online Live/Telephonic Chat Horoscope Consultation by Genuine Astrologers',
    imageAlt: 'Online live and telephonic horoscope consultation',
    href: '#gem-recommendation',
  },
  {
    slug: 'astro-jewellery',
    title:
      'Making Gemstones/Rudrakshas into Effective/Authentic Astro-Rashi Jewellery',
    imageAlt: 'Custom astro-rashi gemstone and rudraksha jewellery',
    href: '/configure',
  },
  {
    slug: 'gem-energization',
    title:
      "Energizing the Gemstones/Rudrakshas According to one's Gotras/Rashi, as Authentic Ancient Rituals (Live / Recording Available)",
    imageAlt: 'Vedic gemstone and rudraksha energization rituals',
    href: '/knowledge/energized-gems',
  },
  {
    slug: 'cod-shipping',
    title:
      'COD Service in Delhi-NCR Area/World Wide Safe & Insured Shipping available',
    imageAlt: 'COD in Delhi-NCR and worldwide insured shipping',
    href: '/policies/shipping',
  },
  {
    slug: 'vedic-remedies',
    title:
      'Ancient Genuine Vedic Remedies – Mantra, Yagya, Yantra, Rudraksha & Ratna Dharana',
    imageAlt: 'Ancient Vedic remedies including mantra, yagya and yantra',
    href: '/vedic-yagyas-service',
  },
  {
    slug: 'retail-store',
    title:
      'Online and Offline (Retail Store / Vedic Gems, Rudrakshas and Yagyas research and energizing centre) Gemstones and Rudrakshas Selling',
    imageAlt: 'Online and offline gemstone and rudraksha retail store',
    href: '/gemstones',
  },
];

/** Bump when replacing files under public/home/ourservicesimg/ */
export const HOME_SERVICE_IMAGE_VERSION = '20260611';

export function homeServiceImageSrc(slug: string): string {
  return `/home/ourservicesimg/${slug}.webp?v=${HOME_SERVICE_IMAGE_VERSION}`;
}
