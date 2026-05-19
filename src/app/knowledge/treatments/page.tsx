import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'Treatments and Enhancements in Gemstones | PureVedicGems',
  description:
    'A detailed guide to gemstone treatments and enhancements including heating, oiling, dyeing, stabilization, bleaching, irradiation, diffusion, filling, lasering, and HPHT.',
};

type TreatmentGuide = {
  title: string;
  slug: string;
  summary: string;
  details: string[];
  disclosure: string;
  images: { src: string; alt: string }[];
};

const TREATMENTS: TreatmentGuide[] = [
  {
    title: 'Heating',
    slug: 'heating',
    summary: 'Heating is the most common gemstone treatment and may lighten, darken, intensify, or completely shift a stone color while improving apparent clarity and brightness.',
    details: [
      'Heating is usually irreversible under normal conditions and is detected by trained observers using laboratory equipment and microscopic indicators.',
      'Unheated rubies and sapphires may contain rutile needles or tiny gas bubbles in liquid-filled pockets. These internal features help labs support an unheated conclusion.',
      'Unheated rubies and sapphires in fine color command premium prices because truly fine untreated corundum is rare.',
      'Beryllium-assisted heating can dramatically alter sapphire color and must be disclosed because it is more than ordinary heat treatment.',
    ],
    disclosure: 'Acceptable when fully disclosed; premium pricing should be reserved for natural, untreated, or no-heat stones supported by a reliable lab report.',
    images: [
      { src: '/treatments/heatingimg1.webp', alt: 'Gemstone heating treatment example one' },
      { src: '/treatments/heatingimg2.webp', alt: 'Gemstone heating treatment example two' },
    ],
  },
  {
    title: 'Oiling',
    slug: 'oiling',
    summary: 'Oiling is most commonly associated with emeralds, where colorless oil enters surface-reaching fissures and makes fractures less visible.',
    details: [
      'Not every emerald is oiled, but oiling is widespread because emeralds commonly contain fissures that reach the surface.',
      'Fine emeralds with equal color and fewer surface-reaching fissures can command much higher prices because less filling is needed.',
      'Ultrasonic cleaning or steam cleaning can remove oil and make fractures appear whiter or more visible; such stones may need careful re-oiling.',
      'Colored oils and hard synthetic resin fillers can be used deceptively because they hide fractures and modify visible color. These should be avoided unless clearly disclosed and priced accordingly.',
    ],
    disclosure: 'Minor colorless oil in emerald is common; colored oil, resin filling, or hardeners such as Opticon require strict disclosure and should not be sold as untreated material.',
    images: [
      { src: '/treatments/oiling1.webp', alt: 'Emerald oiling treatment example one' },
      { src: '/treatments/oiling2.webp', alt: 'Emerald oiling treatment example two' },
    ],
  },
  {
    title: 'Dyeing',
    slug: 'dyeing',
    summary: 'Dyeing introduces color into porous or organic gem materials and is common in some pearls, chalcedony, coral beads, and decorative materials.',
    details: [
      'Japanese Akoya cultured pearls naturally occur in a limited color range. Very dark gray, bluish, violet, nearly black, or intense bronze pearls should be checked for dyeing.',
      'Pink tinting in cultured pearls can sometimes be detected around drill holes, blemishes, or concentrated color zones.',
      'South Sea and Tahitian pearls can naturally occur in exotic colors and are usually more valuable than dyed pearls of similar appearance.',
      'Dyeing of chalcedony and some pearls is prevalent and permanent. The key issue is whether the treatment is disclosed honestly.',
    ],
    disclosure: 'Acceptable in lower-price or decorative categories when disclosed; deceptive when used to imitate rarer natural colors.',
    images: [
      { src: '/treatments/dyeing1.webp', alt: 'Gemstone dyeing treatment example one' },
      { src: '/treatments/dyeing2.webp', alt: 'Gemstone dyeing treatment example two' },
    ],
  },
  {
    title: 'Impregnation and Stabilization',
    slug: 'impregnation-stabilization',
    summary: 'Impregnation fills porous material with wax or paraffin, while stabilization introduces a bonding agent, usually plastic, to make porous gems more durable.',
    details: [
      'Turquoise is the classic example. Stabilization helps prevent absorption of body oils and reduces discoloration risk.',
      'Impregnated pieces must be kept away from heat because wax or paraffin can melt or leak from the material.',
      'Surface waxing may be used to enhance luster in some stones, but it is not a major treatment for most gems.',
      'Opal may be stabilized with plastic to hide crazing, though this is uncommon and can be deceptive when not disclosed.',
    ],
    disclosure: 'Common for porous gems such as turquoise; acceptable when the buyer is told clearly and price reflects the treatment.',
    images: [
      { src: '/treatments/impregnationandstabilization1.webp', alt: 'Impregnation and stabilization example one' },
      { src: '/treatments/impregnationandstabilization2.webp', alt: 'Impregnation and stabilization example two' },
    ],
  },
  {
    title: 'Bleaching',
    slug: 'bleaching',
    summary: 'Bleaching lightens organic gem materials such as ivory, coral, pearls, and cultured pearls.',
    details: [
      'Bleaching is generally permanent and may be difficult or impossible to detect in normal trade observation.',
      'It is used to create a cleaner or lighter appearance in organic gem materials.',
      'In many pearl and organic gem categories, bleaching does not necessarily create a major price difference when it is expected and accepted.',
    ],
    disclosure: 'Usually accepted for organic gem materials, but high-value natural-color claims should still be documented.',
    images: [
      { src: '/treatments/Bleaching1.webp', alt: 'Gemstone bleaching treatment example one' },
      { src: '/treatments/Bleaching2.webp', alt: 'Gemstone bleaching treatment example two' },
    ],
  },
  {
    title: 'Irradiation',
    slug: 'irradiation',
    summary: 'Irradiation uses subatomic particles or radiation to change gemstone color, sometimes followed by heating for a more stable or attractive result.',
    details: [
      'Blue topaz is the best-known example. Natural blue topaz is rare and usually pale, while irradiated blue topaz is widely available.',
      'Off-color diamonds may be irradiated and heated to produce intense greens, yellows, blues, browns, and pinks.',
      'Cultured pearls may be irradiated to produce gray or blue colors, though dyeing is more common in these shades.',
      'Quartz, corundum, beryl, and spodumene varieties may be irradiated and annealed to produce desirable colors.',
    ],
    disclosure: 'Acceptable in many commercial gems when stable and disclosed; critical for pricing because natural-color rarity is very different.',
    images: [
      { src: '/treatments/Irradiation1.webp', alt: 'Gemstone irradiation treatment example one' },
      { src: '/treatments/Irradiation2.webp', alt: 'Gemstone irradiation treatment example two' },
    ],
  },
  {
    title: 'Diffusion',
    slug: 'diffusion',
    summary: 'Diffusion introduces coloring elements into a gem at high temperature, most famously in sapphires and other corundum gems.',
    details: [
      'Early surface diffusion created color only near the surface and could often be detected by immersion or magnification.',
      'Modern high-temperature diffusion can penetrate much deeper, sometimes throughout the stone, and may change color dramatically.',
      'Diffusion may improve color, change color, or create asterism in corundum.',
      'Beryllium diffusion is especially important to disclose because it can make low-value sapphire appear far more desirable.',
    ],
    disclosure: 'Must be disclosed clearly. Diffused stones should not be priced like natural-color or simple heat-only stones.',
    images: [
      { src: '/treatments/Diffusion1.webp', alt: 'Gemstone diffusion treatment example one' },
      { src: '/treatments/Diffusion2.webp', alt: 'Gemstone diffusion treatment example two' },
    ],
  },
  {
    title: 'Filling',
    slug: 'filling',
    summary: 'Filling uses glass, plastic, oil, resin, or other materials to fill surface fractures, cavities, or durability-related openings.',
    details: [
      'Filling is used in rubies, sapphires, diamonds, emeralds, and other gems with surface-reaching fractures or cavities.',
      'Under magnification, filled areas may reveal different surface luster, flash effects, bubbles, or spectral effects in fractures.',
      'Fillers can be damaged by heat, ultrasonic cleaning, repair work, re-tipping, and strong chemicals.',
      'Filled rubies have been studied extensively by gemological labs because filling can greatly affect durability and value.',
    ],
    disclosure: 'A major disclosure issue. Filled stones can be beautiful, but they must be priced and cared for as treated gems.',
    images: [
      { src: '/treatments/Filling1.webp', alt: 'Gemstone filling treatment example one' },
      { src: '/treatments/Filling2.webp', alt: 'Gemstone filling treatment example two' },
    ],
  },
  {
    title: 'Lasering',
    slug: 'lasering',
    summary: 'Lasering is mainly used on diamonds to create tiny drill channels that reach dark inclusions so they can be vaporized, bleached, or made less visible.',
    details: [
      'Laser drill holes are visible under magnification when viewed at the correct angle.',
      'A lasered diamond should be graded and priced with the treatment in mind even if the apparent clarity looks improved.',
      'Diamonds are treated this way because they can withstand laser heat better than most gemstones.',
      'Lasering does not make a diamond flawless; it changes the visibility of an inclusion and must be disclosed.',
    ],
    disclosure: 'Must be disclosed on diamond reports and pricing discussions. The clarity improvement is visual, not equivalent to natural clarity.',
    images: [
      { src: '/treatments/Lasering1.webp', alt: 'Diamond lasering treatment example one' },
      { src: '/treatments/Lasering2.webp', alt: 'Diamond lasering treatment example two' },
    ],
  },
  {
    title: 'High Pressure, High Temperature (HPHT)',
    slug: 'hpht',
    summary: 'HPHT treatment heats diamonds to high temperatures under high pressure to remove, lessen, or change color.',
    details: [
      'HPHT can reduce brownish coloration and make some diamonds appear colorless or more desirable.',
      'It may also create or modify fancy colors depending on the diamond type and treatment conditions.',
      'Detection requires advanced laboratory testing, so reliable diamond certification is essential.',
      'HPHT-treated diamonds are real diamonds, but their treatment status changes rarity, value, and disclosure obligations.',
    ],
    disclosure: 'Must be disclosed. A natural untreated diamond and an HPHT-treated diamond are not priced the same even when they look similar.',
    images: [
      { src: '/treatments/High%20Pressure%2C%20High%20Temperature%20%28HPHT%29%20Treatment1.webp', alt: 'HPHT diamond treatment example one' },
      { src: '/treatments/High%20Pressure%2C%20High%20Temperature%20%28HPHT%29%20Treatment2.webp', alt: 'HPHT diamond treatment example two' },
    ],
  },
];

