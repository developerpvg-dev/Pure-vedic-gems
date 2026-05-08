import type { SanityImageSource } from '@sanity/image-url';

export interface SanitySlug {
  _type: 'slug';
  current: string;
}

export interface SanityAuthor {
  name: string;
  image?: SanityImageSource;
  bio?: string;
}

export interface SanityCategory {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
  postCount?: number;
}

export interface SanityBlogPost {
  _id: string;
  _type: 'blogPost';
  title: string;
  slug: SanitySlug;
  excerpt?: string;
  body?: unknown[]; // Portable Text blocks
  category?: SanityCategory;
  mainImage?: SanityImageSource;
  publishedAt: string;
  author?: SanityAuthor;
  estimatedReadingTime?: number;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: SanityImageSource;
}
