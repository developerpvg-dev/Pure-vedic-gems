import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, MessageCircle } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
  getAllBlogPostSlugs,
} from '@/lib/sanity/queries';
import { PortableText } from '@/components/blog/PortableText';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogConversionRail } from '@/components/blog/BlogConversionRail';
import { BlogLeadPopup } from '@/components/blog/BlogLeadPopup';
import type { SanityBlogPost } from '@/lib/types/blog';
import type { Metadata } from 'next';
import { auditedBlogEnrichment } from '@/lib/blog/audit-enrichment';
import { getBlogRelatedProducts } from '@/lib/blog/blog-rail-data';
import { inferRelatedProductCategory } from '@/lib/blog/related-product-category';
import { blogMetadata, faqJsonLd } from '@/lib/utils/seo';
import '../blog-page.css';

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

  const ogImage = post.ogImage
    ? urlFor(post.ogImage).width(1200).height(630).url()
    : post.mainImage
      ? urlFor(post.mainImage).width(1200).height(630).url()
      : undefined;

  const metadata = blogMetadata({
    title: post.seoTitle || `${post.title} | PureVedicGems`,
    description: post.seoDescription || post.excerpt || 'Read this Vedic gemstone guide from PureVedicGems.',
    path: `/blog/${slug}`,
    image: ogImage,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
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
  const auditEnrichment = auditedBlogEnrichment(slug);
  const faqs = post.faqs?.length ? post.faqs : (auditEnrichment?.faqs ?? []);
  const inferredCategory = inferRelatedProductCategory({
    slug,
    title: post.title,
    categorySlug: post.category?.slug?.current ?? (typeof post.category?.slug === 'string' ? post.category.slug : null),
    categoryTitle: post.category?.title,
  });
  let relatedProductCategoryHref =
    post.relatedProductCategoryHref ??
    auditEnrichment?.relatedProductCategoryHref ??
    inferredCategory?.relatedProductCategoryHref;
  let relatedProductCategoryLabel =
    post.relatedProductCategoryLabel ??
    auditEnrichment?.relatedProductCategoryLabel ??
    inferredCategory?.relatedProductCategoryLabel;
  const relatedResult = await getBlogRelatedProducts(relatedProductCategoryHref);
  const relatedProducts = relatedResult.products;
  if (relatedResult.usedFallback) {
    relatedProductCategoryHref = '/shop';
    relatedProductCategoryLabel = 'Featured Pieces';
  }

  // ponytail: width-only so Sanity doesn't crop; height comes from the image
  const heroImage = post.mainImage
    ? urlFor(post.mainImage).width(1200).quality(85).auto('format').url()
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

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
  const faqSchema = faqJsonLd(faqs);

  return (
    <main className="pvg-blog-page font-body text-[#15110d]">
      <div className="pvg-blog-post-layout">
        <article className="pvg-blog-article-inner">
        <nav className="pvg-blog-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link>
          {post.category && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/blog/category/${post.category.slug?.current ?? post.category.slug}`}>
                {post.category.title}
              </Link>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="line-clamp-1">{post.title}</span>
        </nav>

        <Link
          href={
            post.category
              ? `/blog/category/${post.category.slug?.current ?? post.category.slug}`
              : '/blog'
          }
          className="pvg-blog-back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {post.category ? `Back to ${post.category.title}` : 'Back to Blog'}
        </Link>

        {heroImage && (
          <div className="pvg-blog-post-hero">
            <Image
              src={heroImage}
              alt={post.mainImage?.alt || post.title}
              width={1200}
              height={800}
              className="h-auto w-full"
              style={{ width: '100%', height: 'auto' }}
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        <header className="pvg-blog-post-header">
          {post.category && (
            <Link
              href={`/blog/category/${post.category.slug?.current ?? post.category.slug}`}
              className="pvg-blog-post-category"
            >
              {post.category.title}
            </Link>
          )}
          <h1 className="section-title" style={{ textAlign: 'left' }}>{post.title}</h1>
          {post.excerpt && (
            <p className="pvg-blog-intro" style={{ margin: '0.75rem 0 0', textAlign: 'left' }}>
              {post.excerpt}
            </p>
          )}
          <div className="section-rule-center" style={{ margin: '15px 0 0', marginLeft: 0 }} aria-hidden="true" />
          <div className="pvg-blog-post-meta">
            <div className="flex flex-wrap items-center gap-4">
              {post.author?.name && (
                <div className="pvg-blog-post-author">
                  {post.author.image && (
                    <Image
                      src={urlFor(post.author.image).width(40).height(40).url()}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span>{post.author.name}</span>
                </div>
              )}
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
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
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {post.estimatedReadingTime} min read
                </span>
              )}
            </div>
            <ShareButtons title={post.title} slug={slug} />
          </div>
        </header>

        <div className="mb-8">
          <PortableText value={post.body as unknown[]} />
        </div>

        {relatedProductCategoryHref && relatedProductCategoryLabel ? (
          <section className="pvg-blog-product-category" aria-labelledby="related-products-heading">
            <div className="pvg-blog-product-category-copy">
              <p className="pvg-blog-section-eyebrow">Related collection</p>
              <h2 id="related-products-heading">Explore {relatedProductCategoryLabel}</h2>
              <p>Compare certified pieces, treatment disclosures, and lab certificates.</p>
            </div>
            <Link href={relatedProductCategoryHref} className="pvg-blog-cta-link">
              Browse collection
            </Link>
          </section>
        ) : null}

        {faqs.length > 0 ? (
          <section className="pvg-blog-faq" aria-labelledby="blog-faq-heading">
            <p className="pvg-blog-section-eyebrow">Buying guidance</p>
            <h2 id="blog-faq-heading">
              {post.faqHeading?.trim() || 'Frequently Asked Questions'}
            </h2>
            <div className="pvg-blog-faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="pvg-blog-expert-cta" aria-labelledby="blog-expert-cta-heading">
          <div>
            <p className="pvg-blog-section-eyebrow">Need personal guidance?</p>
            <h2 id="blog-expert-cta-heading">Talk to a gemstone expert</h2>
            <p>Compare certified stones and product documentation before you buy.</p>
          </div>
          <div className="pvg-blog-cta-actions">
            <Link href="/contact" className="pvg-blog-cta-link">Contact our team</Link>
            <a
              href={`https://wa.me/919310172512?text=${encodeURIComponent(`Hello, I have a question about ${post.title}.`)}`}
              className="pvg-blog-cta-link pvg-blog-cta-link--outline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" />
              WhatsApp us
            </a>
          </div>
        </aside>

        <div className="pvg-blog-post-footer">
          <Link href="/blog" className="pvg-blog-back">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Blog
          </Link>
          <ShareButtons title={post.title} slug={slug} />
        </div>

        {relatedPosts.length > 0 && (
          <section className="pvg-blog-related" aria-labelledby="related-articles-heading">
            <h2 className="pvg-blog-related-title" id="related-articles-heading">
              Related Articles
            </h2>
            <div className="pvg-blog-grid">
              {relatedPosts.map((rp) => (
                <BlogPostCard key={rp._id} post={rp} />
              ))}
            </div>
          </section>
        )}

        {[articleJsonLd, faqSchema].filter(Boolean).map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        </article>
        <BlogConversionRail
          relatedProductCategoryHref={relatedProductCategoryHref}
          relatedProductCategoryLabel={relatedProductCategoryLabel}
        />
      </div>
      <BlogLeadPopup
        postTitle={post.title}
        slug={slug}
        relatedProducts={relatedProducts}
        relatedHref={relatedProductCategoryHref}
        relatedLabel={relatedProductCategoryLabel}
      />
    </main>
  );
}
