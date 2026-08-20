import Link from 'next/link';
import {
  getAllBlogPosts,
  getFeaturedBlogPost,
  getAllBlogCategories,
  getBlogPostCount,
} from '@/lib/sanity/queries';
import { BlogFeaturedPost } from '@/components/blog/BlogPostCard';
import { BlogPostRow } from '@/components/blog/BlogPostRow';
import { BlogChooseGemRail } from '@/components/blog/BlogChooseGemRail';
import { BlogPagination, BLOG_POSTS_PER_PAGE } from '@/components/blog/BlogPagination';
import type { SanityBlogPost, SanityCategory } from '@/lib/types/blog';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/utils/seo';
import './blog-page.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildMetadata({
  title: 'Vedic Gemstone Guides & Astrology Insights | PureVedicGems',
  description:
    'Expert insights on Vedic gemstones, astrology, spiritual jewelry, and gemstone buying guides from 4 generations of expertise.',
  path: '/blog',
});

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const [featured, categories, totalCount] = await Promise.all([
    getFeaturedBlogPost(),
    getAllBlogCategories(),
    getBlogPostCount(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / BLOG_POSTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * BLOG_POSTS_PER_PAGE;

  const posts = await getAllBlogPosts(BLOG_POSTS_PER_PAGE, offset);

  const featuredPost = (currentPage === 1 ? featured : null) as SanityBlogPost | null;
  const allPosts = (posts ?? []) as SanityBlogPost[];
  const allCategories = (categories ?? []) as SanityCategory[];

  const remainingPosts = featuredPost
    ? allPosts.filter((p) => p._id !== featuredPost._id)
    : allPosts;

  return (
    <main className="pvg-blog-page font-body text-[#15110d]">
      <div className="pvg-blog-inner">
        <header className="pvg-blog-hero">
          <p className="pvg-account-hero-eyebrow" style={{ marginBottom: '0.5rem' }}>
            Heritage Journal
          </p>
          <h1 className="section-title">The PureVedicGems Journal</h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem auto 0', maxWidth: '40rem' }}>
            Insights on Vedic gemstones, astrology and spiritual living from 87+ years of expertise.
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          {totalCount > 0 && <p className="pvg-blog-hero-count">{totalCount} articles published</p>}
        </header>

        {allCategories.length > 0 && (
          <nav className="pvg-blog-categories" aria-label="Blog categories">
            <Link href="/blog" className="pvg-blog-category-pill pvg-blog-category-pill--active">
              All
            </Link>
            {allCategories.map((cat) => (
              <Link
                key={cat._id}
                href={`/blog/category/${cat.slug?.current ?? cat.slug}`}
                className="pvg-blog-category-pill"
              >
                {cat.title}
                {cat.postCount != null && cat.postCount > 0 && (
                  <span className="text-xs opacity-70">({cat.postCount})</span>
                )}
              </Link>
            ))}
          </nav>
        )}

        {featuredPost && (
          <section className="pvg-blog-featured" aria-label="Featured article">
            <BlogFeaturedPost post={featuredPost} />
          </section>
        )}

        <div className="pvg-blog-archive-layout">
          <div className="pvg-blog-archive-main">
            {remainingPosts.length > 0 ? (
              <>
                <div className="pvg-blog-section-head">
                  <h2>Latest Articles</h2>
                  <p>
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
                <section className="pvg-blog-row-list" aria-label="All articles">
                  {remainingPosts.map((post) => (
                    <BlogPostRow key={post._id} post={post} />
                  ))}
                </section>
                <BlogPagination currentPage={currentPage} totalPages={totalPages} basePath="/blog" />
              </>
            ) : (
              <div className="pvg-blog-empty">
                <p className="pvg-blog-empty-title">No blog posts published yet.</p>
                <p className="pvg-blog-empty-copy">Content will appear here once published in Sanity Studio.</p>
              </div>
            )}
          </div>
          <BlogChooseGemRail />
        </div>

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: 'PureVedicGems Blog',
              description: 'Expert insights on Vedic gemstones, astrology, spiritual jewelry.',
              url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com'}/blog`,
              publisher: { '@type': 'Organization', name: 'PureVedicGems' },
            }),
          }}
        />
      </div>
    </main>
  );
}
