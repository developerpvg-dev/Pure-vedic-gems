import type { Metadata } from 'next';
import type { Product, ProductCard } from '@/lib/types/product';

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
};

const DEFAULT_SITE_URL = 'https://purevedicgems.com';
const BRAND_NAME = 'PureVedicGems';
const DEFAULT_DESCRIPTION =
  'Certified natural Vedic gemstones, Rudraksha, and custom jewelry from a trusted heritage brand established in 1937.';

function productDescription(product: Product | ProductCard) {
  const detailedProduct = product as Product;
  return detailedProduct.short_desc || detailedProduct.clean_description || `${product.name} from ${BRAND_NAME}.`;
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

export function buildMetadata({ title, description, path = '/', image, type = 'website', noIndex = false }: MetadataInput): Metadata {
  const canonical = canonicalUrl(path);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl('/PVG NEW LOGO DESIGN.PNG');

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type,
      url: canonical,
      siteName: BRAND_NAME,
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function productMetadata(product: Product | ProductCard, path: string): Metadata {
  const gemDetails = [product.carat_weight ? `${product.carat_weight} carat` : null, product.origin, product.planet]
    .filter(Boolean)
    .join(' ');
  const title = `${product.name}${gemDetails ? ` - ${gemDetails}` : ''} | ${BRAND_NAME}`;
  const description =
    productDescription(product) ||
    `Shop ${product.name}${gemDetails ? ` (${gemDetails})` : ''} from ${BRAND_NAME}. Certified gemstone details, pricing, and expert guidance.`;

  return buildMetadata({ title, description, path, image: product.thumbnail_url });
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    alternateName: 'Pure Vedic Gems',
    url: siteUrl,
    logo: absoluteUrl('/PVG NEW LOGO DESIGN.PNG'),
    foundingDate: '1937',
    sameAs: [
      'https://www.instagram.com/purevedicgems',
      'https://www.facebook.com/purevedicgems',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        areaServed: ['IN', 'GB'],
        availableLanguage: ['en', 'hi'],
      },
    ],
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
  const availability = product.in_stock === false || product.availability_status === 'out_of_stock'
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    image: product.thumbnail_url ? [absoluteUrl(product.thumbnail_url)] : undefined,
    brand: { '@type': 'Brand', name: BRAND_NAME },
    category: product.category,
    description: productDescription(product),
    url: absoluteUrl(path),
    offers: typeof product.price === 'number'
      ? {
          '@type': 'Offer',
          url: absoluteUrl(path),
          priceCurrency: (product as Product).currency || 'INR',
          price: product.price,
          availability,
          itemCondition: 'https://schema.org/NewCondition',
        }
      : undefined,
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
    publisher: { '@type': 'Organization', name: BRAND_NAME, url: getSiteUrl() },
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
    image: input.image ? absoluteUrl(input.image) : absoluteUrl('/PVG NEW LOGO DESIGN.PNG'),
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