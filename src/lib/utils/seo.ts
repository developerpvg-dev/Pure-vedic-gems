import type { Metadata } from 'next';
import type { Product, ProductCard } from '@/lib/types/product';
import {
  productOfferAvailability,
  productStructuredOfferPrice,
} from '@/lib/shop/product-pricing';
import { gemProductMeta, stripPriceFromTitle, vedicNameFromSlug } from '@/lib/seo/storefront-meta';
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
] as const;

function cleanSeoText(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const truncated = value.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : value.slice(0, maxLength)).trim();
}

export function fitTitle(value: string, maxLength = 60) {
  const title = cleanSeoText(value);
  if (title.length <= maxLength) return title;

  const brandSuffix = ` | ${BRAND_NAME}`;
  if (title.endsWith(brandSuffix) && brandSuffix.length < maxLength) {
    return `${truncateAtWord(title.slice(0, -brandSuffix.length), maxLength - brandSuffix.length)}${brandSuffix}`;
  }

  return truncateAtWord(title, maxLength);
}

export function fitDescription(value: string, maxLength = 160) {
  return truncateAtWord(cleanSeoText(value), maxLength);
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

  if (cmsTitle) {
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

export function organizationJsonLd(): JsonLd {
  const siteUrl = getSiteUrl();
  const logo = brandLogoUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
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
    merchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      name: 'Return Policy',
      url: `${siteUrl}/policies/returns`,
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 15,
      returnMethod: 'https://schema.org/ReturnByMail',
    },
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

export function productJsonLd(product: Product | ProductCard, path: string): JsonLd {
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

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: formatProductDisplayName(product.name),
    sku: product.sku,
    image: product.thumbnail_url ? [absoluteUrl(product.thumbnail_url)] : undefined,
    brand: { '@type': 'Brand', name: BRAND_NAME },
    category: product.category,
    description: productDescription(product),
    url: absoluteUrl(path),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(path),
      priceCurrency: (product as Product).currency || 'INR',
      price: structuredPrice,
      availability,
      itemCondition: 'https://schema.org/NewCondition',
    },
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