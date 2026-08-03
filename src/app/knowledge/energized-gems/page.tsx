import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import './energized-gems-page.css';

export const metadata: Metadata = {
  title: 'Purified and Energised Gemstones | PureVedicGems',
  description:
    'How Pure Vedic Gems purifies and energises Jyotish gemstones with Shudhikaran, planetary beej mantra, and Prana Pratishta pooja — natural stones, in-house Vedic rituals since 1937.',
};

/** Each asset used once on this page. */
const IMG = {
  tealGem: '/knowledge/energized-gems/teal-energized-gem.png',
  prismatic: '/knowledge/energized-gems/prismatic-gem.png',
  aura: '/knowledge/energized-gems/aura-energy.png',
  sage: '/knowledge/energized-gems/vedic-sage-manuscripts.png',
  vedas: '/knowledge/energized-gems/four-vedas.png',
  mantras: '/knowledge/energized-gems/navagraha-mantras-scroll.png',
} as const;

const ENERGIZED_VIDEO_URL = 'https://www.youtube.com/embed/FQ3zVx86Ruc';

/**
 * Legacy Pure Vedic Gems energized-gems page copy (canonical).
 * Source: existing /knowledge/energized-gems content & live site messaging.
 */
const LEGACY_INTRO =
  'Pure Vedic Gems are Genuine and Effective Astro-Jyotish Approved Gems because they are free from the negative inclusions (energies) described in the Ancient Sacred Vedic Texts on Gems Therapy, kept away from the various artificial treatments being done on gemstones nowadays so the stones remain pure and natural, and purified and energized with the concerned planetary Vedic mantra and ancient rituals to magnify positive aura and energy.';

/**
 * Navaratna beej mantras — same strings published on Pure Vedic Gems gem-quality /
 * Navaratna guides (gem-qualities.ts + navaratna-content.ts).
 * Venus primary ratna is Diamond (Heera); white sapphire is the traditional substitute.
 */
const NAVARATNA_MANTRAS = [
  { gem: 'Ruby', hindi: 'Manik', planet: 'Sun (Surya)', mantra: 'Om Hram Hrim Hroum Sah Suryaya Namah' },
  { gem: 'Pearl', hindi: 'Moti', planet: 'Moon (Chandra)', mantra: 'Om Shram Shrim Shroum Sah Chandraya Namah' },
  { gem: 'Red Coral', hindi: 'Moonga', planet: 'Mars (Mangal)', mantra: 'Om Kram Krim Kroum Sah Bhaumaya Namah' },
  { gem: 'Emerald', hindi: 'Panna', planet: 'Mercury (Budh)', mantra: 'Om Bram Brim Broum Sah Budhaya Namah' },
  { gem: 'Yellow Sapphire', hindi: 'Pukhraj', planet: 'Jupiter (Guru)', mantra: 'Om Gram Grim Groum Sah Gurave Namah' },
  { gem: 'Diamond', hindi: 'Heera', planet: 'Venus (Shukra)', mantra: 'Om Dram Drim Droum Sah Shukraya Namah' },
  { gem: 'Blue Sapphire', hindi: 'Neelam', planet: 'Saturn (Shani)', mantra: 'Om Pram Prim Proum Sah Shanaye Namah' },
  { gem: 'Hessonite', hindi: 'Gomed', planet: 'Rahu', mantra: 'Om Bhram Bhrim Bhroum Sah Rahave Namah' },
  { gem: "Cat's Eye", hindi: 'Lehsuniya', planet: 'Ketu', mantra: 'Om Shram Shrim Shroum Sah Ketave Namah' },
] as const;

const RITUAL_STEPS = [
  {
    step: '01',
    title: 'Natural selection',
    body: 'Only natural, Astro-Jyotish suitable gems are chosen — free from the negative inclusions described in classical gem therapy texts, and kept away from undisclosed artificial treatments.',
  },
  {
    step: '02',
    title: 'Shudhikaran',
    body: 'The gem is purified (Shudhikaran) before wear, clearing residual handling energies so it is ready for planetary mantra work.',
  },
  {
    step: '03',
    title: 'Planetary beej mantra',
    body: 'The stone is energised with the beej mantra of its ruling Graha, matching the gem to the planet it is prescribed for.',
  },
  {
    step: '04',
    title: 'Prana Pratishta pooja',
    body: 'In-house Prana Pratishta pooja is performed as per ancient rituals — available according to gotra and rashi, with live streaming or recorded documentation when selected at purchase.',
  },
] as const;

