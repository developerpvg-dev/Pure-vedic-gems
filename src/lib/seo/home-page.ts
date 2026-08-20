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

/** Commercial homepage title: buy / natural / for sale, 30–60 chars. */
export const HOME_PAGE_TITLE = 'Buy Gemstones Online | Natural Gemstones for Sale';

export const HOME_PAGE_DESCRIPTION =
  'Buy gemstones online — natural gemstones and original loose gemstones for sale. Navaratna, Rudraksha, and Vedic jewellery at listed gemstone prices since 1937.';

export const HOME_PAGE_KEYWORDS = [
  'buy gemstones',
  'buy gemstones online',
  'natural gemstones',
  'loose gemstones',
  'gemstones for sale',
  'gemstone prices',
  'original rudraksha',
  'navaratna',
  'vedic jewellery',
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
      name: HOME_PAGE_TITLE,
      description: HOME_PAGE_DESCRIPTION,
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'en-IN',
      primaryImageOfPage: { '@type': 'ImageObject', url: absoluteUrl('/og-default.png') },
      mainEntity: { '@id': `${siteUrl}/#catalog` },
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
      name: 'Buy gemstones, natural gemstones, Rudraksha, and Vedic jewellery',
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
