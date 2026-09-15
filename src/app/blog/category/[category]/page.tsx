import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  getBlogPostsByCategory,
  getBlogCategoryBySlug,
  getBlogPostCountByCategory,
} from '@/lib/sanity/queries';
import { BlogPostRow } from '@/components/blog/BlogPostRow';
import { BlogChooseGemRail } from '@/components/blog/BlogChooseGemRail';
import { BlogPagination, BLOG_POSTS_PER_PAGE } from '@/components/blog/BlogPagination';
import type { SanityBlogPost, SanityCategory } from '@/lib/types/blog';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/utils/seo';
import '../../blog-page.css';

// ponytail: Next 16 ISR + empty generateStaticParams + searchParams was 500ing this nested route
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  try {
    const { category: slug } = await params;
    const cat = (await getBlogCategoryBySlug(slug)) as SanityCategory | null;
    const description =
      typeof cat?.description === 'string' && cat.description
        ? cat.description
        : `Read our latest articles about ${cat?.title ?? slug}.`;
    return buildMetadata({
      title: cat ? `${cat.title} Guides & Insights | PureVedicGems` : 'Blog Category Not Found | PureVedicGems',
      description,
      path: `/blog/category/${slug}`,
      noIndex: !cat,
    });
  } catch {
    return buildMetadata({
      title: 'Blog | PureVedicGems',
      description: 'Vedic gemstone guides and astrology insights from PureVedicGems.',
      path: '/blog',
    });
  }
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const cat = (await getBlogCategoryBySlug(slug)) as SanityCategory | null;
  if (!cat) notFound();

  return (
    <Suspense fallback={<main className="pvg-blog-page font-body text-[#15110d]" />}>
      <BlogCategoryIndex slug={slug} category={cat} searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogCategoryIndex({
  slug,
  category,
  searchParams,
}: {
  slug: string;
  category: SanityCategory;
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const totalCount = Number(await getBlogPostCountByCategory(slug)) || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / BLOG_POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * BLOG_POSTS_PER_PAGE;

  const posts = await getBlogPostsByCategory(slug, BLOG_POSTS_PER_PAGE, offset);
  const allPosts = (posts ?? []) as SanityBlogPost[];

  return (
    <main className="pvg-blog-page font-body text-[#15110d]">
      <div className="pvg-blog-inner">
        <nav className="pvg-blog-breadcrumb pvg-blog-breadcrumb--center" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{category.title}</span>
        </nav>

        <Link href="/blog" className="pvg-blog-back">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All Articles
        </Link>

        <header className="pvg-blog-hero">
          <h1 className="section-title">{category.title}</h1>
          {typeof category.description === 'string' && category.description ? (
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem auto 0', maxWidth: '40rem' }}>
              {category.description}
            </p>
          ) : null}
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          <p className="pvg-blog-hero-count">
            {totalCount} article{totalCount !== 1 ? 's' : ''}
          </p>
        </header>

        <div className="pvg-blog-archive-layout">
          <div className="pvg-blog-archive-main">
            {allPosts.length > 0 ? (
              <>
                <div className="pvg-blog-section-head">
                  <h2>{category.title} Articles</h2>
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
                <section className="pvg-blog-row-list" aria-label={`${category.title} articles`}>
                  {allPosts.map((post) => (
                    <BlogPostRow key={post._id} post={post} />
                  ))}
                </section>
                <BlogPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  basePath={`/blog/category/${slug}`}
                />
              </>
            ) : (
              <div className="pvg-blog-empty">
                <p className="pvg-blog-empty-title">No articles in this category yet.</p>
                <Link href="/blog" className="pvg-blog-back mt-4 inline-flex">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Browse all articles
                </Link>
              </div>
            )}
          </div>
          <BlogChooseGemRail categorySlug={slug} />
        </div>
      </div>
    </main>
  );
}
