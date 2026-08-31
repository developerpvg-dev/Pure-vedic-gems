import type { Metadata } from 'next';
import type { Product, ProductCard } from '@/lib/types/product';
import {
  productOfferAvailability,
  productStructuredOfferPrice,
} from '@/lib/shop/product-pricing';
import {
  gemProductMeta,
  isStaleMarketingTitle,
  stripPriceFromTitle,
  vedicNameFromSlug,
} from '@/lib/seo/storefront-meta';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { ORGANIZATION_ADDRESSES } from '@/lib/constants/company-addresses';

export type JsonLd = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  href: string;
};

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string[];
};

const DEFAULT_SITE_URL = 'https://www.purevedicgems.com';
const BRAND_NAME = 'PureVedicGems';
const DEFAULT_DESCRIPTION =
  'Certified natural Vedic gemstones, Rudraksha, and custom jewelry from a trusted heritage brand established in 1937.';
/** URL-safe brand mark (Google Organization logo + share fallback). */
const BRAND_LOGO_PATH = '/pvg-logo.png';
/** 1200×630 default share card. */
const DEFAULT_OG_IMAGE_PATH = '/og-default.png';
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'purevedicgems@gmail.com';
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91-9871582404';
const OFFICIAL_SAME_AS = [
  'https://www.facebook.com/puregems.vm',
  'https://www.instagram.com/purevedicgems',
  'https://www.youtube.com/@purevedicgems',
  'https://twitter.com/PurevedicGems',
  'https://www.linkedin.com/company/pure-vedic-gems',
] as const;

