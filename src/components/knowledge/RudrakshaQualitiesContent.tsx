'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { RudrakshaHomeCta } from '@/components/knowledge/RudrakshaHomeCta';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import {
  RUDRAKSHA_FAQS,
  RUDRAKSHA_QUALITY_TIERS,
  RUDRAKSHA_TYPE_TABLE,
} from '@/lib/constants/rudraksha-rich-content';

const IMG = {
  fake: '/rudraksha-knowledge/rq-fake.png',
  genuine: '/rudraksha-knowledge/rq-genuine.png',
  slide1: '/rudraksha-knowledge/rq-slide1.jpg',
  slide2: '/rudraksha-knowledge/rq-slide2.jpg',
  slide3: '/rudraksha-knowledge/rq-slide3.png',
  check: '/rudraksha-knowledge/rq-check.png',
} as const;

const ENERGIZING_VIDEO = 'https://www.youtube.com/watch?v=9pI78lewnRE';
const PURIFIED_RUDRAKSHA_VIDEO = 'https://www.youtube.com/watch?v=-HXXVCG12wM';

const ABOUT_RUDRAKSHA = [
  'Rudraksha is the seed of the Eliocarpus Ganitrus tree and plays an important role in a spiritual seeker’s life.',
  'Rudraksha is a very good support because it creates a cocoon of your own energy.',
  'It is also a kind of shield against negative energies.',
  'Rudrakshas trees mainly grows in the area from the Gangetic plain in the foothills of the Himalayas to Southeast Asia, Nepal, Indonesia, New Guinea to Australia, Guam, and Hawaii. But the best Quality and Most Effective Rudrakshas are from Nepal. Rudraksha seeds are covered by an outer husk of blue when fully ripe, and for this reason they are also known as blueberry beads.',
];

const TRUST_POINTS = [
  {
    bold: 'Pure Vedic Gems',
    text: ' is the oldest & most trusted name associated with all kinds of Vedic planetary gemstones and Rudrakshas.',
  },
  {
    bold: 'Genuine Gemstones & Rudrakshas',
    text: ' with certification from international standard labs only.',
  },
  {
    bold: 'Astrologically approved',
    text: ' (Jyotish standard) energized & purified gems Rudrakshas with Vedic mantras & rituals for best results.',
  },
];

const INSTRUCTION_COLUMNS = [
  [
    'Accurate Gemstone & Rudraksha / Gemstone consultation from genuine Vedic Astrologer.',
    'Only Genuine labs/world standard labs certification.',
    'Most reasonable prices (direct sourcing).',
    'We provide certification from labs having complete world`s standard equipments to test all the treatments, Manipulations and enhancements coming in Rudrakshas nowadays.',
  ],
  [
    'We provide most reasonable & genuine prices of Pure and Effective Rudrakshas across the globe.',
    'We have a huge collection of certified, authentic & genuine Rudrakshas.',
    'We also provide the special facility of energizing (Abhimantrit) the Gemstones & Rudrakshas according to personalized Gotra&Rashi through Vedic mantras.',
    'We provide complete genuine Vedic instructions for wearing gemstone and Rudrakshas.',
  ],
  [
    'If you have chosen to purify your life, a Rudraksha is a good tool and add, a little support on the way.',
    'It is also a kind of shield against negative energies.',
    'The Rudraksha beads directly act on the central nervous system by emitting bio electro-chemical impulse hence calming the mind.',
    'One should also pray to Lord Shiva (Chant Mantras) to attain best results.',
  ],
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

function LegacyImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`h-auto w-full max-w-[450px] ${className}`}
      sizes="(max-width: 768px) 100vw, 450px"
      priority={priority}
    />
  );
}

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

