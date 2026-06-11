import Image from 'next/image';
import Link from 'next/link';
import { rudrakshaMukhiImage } from '@/lib/constants/rudraksha-category-images';
import {
  RUDRAKSHA_RICH_GUIDES,
  RUDRAKSHA_FAQS,
} from '@/lib/constants/rudraksha-rich-content';

const ROBOTO = "'Roboto', 'Roboto Fallback', system-ui, -apple-system, sans-serif";

const PILLARS = [
  {
    title: 'Sacred Origins',
    desc: 'Rudraksha is the seed of Elaeocarpus Ganitrus — believed to be the tears of Lord Shiva.',
    glyph: 'ॐ',
  },
  {
    title: 'Planetary Remedy',
    desc: 'Each mukhi is connected to a specific planet, deity and beej mantra.',
    glyph: '☉',
  },
  {
    title: 'Healing Bead',
    desc: 'Used in Vedic tradition for emotional, physical and spiritual well-being.',
    glyph: '🪷',
  },
  {
    title: 'Lab Verified',
    desc: 'Every Rudraksha at Pure Vedic Gems comes with an authentic lab and X-ray report.',
    glyph: '✓',
  },
];

export function RudrakshaIndexContent() {
  return (
    <main
      className="pvg-knowledge-page pb-20"
      style={{ fontFamily: ROBOTO }}
    >
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
            <span className="text-[#4D0A0A]">Rudraksha Library</span>
          </nav>

          <div className="text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[#B8861E]">
              Knowledge · Rudraksha
            </p>
            <h1
              className="mx-auto mt-3 max-w-3xl text-[#4D0A0A]"
              style={{
                fontSize: 'clamp(36px, 5.5vw, 64px)',
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              The Complete Rudraksha Library
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#3B2F26] md:text-lg">
              From the rare One Mukhi to the legendary Kubera Rudraksha — explore
              the sacred power, deities, ruling planets and authentic wearing
              rituals of all 21 Mukhi Rudrakshas.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/knowledge/rudraksha-qualities"
                className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#7A1515]"
              >
                Rudraksha Qualities Guide
              </Link>
              <Link
                href="/shop/rudraksha"
                className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
              >
                Shop Rudraksha
              </Link>
            </div>
          </div>

          {/* Pillars */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-[#DDD0B4] bg-white p-5 text-center shadow-sm"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4D0A0A] text-lg text-white">
                  <span aria-hidden>{p.glyph}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#4D0A0A]">
                  {p.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#6B5B4E]">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo card: Rudraksha qualities */}
      <section className="mx-auto mt-16 max-w-6xl px-4 md:px-8">
        <Link
          href="/knowledge/rudraksha-qualities"
          className="group relative block overflow-hidden rounded-2xl border border-[#DDD0B4] bg-linear-to-br from-white to-[#FDF6E8] transition hover:shadow-xl"
        >
          <div className="grid items-center gap-0 md:grid-cols-[1fr_1fr]">
            <div className="p-7 md:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
                New · Must Read
              </p>
              <h2
                className="mt-2 text-[#4D0A0A]"
                style={{
                  fontSize: 'clamp(24px, 3.2vw, 36px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                Rudraksha Qualities Guide
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#3B2F26] md:text-base">
                How to identify genuine Rudraksha · Compare High, Medium &
                Lower quality grades · Common fake patterns · Complete mukhi
                reference table · Honest FAQs.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#7A1515] group-hover:underline">
                Read full guide
                <span aria-hidden>→</span>
              </span>
            </div>
            <div className="relative aspect-4/3 md:aspect-auto md:h-full">
              <Image
                src="/rudraksha-knowledge/rq-genuine.png"
                alt="Authentic Rudraksha beads"
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          </div>
        </Link>
      </section>

      {/* 21 Mukhi grid */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            1 – 21 Mukhi
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800 }}
          >
            Explore Every Mukhi Rudraksha
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#6B5B4E] md:text-base">
            Each bead carries a unique blessing. Tap any card to read the full
            guide — deity, planet, beej mantra, benefits and wearing rituals.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {RUDRAKSHA_RICH_GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/knowledge/rudraksha/${g.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-[#DDD0B4] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#B8861E] hover:shadow-xl"
            >
              <div className="absolute top-3 right-3 z-10 rounded-full bg-[#4D0A0A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                {g.mukhi} Mukhi
              </div>
              <div className="relative aspect-4/3 bg-linear-to-br from-[#FDF6E8] to-[#F4E7CC]">
                <Image
                  src={rudrakshaMukhiImage(g.slug) ?? g.thumbImage}
                  alt={g.shortTitle}
                  fill
                  className="object-contain p-6 transition group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold text-[#4D0A0A] group-hover:text-[#7A1515]">
                  {g.shortTitle}
                </h3>
                <p className="mt-1 text-xs text-[#6B5B4E]">
                  <span className="font-semibold">{g.deity}</span> ·{' '}
                  {g.planet}
                </p>
                <p className="mt-3 line-clamp-3 flex-1 text-xs leading-5 text-[#3B2F26]">
                  {g.intro.split('. ')[0]}.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A1515]">
                  Read Guide
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick FAQ teaser */}
      <section className="mx-auto mt-20 max-w-4xl px-4 md:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8861E]">
            Most Asked
          </p>
          <h2
            className="mt-2 text-[#4D0A0A]"
            style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 800 }}
          >
            Rudraksha Quick Answers
          </h2>
        </div>
        <div className="mt-8 space-y-3">
          {RUDRAKSHA_FAQS.slice(0, 5).map((f) => (
            <details
              key={f.question}
              className="group overflow-hidden rounded-lg border border-[#DDD0B4] bg-white open:border-[#B8861E] open:shadow-md"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-sm font-bold text-[#4D0A0A] marker:hidden md:text-base">
                {f.question}
                <span
                  aria-hidden
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#faf9f7] text-lg font-bold text-[#7a3a3a] transition group-open:bg-[#f7f2ea] group-open:text-[#5c3d3d]"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-[#EDE3CC] bg-[#FDFAF5] px-5 py-5 text-sm leading-7 text-[#3B2F26] md:text-base">
                {f.answer}
              </div>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-sm">
          <Link
            href="/knowledge/rudraksha-qualities#faqs"
            className="font-bold uppercase tracking-[0.18em] text-[#7A1515] hover:underline"
          >
            View All FAQs →
          </Link>
        </p>
      </section>

      {/* Big CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div className="pvg-knowledge-cta relative overflow-hidden rounded-2xl px-6 py-14 text-center md:px-12 md:py-20">
          <p className="pvg-knowledge-cta-eyebrow text-[11px] font-bold uppercase tracking-[0.28em]">
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
            Find the Rudraksha that resonates with your karmic blueprint
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 md:text-base">
            Speak with our Vedic astrologers for a free chart-based Rudraksha
            recommendation. Every bead is lab-certified and Vedic-energised
            in-house.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop/rudraksha" className="pvg-knowledge-btn-primary px-7 py-3.5 text-sm">
              Shop Rudraksha
            </Link>
            <Link href="/consultation" className="pvg-knowledge-btn-outline px-7 py-3.5 text-sm">
              Get Consultation
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
