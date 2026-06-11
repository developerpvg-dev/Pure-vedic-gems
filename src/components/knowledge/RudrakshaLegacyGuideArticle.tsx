import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { RudrakshaHomeCta } from '@/components/knowledge/RudrakshaHomeCta';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import type { MukhiRichGuide } from '@/lib/constants/rudraksha-rich-content';
import { RUDRAKSHA_COLLECTION_LINKS } from '@/lib/constants/rudraksha-legacy-shared';
import { getRudrakshaRichSchemas } from '@/components/knowledge/RudrakshaGuideArticle';

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

function MetaHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-heading text-lg font-bold text-[#8b1a1a] sm:text-xl">{children}</h2>
  );
}

function BenefitSection({
  title,
  points,
  paragraphs,
}: {
  title: string;
  points?: string[];
  paragraphs?: string[];
}) {
  return (
    <SectionCard>
      <h2 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">{title}</h2>
      <OrnamentalDivider className="mt-2 max-w-xs" />
      {paragraphs?.map((p, i) => (
        <p key={`p-${i}`} className="mt-5 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
          {p}
        </p>
      ))}
      {points && points.length > 0 && (
        <ul className="mt-5 space-y-3 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
          {points.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#c9a84c]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function RudrakshaLegacyGuideArticle({
  guide,
  pathname,
}: {
  guide: MukhiRichGuide;
  pathname: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const schemas = getRudrakshaRichSchemas(guide, pathname, siteUrl);
  const h1 = guide.legacyH1 ?? guide.title.toUpperCase();

  return (
    <main className="pvg-knowledge-page pb-20">
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {/* Hero */}
      <section className="border-b border-[#e8e0d4] bg-white py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] text-[#9e8a70]">
            <Link href="/" className="transition hover:text-[#8b1a1a]">
              Home
            </Link>
            <span>/</span>
            <Link href="/knowledge" className="transition hover:text-[#8b1a1a]">
              Knowledge
            </Link>
            <span>/</span>
            <Link href="/knowledge/rudraksha" className="transition hover:text-[#8b1a1a]">
              Rudraksha
            </Link>
            <span>/</span>
            <span className="text-[#8b1a1a]">{guide.shortTitle}</span>
          </nav>

          <h1 className="text-center font-heading text-2xl font-bold uppercase leading-tight text-primary sm:text-3xl md:text-4xl">
            {h1}
          </h1>

          <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef]">
            <Image
              src={guide.heroImage}
              alt={guide.shortTitle}
              width={2400}
              height={600}
              className="h-auto w-full"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 md:space-y-10 md:py-12">
        <SectionCard className="space-y-4">
          <MetaHeading>Presiding Deity: {guide.deity}</MetaHeading>
          <MetaHeading>Ruling Planet: {guide.planet}</MetaHeading>
          <MetaHeading>Beej Mantra: &ldquo;{guide.beejMantra}&rdquo;</MetaHeading>
          {guide.poojaMantra && (
            <MetaHeading>Pooja Mantra: &ldquo;{guide.poojaMantra}&rdquo;</MetaHeading>
          )}
          <p className="pt-2 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
            {guide.intro}
          </p>
        </SectionCard>

        {guide.benefitGroups.map((group) => (
          <BenefitSection
            key={group.title}
            title={group.title}
            points={group.points}
            paragraphs={group.paragraphs}
          />
        ))}

        {guide.whoCanWear && guide.whoCanWear.length > 0 && (
          <BenefitSection
            title={`Who all can wear ${guide.shortTitle}.`}
            points={guide.whoCanWear}
          />
        )}

        <SectionCard>
          <h2 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
            How to wear {guide.shortTitle}.
          </h2>
          <OrnamentalDivider className="mt-2 max-w-xs" />
          <p className="mt-5 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
            {guide.howToWear}
          </p>
        </SectionCard>

        {guide.whereToBuy && (
          <SectionCard>
            <h2 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
              From where we can buy the original {guide.shortTitle}.
            </h2>
            <OrnamentalDivider className="mt-2 max-w-xs" />
            <p className="mt-5 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
              {guide.whereToBuy}
            </p>
            {guide.conclusion && (
              <p className="mt-5 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
                <strong>Conclusion: </strong>
                {guide.conclusion}
              </p>
            )}
            <p className="mt-5 text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
              If you want to see our wonderful collection of different Mukhi Rudrakshas and also
              want to buy pure and authentic Rudrakshas from Pure Vedic Gems then go through with
              these following links:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {RUDRAKSHA_COLLECTION_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm border border-[#e8dcc8] bg-white px-3 py-1.5 text-xs font-semibold text-[#8b1a1a] transition hover:border-[#8b1a1a] hover:bg-[#fdf8ef]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </SectionCard>
        )}

        {guide.closing && (
          <SectionCard>
            <p className="text-sm leading-7 text-[#5a4a3a] sm:text-base">{guide.closing}</p>
          </SectionCard>
        )}
      </div>

      <RudrakshaHomeCta className="mt-2" />
    </main>
  );
}
