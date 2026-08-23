import type { MetadataRoute } from 'next';
import { SEO_LANDING_PAGES } from '@/lib/constants/seo-landing-pages';
import { GEM_QUALITIES } from '@/lib/constants/gem-qualities';
import { getAllGeoGemLandingSlugs } from '@/lib/constants/geo-gem-landings';
import { NAVARATNA_GUIDES, RUDRAKSHA_GUIDES } from '@/lib/constants/static-knowledge-guides';
import { getAllBlogCategorySlugs, getAllBlogPostSlugs, getAllKnowledgeArticleSlugs } from '@/lib/sanity/queries';
import {
  catalogFamilyToStorefrontGroupSlug,
  normalizeStorefrontGroupSlug,
  productHref,
  storefrontGroupHref,
  storefrontSubcategoryHref,
} from '@/lib/categories/storefront';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { absoluteUrl, getSiteUrl } from '@/lib/utils/seo';
import { designHref } from '@/lib/designs/public';

// Regenerate at most hourly — search engine crawlers hitting the sitemap
// should not trigger fresh product/category/video queries every time.
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

const now = new Date();

function entry(path: string, options: Partial<SitemapEntry> = {}): SitemapEntry {
  return {
    url: absoluteUrl(path),
    lastModified: options.lastModified ?? now,
    changeFrequency: options.changeFrequency ?? 'weekly',
    priority: options.priority ?? 0.6,
  };
}

async function getProductEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('slug, category, updated_at, created_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(5000);

  if (error || !data) return [];

  return data
    .filter((product) => product.slug && product.category)
    .map((product) => entry(productHref(product), {
      lastModified: new Date(product.updated_at ?? product.created_at ?? Date.now()),
      changeFrequency: 'daily',
      priority: 0.74,
    }));
}

