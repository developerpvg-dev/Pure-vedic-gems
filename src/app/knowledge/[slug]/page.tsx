import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity/client';
import { PortableText } from '@/components/blog/PortableText';
import { FALLBACK_KNOWLEDGE_ARTICLES, getFallbackKnowledgeArticle } from '@/lib/constants/knowledge';
import { getAllKnowledgeArticleSlugs, getKnowledgeArticleBySlug } from '@/lib/sanity/queries';
import type { PortableTextBlock, SanityKnowledgeArticle } from '@/lib/types/content';

export const revalidate = 3600;

interface KnowledgeArticleProps {
  params: Promise<{ slug: string }>;
}

function getBlockText(block: PortableTextBlock) {
  return block.children?.map((child) => child.text ?? '').join('') ?? '';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function getHeadings(article: SanityKnowledgeArticle) {
  return (article.body ?? [])
    .filter((block) => block._type === 'block' && ['h2', 'h3'].includes(block.style ?? ''))
    .map((block) => {
      const text = getBlockText(block);
      return { text, href: `#${slugify(text)}`, level: block.style ?? 'h2' };
    })
    .filter((heading) => heading.text.length > 0);
}

function getImageUrl(article: SanityKnowledgeArticle, width = 1200, height = 720) {
  if (!article.mainImage) return null;
  if (typeof article.mainImage === 'string') return article.mainImage;
  return urlFor(article.mainImage).width(width).height(height).quality(85).auto('format').url();
}

async function getArticle(slug: string) {
  return ((await getKnowledgeArticleBySlug(slug)) as SanityKnowledgeArticle | null) ?? getFallbackKnowledgeArticle(slug);
}

export async function generateStaticParams() {
  const sanitySlugs = await getAllKnowledgeArticleSlugs();
  const slugs = new Set(FALLBACK_KNOWLEDGE_ARTICLES.map((article) => article.slug.current));
  for (const item of sanitySlugs ?? []) {
    if (item.slug?.current) slugs.add(item.slug.current);
  }
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: KnowledgeArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const image = article.ogImage
    ? urlFor(article.ogImage).width(1200).height(630).url()
    : getImageUrl(article, 1200, 630) ?? undefined;

  return {
    title: article.seoTitle || `${article.title} | PureVedicGems`,
    description: article.seoDescription || article.excerpt || `${article.category} from the PureVedicGems knowledge hub.`,
    alternates: { canonical: `${siteUrl}/knowledge/${slug}` },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt,
      type: 'article',
      url: `${siteUrl}/knowledge/${slug}`,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function KnowledgeArticlePage({ params }: KnowledgeArticleProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const heroImage = getImageUrl(article);
  const headings = getHeadings(article);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: heroImage ?? undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: article.author?.name
      ? { '@type': 'Person', name: article.author.name }
      : { '@type': 'Organization', name: 'PureVedicGems' },
    publisher: { '@type': 'Organization', name: 'PureVedicGems', url: siteUrl },
    mainEntityOfPage: `${siteUrl}/knowledge/${slug}`,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Knowledge', item: `${siteUrl}/knowledge` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${siteUrl}/knowledge/${slug}` },
    ],
  };
  const faqJsonLd = article.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: article.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null;

  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-[130px] md:px-8">
      <article className="mx-auto max-w-[1120px]">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]">
          <Link href="/" className="hover:text-[var(--pvg-accent)]">Home</Link>
          <span>/</span>
          <Link href="/knowledge" className="hover:text-[var(--pvg-accent)]">Knowledge</Link>
          <span>/</span>
          <span className="text-[var(--pvg-primary)]">{article.category}</span>
        </nav>

        <header className="border-b border-[var(--pvg-border)] pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[var(--pvg-accent)]">{article.category}</p>
          <h1 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            {article.title}
          </h1>
          {article.excerpt && <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--pvg-muted)]">{article.excerpt}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-[var(--pvg-muted)]">
            {article.estimatedReadingTime ? <span>{article.estimatedReadingTime} min read</span> : null}
            {article.author?.name ? <span>Reviewed by {article.author.name}</span> : null}
          </div>
        </header>

        {heroImage && (
          <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-xl bg-brand-surface">
            <Image src={heroImage} alt={article.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 1120px" />
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            {headings.length > 0 && (
              <div className="sticky top-32 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-accent)]">In this guide</p>
                <nav className="space-y-2">
                  {headings.map((heading) => (
                    <a key={heading.href} href={heading.href} className={`block text-xs leading-5 text-[var(--pvg-muted)] hover:text-[var(--pvg-primary)] ${heading.level === 'h3' ? 'pl-3' : ''}`}>
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>

          <div>
            <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-bg p-5 md:p-8">
              <PortableText value={article.body} />
            </div>

            {article.faqs?.length ? (
              <section className="mt-8 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-5 md:p-6">
                <h2 className="font-heading text-2xl text-[var(--pvg-primary)]">Frequently Asked Questions</h2>
                <div className="mt-4 space-y-3">
                  {article.faqs.map((faq) => (
                    <details key={faq.question} className="rounded-lg border border-[var(--pvg-border)] bg-brand-bg p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-[var(--pvg-primary)]">{faq.question}</summary>
                      <p className="mt-3 text-sm leading-7 text-[var(--pvg-muted)]">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-8 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-5">
              <p className="text-sm leading-relaxed text-[var(--pvg-muted)]">
                Need help applying this to a real product? Browse the catalog or request a consultation with product SKUs and tag numbers ready.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={article.relatedProductCategoryHref ?? '/shop'} className="rounded-lg bg-brand-primary px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)]">
                  Browse Catalog
                </Link>
                <Link href="/consultation" className="rounded-lg border border-[var(--pvg-primary)] px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)]">
                  Book Consultation
                </Link>
              </div>
            </div>

            <p className="mt-5 text-xs leading-6 text-[var(--pvg-muted)]">
              Gemstone use for astrological purposes is a traditional practice. This content is educational and should not be treated as medical, legal, financial, or emergency advice.
            </p>
          </div>
        </div>
      </article>
      {[articleJsonLd, breadcrumbJsonLd, faqJsonLd].filter(Boolean).map((schema, index) => (
        <script key={index} type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </main>
  );
}