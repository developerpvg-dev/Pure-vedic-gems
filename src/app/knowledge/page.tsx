import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { urlFor } from '@/lib/sanity/client';
import { getAllKnowledgeArticles } from '@/lib/sanity/queries';
import { FALLBACK_KNOWLEDGE_ARTICLES } from '@/lib/constants/knowledge';
import { NAVARATNA_GUIDES, RUDRAKSHA_GUIDES } from '@/lib/constants/static-knowledge-guides';
import type { SanityKnowledgeArticle } from '@/lib/types/content';

export const metadata: Metadata = {
  title: 'The Vedic Gem Library | PureVedicGems',
  description: 'Static Navaratna guides, Rudraksha per-mukhi guides, Vedic astrology notes, and buying guidance from PureVedicGems.',
};

export const revalidate = 3600;

const pathwayCards = [
  {
    title: 'Navratnas',
    copy: 'A complete guide to the nine Vedic gems, planetary associations, wearing rules, mantras, substitutes, and buying checks.',
    href: '/knowledge/gemstones',
    stat: '9 Vedic gems',
  },
  {
    title: 'Treatments',
    copy: 'Heating, oiling, dyeing, filling, diffusion, HPHT, lasering, and other gemstone treatment disclosures explained clearly.',
    href: '/knowledge/treatments',
    stat: 'Disclosure guide',
  },
  {
    title: 'Energized Gems',
    copy: 'Legacy guidance on gemstone purification, Prana Pratishta pooja, Vedic mantra energization, and aura-focused preparation.',
    href: '/knowledge/energized-gems',
    stat: 'Prana pratishta',
  },
  {
    title: 'Gem Care',
    copy: 'Cleaning, care, maintenance, and gemstone-specific handling notes carried forward from the old Pure Vedic Gems library.',
    href: '/knowledge/gems-care',
    stat: 'Care chart',
  },
  {
    title: 'Rudraksha Library',
    copy: 'Per-mukhi guides from 1 Mukhi to 21 Mukhi with identification and care notes.',
    href: '/knowledge/rudraksha',
    stat: '21 guides',
  },
  {
    title: "Buyer's Guide",
    copy: 'Certification, treatment disclosure, tag number, origin, and safe purchase checklists.',
    href: '/knowledge/buying-guides',
    stat: 'Safety first',
  },
] as const;

const featuredStaticGuides = [
  NAVARATNA_GUIDES.find((guide) => guide.slug === 'ruby-manik-guide'),
  NAVARATNA_GUIDES.find((guide) => guide.slug === 'yellow-sapphire-pukhraj-guide'),
  NAVARATNA_GUIDES.find((guide) => guide.slug === 'blue-sapphire-neelam-guide'),
  RUDRAKSHA_GUIDES.find((guide) => guide.slug === '1-mukhi'),
  RUDRAKSHA_GUIDES.find((guide) => guide.slug === '5-mukhi'),
  RUDRAKSHA_GUIDES.find((guide) => guide.slug === '14-mukhi'),
].filter(Boolean);

function getImageUrl(article: SanityKnowledgeArticle) {
  if (!article.mainImage) return null;
  if (typeof article.mainImage === 'string') return article.mainImage;
  return urlFor(article.mainImage).width(900).height(620).quality(80).auto('format').url();
}