function cleanSeoText(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function fitTitle(value: string) {
  return cleanSeoText(value);
}

export function fitDescription(value: string) {
  return cleanSeoText(value);
}

function productDescription(product: Product | ProductCard) {
  const detailedProduct = product as Product;
  return detailedProduct.short_desc || detailedProduct.clean_description || `${formatProductDisplayName(product.name)} from ${BRAND_NAME}.`;
}

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return url.replace(/\/$/, '');
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function canonicalUrl(path = '/') {
  return absoluteUrl(path.split('?')[0] || '/');
}

export function brandLogoUrl() {
  return absoluteUrl(BRAND_LOGO_PATH);
}

export function defaultOgImageUrl() {
  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

export function buildMetadata({ title, description, path = '/', image, type = 'website', noIndex = false, keywords }: MetadataInput): Metadata {
  const canonical = canonicalUrl(path);
  const ogImage = image ? absoluteUrl(image) : defaultOgImageUrl();
  const seoTitle = fitTitle(title);
  const seoDescription = fitDescription(description);

  return {
    title: { absolute: seoTitle },
    description: seoDescription,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type,
      url: canonical,
      siteName: BRAND_NAME,
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@PurevedicGems',
      title: seoTitle,
      description: seoDescription,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

function isGemOrRudrakshaSku(product: Product | ProductCard) {
  const cat = (product.category || '').toLowerCase();
  if (cat === 'jewelry' || cat === 'jewellery' || cat === 'idol' || cat === 'mala' || cat === 'malas') return false;
  const type = 'product_type' in product ? product.product_type : undefined;
  if (type === 'jewelry' || type === 'idol' || type === 'mala') return false;
  return (
    cat === 'navaratna' ||
    cat === 'upratna' ||
    cat === 'uparatna' ||
    cat === 'rudraksha' ||
    cat === 'gemstone' ||
    type === 'gemstone' ||
    type === 'rudraksha'
  );
}

export function productMetadata(
  product: Product | ProductCard,
  path: string,
  overrides?: { title?: string | null; description?: string | null; image?: string | null },
): Metadata {
  const displayName = formatProductDisplayName(product.name);
  const detailedProduct = product as Product;
  const gemDetails = [
    product.carat_weight ? `${product.carat_weight} carat` : null,
    product.origin,
    product.planet,
    detailedProduct.sku ? `SKU ${detailedProduct.sku}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const cmsTitle = overrides?.title?.trim();
  const cmsDescription = overrides?.description?.trim();
  let title: string;
  let description: string;

  const useCmsTitle = cmsTitle && !isStaleMarketingTitle(cmsTitle);
  if (useCmsTitle) {
    title = stripPriceFromTitle(cmsTitle);
    description = cmsDescription || productDescription(product);
  } else if (isGemOrRudrakshaSku(product)) {
    const meta = gemProductMeta({
      name: displayName,
      origin: product.origin,
      carat: product.carat_weight,
      sizeMm: detailedProduct.bead_size_mm,
      vedicName: vedicNameFromSlug(product.sub_category),
      category: product.category,
      treatment: product.treatment,
      certification: product.certification,
      certificateLab: detailedProduct.certificate_lab,
    });
    title = meta.title;
    description = cmsDescription || meta.description;
  } else {
    title = `${displayName}${gemDetails ? ` - ${gemDetails}` : ''} | ${BRAND_NAME}`;
    description =
      cmsDescription ||
      productDescription(product) ||
      `Shop ${displayName}${gemDetails ? ` (${gemDetails})` : ''} from ${BRAND_NAME}. Certified gemstone details, pricing, and expert guidance.`;
  }

  return buildMetadata({ title, description, path, image: overrides?.image ?? product.thumbnail_url });
}

export function categoryMetadata({ title, description, path, image }: MetadataInput): Metadata {
  return buildMetadata({ title, description, path, image });
}

export function blogMetadata({ title, description, path, image }: MetadataInput): Metadata {
  return buildMetadata({ title, description, path, image, type: 'article' });
}

export function knowledgeMetadata({ title, description, path, image }: MetadataInput): Metadata {
  return buildMetadata({ title, description, path, image, type: 'article' });
}

/** Shared @id so Product Offers can point at the org return policy. */
export function merchantReturnPolicyJsonLd(): JsonLd {
  const siteUrl = getSiteUrl();
  return {
    '@type': 'MerchantReturnPolicy',
    '@id': `${siteUrl}/policies/returns#policy`,
    name: 'Return Policy',
    url: `${siteUrl}/policies/returns`,
    applicableCountry: ['IN', 'GB', 'AE'],
    returnPolicyCountry: 'IN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 15,
    returnMethod: 'https://schema.org/ReturnByMail',
    // ponytail: policy page says customer pays return shipping
    returnFees: 'https://schema.org/ReturnShippingFees',
    refundType: 'https://schema.org/FullRefund',
  };
}

/** Matches /policies/shipping — paid domestic (not free delivery). */
function merchantShippingServicesJsonLd(): JsonLd[] {
  const siteUrl = getSiteUrl();
  const origin = {
    '@type': 'DefinedRegion',
    addressCountry: 'IN',
  };
  return [
    {
      '@type': 'ShippingService',
      '@id': `${siteUrl}/policies/shipping#india`,
      name: 'India Post Speed Post',
      description: 'Domestic shipping for orders up to ₹25,000',
      fulfillmentType: 'https://schema.org/FulfillmentTypeDelivery',
      shippingConditions: [
        {
          '@type': 'ShippingConditions',
          shippingOrigin: origin,
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '200',
            currency: 'INR',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 6,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      ],
    },
    {
      '@type': 'ShippingService',
      '@id': `${siteUrl}/policies/shipping#international`,
      name: 'International EMS / courier',
      description: 'Tracked international shipping',
      fulfillmentType: 'https://schema.org/FulfillmentTypeDelivery',
      shippingConditions: [
        {
          '@type': 'ShippingConditions',
          shippingOrigin: origin,
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: '2500',
            currency: 'INR',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 12,
            maxValue: 15,
            unitCode: 'DAY',
          },
        },
      ],
    },
  ];
}

/** Offer-level shipping for merchant listings (India primary). */
function productOfferShippingDetailsJsonLd(): JsonLd {
  const siteUrl = getSiteUrl();
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: '200',
      currency: 'INR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'IN',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 3,
        maxValue: 7,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 6,
        maxValue: 7,
        unitCode: 'DAY',
      },
    },
    hasShippingService: { '@id': `${siteUrl}/policies/shipping#india` },
  };
}

export function organizationJsonLd(): JsonLd {
  const siteUrl = getSiteUrl();
  const logo = brandLogoUrl();
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    '@id': `${siteUrl}/#organization`,
    name: BRAND_NAME,
    alternateName: ['Pure Vedic Gems', 'PureVedic Gems'],
    legalName: 'PURE VEDIC GEMS PVT. LTD.',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: logo,
      width: 512,
      height: 512,
    },
    image: [logo, defaultOgImageUrl()],
    foundingDate: '1937',
    email: SUPPORT_EMAIL,
    telephone: SUPPORT_PHONE,
    address: ORGANIZATION_ADDRESSES,
    sameAs: [...OFFICIAL_SAME_AS],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: SUPPORT_PHONE,
        email: SUPPORT_EMAIL,
        areaServed: ['IN', 'GB', 'AE'],
        availableLanguage: ['en', 'hi'],
      },
    ],
    hasMerchantReturnPolicy: merchantReturnPolicyJsonLd(),
    hasShippingService: merchantShippingServicesJsonLd(),
  };
}

