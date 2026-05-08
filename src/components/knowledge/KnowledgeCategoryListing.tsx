import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { urlFor } from '@/lib/sanity/client';
import { FALLBACK_KNOWLEDGE_ARTICLES } from '@/lib/constants/knowledge';
import {
  NAVARATNA_GUIDES,
  RUDRAKSHA_GUIDES,
  type StaticKnowledgeGuide,
} from '@/lib/constants/static-knowledge-guides';
import { getKnowledgeArticlesByCategory } from '@/lib/sanity/queries';
import type { SanityKnowledgeArticle } from '@/lib/types/content';

export type KnowledgeCategoryKey = 'gemstones' | 'rudraksha' | 'astrology' | 'buying-guides';

export const KNOWLEDGE_CATEGORY_CONFIG: Record<KnowledgeCategoryKey, {
  title: string;
  eyebrow: string;
  description: string;
  categories: string[];
}> = {
  gemstones: {
    title: 'Gemstone Guides',
    eyebrow: 'Gemstones',
    description: 'Buying and verification guidance for Jyotish gemstones, quality checks, certification, treatment disclosure, and suitability.',
    categories: ['Gemstone Guide'],
  },
  rudraksha: {
    title: 'Rudraksha Guides',
    eyebrow: 'Rudraksha',
    description: 'Practical notes for mukhi count, origin, x-ray checks, bead care, wearing support, and energization expectations.',
    categories: ['Rudraksha'],
  },
  astrology: {
    title: 'Vedic Astrology Guides',
    eyebrow: 'Astrology',
    description: 'Traditional Navagraha and gemstone context written with clear disclaimers and careful product-selection guidance.',
    categories: ['Vedic Astrology'],
  },
  'buying-guides': {
    title: 'Buying Safety Guides',
    eyebrow: 'Buying Guides',
    description: 'Checklists for certificates, photos, tag numbers, treatment disclosure, returns, care, and pre-purchase expert review.',
    categories: ['Buying Safety', 'Care Guide'],
  },
};

export function getKnowledgeCategoryMetadata(key: KnowledgeCategoryKey): Metadata {
  const config = KNOWLEDGE_CATEGORY_CONFIG[key];
  return {
    title: `${config.title} | PureVedicGems`,
    description: config.description,
  };
}

function getImageUrl(article: SanityKnowledgeArticle) {
  if (!article.mainImage) return null;
  if (typeof article.mainImage === 'string') return article.mainImage;
  return urlFor(article.mainImage).width(900).height(620).quality(80).auto('format').url();
}

function getStaticGuides(categoryKey: KnowledgeCategoryKey): StaticKnowledgeGuide[] {
  if (categoryKey === 'gemstones') return NAVARATNA_GUIDES;
  if (categoryKey === 'rudraksha') return RUDRAKSHA_GUIDES;
  return [];
}

export async function KnowledgeCategoryListing({ categoryKey }: { categoryKey: KnowledgeCategoryKey }) {
  const config = KNOWLEDGE_CATEGORY_CONFIG[categoryKey];
  const sanityArticles = (await getKnowledgeArticlesByCategory(config.categories, 50)) as SanityKnowledgeArticle[];
  const fallbackArticles = FALLBACK_KNOWLEDGE_ARTICLES.filter((article) => config.categories.includes(article.category));
  const articles = sanityArticles.length ? sanityArticles : fallbackArticles;
  const staticGuides = getStaticGuides(categoryKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-[130px] md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]">
          <Link href="/" className="hover:text-[var(--pvg-accent)]">Home</Link>
          <span>/</span>
          <Link href="/knowledge" className="hover:text-[var(--pvg-accent)]">Knowledge</Link>
          <span>/</span>
          <span className="text-[var(--pvg-primary)]">{config.eyebrow}</span>
        </nav>

        <header className="mb-10 border-b border-[var(--pvg-border)] pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[var(--pvg-accent)]">{config.eyebrow}</p>
          <h1 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(32px, 5vw, 58px)' }}>
            {config.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--pvg-muted)] md:text-base">
            {config.description}
          </p>
        </header>

        {staticGuides.length ? (
          <section className="mb-12">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-[var(--pvg-accent)]">Static Library</p>
                <h2 className="mt-2 font-heading text-2xl text-[var(--pvg-primary)]">
                  {categoryKey === 'gemstones' ? '9 Navaratna Guides' : '21 Rudraksha Guides'}
                </h2>
              </div>
              <p className="text-sm text-[var(--pvg-muted)]">Complete Week 4 static guide set</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {staticGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`${guide.parentHref}/${guide.slug}`}
                  className="group overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-brand-surface transition-all hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(61,43,31,0.12)]"
                >
                  <div className="relative aspect-[4/3] bg-brand-bg-alt">
                    <Image src={guide.heroImage} alt={guide.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-accent)]">{guide.eyebrow}</p>
                    <h3 className="mt-2 font-heading text-lg font-semibold text-[var(--pvg-primary)]">{guide.shortTitle}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--pvg-muted)]">{guide.description}</p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)]">Open Static Guide</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {articles.length ? (
          <section>
            {staticGuides.length ? (
              <div className="mb-5 border-t border-[var(--pvg-border)] pt-8">
                <p className="text-[10px] font-bold uppercase tracking-[2.5px] text-[var(--pvg-accent)]">Editorial Articles</p>
              </div>
            ) : null}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const imageUrl = getImageUrl(article);
              return (
                <Link
                  key={article._id}
                  href={`/knowledge/${article.slug.current}`}
                  className="group overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-brand-surface transition-all hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(61,43,31,0.12)]"
                >
                  {imageUrl && (
                    <div className="relative aspect-[4/3] bg-brand-bg-alt">
                      <Image src={imageUrl} alt={article.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-accent)]">{article.category}</p>
                    <h2 className="mt-2 font-heading text-lg font-semibold text-[var(--pvg-primary)]">{article.title}</h2>
                    {article.excerpt && <p className="mt-2 text-sm leading-relaxed text-[var(--pvg-muted)]">{article.excerpt}</p>}
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)]">Read Guide</p>
                  </div>
                </Link>
              );
            })}
            </div>
          </section>
        ) : (
          !staticGuides.length ? <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-8 text-center">
            <h2 className="font-heading text-2xl text-[var(--pvg-primary)]">Guides are being prepared</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--pvg-muted)]">
              Editors can publish this category from Sanity Studio. Until then, use the main Knowledge Hub for available guides.
            </p>
            <Link href="/knowledge" className="mt-5 inline-flex rounded-lg border border-[var(--pvg-primary)] px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)]">
              All Knowledge Guides
            </Link>
          </div> : null
        )}
      </div>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: config.title,
            description: config.description,
            url: `${siteUrl}/knowledge/${categoryKey}`,
            hasPart: [
              ...staticGuides.map((guide) => ({
                '@type': 'Article',
                headline: guide.title,
                url: `${siteUrl}${guide.parentHref}/${guide.slug}`,
              })),
              ...articles.map((article) => ({
              '@type': 'Article',
              headline: article.title,
              url: `${siteUrl}/knowledge/${article.slug.current}`,
              })),
            ],
          }),
        }}
      />
    </main>
  );
}