export function RudrakshaQualitiesContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="pvg-knowledge-page pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      {/* Hero */}
      <section className="border-b border-[#e8e0d4] bg-white py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <nav className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-[12px] text-[#9e8a70]">
            <Link href="/" className="transition hover:text-[#8b1a1a]">
              Home
            </Link>
            <span>/</span>
            <Link href="/knowledge" className="transition hover:text-[#8b1a1a]">
              Knowledge
            </Link>
            <span>/</span>
            <span className="text-[#8b1a1a]">Rudraksha Qualities</span>
          </nav>

          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#c9a84c]">
            Authenticity Guide · Since 1937
          </p>
          <h1 className="mx-auto mt-3 max-w-5xl font-heading text-3xl font-bold leading-tight text-primary sm:text-4xl md:text-5xl">
            OLDEST &amp; MOST TRUSTED GENUINE &amp; PURE RUDRAKSHAS SELLER IN INDIA!
          </h1>
          <OrnamentalDivider className="mx-auto mt-3 max-w-sm" />
          <p className="mx-auto mt-6 max-w-4xl text-left text-sm leading-7 text-[#5a4a3a] sm:text-base sm:leading-8">
            To benefit your lives with the Ancient Indian Vedic Science of Rudraksha Therapy, for
            protection against the negative energy of unfavourable planets and strengthen the weak
            body chakras, to make the cosmic forces of nature to work in your favor you need to wear
            Pure and Natural, Purified &amp; Energized (By Special Rudra Mantras), Genuine
            Rudrakshas recommended in your{' '}
            <Link href="/consultation" className="font-semibold text-[#8b1a1a] underline">
              Vedic horoscope
            </Link>{' '}
            with proper wearing rituals and mantras mentioned in the Ancient Vedas and Puranas
            (Sacred Texts)
          </p>
          <blockquote className="mx-auto mt-8 max-w-4xl rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] px-5 py-5 text-left text-sm italic leading-7 text-[#5a4a3a] sm:px-6 sm:text-base">
            &ldquo;Kindly buy only 100% Natural (non-tampered and not fake or artificially extra
            lines created) and Good quality (perfect shape and clear and prominent outer texture) and
            certified (with X-ray) by Genuine Lab Rudrakshas only. Also, the Magnetic Energy and
            Temperature tests are very important to know the power level of these Rudrakshas. After
            these, the{' '}
            <a
              href={ENERGIZING_VIDEO}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#8b1a1a] underline not-italic"
            >
              Energizing by Ancient Rituals/Mantras
            </a>{' '}
            is also very important&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Main content — full width container */}
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 md:space-y-12 md:py-12">
        {/* Quality comparison images */}
        <SectionCard>
          <h2 className="text-center font-heading text-2xl font-bold text-[#8b1a1a] sm:text-3xl">
            Rudraksha Qualities Available In Market
          </h2>
          <OrnamentalDivider className="mx-auto mt-2 max-w-xs" />
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col items-center text-center">
              <div className="w-full max-w-[450px] overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-3">
                <LegacyImage
                  src={IMG.fake}
                  alt="Poor Quality, fake and Tampered Rudrakshas"
                  width={450}
                  height={150}
                  priority
                  className="max-w-none"
                />
              </div>
              <span className="mt-4 inline-block rounded-sm bg-[#8b1a1a] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white">
                Poor Quality/fake and Tampered Rudrakshas
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-full max-w-[450px] overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-3">
                <LegacyImage
                  src={IMG.genuine}
                  alt="Genuine Quality, Natural and Pure Rudrakshas"
                  width={450}
                  height={150}
                  className="max-w-none"
                />
              </div>
              <span className="mt-4 inline-block rounded-sm bg-[#8b1a1a] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white">
                Genuine Quality/Natural and Pure Rudrakshas
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Characteristics */}
        <SectionCard className="text-center">
          <h3 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
            : Characteristics Of Rudrakshas :
          </h3>
          <ul className="mx-auto mt-6 max-w-4xl space-y-4 text-left text-sm leading-7 sm:text-base">
            {RUDRAKSHA_QUALITY_TIERS.map((tier) => (
              <li key={tier.name} className="flex gap-3">
                <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#c9a84c]" />
                <span>{tier.description}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* Fake rudraksha slides */}
        <SectionCard className="text-center">
          <h3 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
            Fake Rudrakshas/ Poor Quality Rudrakshas/ Tempered Rudrakshas
          </h3>
          <div className="mx-auto mt-6 flex max-w-[609px] flex-col items-center gap-4">
            {[IMG.slide1, IMG.slide2, IMG.slide3].map((src, i) => (
              <div
                key={src}
                className="w-full overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-2"
              >
                <LegacyImage
                  src={src}
                  alt={i === 0 ? 'rudraksha 1' : i === 1 ? 'rudraksha 2' : '3rd Slide'}
                  width={609}
                  height={169}
                  className="mx-auto max-w-none"
                />
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-4xl text-left text-sm leading-7 sm:text-base">
            Most of the Rudraksha Sellers are selling Treated, Fake, Tampered or Manipulated (to
            create artificial extra mukhi`s) and/or Rudrakshas with improper seeds and compartments
            inside (as the energy of the Rudraksha depends on seeds inside) which are comparatively
            cheaper. And they have shown to give negative energies and bring harmful effects in
            one&apos;s life. In the Ancient Sacred Texts (Vedas &amp; Puranas) also it is mentioned
            that these types of Rudrakshas are a total failure and bring negative effects and hence
            should be avoided. Make sure that the Rudraksha you are buying is not infected by any
            insect or broken and should not even be exactly round in shape etc. These kinds of
            Rudrakshas are considered defected or fake and should not be worn.
          </p>
        </SectionCard>

        {/* Mukhi table */}
        <SectionCard>
          <h2 className="text-center font-heading text-2xl font-bold text-[#8b1a1a] sm:text-3xl">
            Types of Rudraksha :
          </h2>
          <div className="mt-6 overflow-hidden rounded-sm border border-[#e0d0b0]">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:h-0.75 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9a84c]/60 [&::-webkit-scrollbar-track]:bg-[#fdf8ef]">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="pvg-knowledge-table-head border-b border-[#e0d0b0]">
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                      * Rudraksha
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                      Ruling God
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                      Planet
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide">
                      Mantras
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RUDRAKSHA_TYPE_TABLE.map((row, idx) => {
                    const rowClass =
                      'border-t border-[#e0d0b0]' + (idx % 2 === 1 ? ' bg-[#fdf8ef]/60' : '');
                    return (
                      <tr key={row.mukhi} className={rowClass + ' hover:bg-[#f7f2ea]'}>
                        <td className="px-4 py-3 font-semibold text-[#8b1a1a]">
                          {row.slug ? (
                            <Link
                              href={`/knowledge/rudraksha/${row.slug}`}
                              className="underline transition hover:text-[#c9a84c]"
                            >
                              {row.mukhi}
                            </Link>
                          ) : (
                            row.mukhi
                          )}
                        </td>
                        <td className="px-4 py-3">{row.deity}</td>
                        <td className="px-4 py-3">{row.planet}</td>
                        <td className="px-4 py-3">{row.mantra}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        {/* Certified CTA */}
        <SectionCard className="text-center">
          <h2 className="font-heading text-xl font-bold leading-snug text-[#8b1a1a] sm:text-2xl">
            Natural, Non-Tampered, Genuine Quality, Purified &amp; Energized by Ancient Rituals,
            Certified Rudrakshas for positive Healing energies in one&apos;s life.
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop/rudraksha" className="pvg-knowledge-btn-primary px-6 py-3 text-xs">
              View Our Rudraksha
            </Link>
            <Link href="/" className="pvg-knowledge-btn-outline px-6 py-3 text-xs">
              Visit Our Website
            </Link>
          </div>
        </SectionCard>

        {/* About rudraksha */}
        <SectionCard>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-7 sm:text-base">
            {ABOUT_RUDRAKSHA.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </SectionCard>

        {/* Trust points */}
        <SectionCard className="pvg-knowledge-on-dark !border-l-4">
          <div className="space-y-5">
            {TRUST_POINTS.map((point) => (
              <div key={point.bold} className="flex gap-3 border-b border-[#e8dcc8] pb-4 last:border-0 last:pb-0">
                <Image
                  src={IMG.check}
                  alt=""
                  width={22}
                  height={21}
                  className="mt-1 h-[21px] w-[22px] shrink-0"
                  aria-hidden
                />
                <p className="text-sm leading-7 sm:text-base">
                  <strong className="text-[#5c3d3d]">{point.bold}</strong>
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Purified & energized */}
        <SectionCard className="text-center">
          <h3 className="font-heading text-xl font-bold text-[#8b1a1a] sm:text-2xl">
            Purified &amp; Energized Genuine Rudrakshas
          </h3>
          <p className="mx-auto mt-4 max-w-4xl text-sm leading-7 sm:text-base">
            We deal in High Quality, Genuine, Authentic, Effective, Certified,{' '}
            <a
              href={PURIFIED_RUDRAKSHA_VIDEO}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#8b1a1a] underline"
            >
              Purified and Energized By Ancient Ritual Rudrakshas
            </a>{' '}
            Only (as mentioned in Pauranic classic texts) for best results
          </p>
        </SectionCard>

        {/* Pendant designs CTA */}
        <div className="overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-6 sm:p-8">
          <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
            <h3 className="text-center font-heading text-lg font-bold text-[#8b1a1a] lg:text-left lg:text-xl">
              Click here to View our Astrological-Approved Rudraksha Pendents Designs&rdquo;
            </h3>
            <Link href="/shop/rudraksha-jewelry" className="pvg-knowledge-btn-primary shrink-0 px-7 py-3.5 text-xs">
              Order Now
            </Link>
          </div>
        </div>

        {/* Three-column instruction lists */}
        <div className="grid gap-6 md:grid-cols-3">
          {INSTRUCTION_COLUMNS.map((column, colIdx) => (
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

        {/* Energizing video CTA */}
        <div className="overflow-hidden rounded-sm bg-[#8b1a1a] p-6 text-white sm:p-8">
          <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
            <h4 className="text-center text-base font-bold leading-snug lg:text-left lg:text-lg">
              <a
                href={ENERGIZING_VIDEO}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline transition hover:text-[#f5e6c8]"
              >
                Click here to View our &ldquo;Purifying and Energizing of Rudrakshas by Ancient
                Rituals at Pure Vedic Gems&rdquo;
              </a>
            </h4>
            <a
              href="tel:+919871582404"
              className="inline-flex shrink-0 items-center justify-center rounded-sm border-2 border-white px-6 py-3 text-[11px] font-black uppercase tracking-widest transition hover:bg-white hover:text-[#8b1a1a]"
            >
              +91 9871582404
            </a>
          </div>
        </div>
      </div>

      <RudrakshaHomeCta />

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-10 sm:px-6 md:space-y-12 md:pb-12">
        {/* FAQs */}
        <section id="faqs">
          <h2 className="text-center font-heading text-2xl font-bold text-[#8b1a1a] sm:text-3xl">
            Rudraksha Beads-Frequently Asked Questions
          </h2>
          <OrnamentalDivider className="mx-auto mt-2 max-w-xs" />
          <div className="mt-8 space-y-2">
            {RUDRAKSHA_FAQS.map((faq, idx) => {
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
    </main>
  );
}