/** Sitename + Google sitelinks search box (matches shop ?q= search). */
export function websiteJsonLd(): JsonLd {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: BRAND_NAME,
    alternateName: 'Pure Vedic Gems',
    url: siteUrl,
    inLanguage: 'en-IN',
    publisher: { '@id': `${siteUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>): JsonLd | null {
  if (faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** Minimal review shape for AggregateRating / Review JSON-LD (avoid importing client components). */
export type ProductReviewJsonLdInput = {
  customer_name: string;
  rating: number | null;
  title?: string | null;
  review_text?: string | null;
  created_at: string;
};

export function productJsonLd(
  product: Product | ProductCard,
  path: string,
  options?: {
    images?: string[];
    displayName?: string;
    reviews?: ProductReviewJsonLdInput[];
  },
): JsonLd {
  const pricing = {
    price: product.price,
    price_per_carat: product.price_per_carat,
    carat_weight: product.carat_weight,
    price_mode: product.price_mode,
    in_stock: product.in_stock,
    stock_quantity: product.stock_quantity,
    availability_status: product.availability_status,
    sold_individually: product.sold_individually,
  };
  const availability = productOfferAvailability(pricing);
  const structuredPrice = productStructuredOfferPrice(pricing);
  const siteUrl = getSiteUrl();
  const offerUrl = absoluteUrl(path);

  const imageUrls = (options?.images?.length
    ? options.images
    : product.thumbnail_url
      ? [product.thumbnail_url]
      : []
  )
    .map((url) => absoluteUrl(url))
    .filter(Boolean);

  const ratedReviews = (options?.reviews ?? []).filter(
    (review): review is ProductReviewJsonLdInput & { rating: number } =>
      typeof review.rating === 'number' && review.rating >= 1 && review.rating <= 5,
  );
  const averageRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, review) => sum + review.rating, 0) / ratedReviews.length
      : null;

  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: options?.displayName || formatProductDisplayName(product.name),
    sku: product.sku,
    image: imageUrls.length > 0 ? imageUrls : undefined,
    brand: { '@type': 'Brand', name: BRAND_NAME },
    category: product.category,
    description: productDescription(product),
    url: offerUrl,
    offers: {
      '@type': 'Offer',
      url: offerUrl,
      priceCurrency: (product as Product).currency || 'INR',
      price: structuredPrice,
      priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND_NAME, '@id': `${siteUrl}/#organization` },
      hasMerchantReturnPolicy: { '@id': `${siteUrl}/policies/returns#policy` },
      shippingDetails: productOfferShippingDetailsJsonLd(),
    },
    ...(averageRating != null
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Math.round(averageRating * 10) / 10,
            reviewCount: ratedReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          // Cap Review nodes — AggregateRating already covers the star count
          review: ratedReviews.slice(0, 5).map((review) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: review.customer_name || 'Customer' },
            datePublished: review.created_at.slice(0, 10),
            reviewBody: review.review_text || undefined,
            name: review.title || undefined,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
  };
}

export function articleJsonLd(input: {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description || DEFAULT_DESCRIPTION,
    image: input.image ? absoluteUrl(input.image) : undefined,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt || input.publishedAt,
    author: input.authorName
      ? { '@type': 'Person', name: input.authorName }
      : { '@type': 'Organization', name: BRAND_NAME },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      url: getSiteUrl(),
      logo: { '@type': 'ImageObject', url: brandLogoUrl() },
    },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}

export function collectionPageJsonLd(input: {
  title: string;
  description: string;
  path: string;
  items?: Array<{ name: string; href: string }>;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    hasPart: input.items?.map((item) => ({
      '@type': 'WebPage',
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}

export function itemListJsonLd(items: Array<{ name: string; href: string; position?: number }>): JsonLd | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position ?? index + 1,
      name: item.name,
      url: absoluteUrl(item.href),
    })),
  };
}

export function howToJsonLd(input: { name: string; description: string; steps: string[]; path: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: step,
    })),
  };
}

export function serviceJsonLd(input: { name: string; description: string; path: string; provider?: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@type': 'Organization', name: input.provider || BRAND_NAME, url: getSiteUrl() },
  };
}

export function localBusinessJsonLd(input: {
  name: string;
  address: string;
  path: string;
  phone?: string;
  image?: string | null;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: input.name,
    url: absoluteUrl(input.path),
    image: input.image ? absoluteUrl(input.image) : brandLogoUrl(),
    telephone: input.phone,
    address: input.address,
  };
}

export function personJsonLd(input: { name: string; title?: string; description?: string; image?: string | null; path?: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    jobTitle: input.title,
    description: input.description,
    image: input.image ? absoluteUrl(input.image) : undefined,
    url: input.path ? absoluteUrl(input.path) : undefined,
  };
}