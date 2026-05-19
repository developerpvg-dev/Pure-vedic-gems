import Link from 'next/link';
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'Purified and Energised Gemstones | PureVedicGems',
  description:
    'Legacy Pure Vedic Gems guidance on Prana Pratishta pooja, gemstone purification, planetary mantra energization, and positive aura preparation.',
};

const ENERGIZED_COPY =
  'Pure Vedic Gems are Genuine and Effective Astro-Jyotish Approved Gems because they are free from the negative inclusions (energies) described in the Ancient Sacred Vedic Texts on Gems Therapy, kept away from the various artificial treatments being done on gemstones nowadays so the stones remain pure and natural, and purified and energized with the concerned planetary Vedic mantra and ancient rituals to magnify positive aura and energy.';

const ENERGIZED_VIDEO_URL = 'https://www.youtube.com/embed/FQ3zVx86Ruc';

export default function EnergizedGemsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <>
      <section className="bg-secondary/30 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h1 className="font-heading text-4xl font-bold leading-tight text-primary md:text-5xl lg:text-6xl">
              Purified and Energised Gemstones
            </h1>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" />
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.24em] text-[#b8861e]">
              Prana Pratishta Pooja
            </p>
            <p className="mt-5 text-left text-sm leading-7 text-[#5a4a3a] sm:text-base">
              {ENERGIZED_COPY}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-background py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-6">
            <ScrollReveal>
              <div className="overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef]" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  title="Purified and Energised Gemstones video"
                  src={ENERGIZED_VIDEO_URL}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e8a70]">Next Step</p>
                  <p className="mt-1 max-w-xl text-sm text-[#5a4a3a]">
                    If you need a gem chosen and energized according to your chart, use the consultation flow before purchase.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/consultation"
                    className="inline-flex items-center gap-2 bg-[#6b1111] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#8b1a1a]"
                  >
                    Book Consultation &rarr;
                  </Link>
                  <Link
                    href="/knowledge/gemstones"
                    className="inline-flex items-center gap-2 border border-[#e0d0b0] bg-white px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[#8b1a1a] transition hover:border-[#8b1a1a]"
                  >
                    View Navratnas &rarr;
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Purified and Energised Gemstones',
            description: ENERGIZED_COPY,
            url: `${siteUrl}/knowledge/energized-gems`,
            video: {
              '@type': 'VideoObject',
              name: 'Purified and Energised Gemstones',
              embedUrl: ENERGIZED_VIDEO_URL,
            },
          }),
        }}
      />
    </>
  );
}