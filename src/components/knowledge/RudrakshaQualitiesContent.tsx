'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  RUDRAKSHA_FAQS,
  RUDRAKSHA_QUALITY_TIERS,
  RUDRAKSHA_TYPE_TABLE,
} from '@/lib/constants/rudraksha-rich-content';

const ROBOTO = "'Roboto', 'Roboto Fallback', system-ui, -apple-system, sans-serif";

const FAKE_SLIDES = [
  { src: '/rudraksha-knowledge/rq-slide1.jpg', label: 'Joined / glued half beads' },
  { src: '/rudraksha-knowledge/rq-slide2.jpg', label: 'Carved imitations' },
  { src: '/rudraksha-knowledge/rq-slide3.png', label: 'Chemically darkened seeds' },
];

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: RUDRAKSHA_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

export function RudrakshaQualitiesContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main
      className="min-h-screen bg-[#FDFAF5] pb-20 pt-28 md:pt-32"
      style={{ fontFamily: ROBOTO }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-[#FDFAF5] via-[#F7EFE0]/60 to-[#FDFAF5]" />
        <div className="pointer-events-none absolute -top-32 -right-32 -z-10 h-112 w-md rounded-full bg-[#B8861E]/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-112 w-md rounded-full bg-[#7A1515]/10 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#6B5B4E]">
            <Link href="/" className="hover:text-[#7A1515]">
              Home
            </Link>
            <span>/</span>
            <Link href="/knowledge" className="hover:text-[#7A1515]">
              Knowledge
            </Link>
            <span>/</span>
            <span className="text-[#4D0A0A]">Rudraksha Qualities</span>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.28em] text-[#B8861E]">
                Rudraksha · Authenticity Guide
              </p>
              <h1
                className="text-[#4D0A0A]"
                style={{
                  fontSize: 'clamp(34px, 5vw, 60px)',
                  lineHeight: 1.05,
                  fontWeight: 800,
                }}
              >
                Rudraksha Qualities
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#3B2F26] md:text-lg">
                Rudraksha is the seed of the <em>Elaeocarpus Ganitrus</em> tree —
                a sacred, naturally-occurring bead used in Vedic worship for
                thousands of years. Each bead is associated with a planet and a
                presiding deity. Identifying authentic Rudraksha is the first
                step to receiving its true healing power. Pure Vedic Gems has
                been dealing in genuine, lab-certified Rudrakshas direct from
                Nepal since <strong>1937</strong>.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/shop/rudraksha"
                  className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#7A1515]"
                >
                  Shop Authentic Rudraksha
                </Link>
                <Link
                  href="/consult"
                  className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
                >
                  Free Recommendation
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-[#DDD0B4] bg-white shadow-md">
                  <Image
                    src="/rudraksha-knowledge/rq-genuine.png"
                    alt="Genuine Rudraksha"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 300px"
                    priority
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-[#0A0A0A]/80 to-transparent p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E6C36F]">
                      Genuine
                    </p>
                  </div>
                </div>
                <div className="relative aspect-square overflow-hidden rounded-xl border border-[#DDD0B4] bg-white shadow-md">
                  <Image
                    src="/rudraksha-knowledge/rq-fake.png"
                    alt="Fake Rudraksha"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 300px"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-[#0A0A0A]/80 to-transparent p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E6948A]">
                      Fake / Imitation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality tiers */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            Quality Grades
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 800 }}
          >
            Rudraksha Qualities Available in the Market
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#6B5B4E] md:text-base">
            Rudraksha beads are generally available in three quality grades. The
            best grade is rare and is reserved for serious healing or daily
            worship use.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {RUDRAKSHA_QUALITY_TIERS.map((tier, idx) => (
            <div
              key={tier.name}
              className="group relative overflow-hidden rounded-xl border border-[#DDD0B4] bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="absolute top-0 left-0 h-1 w-full"
                style={{ background: tier.color }}
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
                Tier 0{idx + 1}
              </p>
              <h3
                className="mt-2 text-2xl font-bold"
                style={{ color: tier.color }}
              >
                {tier.name}
              </h3>
              <span
                className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                style={{ background: tier.color }}
              >
                {tier.badge}
              </span>
              <p className="mt-4 text-sm leading-7 text-[#3B2F26]">
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Fake bead awareness carousel */}
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
              Common Fake Rudraksha Patterns
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#6B5B4E]">
              The market is flooded with imitations — joined halves, carved
              wood, plastic and chemically treated seeds. Here are typical
              examples you should be able to spot.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {FAKE_SLIDES.map((slide) => (
              <div
                key={slide.src}
                className="overflow-hidden rounded-xl border border-[#DDD0B4] bg-white"
              >
                <div className="relative aspect-4/3 bg-[#FDF6E8]">
                  <Image
                    src={slide.src}
                    alt={slide.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <p className="border-t border-[#DDD0B4] px-4 py-3 text-center text-sm font-semibold text-[#4D0A0A]">
                  {slide.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs italic text-[#6B5B4E]">
            Always insist on an X-ray and lab certificate from a reputable
            astro-gemology lab before purchase.
          </p>
        </div>
      </section>

      {/* Mukhi table */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            Reference Table
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 800 }}
          >
            Types of Rudraksha (1 – 21 Mukhi)
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#6B5B4E] md:text-base">
            Each mukhi represents a different deity, planet and beej mantra. Tap
            any row to read the full guide.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-[#DDD0B4] bg-white">
          {/* Header */}
          <div className="hidden grid-cols-[1fr_1.2fr_0.8fr_1.6fr] gap-4 border-b border-[#DDD0B4] bg-[#4D0A0A] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white md:grid">
            <span>Mukhi</span>
            <span>Presiding Deity</span>
            <span>Ruling Planet</span>
            <span>Beej Mantra</span>
          </div>
          <div className="divide-y divide-[#EDE3CC]">
            {RUDRAKSHA_TYPE_TABLE.map((row, idx) => {
              const cells = (
                <>
                  <span className="font-bold text-[#4D0A0A]">{row.mukhi}</span>
                  <span className="text-sm text-[#3B2F26]">{row.deity}</span>
                  <span className="text-sm text-[#3B2F26]">{row.planet}</span>
                  <span className="text-sm text-[#6B5B4E]">{row.mantra}</span>
                </>
              );
              const className =
                'grid grid-cols-1 gap-1.5 px-5 py-4 transition hover:bg-[#FDF6E8] md:grid-cols-[1fr_1.2fr_0.8fr_1.6fr] md:gap-4' +
                (idx % 2 === 1 ? ' bg-[#FBF6EA]/40' : '');
              return row.slug ? (
                <Link
                  key={row.mukhi}
                  href={`/knowledge/rudraksha/${row.slug}`}
                  className={className}
                >
                  {cells}
                </Link>
              ) : (
                <div key={row.mukhi} className={className}>
                  {cells}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Rudraksha */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
              About Rudraksha
            </p>
            <h2
              className="mt-2 text-[#4D0A0A]"
              style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}
            >
              Sacred Seed of <em>Elaeocarpus Ganitrus</em>
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[#3B2F26] md:text-base md:leading-8">
              {[
                'Rudraksha trees grow naturally in the foothills of the Himalayas — primarily Nepal, India, Indonesia and Malaysia.',
                'Nepal-origin Rudrakshas are considered the most powerful for healing therapy.',
                'Beads range from 1 mukhi (face) to 21 mukhi, with special types like Gauri Shankar, Ganesh, Garbh-Gauri and Nir Mukhi.',
                'Each bead is associated with a planet, making it a precise planetary remedy when used under astrological guidance.',
                'In Vedic tradition, Rudrakshas are believed to be the tears of Lord Shiva — symbolising compassion and protection.',
                'Authentic beads should be unbroken, naturally formed and verified with X-ray testing.',
              ].map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2 inline-block h-2 w-2 flex-none rounded-full bg-[#B8861E]"
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#DDD0B4] bg-[#4D0A0A] p-7 text-[#F7EAD0] md:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E6C36F]">
              Why Pure Vedic Gems
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              Authenticity, Backed by Heritage
            </h3>
            <ul className="mt-6 space-y-5">
              {[
                {
                  title: 'Since 1937',
                  desc: 'Four generations of trusted expertise sourcing direct from Nepal.',
                },
                {
                  title: 'Lab Certified',
                  desc: 'Every bead supplied with a reputed astro-gemology lab certificate.',
                },
                {
                  title: 'Vedic Energised',
                  desc: 'Complete in-house Shudhikaran and Pran-Pratishtha rituals.',
                },
                {
                  title: 'Free Astro Recommendation',
                  desc: 'Birth-chart based guidance from senior astrologers.',
                },
              ].map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#B8861E] text-base font-bold text-white">
                    ✓
                  </span>
                  <div>
                    <p className="text-base font-bold text-white">{f.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#F7EAD0]/85">
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
            Rudraksha FAQs
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {RUDRAKSHA_FAQS.map((faq, idx) => {
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
                      (isOpen
                        ? 'bg-[#4D0A0A] text-white'
                        : 'bg-[#FDF6E8] text-[#4D0A0A]')
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

      {/* Big CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-14 text-center text-white md:px-12 md:py-20"
          style={{
            background:
              'linear-gradient(135deg, #4D0A0A 0%, #7A1515 55%, #4D0A0A 100%)',
          }}
        >
          <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[#B8861E]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#D4A843]/20 blur-3xl" />
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#E6C36F]">
            Authentic · Energised · Certified
          </p>
          <h2
            className="mx-auto mt-4 max-w-3xl"
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            Find the perfect Rudraksha for your karmic blueprint
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-[#F7EAD0]/85 md:text-base">
            Speak with our Vedic astrologers and astro-gemologists for a free
            chart-based Rudraksha recommendation — backed by lab certification
            and Vedic energisation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop/rudraksha"
              className="inline-flex items-center justify-center rounded-md bg-[#B8861E] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition hover:bg-[#D4A843]"
            >
              Shop Rudraksha
            </Link>
            <Link
              href="/consult"
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
