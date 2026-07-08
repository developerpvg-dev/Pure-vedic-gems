'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { KnowledgePageHero } from '@/components/knowledge/KnowledgePageHero';
import { GEM_QUALITY_FAQS, type GemQuality } from '@/lib/constants/gem-qualities';

export type GemQualityIndexItem = GemQuality & { cardImage: string };

const PILLARS = [
  { title: 'Lab Certified', desc: 'GIA · IGI · GRS · Gübelin · GII certification on every stone.' },
  { title: 'Untreated', desc: 'Only natural, unheated, unfilled, undiffused Jyotish-grade gems.' },
  { title: 'Vedic Energised', desc: 'Complete Shudhikaran and Pran-Pratishtha in-house.' },
  { title: 'Since 1937', desc: 'Four generations of trusted Vedic gem expertise.' },
];

export function GemsQualitiesIndexContent({ gems }: { gems: GemQualityIndexItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GEM_QUALITY_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <main className="pvg-knowledge-page pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <KnowledgePageHero
        title="Gem Qualities & Identification Guides"
        subtitle="The authoritative Vedic reference on identifying natural, untreated Jyotish gemstones — Ruby, Emerald, Blue & Yellow Sapphire, Red Coral, Hessonite, Cat's Eye, White Sapphire, Pearl and Opal. Trusted since 1937."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Knowledge', href: '/knowledge' },
          { label: 'Gem Qualities' },
        ]}
      >
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#7A1515]"
          >
            Shop Authentic Gemstones
          </Link>
          <Link
            href="/consultation"
            className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
          >
            Book Consultation
          </Link>
        </div>
      </KnowledgePageHero>

      {/* Pillars */}
      <section className="mx-auto mt-16 max-w-6xl px-4 md:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-[#DDD0B4] bg-white px-6 py-6 text-center transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
                {p.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[#3B2F26]">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gem grid */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            Planetary Gems · Quality Guides
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800 }}
          >
            Choose a Gemstone to Explore
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#6B5B4E] md:text-base">
            Tap any gem below to read its full identification guide — natural features,
            quality grades, fake awareness and Vedic wearing ritual.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gems.map((gem) => (
            <Link
              key={gem.slug}
              href={`/knowledge/gem-qualities/${gem.slug}`}
              className="group overflow-hidden rounded-2xl border border-[#DDD0B4] bg-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-4/3 bg-[#FDF6E8]">
                <Image
                  src={gem.cardImage}
                  alt={`${gem.name} — ${gem.hindiName}`}
                  fill
                  className="object-contain p-4 transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div
                  className="absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-md"
                  style={{ background: gem.accent }}
                >
                  {gem.planet.split(' ')[0]}
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 p-4"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 100%)',
                  }}
                >
                  <p className="text-lg font-bold text-white">{gem.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E6C36F]">
                    {gem.hindiName}
                  </p>
                </div>
              </div>
              <div className="px-5 py-5">
                <p className="text-sm leading-7 text-[#3B2F26]">{gem.intro}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7A1515]">
                  Read Guide
                  <span aria-hidden>→</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Rudraksha cross-link */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="grid items-center gap-8 rounded-2xl border border-[#DDD0B4] bg-linear-to-br from-white to-[#FDF6E8] p-7 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
              Related Library
            </p>
            <h2
              className="mt-2 text-[#4D0A0A]"
              style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800 }}
            >
              Looking for Rudraksha Qualities?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#3B2F26] md:text-base">
              Read our detailed Rudraksha authenticity guide — 1 to 21 mukhi reference,
              fake bead patterns and Vedic wearing rituals.
            </p>
          </div>
          <Link
            href="/knowledge/rudraksha-qualities"
            className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#7A1515]"
          >
            Rudraksha Qualities
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto mt-20 max-w-4xl px-4 md:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            Questions Answered
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 800 }}
          >
            Gemstone Quality FAQs
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {GEM_QUALITY_FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.question}
                className={
                  'overflow-hidden rounded-lg border bg-white transition ' +
                  (isOpen ? 'border-[#B8861E] shadow-md' : 'border-[#DDD0B4]')
                }
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-[#4D0A0A] md:text-base">
                    {faq.question}
                  </span>
                  <span
                    className={
                      'flex h-7 w-7 flex-none items-center justify-center rounded-full text-lg font-bold transition ' +
                      (isOpen ? 'bg-[#f7f2ea] text-[#5c3d3d]' : 'bg-[#faf9f7] text-[#7a3a3a]')
                    }
                    aria-hidden
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-[#EDE3CC] bg-[#FDFAF5] px-5 py-5 text-sm leading-7 text-[#3B2F26] md:text-base md:leading-8">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div className="pvg-knowledge-cta relative overflow-hidden rounded-2xl px-6 py-14 text-center md:px-12 md:py-20">
          <p className="pvg-knowledge-cta-eyebrow text-[11px] font-bold uppercase tracking-[0.28em]">
            Authentic · Energised · Certified
          </p>
          <h2
            className="mx-auto mt-4 max-w-3xl"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15 }}
          >
            Find the right Vedic gemstone for your kundali
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 md:text-base">
            Speak with our senior astrologers and astro-gemologists for a personalised chart-based
            gemstone recommendation — backed by lab certification and Vedic energisation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="pvg-knowledge-btn-primary px-7 py-3.5 text-sm">
              Shop Gemstones
            </Link>
            <Link href="/consultation" className="pvg-knowledge-btn-outline px-7 py-3.5 text-sm">
              Book Consultation
            </Link>
            <a
              href="https://wa.me/919810335577"
              target="_blank"
              rel="noopener noreferrer"
              className="pvg-knowledge-btn-outline px-7 py-3.5 text-sm"
            >
              WhatsApp Astrologer
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