async function getVideoEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('videos')
    .select('slug, updated_at, created_at, published_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(2000);

  if (error || !data) return [];

  return data
    .filter((video) => video.slug)
    .map((video) => entry(`/videos/${encodeURIComponent(video.slug)}`, {
      lastModified: new Date(video.updated_at ?? video.published_at ?? video.created_at ?? Date.now()),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
}

async function getDesignEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('jewelry_designs')
    .select('name, setting_type, product_scope, created_at')
    .eq('is_active', true)
    .eq('is_custom', false)
    .order('sort_order', { ascending: true })
    .limit(500);

  if (error || !data) return [];

  const entries: MetadataRoute.Sitemap = [
    entry('/designs', { changeFrequency: 'weekly', priority: 0.7 }),
    entry('/designs/ring', { changeFrequency: 'weekly', priority: 0.68 }),
    entry('/designs/pendant', { changeFrequency: 'weekly', priority: 0.68 }),
    entry('/designs/bracelet', { changeFrequency: 'weekly', priority: 0.66 }),
    entry('/designs/rudraksha', { changeFrequency: 'weekly', priority: 0.66 }),
  ];

  for (const row of data) {
    const href = designHref(row);
    if (!href) continue;
    entries.push(
      entry(href, {
        lastModified: new Date(row.created_at ?? Date.now()),
        changeFrequency: 'monthly',
        priority: 0.55,
      })
    );
  }

  return entries;
}

async function getCategoryEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  const [gemCategories, productCategories] = await Promise.all([
    supabase
      .from('gem_categories')
      .select('slug, type, updated_at, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_categories')
      .select('slug, family, parent_id, updated_at, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  if (!gemCategories.error && gemCategories.data) {
    gemCategories.data.forEach((category) => {
      const groupSlug = normalizeStorefrontGroupSlug(category.type);
      if (!groupSlug || !category.slug) return;
      entries.push(entry(storefrontSubcategoryHref(groupSlug, category.slug), {
        lastModified: new Date(category.updated_at ?? category.created_at ?? Date.now()),
        changeFrequency: 'weekly',
        priority: 0.72,
      }));
    });
  }

  if (!productCategories.error && productCategories.data) {
    productCategories.data.forEach((category) => {
      const groupSlug = catalogFamilyToStorefrontGroupSlug(category.family);
      if (!groupSlug || !category.slug) return;
      const href = category.parent_id
        ? storefrontSubcategoryHref(groupSlug, category.slug)
        : storefrontGroupHref(groupSlug);
      entries.push(entry(href, {
        lastModified: new Date(category.updated_at ?? category.created_at ?? Date.now()),
        changeFrequency: 'weekly',
        priority: category.parent_id ? 0.7 : 0.82,
      }));
    });
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [
    blogSlugs,
    blogCategorySlugs,
    knowledgeSlugs,
    productEntries,
    categoryEntries,
    videoEntries,
    designEntries,
  ] = await Promise.all([
    getAllBlogPostSlugs(),
    getAllBlogCategorySlugs(),
    getAllKnowledgeArticleSlugs(),
    getProductEntries(),
    getCategoryEntries(),
    getVideoEntries(),
    getDesignEntries(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: getSiteUrl(),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    entry('/gemstones', { changeFrequency: 'daily', priority: 0.9 }),
    entry('/gemstones/navaratna', { changeFrequency: 'weekly', priority: 0.88 }),
    entry('/gemstones/upratna', { changeFrequency: 'weekly', priority: 0.84 }),
    entry('/rudraksha', { changeFrequency: 'weekly', priority: 0.88 }),
    entry('/knowledge', { priority: 0.82 }),
    ...['gemstones', 'treatments', 'energized-gems', 'gems-care', 'rudraksha', 'astrology'].map((category) => entry(`/knowledge/${category}`, { priority: 0.7 })),
    entry('/knowledge/gem-qualities', { priority: 0.78 }),
    entry('/knowledge/rudraksha-qualities', { priority: 0.78 }),
    ...GEM_QUALITIES.map((gem) => entry(`/knowledge/gem-qualities/${gem.slug}`, { priority: 0.74 })),
    ...NAVARATNA_GUIDES.map((guide) => ({
      url: absoluteUrl(`/knowledge/gemstones/${guide.slug}`),
      lastModified: new Date(guide.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.68,
    })),
    ...RUDRAKSHA_GUIDES.map((guide) => ({
      url: absoluteUrl(`/knowledge/rudraksha/${guide.slug}`),
      lastModified: new Date(guide.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.66,
    })),
    // Geo gem landings (live at /[slug]) — must be listed or crawlers miss ~69 URLs.
    ...getAllGeoGemLandingSlugs().map((slug) => entry(`/${slug}`, { priority: 0.72 })),
    entry('/blog', { priority: 0.7 }),
    entry(
      '/unveiling-the-mystical-connection-between-gemstones-rudrakshas-and-the-nine-forms-of-goddess-durga',
      { changeFrequency: 'monthly', priority: 0.72 },
    ),
    entry('/about', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/about/experts', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/about/stores', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/contact', { changeFrequency: 'monthly', priority: 0.55 }),
    entry('/consultation', { changeFrequency: 'monthly', priority: 0.65 }),
    entry('/gems-recommendations', { changeFrequency: 'monthly', priority: 0.88 }),
    entry('/vedic-yagyas-service', { changeFrequency: 'weekly', priority: 0.7 }),
    entry('/lab-certificate', { changeFrequency: 'monthly', priority: 0.55 }),
    entry('/testimonials', { changeFrequency: 'weekly', priority: 0.55 }),
    entry('/feedback', { changeFrequency: 'yearly', priority: 0.3 }),
    entry('/track-order', { changeFrequency: 'yearly', priority: 0.3 }),
    entry('/policies/shipping', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/returns', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/privacy', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/terms', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/legal-notice', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/treatment-disclosure', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/certification-trust', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/gemstone-care', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/tools/carat-to-ratti', { priority: 0.68 }),
    entry('/tools/ring-size-guide', { priority: 0.68 }),
    entry('/videos', { changeFrequency: 'weekly', priority: 0.7 }),
    entry('/events-and-seminars', { changeFrequency: 'weekly', priority: 0.6 }),
    ...SEO_LANDING_PAGES.map((page) => entry(page.href, { priority: 0.76 })),
    ...(blogSlugs ?? []).map((item) => entry(`/blog/${item.slug.current}`, { priority: 0.62 })),
    ...(blogCategorySlugs ?? []).map((item) => entry(`/blog/category/${item.slug.current}`, { priority: 0.52 })),
    ...(knowledgeSlugs ?? []).map((item) => entry(`/knowledge/${item.slug.current}`, { priority: 0.62 })),
  ];

  const unique = new Map<string, SitemapEntry>();
  [...staticPages, ...categoryEntries, ...productEntries, ...videoEntries, ...designEntries].forEach((item) => unique.set(item.url, item));
  return Array.from(unique.values());
}
