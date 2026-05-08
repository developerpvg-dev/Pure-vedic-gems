import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight, Tag } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import {
  getAllBlogPosts,
  getFeaturedBlogPost,
  getAllBlogCategories,
  getBlogPostCount,
} from '@/lib/sanity/queries';
import type { SanityBlogPost, SanityCategory } from '@/lib/types/blog';
import type { Metadata } from 'next';

export const revalidate = 3600; // ISR: 1 hour

export const metadata: Metadata = {
  title: 'Blog — PureVedicGems',
  description:
    'Expert insights on Vedic gemstones, astrology, spiritual jewelry, and gemstone buying guides from 4 generations of expertise.',
  openGraph: {
    title: 'Blog — PureVedicGems',
    description:
      'Expert insights on Vedic gemstones, astrology, spiritual jewelry, and gemstone buying guides.',
    type: 'website',
  },
};

function PostCard({ post }: { post: SanityBlogPost }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(600).height(400).quality(80).auto('format').url()
    : null;

  return (
    <Link
      href={`/blog/${post.slug?.current}`}
      className="group overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition-all hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(61,43,31,0.12)]"
    >
      {imageUrl && (
        <div className="relative aspect-3/2 overflow-hidden bg-brand-bg-alt">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-5">
        {post.category && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold-light px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
            <Tag className="h-3 w-3" />
            {post.category.title}
          </span>
        )}
        <h3 className="mt-2 font-heading text-lg font-bold text-brand-primary transition-colors group-hover:text-brand-accent line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-sm leading-6 text-brand-muted line-clamp-2">{post.excerpt}</p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-brand-muted">
          <div className="flex items-center gap-3">
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
            {post.estimatedReadingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.estimatedReadingTime} min read
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 font-semibold text-brand-accent opacity-0 transition-opacity group-hover:opacity-100">
            Read <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedPost({ post }: { post: SanityBlogPost }) {
  const imageUrl = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(600).quality(85).auto('format').url()
    : null;

  return (
    <Link
      href={`/blog/${post.slug?.current}`}
      className="group relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(61,43,31,0.16)]"
    >
      <div className="grid gap-0 md:grid-cols-2">
        {imageUrl && (
          <div className="relative aspect-3/2 overflow-hidden bg-brand-bg-alt md:aspect-auto md:min-h-85">
            <Image
              src={imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        )}
        <div className="flex flex-col justify-center p-6 md:p-8">
          <span className="mb-3 inline-block w-fit rounded-full bg-brand-gold-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-primary">
            Featured
          </span>
          {post.category && (
            <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-accent">
              {post.category.title}
            </span>
          )}
          <h2 className="font-heading text-2xl font-bold text-brand-primary transition-colors group-hover:text-brand-accent md:text-3xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-3 leading-7 text-brand-muted line-clamp-3">{post.excerpt}</p>
          )}
          <div className="mt-5 flex items-center gap-4 text-sm text-brand-muted">
            {post.author?.name && <span>By {post.author.name}</span>}
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
            {post.estimatedReadingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.estimatedReadingTime} min
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const [featured, posts, categories, totalCount] = await Promise.all([
    getFeaturedBlogPost(),
    getAllBlogPosts(50, 0),
    getAllBlogCategories(),
    getBlogPostCount(),
  ]);

  const featuredPost = featured as SanityBlogPost | null;
  const allPosts = (posts ?? []) as SanityBlogPost[];
  const allCategories = (categories ?? []) as SanityCategory[];

  // Remove featured post from grid to avoid duplication
  const remainingPosts = featuredPost
    ? allPosts.filter((p) => p._id !== featuredPost._id)
    : allPosts;

  return (
    <div className="min-h-screen bg-brand-bg px-4 pb-20 pt-35 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="mb-10 border-b border-brand-border pb-8 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-brand-accent">Heritage Journal</p>
        <h1 className="font-heading text-4xl font-bold text-brand-primary md:text-5xl">
          The PureVedicGems Journal
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-brand-muted md:text-lg">
          Insights on Vedic gemstones, astrology and spiritual living from 87+ years of expertise.
        </p>
        {totalCount > 0 && (
          <p className="mt-2 text-sm text-brand-muted">{totalCount} articles published</p>
        )}
      </div>

      {/* Categories */}
      {allCategories.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/blog"
            className="rounded-full bg-brand-primary px-4 py-1.5 text-sm font-semibold text-brand-bg"
          >
            All
          </Link>
          {allCategories.map((cat) => (
            <Link
              key={cat._id}
              href={`/blog/category/${cat.slug?.current ?? cat.slug}`}
              className="rounded-full border border-brand-border bg-brand-surface px-4 py-1.5 text-sm font-medium text-brand-text transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              {cat.title}
              {cat.postCount != null && cat.postCount > 0 && (
                <span className="ml-1 text-xs text-brand-muted">({cat.postCount})</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Featured Post */}
      {featuredPost && (
        <section className="mb-12">
          <FeaturedPost post={featuredPost} />
        </section>
      )}

      {/* Posts Grid */}
      {remainingPosts.length > 0 ? (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {remainingPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface py-20 text-center">
          <p className="text-lg text-brand-primary">No blog posts published yet.</p>
          <p className="mt-2 text-sm text-brand-muted">
            Content will appear here once published in Sanity Studio.
          </p>
        </div>
      )}

      {/* JSON-LD: Blog listing */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'PureVedicGems Blog',
            description:
              'Expert insights on Vedic gemstones, astrology, spiritual jewelry.',
            url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com'}/blog`,
            publisher: {
              '@type': 'Organization',
              name: 'PureVedicGems',
            },
          }),
        }}
      />
      </div>
    </div>
  );
}
