'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { GEM_QUALITIES, GEM_QUALITY_FAQS, type GemQuality } from '@/lib/constants/gem-qualities';

const ROBOTO = "'Roboto', 'Roboto Fallback', system-ui, -apple-system, sans-serif";

export function GemQualityContent({ slug }: { slug: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const gem = GEM_QUALITIES.find((g) => g.slug === slug);
  if (!gem) return null;

  const others = GEM_QUALITIES.filter((g) => g.slug !== slug).slice(0, 4);

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
    <main
      className="min-h-screen bg-[#FDFAF5] pb-20 pt-28 md:pt-32"
      style={{ fontFamily: ROBOTO }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-[#FDFAF5] via-[#F7EFE0]/60 to-[#FDFAF5]" />
        <div
          className="pointer-events-none absolute -top-32 -right-32 -z-10 h-112 w-md rounded-full blur-3xl"
          style={{ background: `${gem.accent}22` }}
        />
        <div className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-112 w-md rounded-full bg-[#7A1515]/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B5B4E]">
            <Link href="/" className="hover:text-[#7A1515]">Home</Link>
            <span>/</span>
            <Link href="/knowledge" className="hover:text-[#7A1515]">Knowledge</Link>
            <span>/</span>
            <Link href="/knowledge/gem-qualities" className="hover:text-[#7A1515]">Gem Qualities</Link>
            <span>/</span>
            <span className="text-[#4D0A0A]">{gem.name}</span>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p
                className="mb-3 text-xs font-extrabold uppercase tracking-[0.28em]"
                style={{ color: gem.accent }}
              >
                {gem.planet} · Authenticity Guide
              </p>
              <h1
                className="text-[#4D0A0A]"
                style={{ fontSize: 'clamp(34px, 5vw, 60px)', lineHeight: 1.05, fontWeight: 800 }}
              >
                {gem.name} <span className="text-[#7A1515]">— {gem.hindiName}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#3B2F26] md:text-lg">
                {gem.intro}
              </p>

              {/* Quick spec strip */}
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Planet', value: gem.planet },
                  { label: 'Cosmic Ray', value: gem.cosmicRay },
                  { label: 'Day to Wear', value: gem.day },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-lg border border-[#DDD0B4] bg-white px-4 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8861E]">
                      {spec.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#4D0A0A]">{spec.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#7A1515]"
                >
                  Shop Authentic {gem.name}
                </Link>
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
                >
                  Free Recommendation
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#DDD0B4] bg-white shadow-xl">
                <Image
                  src={gem.heroImage}
                  alt={`Natural ${gem.name} (${gem.hindiName})`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 560px"
                  priority
                />
                <div
                  className="absolute bottom-0 left-0 right-0 p-4"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, transparent 100%)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E6C36F]">
                    Natural · Lab Certified · Energised
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {gem.name} — {gem.hindiName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Identification + Benefits */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#DDD0B4] bg-white p-7 md:p-9">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: gem.accent }}
            >
              Identification
            </p>
            <h2
              className="mt-2 text-[#4D0A0A]"
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800 }}
            >
              How to Recognise Natural {gem.name}
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[#3B2F26] md:text-base">
              {gem.identifyingFeatures.map((f, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-2 w-2 flex-none rounded-full"
                    style={{ background: gem.accent }}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-lg bg-[#FDF6E8] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7A1515]">
                Notable Sources
              </p>
              <p className="mt-2 text-sm leading-7 text-[#3B2F26]">
                {gem.sources.join(' · ')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DDD0B4] bg-[#4D0A0A] p-7 text-[#F7EAD0] md:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#E6C36F]">
              Astrological Benefits
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
              Why Wear {gem.hindiName}?
            </h2>
            <ul className="mt-6 space-y-4">
              {gem.benefits.map((b, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#B8861E] text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-7 text-[#F7EAD0]/90 md:text-base">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Quality Grades */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="text-center">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.28em]"
            style={{ color: gem.accent }}
          >
            Quality Grades
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 800 }}
          >
            {gem.name} Grades Available in the Market
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#6B5B4E] md:text-base">
            {gem.name} is generally available in three quality grades. The finest grade
            is reserved for Jyotish prescription and family heirlooms.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {gem.qualityGrades.map((tier, idx) => (
            <div
              key={tier.tier}
              className="group relative overflow-hidden rounded-xl border border-[#DDD0B4] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute top-0 left-0 h-1 w-full" style={{ background: tier.color }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
                Tier 0{idx + 1}
              </p>
              <h3 className="mt-2 text-2xl font-bold" style={{ color: tier.color }}>
                {tier.tier}
              </h3>
              <span
                className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                style={{ background: tier.color }}
              >
                {tier.badge}
              </span>
              <p className="mt-4 text-sm leading-7 text-[#3B2F26]">{tier.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fake awareness */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="rounded-2xl border border-[#DDD0B4] bg-linear-to-br from-white to-[#FDF6E8] p-6 md:p-10">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#7A1515]">
              Buyer Beware
            </p>
            <h2
              className="mt-2 text-[#4D0A0A]"
              style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}
            >
              Common Fake {gem.name} in the Market
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#6B5B4E]">
              The gem trade is flooded with treated, synthetic and imitation material. Here
              are the typical impostors of {gem.name}.
            </p>
          </div>

          <ul className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
            {gem.commonFakes.map((fake, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-[#DDD0B4] bg-white px-5 py-4"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#7A1515] text-xs font-bold text-white">
                  ✕
                </span>
                <span className="text-sm leading-7 text-[#3B2F26]">{fake}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-xs italic text-[#6B5B4E]">
            Always insist on a recognised lab certificate (GIA · IGI · GRS · Gübelin · GII)
            before purchase.
          </p>
        </div>
      </section>

      {/* Wearing ritual */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{ color: gem.accent }}
            >
              Vedic Wearing Ritual
            </p>
            <h2
              className="mt-2 text-[#4D0A0A]"
              style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}
            >
              How to Wear {gem.name}
            </h2>
            <div className="mt-6 space-y-5">
              {[
                { label: 'Beej Mantra', value: gem.beejMantra },
                { label: 'Finger', value: gem.ringFinger },
                { label: 'Day & Time', value: gem.day },
                { label: 'Metal', value: gem.metalSuggestion },
                { label: 'Weight Guidance', value: gem.weightGuidance },
                { label: 'Suits Rashi', value: gem.rashis.join(', ') },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid gap-1 rounded-lg border border-[#DDD0B4] bg-white p-5 md:grid-cols-[160px_1fr] md:items-center md:gap-6"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
                    {row.label}
                  </p>
                  <p className="text-sm font-semibold text-[#3B2F26] md:text-base">{row.value}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm italic leading-7 text-[#6B5B4E]">
              Recite the beej mantra 108 times before wearing, ideally on the recommended
              day during sunrise (or evening for Saturn/Rahu/Ketu stones). Pure Vedic
              Gems performs the full Shudhikaran and Pran-Pratishtha for every gem we ship.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDD0B4] bg-[#4D0A0A] p-7 text-[#F7EAD0] md:p-9">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E6C36F]">
              Why Pure Vedic Gems
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Authenticity, Backed by Heritage
            </h3>
            <ul className="mt-6 space-y-5">
              {[
                { title: 'Since 1937', desc: 'Four generations of trusted expertise in Jyotish gems.' },
                { title: 'Lab Certified', desc: 'Every gem supplied with a GIA / IGI / GRS certificate.' },
                { title: 'Vedic Energised', desc: 'Complete in-house Shudhikaran and Pran-Pratishtha rituals.' },
                { title: 'Free Recommendation', desc: 'Birth-chart-based guidance from senior Vedic astrologers.' },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#B8861E] text-base font-bold text-white">
                    ✓
                  </span>
                  <div>
                    <p className="text-base font-bold text-white">{f.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#F7EAD0]/85">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Long description */}
      <section className="mx-auto mt-20 max-w-4xl px-4 md:px-8">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
          About {gem.name}
        </p>
        <h2
          className="mt-2 text-center text-[#4D0A0A]"
          style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}
        >
          The Vedic Significance of {gem.hindiName}
        </h2>
        <p className="mt-6 text-center text-sm leading-8 text-[#3B2F26] md:text-base md:leading-9">
          {gem.longDescription}
        </p>
      </section>

      {/* FAQs */}
      <section className="mx-auto mt-20 max-w-4xl px-4 md:px-8" id="faqs">
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
                      (isOpen ? 'bg-[#4D0A0A] text-white' : 'bg-[#FDF6E8] text-[#4D0A0A]')
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

      {/* Explore other gems */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            Explore More
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}
          >
            Other Gemstone Quality Guides
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((g) => (
            <OtherGemCard key={g.slug} gem={g} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/knowledge/gem-qualities"
            className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
          >
            View All Gem Qualities
          </Link>
        </div>
      </section>

      {/* Big CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-14 text-center text-white md:px-12 md:py-20"
          style={{
            background: 'linear-gradient(135deg, #4D0A0A 0%, #7A1515 55%, #4D0A0A 100%)',
          }}
        >
          <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#B8861E]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#D4A843]/20 blur-3xl" />
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#E6C36F]">
            Authentic · Energised · Certified
          </p>
          <h2
            className="mx-auto mt-4 max-w-3xl"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15 }}
          >
            Find the perfect {gem.name} for your karmic blueprint
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-[#F7EAD0]/85 md:text-base">
            Speak with our Vedic astrologers and astro-gemologists for a free chart-based
            {' '}{gem.name} recommendation — backed by lab certification and Vedic energisation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-md bg-[#B8861E] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition hover:bg-[#D4A843]"
            >
              Shop {gem.name}
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center rounded-md border-2 border-white/80 bg-transparent px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              Free Consultation
            </Link>
            <a
              href="https://wa.me/919810335577"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
            >
              WhatsApp Astrologer
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function OtherGemCard({ gem }: { gem: GemQuality }) {
  return (
    <Link
      href={`/knowledge/gem-qualities/${gem.slug}`}
      className="group overflow-hidden rounded-xl border border-[#DDD0B4] bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-4/3 bg-[#FDF6E8]">
        <Image
          src={gem.heroImage}
          alt={gem.name}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div
          className="absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
          style={{ background: gem.accent }}
        >
          {gem.planet.split(' ')[0]}
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="text-base font-bold text-[#4D0A0A]">{gem.name}</p>
        <p className="mt-1 text-xs font-semibold text-[#7A1515]">{gem.hindiName}</p>
      </div>
    </Link>
  );
}
