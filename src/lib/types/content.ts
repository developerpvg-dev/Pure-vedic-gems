import type { SanityImageSource } from '@sanity/image-url';
import type { SanitySlug } from './blog';

export interface PortableTextSpan {
  _type: 'span';
  _key?: string;
  text?: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _type: 'block';
  _key?: string;
  style?: string;
  children?: PortableTextSpan[];
  markDefs?: Array<Record<string, unknown>>;
}

export interface SanityReferencePerson {
  name: string;
  image?: SanityImageSource;
  photo?: SanityImageSource;
  bio?: string;
  title?: string;
}

export interface KnowledgeFaq {
  question: string;
  answer: string;
}

export interface SanityKnowledgeArticle {
  _id: string;
  _type?: 'knowledgeArticle';
  title: string;
  slug: SanitySlug;
  category: string;
  excerpt?: string;
  mainImage?: SanityImageSource | string;
  body?: PortableTextBlock[];
  faqs?: KnowledgeFaq[];
  author?: SanityReferencePerson;
  featured?: boolean;
  publishedAt?: string;
  updatedAt?: string;
  estimatedReadingTime?: number;
  relatedProductCategoryHref?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: SanityImageSource;
}

export interface SanityStoreLocation {
  _id: string;
  title: string;
  slug?: SanitySlug;
  image?: SanityImageSource | string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  mapUrl?: string;
  hours?: Array<{ day?: string; time?: string }>;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface SanityTestimonial {
  _id: string;
  name: string;
  location?: string;
  rating?: number;
  quote: string;
  productContext?: string;
  isFeatured?: boolean;
}

export interface SanityExpertProfile {
  _id: string;
  name: string;
  title?: string;
  specialty?: string;
  photo?: SanityImageSource | string;
  bio?: string;
  personalQuote?: string;
  credentials?: string[];
  languages?: string[];
  yearsExperience?: number;
}