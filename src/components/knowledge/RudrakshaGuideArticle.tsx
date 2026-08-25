import Image from 'next/image';
import Link from 'next/link';
import type { MukhiRichGuide } from '@/lib/constants/rudraksha-rich-content';
import { RUDRAKSHA_RICH_GUIDES } from '@/lib/constants/rudraksha-rich-content';
import { KnowledgePageHero } from '@/components/knowledge/KnowledgePageHero';

export function getRudrakshaRichSchemas(
  guide: MukhiRichGuide,
  pathname: string,
  siteUrl: string,
) {
  const pageUrl = `${siteUrl}${pathname}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.intro,
      image: `${siteUrl}${guide.heroImage}`,
      author: { '@type': 'Organization', name: 'PureVedicGems' },
      publisher: { '@type': 'Organization', name: 'PureVedicGems', url: siteUrl },
      mainEntityOfPage: pageUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Knowledge', item: `${siteUrl}/knowledge` },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Rudraksha',
          item: `${siteUrl}/knowledge/rudraksha`,
        },
        { '@type': 'ListItem', position: 4, name: guide.shortTitle, item: pageUrl },
      ],
    },
  ];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#DDD0B4] bg-white p-4 shadow-[0_1px_0_rgba(77,10,10,0.04)]">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8861E]"
      >
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 font-semibold text-[#1C1C1C] md:text-base">
        {value}
      </p>
    </div>
  );
}

export function RudrakshaGuideArticle({
  guide,
  pathname,
}: {
  guide: MukhiRichGuide;
  pathname: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const schemas = getRudrakshaRichSchemas(guide, pathname, siteUrl);

  const related = RUDRAKSHA_RICH_GUIDES.filter(
    (g) => g.slug !== guide.slug,
  )
    .sort(
      (a, b) =>
        Math.abs(a.mukhi - guide.mukhi) - Math.abs(b.mukhi - guide.mukhi),
    )
    .slice(0, 6);

  return (
    <main className="pvg-knowledge-page pb-20">
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <KnowledgePageHero
        title={guide.title}
        subtitle={guide.intro}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Knowledge', href: '/knowledge' },
          { label: 'Rudraksha', href: '/knowledge/rudraksha' },
          { label: guide.shortTitle },
        ]}
      />

      <section className="mx-auto max-w-6xl px-4 md:px-8">
        <p className="mb-6 text-center text-xs font-extrabold uppercase tracking-[0.28em] text-[#B8861E]">
          {guide.mukhi} Mukhi · Authentic Rudraksha Guide
        </p>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href={guide.shopHref}
                className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-[#7A1515]"
              >
                Shop {guide.shortTitle}
              </Link>
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
              >
                Get Astro Consult
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-[#DDD0B4] bg-white shadow-xl shadow-[#4D0A0A]/10">
              <Image
                src={guide.heroImage}
                alt={guide.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
                priority
              />
            </div>
            <div className="absolute -bottom-5 -right-3 hidden rounded-lg border border-[#B8861E]/40 bg-white px-5 py-3 text-center shadow-lg md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
                Since 1937
              </p>
              <p className="mt-1 text-xs font-semibold text-[#4D0A0A]">
                Lab Certified · Energised
              </p>
            </div>
          </div>
        </div>

        {/* Key stats */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Presiding Deity" value={guide.deity} />
          <Stat label="Ruling Planet" value={guide.planet} />
          <Stat label="Beej Mantra" value={guide.beejMantra} />
          <Stat label="Chakra" value={guide.chakra ?? 'All / Universal'} />
        </div>
      </section>

      {/* Benefit groups */}
      <section className="mx-auto mt-16 max-w-6xl px-4 md:px-8">
        <h2
          className="text-center text-[#4D0A0A]"
          style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', fontWeight: 800, letterSpacing: '-0.01em' }}
        >
          Why Wear {guide.shortTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-base leading-7 text-[#6B5B4E]">
          Authentic, energised {guide.shortTitle} delivers measurable benefit across four
          dimensions of life — success, spirituality, health and inner peace.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {guide.benefitGroups.map((group) => (
            <div
              key={group.title}
              className="group relative overflow-hidden rounded-xl border border-[#DDD0B4] bg-white p-6 md:p-7"
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#B8861E]/8 transition group-hover:bg-[#B8861E]/14" />
              <h3 className="text-lg font-bold text-[#4D0A0A] md:text-xl">
                {group.title}
              </h3>
              <div className="mt-3 h-0.75 w-12 rounded-full bg-[#B8861E]" />
              <ul className="mt-5 space-y-3">
                {(group.points ?? []).map((p, idx) => (
                  <li key={idx} className="flex gap-3 text-sm leading-7 text-[#3B2F26]">
                    <span
                      aria-hidden
                      className="mt-2 inline-block h-1.5 w-1.5 flex-none rounded-full bg-[#7A1515]"
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Who can wear */}
      {guide.whoCanWear && guide.whoCanWear.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 md:px-8">
          <div className="rounded-2xl border border-[#DDD0B4] bg-linear-to-br from-white to-[#FDF6E8] p-6 md:p-10">
            <h2
              className="text-[#4D0A0A]"
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800 }}
            >
              Who Should Wear {guide.shortTitle}
            </h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {guide.whoCanWear.map((p, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-md bg-white/70 p-4 text-sm leading-7 text-[#3B2F26]"
                >
                  <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#4D0A0A] text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* How to wear */}
      <section className="mx-auto mt-16 max-w-6xl px-4 md:px-8">
        <div className="grid items-stretch gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="pvg-knowledge-on-dark rounded-2xl p-7 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a67c2e]">
              Vedic Ritual
            </p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              How to Wear {guide.shortTitle}
            </h2>
            <p className="pvg-knowledge-on-dark-muted mt-5 text-sm leading-8 md:text-base md:leading-8">
              {guide.howToWear}
            </p>
            {guide.poojaMantra && (
              <div className="pvg-knowledge-mantra mt-5 rounded-lg p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a67c2e]">
                  Pooja Mantra
                </p>
                <p className="mt-2 text-sm font-semibold tracking-wide md:text-base">
                  {guide.poojaMantra}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-2xl border border-[#DDD0B4] bg-white p-7 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
              Authenticity Promise
            </p>
            <h3 className="mt-3 text-xl font-bold text-[#4D0A0A] md:text-2xl">
              Sourced Direct · Lab Certified · Vedic Energised
            </h3>
            <p className="mt-4 flex-1 text-sm leading-7 text-[#3B2F26] md:text-base md:leading-7">
              {guide.closing}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={guide.shopHref}
                className="inline-flex items-center justify-center rounded-md bg-[#4D0A0A] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#7A1515]"
              >
                Shop {guide.shortTitle}
              </Link>
              <a
                href="https://wa.me/919871582404"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border-2 border-[#4D0A0A] bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#4D0A0A] transition hover:bg-[#FDF6E8]"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Big CTA (homepage style) */}
      <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
        <div className="pvg-knowledge-cta relative overflow-hidden rounded-2xl px-6 py-14 text-center md:px-12 md:py-20">
          <p className="pvg-knowledge-cta-eyebrow text-[11px] font-bold uppercase tracking-[0.28em]">
            Authentic · Energised · Certified
          </p>
          <h2
            className="mx-auto mt-4 max-w-3xl"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15 }}
          >
            Bring the divine power of {guide.shortTitle} into your life
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 md:text-base">
            Get a personalised chart-based recommendation from our Vedic astrologers and discover
            the bead that resonates with your karmic blueprint.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={guide.shopHref} className="pvg-knowledge-btn-primary px-7 py-3.5 text-sm">
              Shop {guide.shortTitle}
            </Link>
            <Link href="/consultation" className="pvg-knowledge-btn-outline px-7 py-3.5 text-sm">
              Book Consultation
            </Link>
            <a
              href="https://wa.me/919871582404"
              target="_blank"
              rel="noopener noreferrer"
              className="pvg-knowledge-btn-outline px-7 py-3.5 text-sm"
            >
              WhatsApp Astrologer
            </a>
          </div>
        </div>
      </section>

      {/* Related mukhis */}
      <section className="mx-auto mt-20 max-w-6xl px-4 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B8861E]">
              Explore further
            </p>
            <h2
              className="mt-2 text-[#4D0A0A]"
              style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800 }}
            >
              Related Mukhi Rudrakshas
            </h2>
          </div>
          <Link
            href="/knowledge/rudraksha"
            className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[#7A1515] hover:underline md:inline"
          >
            View all 21 →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              href={`/knowledge/rudraksha/${r.slug}`}
              className="group flex gap-4 rounded-lg border border-[#DDD0B4] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#B8861E] hover:shadow-md"
            >
              <div className="relative h-20 w-20 flex-none overflow-hidden rounded-md border border-[#DDD0B4] bg-[#FDF6E8]">
                <Image
                  src={r.thumbImage}
                  alt={r.shortTitle}
                  fill
                  className="object-contain p-2"
                  sizes="80px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8861E]">
                  Mukhi {r.mukhi}
                </p>
                <h3 className="mt-1 truncate text-sm font-bold text-[#4D0A0A] group-hover:text-[#7A1515]">
                  {r.shortTitle}
                </h3>
                <p className="mt-1 truncate text-xs text-[#6B5B4E]">
                  {r.deity} · {r.planet}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
