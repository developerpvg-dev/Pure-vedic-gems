import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  getBlogPostsByCategory,
  getBlogCategoryBySlug,
  getAllBlogCategorySlugs,
  getBlogPostCountByCategory,
} from '@/lib/sanity/queries';
import { BlogPostRow } from '@/components/blog/BlogPostRow';
import { BlogChooseGemRail } from '@/components/blog/BlogChooseGemRail';
import { BlogPagination, BLOG_POSTS_PER_PAGE } from '@/components/blog/BlogPagination';
import type { SanityBlogPost, SanityCategory } from '@/lib/types/blog';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/utils/seo';
import '../../blog-page.css';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllBlogCategorySlugs();
  return (slugs ?? []).map((s) => ({ category: s.slug.current }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = (await getBlogCategoryBySlug(slug)) as SanityCategory | null;
  if (!cat) {
    return buildMetadata({
      title: 'Blog Category Not Found | PureVedicGems',
      description: 'The requested blog category could not be found.',
      path: `/blog/category/${slug}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${cat.title} Guides & Insights | PureVedicGems`,
    description: cat.description || `Read our latest articles about ${cat.title}.`,
    path: `/blog/category/${slug}`,
  });
}

export default async function BlogCategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const [cat, totalCount] = await Promise.all([
    getBlogCategoryBySlug(slug),
    getBlogPostCountByCategory(slug),
  ]);

  const category = cat as SanityCategory | null;
  if (!category) notFound();

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
          {category.description && (
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem auto 0', maxWidth: '40rem' }}>
              {category.description}
            </p>
          )}
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
