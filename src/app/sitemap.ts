import type { MetadataRoute } from 'next';
import { SEO_LANDING_PAGES } from '@/lib/constants/seo-landing-pages';
import { FALLBACK_KNOWLEDGE_ARTICLES } from '@/lib/constants/knowledge';
import { NAVARATNA_GUIDES, RUDRAKSHA_GUIDES } from '@/lib/constants/static-knowledge-guides';
import { getAllBlogCategorySlugs, getAllBlogPostSlugs, getAllKnowledgeArticleSlugs } from '@/lib/sanity/queries';
import { productHref } from '@/lib/categories/storefront';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { absoluteUrl, getSiteUrl } from '@/lib/utils/seo';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogSlugs, blogCategorySlugs, knowledgeSlugs, productEntries] = await Promise.all([
    getAllBlogPostSlugs(),
    getAllBlogCategorySlugs(),
    getAllKnowledgeArticleSlugs(),
    getProductEntries(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: getSiteUrl(),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    entry('/shop', { changeFrequency: 'daily', priority: 0.9 }),
    entry('/knowledge', { priority: 0.82 }),
    ...['gemstones', 'rudraksha', 'astrology', 'buying-guides'].map((category) => entry(`/knowledge/${category}`, { priority: 0.7 })),
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
    ...FALLBACK_KNOWLEDGE_ARTICLES.map((article) => entry(`/knowledge/${article.slug.current}`, { priority: 0.62 })),
    entry('/blog', { priority: 0.7 }),
    entry('/about', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/about/experts', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/about/stores', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/contact', { changeFrequency: 'monthly', priority: 0.55 }),
    entry('/consultation', { changeFrequency: 'monthly', priority: 0.65 }),
    entry('/policies/shipping', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/returns', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/privacy', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/policies/terms', { changeFrequency: 'yearly', priority: 0.35 }),
    entry('/tools/recommendation', { priority: 0.72 }),
    entry('/tools/carat-to-ratti', { priority: 0.68 }),
    entry('/tools/ring-size-guide', { priority: 0.68 }),
    ...SEO_LANDING_PAGES.map((page) => entry(page.href, { priority: 0.76 })),
    ...(blogSlugs ?? []).map((item) => entry(`/blog/${item.slug.current}`, { priority: 0.62 })),
    ...(blogCategorySlugs ?? []).map((item) => entry(`/blog/category/${item.slug.current}`, { priority: 0.52 })),
    ...(knowledgeSlugs ?? []).map((item) => entry(`/knowledge/${item.slug.current}`, { priority: 0.62 })),
  ];

  const unique = new Map<string, SitemapEntry>();
  [...staticPages, ...productEntries].forEach((item) => unique.set(item.url, item));
  return Array.from(unique.values());
}
