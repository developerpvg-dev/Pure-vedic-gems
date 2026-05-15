import { NextRequest, NextResponse } from 'next/server';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { SEO_LANDING_PAGES } from '@/lib/constants/seo-landing-pages';
import { NAVARATNA_GUIDES, RUDRAKSHA_GUIDES } from '@/lib/constants/static-knowledge-guides';
import { productHref } from '@/lib/categories/storefront';
import { getAllBlogPosts, getAllKnowledgeArticles } from '@/lib/sanity/queries';
import { searchQuerySchema } from '@/lib/validators/product';
import type { SearchResponse, SearchResult, SearchResultGroup } from '@/lib/types/product';
import type { SanityBlogPost } from '@/lib/types/blog';
import type { SanityKnowledgeArticle } from '@/lib/types/content';

function buildSearchTerm(query: string) {
  return `%${query.replace(/[%,]/g, ' ').trim()}%`;
}

function matchesQuery(values: Array<string | null | undefined>, query: string) {
  const normalized = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function getToolResults(query: string): SearchResult[] {
  const tools = [
    {
      id: 'tool-recommendation',
      name: 'Gemstone Recommendation Tool',
      href: '/tools/recommendation',
      category: 'tool',
      description: 'Build a preliminary gemstone shortlist using purpose, birth details, and budget.',
    },
    {
      id: 'tool-carat-ratti',
      name: 'Carat to Ratti Converter',
      href: '/tools/carat-to-ratti',
      category: 'tool',
      description: 'Convert gemstone carat weight to traditional Indian ratti.',
    },
    {
      id: 'tool-ring-size',
      name: 'Ring Size Guide',
      href: '/tools/ring-size-guide',
      category: 'tool',
      description: 'Compare India, US, UK, and EU ring sizes for custom gemstone rings.',
    },
  ];

  return tools
    .filter((tool) => matchesQuery([tool.name, tool.description], query))
    .map((tool) => ({ ...tool, type: 'tool' as const, thumbnail_url: null, origin: null, planet: null }));
}

function getCategoryResults(query: string): SearchResult[] {
  return SEO_LANDING_PAGES
    .filter((page) => matchesQuery([page.title, page.description, page.planet, page.purpose, page.rashiName, ...page.primaryGemNames], query))
    .slice(0, 8)
    .map((page) => ({
      id: `seo-${page.slug}`,
      type: 'category' as const,
      name: page.title,
      title: page.title,
      href: page.href,
      category: page.kind,
      categoryLabel: page.eyebrow,
      description: page.description,
      thumbnail_url: null,
      origin: null,
      planet: page.planet ?? null,
    }));
}

function getStaticKnowledgeResults(query: string): SearchResult[] {
  return [...NAVARATNA_GUIDES, ...RUDRAKSHA_GUIDES]
    .filter((guide) => matchesQuery([guide.title, guide.shortTitle, guide.description, guide.category], query))
    .slice(0, 8)
    .map((guide) => ({
      id: `static-knowledge-${guide.slug}`,
      type: 'knowledge' as const,
      name: guide.title,
      title: guide.title,
      href: `${guide.parentHref}/${guide.slug}`,
      category: 'knowledge',
      categoryLabel: guide.category,
      description: guide.description,
      thumbnail_url: guide.heroImage,
      origin: null,
      planet: null,
    }));
}

function toGroups(groups: SearchResultGroup[]) {
  return groups.filter((group) => group.results.length > 0);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate
    const parsed = searchQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid search query', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { q } = parsed.data;
    const supabase = createOptionalPublicClient();

    // Use PostgreSQL full-text search with ts_query
    // Search across: name, SKU/tag number, Vedic name, origin, planet, short description
    // Using ilike as fallback for environments without tsvector columns configured
    const searchTerm = buildSearchTerm(q);
    let productResults: SearchResult[] = [];

    if (supabase) {
      const { data: results, error } = await supabase
        .from('products')
        .select('id, slug, name, category, price, thumbnail_url, origin, planet, tag_number')
        .eq('is_active', true)
        .or(
          `name.ilike.${searchTerm},sku.ilike.${searchTerm},tag_number.ilike.${searchTerm},vedic_name.ilike.${searchTerm},origin.ilike.${searchTerm},planet.ilike.${searchTerm},short_desc.ilike.${searchTerm}`
        )
        .order('featured', { ascending: false })
        .order('price', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Search query error:', error);
      } else {
        productResults = (results ?? []).map((result) => ({
          ...result,
          type: 'product' as const,
          href: productHref(result),
          categoryLabel: 'Product',
          description: null,
        }));
      }
    }

    const [knowledgeArticles, blogPosts] = await Promise.all([
      getAllKnowledgeArticles(60) as Promise<SanityKnowledgeArticle[]>,
      getAllBlogPosts(60, 0) as Promise<SanityBlogPost[]>,
    ]);

    const dynamicKnowledgeResults: SearchResult[] = (knowledgeArticles ?? [])
      .filter((article) => matchesQuery([article.title, article.excerpt, article.category], q))
      .slice(0, 6)
      .map((article) => ({
        id: `knowledge-${article._id}`,
        type: 'knowledge',
        name: article.title,
        title: article.title,
        href: `/knowledge/${article.slug.current}`,
        category: 'knowledge',
        categoryLabel: article.category,
        description: article.excerpt ?? null,
        thumbnail_url: typeof article.mainImage === 'string' ? article.mainImage : null,
        origin: null,
        planet: null,
      }));

    const blogResults: SearchResult[] = (blogPosts ?? [])
      .filter((post) => matchesQuery([post.title, post.excerpt, post.category?.title], q))
      .slice(0, 6)
      .map((post) => ({
        id: `blog-${post._id}`,
        type: 'blog',
        name: post.title,
        title: post.title,
        href: `/blog/${post.slug.current}`,
        category: 'blog',
        categoryLabel: post.category?.title ?? 'Blog',
        description: post.excerpt ?? null,
        thumbnail_url: null,
        origin: null,
        planet: null,
      }));

    const groups = toGroups([
      { type: 'product', label: 'Products', results: productResults },
      { type: 'category', label: 'SEO Guides', results: getCategoryResults(q) },
      { type: 'knowledge', label: 'Knowledge', results: [...getStaticKnowledgeResults(q), ...dynamicKnowledgeResults].slice(0, 8) },
      { type: 'blog', label: 'Blog', results: blogResults },
      { type: 'tool', label: 'Tools', results: getToolResults(q) },
    ]);

    const allResults = groups.flatMap((group) => group.results);

    const response: SearchResponse = {
      results: allResults,
      groups,
      query: q,
      total: allResults.length,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
