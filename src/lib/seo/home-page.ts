import {
  canonicalGroupHref,
  canonicalSubcategoryHref,
  NAVARATNA_STOREFRONT_SLUGS,
  UPRATNA_STOREFRONT_SLUGS,
} from '@/lib/categories/canonical-storefront-path';
import { KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';
import {
  DELHI_MAP_URL,
  DELHI_SHOWROOM_HOURS,
  ORGANIZATION_ADDRESSES,
} from '@/lib/constants/company-addresses';
import { RUDRAKSHA_STOREFRONT_SLUGS, RUDRAKSHA_SUBCATEGORY_LABELS } from '@/lib/constants/rudraksha-subcategories';
import { gemEnglishName } from '@/lib/seo/storefront-meta';
import { absoluteUrl, brandLogoUrl, getSiteUrl, itemListJsonLd, type JsonLd } from '@/lib/utils/seo';

/** Homepage title (45–60 chars). Brand suffix matches live site name. */
export const HOME_PAGE_TITLE = 'Buy Certified Vedic Gemstones Online India | PureVedicGems';

export const HOME_PAGE_DESCRIPTION =
  'Discover thoughtfully curated treasures from PureVedicGems. Explore the collection and find a meaningful piece to suit your style.';

export const HOME_PAGE_KEYWORDS = [
  'certified Vedic gemstones',
  'buy Vedic gemstones online India',
  'authentic Vedic gemstones',
  'planetary gemstones',
  'Rudraksha',
  'energized gemstones',
  'gemstone certification',
  'Vedic healing remedies',
  'buy gemstones online',
  'natural gemstones',
];

function gemLabel(slug: string) {
  return gemEnglishName(KNOWN_GEM_SUBCATEGORIES[slug]?.label ?? slug);
}

function offerItems(slugs: Iterable<string>, nameOf: (slug: string) => string) {
  return [...slugs].flatMap((slug) => {
    const href = canonicalSubcategoryHref(slug);
    return href ? [{ '@type': 'OfferCatalog', name: nameOf(slug), url: absoluteUrl(href) }] : [];
  });
}

/** ponytail: homepage-only graph. Layout already emits Organization + WebSite. */
export function homePageJsonLd(): JsonLd[] {
  const siteUrl = getSiteUrl();
  const collections = [
    { name: 'Navaratna Gems', href: canonicalGroupHref('navaratna') },
    { name: 'Upratna Gems', href: canonicalGroupHref('upratna') },
    { name: 'Original Rudraksha', href: canonicalGroupHref('rudraksha') },
    { name: 'Vedic Jewellery', href: '/shop/jewelry' },
    { name: 'Spiritual Idols', href: '/shop/idols' },
    { name: 'Rudraksha Malas', href: '/shop/malas' },
  ];

  const itemList = itemListJsonLd(collections);
  const sitePhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91-9871582404';
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${siteUrl}/#webpage`,
      url: siteUrl,
      name: 'Buy Certified Vedic Gemstones Online in India',
      headline: 'Buy Certified Vedic Gemstones Online in India',
      description: HOME_PAGE_DESCRIPTION,
      keywords: HOME_PAGE_KEYWORDS,
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#organization` },
      publisher: { '@id': `${siteUrl}/#organization` },
      mainEntity: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en-IN',
      primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl('/og-default.png') },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${siteUrl}/#vedic-gemstone-services`,
      name: 'Certified Vedic Gemstone and Healing Services',
      provider: { '@id': `${siteUrl}/#organization` },
      areaServed: { '@type': 'Place', name: 'India and international locations' },
      description:
        'Customized Vedic remedies using authenticated gemstones, Rudrakshas, crystals and Yantras, prepared according to traditional Vedic rituals and sacred geometry.',
      serviceType: [
        'Certified Vedic gemstone consultation',
        'Vedic gemstone sourcing',
        'Gemstone purification and energization',
        'Customized Vedic talisman preparation',
        'Rudraksha and Yantra remedies',
        'Vedic ritual and spiritual healing guidance',
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'JewelryStore',
      '@id': `${siteUrl}/#store`,
      name: 'PureVedicGems',
      image: brandLogoUrl(),
      url: siteUrl,
      telephone: sitePhone,
      address: ORGANIZATION_ADDRESSES[1],
      hasMap: DELHI_MAP_URL,
      openingHoursSpecification: [...DELHI_SHOWROOM_HOURS],
      parentOrganization: { '@id': `${siteUrl}/#organization` },
      hasOfferCatalog: { '@id': `${siteUrl}/#catalog` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      '@id': `${siteUrl}/#catalog`,
      name: 'Certified Vedic gemstones, Rudraksha, and Vedic jewellery',
      url: siteUrl,
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Navaratna Gems',
          url: absoluteUrl(canonicalGroupHref('navaratna')),
          itemListElement: offerItems(NAVARATNA_STOREFRONT_SLUGS, gemLabel),
        },
        {
          '@type': 'OfferCatalog',
          name: 'Upratna Gems',
          url: absoluteUrl(canonicalGroupHref('upratna')),
          itemListElement: offerItems(UPRATNA_STOREFRONT_SLUGS, gemLabel),
        },
        {
          '@type': 'OfferCatalog',
          name: 'Original Rudraksha',
          url: absoluteUrl(canonicalGroupHref('rudraksha')),
          itemListElement: offerItems(RUDRAKSHA_STOREFRONT_SLUGS, (slug) => RUDRAKSHA_SUBCATEGORY_LABELS[slug] ?? slug),
        },
        { '@type': 'OfferCatalog', name: 'Vedic Jewellery', url: absoluteUrl('/shop/jewelry') },
        { '@type': 'OfferCatalog', name: 'Spiritual Idols', url: absoluteUrl('/shop/idols') },
        { '@type': 'OfferCatalog', name: 'Rudraksha Malas', url: absoluteUrl('/shop/malas') },
      ],
    },
    ...(itemList ? [itemList] : []),
  ];
}