export default function EnergizedGemsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <main className="pvg-energized-page min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-6 pt-10 sm:px-6 lg:pt-14" aria-labelledby="energized-hero-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="pvg-energized-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/knowledge">Knowledge</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Energized Gems</span>
          </nav>
          <h1 className="section-title" id="energized-hero-heading">
            Purified and Energised Gemstones
          </h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
            Shudhikaran, planetary beej mantra, and Prana Pratishta — in-house Vedic preparation since 1937.
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
        </div>
      </section>

      <section className="pvg-energized-main" aria-label="Energized gems guidance">
        <div className="pvg-energized-stack">
          {/* 1 — teal gem: what PVG means by energised */}
          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--maroon">
              <div className="pvg-energized-split">
                <div className="pvg-energized-media">
                  <Image
                    src={IMG.tealGem}
                    alt="Illustration of an energised Jyotish gemstone"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20"
                    aria-hidden="true"
                  />
                  <p className="pvg-energized-media-caption">Purified · Energised · Ready to wear</p>
                </div>
                <div className="pvg-energized-card-body">
                  <p className="pvg-energized-kicker">Our standard</p>
                  <h2 className="pvg-energized-title">What makes a Pure Vedic Gem effective</h2>
                  <p className="pvg-energized-lead">{LEGACY_INTRO}</p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* 2 — prismatic: natural / untreated */}
          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--gold">
              <div className="pvg-energized-split pvg-energized-split--flip">
                <div className="pvg-energized-card-body">
                  <p className="pvg-energized-kicker">Natural first</p>
                  <h2 className="pvg-energized-title">Pure stones before any ritual</h2>
                  <p className="pvg-energized-lead">
                    For Jyotish use, Pure Vedic Gems focuses on natural gemstones and full treatment disclosure. Stones
                    kept free of the artificial treatments commonly used only to improve looks remain suitable for
                    planetary remedy when the chart calls for them.
                  </p>
                  <p className="pvg-energized-lead">
                    Selection also avoids gems with the negative inclusions described in classical Vedic texts on gem
                    therapy — so energisation is applied only to stones already fit for Astro-Jyotish wear.
                  </p>
                </div>
                <div className="pvg-energized-media">
                  <Image
                    src={IMG.prismatic}
                    alt="Natural faceted gemstone with light refraction"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* 3 — aura: ritual path */}
          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--maroon">
              <div className="pvg-energized-split">
                <div className="pvg-energized-media">
                  <Image
                    src={IMG.aura}
                    alt="Visual metaphor for gemstone aura and vibrational energy"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
                <div className="pvg-energized-card-body">
                  <p className="pvg-energized-kicker">In-house ritual</p>
                  <h2 className="pvg-energized-title">From purification to Prana Pratishta</h2>
                  <p className="pvg-energized-lead">
                    Before wearing a Jyotish gem, it is purified (Shudhikaran) and energised with the planet’s beej
                    mantra. This prepares the stone and aligns it with the wearer’s kundali. Pure Vedic Gems performs
                    these Vedic rituals in-house at our research centre and temple setup.
                  </p>
                  <ol className="pvg-energized-steps">
                    {RITUAL_STEPS.map((item) => (
                      <li key={item.step} className="pvg-energized-step">
                        <span className="pvg-energized-step-num">{item.step}</span>
                        <h3 className="pvg-energized-step-title">{item.title}</h3>
                        <p className="pvg-energized-step-copy">{item.body}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* 4 — sage: tradition */}
          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--gold">
              <div className="pvg-energized-split pvg-energized-split--flip">
                <div className="pvg-energized-card-body">
                  <p className="pvg-energized-kicker">Lineage</p>
                  <h2 className="pvg-energized-title">Ancient rituals, family practice since 1937</h2>
                  <p className="pvg-energized-lead">
                    Pure Vedic Gems Pvt. Ltd. is a four-generation family house for Astro-Jyotish gemstones, authentic
                    Rudrakshas, and Vedic remedies. Purification and energisation are carried out as per ancient
                    scriptures at our in-house Vedic research centre and temple setup — not as a label added after
                    packing.
                  </p>
                  <p className="pvg-energized-lead">
                    Energisation of gemstones and Rudrakshas can be performed according to the wearer’s gotra and
                    rashi. Live streaming or recording of the ritual is available when you select that option with your
                    order.
                  </p>
                </div>
                <div className="pvg-energized-media pvg-energized-media--tall">
                  <Image
                    src={IMG.sage}
                    alt="Vedic sage and manuscript panels representing traditional knowledge"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* 5 — vedas: knowledge frame */}
          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--maroon">
              <div className="pvg-energized-split">
                <div className="pvg-energized-media pvg-energized-media--tall">
                  <Image
                    src={IMG.vedas}
                    alt="Stack of the four Vedas — Rig, Yajur, Sama and Atharva"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>
                <div className="pvg-energized-card-body">
                  <p className="pvg-energized-kicker">Knowledge frame</p>
                  <h2 className="pvg-energized-title">Within the Vedic knowledge tradition</h2>
                  <p className="pvg-energized-lead">
                    Ratna (gem) therapy for Jyotish sits inside the wider Vedic knowledge stream — planetary deities
                    (Grahas), beej mantras, and careful selection of natural stones for remedial wear (ratna dharana).
                  </p>
                  <p className="pvg-energized-lead">
                    Our process follows that traditional framework: purify the gem, recite the concerned planetary
                    mantra, and complete Prana Pratishta so the stone is prepared to magnify positive aura for the
                    wearer when the chart supports it.
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* 6 — mantra scroll: Navaratna mantras */}
          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--gold">
              <div className="pvg-energized-split">
                <div className="pvg-energized-media pvg-energized-media--tall">
                  <Image
                    src={IMG.mantras}
                    alt="Traditional scroll showing Navagraha mantra presentation"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                </div>
                <div className="pvg-energized-card-body">
                  <p className="pvg-energized-kicker">Navaratna beej mantras</p>
                  <h2 className="pvg-energized-title">Mantra used for each planetary gem</h2>
                  <p className="pvg-energized-lead">
                    These are the Navaratna beej mantras published across Pure Vedic Gems gem guides. The same mantra
                    of the ruling planet is used during energisation; wearers may also recite it on the prescribed day
                    after the gem is set. White sapphire (Safed Pukhraj) uses the Venus mantra when worn as the
                    traditional Diamond substitute.
                  </p>
                  <ul className="pvg-energized-mantra-list">
                    {NAVARATNA_MANTRAS.map((row) => (
                      <li key={row.gem} className="pvg-energized-mantra-item">
                        <div>
                          <p className="pvg-energized-mantra-gem">
                            {row.gem} <span>({row.hindi})</span>
                          </p>
                          <p className="pvg-energized-mantra-planet">{row.planet}</p>
                        </div>
                        <p className="pvg-energized-mantra-text">{row.mantra}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal>
            <article className="pvg-energized-card pvg-energized-card--maroon">
              <div className="pvg-energized-card-body">
                <p className="pvg-energized-kicker">Watch</p>
                <h2 className="pvg-energized-title">Purified and energised gemstones</h2>
                <div className="pvg-energized-video">
                  <iframe
                    title="Purified and Energised Gemstones video"
                    src={ENERGIZED_VIDEO_URL}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            </article>
          </ScrollReveal>

          <ScrollReveal>
            <div className="pvg-energized-cta">
              <div>
                <p className="pvg-energized-kicker">Next step</p>
                <p className="pvg-energized-cta-copy">
                  Need a gem chosen for your chart, then purified and energised with Prana Pratishta? Book a
                  consultation before you buy — or browse the Navaratna collection.
                </p>
              </div>
              <div className="pvg-energized-cta-actions">
                <Link href="/consultation" className="pvg-energized-btn pvg-energized-btn--primary">
                  Book Consultation →
                </Link>
                <Link href="/knowledge/gemstones" className="pvg-energized-btn pvg-energized-btn--ghost">
                  View Navratnas →
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
            '@type': 'Article',
            headline: 'Purified and Energised Gemstones',
            description: LEGACY_INTRO,
            url: `${siteUrl}/knowledge/energized-gems`,
            image: [IMG.tealGem, IMG.prismatic, IMG.aura, IMG.sage, IMG.vedas, IMG.mantras],
            video: {
              '@type': 'VideoObject',
              name: 'Purified and Energised Gemstones',
              embedUrl: ENERGIZED_VIDEO_URL,
            },
          }),
        }}
      />
    </main>
  );
}
