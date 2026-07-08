import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { KnowledgePageHero } from '@/components/knowledge/KnowledgePageHero';

const LIBRARIES = [
  {
    group: 'Gemstones',
    title: 'Navratnas',
    copy: 'The nine Vedic planetary gems — associations, wearing rules, mantras, and quality checks.',
    href: '/knowledge/gemstones',
  },
  {
    group: 'Gemstones',
    title: 'Gem Qualities',
    copy: 'Identify natural, untreated Jyotish-grade gems and understand quality grades.',
    href: '/knowledge/gem-qualities',
  },
  {
    group: 'Gemstones',
    title: 'Opal Qualities',
    copy: 'Australian opal quality tiers, play-of-colour grading, and Venus (Shukra) wearing guidance.',
    href: '/knowledge/gem-qualities/opal',
  },
  {
    group: 'Gemstones',
    title: 'Treatments & Enhancements',
    copy: 'Heating, oiling, dyeing, diffusion, filling, and other disclosures explained.',
    href: '/knowledge/treatments',
  },
  {
    group: 'Gemstones',
    title: 'Energized Gems',
    copy: 'Purification, Prana Pratishta pooja, and Vedic mantra energization.',
    href: '/knowledge/energized-gems',
  },
  {
    group: 'Gemstones',
    title: 'Gem Care',
    copy: 'Cleaning, maintenance, and gemstone-specific handling precautions.',
    href: '/knowledge/gems-care',
  },
  {
    group: 'Astrology',
    title: 'Vedic Astrology',
    copy: 'Navagraha, karma, planetary remedies, and the role of gems in Jyotish.',
    href: '/knowledge/astrology',
  },
  {
    group: 'Rudraksha',
    title: 'Rudraksha Library',
    copy: 'Complete 1 to 21 Mukhi guides with identification, care, and wearing rituals.',
    href: '/knowledge/rudraksha',
  },
  {
    group: 'Rudraksha',
    title: 'Rudraksha Qualities',
    copy: 'Genuine vs fake beads, quality grades, mukhi reference, and X-ray verification.',
    href: '/knowledge/rudraksha-qualities',
  },
] as const;

const GROUP_ORDER = ['Gemstones', 'Astrology', 'Rudraksha'] as const;

export function KnowledgeHubPage({ siteUrl }: { siteUrl: string }) {
  return (
    <div className="pvg-knowledge-page">
      <KnowledgePageHero
        title="The Vedic Gem Library"
        subtitle="Curated reference guides on gemstones, Rudraksha, astrology, and safe buying — from Pure Vedic Gems since 1937."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Knowledge' },
        ]}
      >
        <ScrollReveal>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/consultation" className="pvg-knowledge-btn-primary px-5 py-2.5 text-[11px]">
              Book Consultation
            </Link>
            <Link href="/tools/recommendation" className="pvg-knowledge-btn-outline px-5 py-2.5 text-[11px]">
              Get Recommendation
            </Link>
          </div>
        </ScrollReveal>
      </KnowledgePageHero>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="space-y-12">
            {GROUP_ORDER.map((group) => {
              const items = LIBRARIES.filter((item) => item.group === group);
              return (
                <ScrollReveal key={group}>
                  <div>
                    <h2 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#b8861e]">
                      {group}
                    </h2>
                    <ul className="divide-y divide-[#e8e0d4] overflow-hidden rounded-lg border border-[#e8e0d4] bg-white shadow-sm">
                      {items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="group flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-[#f7f2ea] sm:items-center sm:px-6 sm:py-5"
                          >
                            <div className="min-w-0">
                              <p className="font-heading text-base font-semibold text-[#5c3d3d] sm:text-lg">
                                {item.title}
                              </p>
                              <p className="mt-1 text-sm leading-6 text-[#6f6559]">{item.copy}</p>
                            </div>
                            <span
                              aria-hidden
                              className="mt-1 shrink-0 text-lg text-[#a67c2e] transition group-hover:translate-x-0.5 sm:mt-0"
                            >
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal>
            <div className="mt-14 flex flex-col items-start justify-between gap-4 rounded-lg border border-[#e8e0d4] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:px-6">
              <p className="text-sm leading-7 text-[#6f6559]">
                Need a gemstone matched to your birth chart? Speak with our Vedic experts before you buy.
              </p>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link href="/consultation" className="pvg-knowledge-btn-primary px-5 py-2.5 text-[11px]">
                  Book Consultation
                </Link>
                <Link href="/tools/recommendation" className="pvg-knowledge-btn-outline px-5 py-2.5 text-[11px]">
                  Get Recommendation
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'The Vedic Gem Library',
            description: 'Vedic gemstone and Rudraksha knowledge library from Pure Vedic Gems.',
            url: `${siteUrl}/knowledge`,
            hasPart: LIBRARIES.map((item) => ({
              '@type': 'WebPage',
              name: item.title,
              url: `${siteUrl}${item.href}`,
            })),
          }),
        }}
      />
    </div>
  );
}
