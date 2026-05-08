import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
  getAllBlogPostSlugs,
} from '@/lib/sanity/queries';
import { PortableText } from '@/components/blog/PortableText';
import { ShareButtons } from '@/components/blog/ShareButtons';
import type { SanityBlogPost } from '@/lib/types/blog';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllBlogPostSlugs();
  return (slugs ?? []).map((s) => ({ slug: s.slug.current }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getBlogPostBySlug(slug)) as SanityBlogPost | null;
  if (!post) return { title: 'Post Not Found — PureVedicGems' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const ogImage = post.ogImage
    ? urlFor(post.ogImage).width(1200).height(630).url()
    : post.mainImage
      ? urlFor(post.mainImage).width(1200).height(630).url()
      : undefined;

  return {
    title: post.seoTitle || `${post.title} — PureVedicGems Blog`,
    description: post.seoDescription || post.excerpt || '',
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || '',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
      url: `${siteUrl}/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || '',
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: `${siteUrl}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = (await getBlogPostBySlug(slug)) as SanityBlogPost | null;

  if (!post) notFound();

  const relatedPosts = post.category?._id
    ? ((await getRelatedBlogPosts(post._id, post.category._id, 3)) as SanityBlogPost[])
    : [];

  const heroImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).height(600).quality(85).auto('format').url()
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  // Article JSON-LD
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || '',
    image: heroImage || undefined,
    datePublished: post.publishedAt,
    author: post.author?.name
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: 'PureVedicGems' },
    publisher: {
      '@type': 'Organization',
      name: 'PureVedicGems',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${slug}`,
    },
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-gray-500">
          <li>
            <Link href="/" className="transition hover:text-amber-700">Home</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/blog" className="transition hover:text-amber-700">Blog</Link>
          </li>
          {post.category && (
            <>
              <li>/</li>
              <li>
                <Link
                  href={`/blog/category/${post.category.slug?.current ?? post.category.slug}`}
                  className="transition hover:text-amber-700"
                >
                  {post.category.title}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="truncate font-medium text-gray-900">{post.title}</li>
        </ol>
      </nav>

      {/* Hero Image */}
      {heroImage && (
        <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-2xl bg-gray-100">
          <Image
            src={heroImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 800px"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        {post.category && (
          <Link
            href={`/blog/category/${post.category.slug?.current ?? post.category.slug}`}
            className="mb-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 transition hover:bg-amber-100"
          >
            {post.category.title}
          </Link>
        )}
        <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {post.author?.name && (
              <div className="flex items-center gap-2">
                {post.author.image && (
                  <Image
                    src={urlFor(post.author.image).width(40).height(40).url()}
                    alt={post.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium text-gray-700">{post.author.name}</span>
              </div>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </span>
            )}
            {post.estimatedReadingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.estimatedReadingTime} min read
              </span>
            )}
          </div>
          <ShareButtons title={post.title} slug={slug} />
        </div>
      </header>

      {/* Body */}
      <div className="mb-12">
        <PortableText value={post.body as unknown[]} />
      </div>

      {/* Bottom Share + Back */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Link
          href="/blog"
          className="flex items-center gap-2 text-sm font-medium text-amber-700 transition hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
        <ShareButtons title={post.title} slug={slug} />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Related Articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((rp) => {
              const img = rp.mainImage
                ? urlFor(rp.mainImage).width(400).height(260).quality(75).auto('format').url()
                : null;
              return (
                <Link
                  key={rp._id}
                  href={`/blog/${rp.slug?.current}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                >
                  {img && (
                    <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
                      <Image
                        src={img}
                        alt={rp.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-amber-700 line-clamp-2">
                      {rp.title}
                    </h3>
                    {rp.publishedAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(rp.publishedAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
    </article>
  );
}