export default async function KnowledgePage() {
  const sanityArticles = (await getAllKnowledgeArticles(24)) as SanityKnowledgeArticle[];
  const articles = sanityArticles.length > 0 ? sanityArticles : FALLBACK_KNOWLEDGE_ARTICLES;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <main className="min-h-screen bg-[#FDFAF5] px-4 pb-20 pt-32.5 md:px-8">
      <div className="mx-auto max-w-300">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-[#6B5B4E]">
          <Link href="/" className="hover:text-[#7A1515]">Home</Link>
          <span>/</span>
          <span className="text-[#4D0A0A]">Knowledge</span>
        </nav>

        <section className="grid gap-8 border-b border-[#DDD0B4] pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#B8861E]">Knowledge Hub</p>
            <h1 className="text-[#4D0A0A]" style={{ fontSize: 'clamp(38px, 6vw, 76px)', lineHeight: 1 }}>
              The Vedic Gem Library
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#6B5B4E] md:text-lg">
              Static launch-ready guides for Navaratna gemstones, gemstone energization, gem care, Rudraksha beads, and editorial buying safety content from Sanity when available.
            </p>
          </div>
          <div className="grid grid-cols-3 border border-[#DDD0B4] bg-white text-center">
            <div className="border-r border-[#DDD0B4] p-4">
              <p className="text-3xl font-black text-[#7A1515]">9</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B5B4E]">Navaratna</p>
            </div>
            <div className="border-r border-[#DDD0B4] p-4">
              <p className="text-3xl font-black text-[#7A1515]">21</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B5B4E]">Rudraksha</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-black text-[#7A1515]">32</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#6B5B4E]">Static pages</p>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pathwayCards.map((card) => (
            <Link key={card.href} href={card.href} className="group border border-[#DDD0B4] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(61,43,31,0.12)]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8861E]">{card.stat}</p>
              <h2 className="mt-3 text-2xl font-black text-[#4D0A0A]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[#6B5B4E]">{card.copy}</p>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-[#7A1515]">Open pathway</p>
            </Link>
          ))}
        </section>

        <section className="mt-10 grid gap-5 border border-[#DDD0B4] bg-[#4D0A0A] p-6 text-white md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4A843]">Recommendation Tool</p>
            <h2 className="mt-3 text-3xl font-black">Which gem should you wear?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
              Use the consultation flow for birth details, life situation, and guided product shortlisting. This keeps the old Week 4 quiz entry available through a working route.
            </p>
          </div>
          <Link href="/consultation" className="bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#7A1515]">
            Start Recommendation
          </Link>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B8861E]">Featured Static Guides</p>
              <h2 className="mt-2 text-3xl font-black text-[#4D0A0A]">Magazine-style launch pages</h2>
            </div>
            <Link href="/knowledge/gemstones" className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A1515]">View Navratnas</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredStaticGuides.map((guide) => guide ? (
              <Link
                key={guide.slug}
                href={`${guide.parentHref}/${guide.slug}`}
                className="group overflow-hidden border border-[#DDD0B4] bg-white transition hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(61,43,31,0.12)]"
              >
                <div className="relative aspect-4/3 bg-[#F5EDDA]">
                  <Image src={guide.heroImage} alt={guide.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8861E]">{guide.eyebrow}</p>
                  <h3 className="mt-2 text-lg font-black text-[#4D0A0A]">{guide.shortTitle}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#6B5B4E]">{guide.description}</p>
                </div>
              </Link>
            ) : null)}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 border-t border-[#DDD0B4] pt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B8861E]">Editorial Grid</p>
            <h2 className="mt-2 text-3xl font-black text-[#4D0A0A]">Buying and astrology notes</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((guide) => {
              const imageUrl = getImageUrl(guide);
              return (
                <Link
                  key={guide._id}
                  href={`/knowledge/${guide.slug.current}`}
                  className="group overflow-hidden border border-[#DDD0B4] bg-white transition-all hover:-translate-y-1 hover:shadow-[0_16px_44px_rgba(61,43,31,0.12)]"
                >
                  {imageUrl && (
                    <div className="relative aspect-4/3 bg-[#F5EDDA]">
                      <Image src={imageUrl} alt={guide.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B8861E]">{guide.category}</p>
                    <h3 className="mt-2 text-lg font-black text-[#4D0A0A]">{guide.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#6B5B4E]">{guide.excerpt}</p>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#7A1515]">Read Guide</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'The Vedic Gem Library',
            description: 'Static Navaratna and Rudraksha guides with buying safety content.',
            url: `${siteUrl}/knowledge`,
            hasPart: [
              ...NAVARATNA_GUIDES.map((guide) => ({ '@type': 'Article', headline: guide.title, url: `${siteUrl}${guide.parentHref}/${guide.slug}` })),
              ...RUDRAKSHA_GUIDES.map((guide) => ({ '@type': 'Article', headline: guide.title, url: `${siteUrl}${guide.parentHref}/${guide.slug}` })),
            ],
          }),
        }}
      />
    </main>
  );
}