const NOT_COMMONLY_ENHANCED = [
  'Garnet, except some demantoid reports',
  'Peridot',
  'Iolite',
  'Spinel',
  'Most Chrysoberyl varieties',
  'Tourmaline, except some Paraiba-type discussions',
  'Malachite',
  'Hematite',
  'Most feldspar, with caution around andesine and labradorite varieties',
] as const;

const BUYER_CHECKS = [
  'Ask for the treatment status in writing before purchase.',
  'Match the invoice, tag number, stone weight, photos, and certificate details.',
  'Use trusted gemological laboratories for high-value gems.',
  'Avoid vague words such as natural look, enhanced shine, or old stock unless treatment status is specific.',
  'For Jyotish use, prefer natural, properly disclosed, astrologically approved gemstones over cheaper treated material.',
] as const;

export default function GemstoneTreatmentsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <>
      {/* ── Hero + Intro ── */}
      <section className="bg-secondary/30 py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h1 className="font-heading text-4xl font-bold leading-tight text-primary md:text-5xl lg:text-6xl">
              Treatments &amp; Enhancements
            </h1>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" />
            <p className="mt-4 text-left text-sm leading-7 text-[#5a4a3a]">
              Many gemstones in the market have been treated to improve their appearance. Some treatments are stable and widely accepted when disclosed. Others can reduce durability, hide serious defects, or make a stone appear more valuable than it truly is. For Jyotish gemstones, disclosure is especially important because buyers rely on natural origin, purity, and a specific remedial purpose — not only on beauty. Pure Vedic Gems checks every stone through certified gemologists before adding it to stock, so customers receive genuine, authentic, and properly disclosed gemstones.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="bg-background py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-6">

            {TREATMENTS.map((treatment) => (
              <ScrollReveal key={treatment.slug}>
                <article
                  id={treatment.slug}
                  className="scroll-mt-32 overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fffdf8] shadow-[0_2px_20px_rgba(61,43,31,0.08)]"
                >
                  <div className="p-5 sm:p-6">
                    <div className="mx-auto max-w-5xl">
                      <div className="text-center">
                        <h2 className="font-heading text-3xl font-black leading-tight text-[#8b1a1a] sm:text-4xl lg:text-5xl">
                          {treatment.title}
                        </h2>
                        <div className="mt-2 flex items-center justify-center gap-3">
                          <span className="h-px flex-1 bg-[#9e6c18]" />
                          <span className="text-sm leading-none text-[#9e6c18]">◆</span>
                          <span className="h-px flex-1 bg-[#9e6c18]" />
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-[#8a5c1a] sm:text-base">
                        {treatment.summary}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {treatment.images.map((img) => (
                          <div
                            key={img.src}
                            className="relative"
                            style={{ aspectRatio: '4 / 3' }}
                          >
                            <Image
                              src={img.src}
                              alt={img.alt}
                              fill
                              className="object-contain"
                              sizes="(max-width: 767px) 100vw, 50vw"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-sm border border-[#e8dcc8] bg-[#fffaf2] p-4 sm:p-5">
                          <h3 className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#8b1a1a]">Details</h3>
                          <div className="h-0.5 w-8 bg-[#8b1a1a]" />
                          <ul className="mt-3 space-y-2.5">
                            {treatment.details.map((point) => (
                              <li key={point} className="flex items-start gap-2.5 text-sm leading-7 text-[#5a4a3a]">
                                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b1a1a]" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-sm border border-[#e8dcc8] bg-[#fffaf2] p-4 sm:p-5">
                          <h3 className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#c9a84c]">Disclosure Guidance</h3>
                          <div className="h-0.5 w-8 bg-[#c9a84c]" />
                          <p className="mt-3 text-sm leading-7 text-[#5a4a3a]">{treatment.disclosure}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}

            {/* Buyer Checks */}
            <ScrollReveal>
              <div className="rounded-sm border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_20px_rgba(61,43,31,0.08)] sm:p-6">
                <h2 className="font-heading text-xl font-black text-[#8b1a1a]">Buyer&apos;s Checklist</h2>
                <div className="mt-1 h-0.5 w-8 bg-[#8b1a1a]" />
                <ul className="mt-3 space-y-2.5">
                  {BUYER_CHECKS.map((check) => (
                    <li key={check} className="flex items-start gap-3 text-sm leading-7 text-[#5a4a3a]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c9a84c] text-[10px] font-black text-[#c9a84c]">
                        ✓
                      </span>
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>

            {/* Not Commonly Enhanced */}
            <ScrollReveal>
              <div className="rounded-sm border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_20px_rgba(61,43,31,0.08)] sm:p-6">
                <h2 className="font-heading text-xl font-black text-[#8b1a1a]">Gemstones With Fewer Known Enhancements</h2>
                <div className="mt-1 h-0.5 w-8 bg-[#8b1a1a]" />
                <p className="mt-3 text-sm leading-7 text-[#5a4a3a]">
                  Some gemstones are not commonly enhanced, though gem treatment technology changes constantly and new methods may appear. Even in these categories, reliable sourcing and testing remain important.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {NOT_COMMONLY_ENHANCED.map((gem) => (
                    <span key={gem} className="rounded-sm border border-[#e0d0b0] bg-[#fdf8ef] px-3 py-1.5 text-xs text-[#5a4a3a]">
                      {gem}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e8a70]">Our Quality Promise</p>
                  <p className="mt-1 max-w-xl text-sm text-[#5a4a3a]">
                    Our certified gemologists check every gemstone for the treatments listed above before adding it to stock. We recommend proper lab certification for all high-value Jyotish stones.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/knowledge/gemstones"
                    className="inline-flex items-center gap-2 bg-[#6b1111] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#8b1a1a]"
                  >
                    Read Navratnas Guide &rarr;
                  </Link>
                  <Link
                    href="/consultation"
                    className="inline-flex items-center gap-2 border border-[#e0d0b0] bg-white px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[#8b1a1a] transition hover:border-[#8b1a1a]"
                  >
                    Ask an Expert &rarr;
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
            headline: 'Treatments and Enhancements in Gemstones',
            description: 'A detailed guide to gemstone treatments and disclosure guidance.',
            url: `${siteUrl}/knowledge/treatments`,
            hasPart: TREATMENTS.map((treatment) => ({
              '@type': 'Article',
              headline: treatment.title,
              url: `${siteUrl}/knowledge/treatments#${treatment.slug}`,
            })),
          }),
        }}
      />
    </>
  );
}
