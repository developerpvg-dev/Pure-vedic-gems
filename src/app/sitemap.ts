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

function entry(path: string, lastModified: Date = now): SitemapEntry {
  return { url: absoluteUrl(path), lastModified };
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
    .map((product) => entry(productHref(product), new Date(product.updated_at ?? product.created_at ?? Date.now())));
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
    .map((video) => entry(`/videos/${encodeURIComponent(video.slug)}`, new Date(video.updated_at ?? video.published_at ?? video.created_at ?? Date.now())));
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
    entry('/designs'),
    entry('/designs/ring'),
    entry('/designs/pendant'),
    entry('/designs/bracelet'),
    entry('/designs/rudraksha'),
  ];

  for (const row of data) {
    const href = designHref(row);
    if (!href) continue;
    entries.push(entry(href, new Date(row.created_at ?? Date.now())));
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
      entries.push(entry(storefrontSubcategoryHref(groupSlug, category.slug), new Date(category.updated_at ?? category.created_at ?? Date.now())));
    });
  }

  if (!productCategories.error && productCategories.data) {
    productCategories.data.forEach((category) => {
      const groupSlug = catalogFamilyToStorefrontGroupSlug(category.family);
      if (!groupSlug || !category.slug) return;
      const href = category.parent_id
        ? storefrontSubcategoryHref(groupSlug, category.slug)
        : storefrontGroupHref(groupSlug);
      entries.push(entry(href, new Date(category.updated_at ?? category.created_at ?? Date.now())));
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
    entry('/gemstones'),
    entry('/gemstones/navaratna'),
    entry('/gemstones/upratna'),
    entry('/rudraksha'),
    entry('/knowledge'),
    ...['gemstones', 'treatments', 'energized-gems', 'gems-care', 'rudraksha', 'astrology'].map((category) => entry(`/knowledge/${category}`)),
    entry('/knowledge/gem-qualities'),
    entry('/knowledge/rudraksha-qualities'),
    ...GEM_QUALITIES.map((gem) => entry(`/knowledge/gem-qualities/${gem.slug}`)),
    ...NAVARATNA_GUIDES.map((guide) => entry(`/knowledge/gemstones/${guide.slug}`, new Date(guide.updatedAt))),
    ...RUDRAKSHA_GUIDES.map((guide) => entry(`/knowledge/rudraksha/${guide.slug}`, new Date(guide.updatedAt))),
    // Geo gem landings (live at /[slug]) — must be listed or crawlers miss ~69 URLs.
    ...getAllGeoGemLandingSlugs().map((slug) => entry(`/${slug}`)),
    entry('/blog'),
    entry('/unveiling-the-mystical-connection-between-gemstones-rudrakshas-and-the-nine-forms-of-goddess-durga'),
    entry('/about'),
    entry('/about/experts'),
    entry('/about/stores'),
    entry('/contact'),
    entry('/consultation'),
    entry('/gems-recommendations'),
    entry('/vedic-yagyas-service'),
    entry('/lab-certificate'),
    entry('/testimonials'),
    entry('/feedback'),
    entry('/track-order'),
    entry('/policies/shipping'),
    entry('/policies/returns'),
    entry('/policies/privacy'),
    entry('/policies/terms'),
    entry('/policies/legal-notice'),
    entry('/policies/treatment-disclosure'),
    entry('/policies/certification-trust'),
    entry('/policies/gemstone-care'),
    entry('/tools/carat-to-ratti'),
    entry('/tools/ring-size-guide'),
    entry('/videos'),
    entry('/events-and-seminars'),
    ...SEO_LANDING_PAGES.map((page) => entry(page.href)),
    ...(blogSlugs ?? []).map((item) => entry(`/blog/${item.slug.current}`)),
    ...(blogCategorySlugs ?? []).map((item) => entry(`/blog/category/${item.slug.current}`)),
    ...(knowledgeSlugs ?? []).map((item) => entry(`/knowledge/${item.slug.current}`)),
  ];

  const unique = new Map<string, SitemapEntry>();
  [...staticPages, ...categoryEntries, ...productEntries, ...videoEntries, ...designEntries].forEach((item) => unique.set(item.url, item));
  return Array.from(unique.values());
}
