'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { NavaratnaHomeCta } from '@/components/knowledge/NavaratnaHomeCta';
import { KnowledgePageHero } from '@/components/knowledge/KnowledgePageHero';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import {
  getGemLegacyGuide,
  LEGACY_GEM_QUALITY_SLUGS,
} from '@/lib/constants/gem-legacy-quality-data';
import { GEM_QUALITIES } from '@/lib/constants/gem-qualities';

function SectionCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        'rounded-sm border border-[#e8dcc8] bg-[#fffdf8] p-6 shadow-[0_2px_20px_rgba(61,43,31,0.08)] sm:p-8 ' +
        className
      }
    >
      {children}
    </div>
  );
}

function TierTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="pvg-knowledge-table-wrap mt-5 overflow-x-auto rounded-sm border border-[#e8dcc8]">
      <table className="w-full min-w-[320px] text-left text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[#e8dcc8] last:border-0">
              <th className="w-[38%] bg-[#fdf8ef] px-4 py-3 font-semibold text-[#5c3d3d]">
                {row.label}
              </th>
              <td className="px-4 py-3 leading-7 text-[#5a4a3a]">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GemLegacyQualityContent({ slug }: { slug: string }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const guide = getGemLegacyGuide(slug);
  const gemMeta = GEM_QUALITIES.find((g) => g.slug === slug);

  if (!guide) return null;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <div className="pvg-knowledge-page pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <KnowledgePageHero
        title={guide.legacyH1}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Knowledge', href: '/knowledge' },
          { label: 'Gem Qualities', href: '/knowledge/gem-qualities' },
          { label: gemMeta?.name ?? slug },
        ]}
      >
        <blockquote className="mx-auto mt-4 max-w-5xl rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] px-5 py-5 text-left text-sm italic leading-7 text-[#5a4a3a] sm:px-6 sm:text-base">
          &ldquo;{guide.certificationQuote}&rdquo;
        </blockquote>
      </KnowledgePageHero>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 md:space-y-12 md:py-12">
        {guide.sectionIntro && (
          <SectionCard className="text-center">
            <h2 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
              {guide.sectionIntro}
            </h2>
          </SectionCard>
        )}

        {guide.tiers.map((tier) => (
          <SectionCard key={tier.title}>
            <h2 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
              {tier.title}
            </h2>
            <TierTable rows={tier.rows} />
            {tier.note && (
              <p className="mt-4 text-sm italic leading-7 text-[#6f6559] sm:text-base">
                ({tier.note})
              </p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {tier.images.map((img) => (
                <div
                  key={img.src}
                  className="overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-2"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={400}
                    height={300}
                    className="h-auto w-full"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </SectionCard>
        ))}

        <SectionCard className="text-center">
          <Link href={guide.shopHref} className="pvg-knowledge-btn-primary px-8 py-3.5 text-sm">
            {guide.shopLabel}
          </Link>
        </SectionCard>

        {guide.introBullets && guide.introBullets.length > 0 && (
          <SectionCard>
            <ul className="space-y-3 text-sm leading-7 sm:text-base">
              {guide.introBullets.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#c9a84c]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {guide.trustPoints && guide.trustPoints.length > 0 && (
          <SectionCard className="pvg-knowledge-on-dark !border-l-4">
            <div className="space-y-5">
              {guide.trustPoints.map((point) => (
                <div
                  key={point.bold}
                  className="flex gap-3 border-b border-[#e8dcc8] pb-4 last:border-0 last:pb-0"
                >
                  <span className="mt-1 text-lg text-[#c9a84c]" aria-hidden>
                    ✓
                  </span>
                  <p className="text-sm leading-7 sm:text-base">
                    <strong className="text-[#5c3d3d]">{point.bold}</strong>
                    {point.text}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {guide.aboutTitle && guide.aboutParagraphs.length > 0 && (
          <SectionCard>
            <h2 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
              {guide.aboutTitle}
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 sm:text-base sm:leading-8">
              {guide.aboutParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </SectionCard>
        )}

        {guide.generalCharacteristics && guide.generalCharacteristics.length > 0 && (
          <SectionCard>
            <h3 className="font-heading text-lg font-bold text-[#8b1a1a] sm:text-xl">
              {guide.generalCharacteristicsTitle ?? 'General Characteristics'}
            </h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 sm:text-base">
              {guide.generalCharacteristics.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#c9a84c]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {guide.goodQualities && guide.goodQualities.length > 0 && (
          <SectionCard>
            <h3 className="font-heading text-lg font-bold text-[#8b1a1a] sm:text-xl">
              {guide.goodQualitiesTitle ?? 'Qualities of a Good Quality Jyotish Gem'}
            </h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 sm:text-base">
              {guide.goodQualities.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#c9a84c]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {guide.instructionColumns && guide.instructionColumns.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            {guide.instructionColumns.map((column, colIdx) => (
              <SectionCard key={colIdx} className="!p-5 sm:!p-6">
                <ul className="space-y-3 text-sm leading-7">
                  {column.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a84c]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ))}
          </div>
        )}

        {guide.energizingVideoHref && (
          <div className="overflow-hidden rounded-sm bg-[#8b1a1a] p-6 text-white sm:p-8">
            <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
              <h4 className="text-center text-base font-bold leading-snug lg:text-left lg:text-lg">
                <a
                  href={guide.energizingVideoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline transition hover:text-[#f5e6c8]"
                >
                  {guide.energizingVideoLabel}
                </a>
              </h4>
              {guide.phone && (
                <a
                  href={`tel:${guide.phone.replace(/\s/g, '')}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-sm border-2 border-white px-6 py-3 text-[11px] font-black uppercase tracking-widest transition hover:bg-white hover:text-[#8b1a1a]"
                >
                  {guide.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {guide.jewelleryCta && (
          <div className="overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-6 sm:p-8">
            <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
              <h3 className="text-center font-heading text-lg font-bold text-[#8b1a1a] lg:text-left lg:text-xl">
                {guide.jewelleryCta.title}
              </h3>
              <Link
                href={guide.jewelleryCta.href}
                className="pvg-knowledge-btn-primary shrink-0 px-7 py-3.5 text-xs"
              >
                {guide.jewelleryCta.label}
              </Link>
            </div>
          </div>
        )}
      </div>

      <NavaratnaHomeCta />

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-10 sm:px-6 md:pb-12">
        <section id="faqs">
          <h2 className="text-center font-heading text-2xl font-bold text-[#8b1a1a] sm:text-3xl">
            {guide.faqTitle ?? `${gemMeta?.name ?? 'Gemstone'} — Frequently Asked Questions`}
          </h2>
          <OrnamentalDivider className="mx-auto mt-2 max-w-xs" />
          <div className="mt-8 space-y-2">
            {guide.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.question}
                  className={
                    'overflow-hidden rounded-sm border bg-white ' +
                    (isOpen ? 'border-[#c9a84c]' : 'border-[#e8dcc8]')
                  }
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-bold text-[#5c3d3d] sm:text-base">
                      {faq.question}
                    </span>
                    <span
                      className={
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg font-bold transition ' +
                        (isOpen
                          ? 'bg-[#f7f2ea] text-[#8b1a1a]'
                          : 'bg-[#faf9f7] text-[#7a3a3a]')
                      }
                      aria-hidden
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#e8dcc8] bg-[#fdfaf5] px-5 py-5 text-sm leading-7 sm:text-base">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export { LEGACY_GEM_QUALITY_SLUGS };
