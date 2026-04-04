'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const EXPERTS = [
  {
    id: 'vikas',
    name: 'Mr. Vikas Mehra',
    generation: '3rd Generation Jeweller',
    primaryRole: 'Master Gemologist & Vedic Scholar',
    bio: 'With over two decades of immersive study in planetary gemology and Vedic astrology, Mr. Vikas Mehra bridges the ancient wisdom of Jyotish with the precision of modern gemological science. His multi-certification across GIA, IIG, and EGL ensures every recommendation is both cosmically aligned and scientifically verified.',
    specialties: ['GIA Certified', 'IIG Certified', 'EGL Certified', 'Vedic Astrology Research'],
    photo: '/our_expets_img/Mr. Vikash Mehra.jpeg',
    quote: 'Every stone carries a cosmic fingerprint — our duty is to match its destiny with yours.',
  },
  {
    id: 'tanya',
    name: 'Mrs. Tanya Mehra',
    generation: 'Vedic Astrology Specialist',
    primaryRole: 'Vedic Astrology Research Specialist',
    bio: 'Mrs. Tanya Mehra is a dedicated Vedic Astrology Research Specialist whose deep-rooted study of planetary influences and their relationship with precious gemstones has guided thousands toward clarity and purpose. Her consultations weave traditional Jyotish frameworks with an intuitive understanding of each individual\'s cosmic blueprint.',
    specialties: ['Jyotish Vidya', 'Planetary Gemology', 'Birth Chart Analysis', 'Gem Prescription'],
    photo: '/our_expets_img/Mrs . Tanya Mehra.jpeg',
    quote: 'The cosmos speaks through gemstones — our role is to help you listen.',
  },
  {
    id: 'vrayas',
    name: 'Mr. Vrayas Mehra',
    generation: '4th Generation Jeweller',
    primaryRole: 'GIA Certified Gemologist',
    bio: 'Representing the fourth generation of the Mehra jewellery legacy, Mr. Vrayas Mehra brings a rare combination of inherited craft mastery and internationally accredited gemological expertise. His GIA certification and hands-on experience in gemstone sourcing ensures every stone meets the highest standards of quality and authenticity.',
    specialties: ['GIA Certified', 'Gemstone Sourcing', 'Quality Certification', 'Heritage Craft'],
    photo: '/our_expets_img/Mr. Vrayas Mehra.jpeg',
    quote: 'Craftsmanship passed through generations lives in every gem we offer.',
  },
];

export function ExpertTeam() {
  return (
    <section
      className="relative overflow-hidden py-12 md:py-16"
      style={{
        background:
          'linear-gradient(160deg, #0F0805 0%, #1C100A 40%, #2A1810 70%, #1A0D07 100%)',
      }}
    >
      {/* Noise grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
        aria-hidden
      />

      {/* Giant heritage watermark */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden"
        aria-hidden
      >
        <span
          className="font-heading whitespace-nowrap font-black leading-none text-[#C9A84C]"
          style={{ fontSize: 'clamp(5rem, 20vw, 18rem)', opacity: 0.025, letterSpacing: '0.15em' }}
        >
          MEHRA
        </span>
      </div>

      {/* Top & bottom accent lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#C9A84C]/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#C9A84C]/50 to-transparent" />

      {/* Soft radial ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '900px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* ── Section Header ──────────────────────────────────── */}
        <div className="mb-10 text-center">
          <p
            className="font-body text-[10px] uppercase tracking-[6px] text-[#C9A84C]"
            style={{ letterSpacing: '0.45em' }}
          >
            Trusted Expertise
          </p>

          <h2 className="mt-4 font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Meet Our Experts
          </h2>

          {/* Ornamental rule */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <div
              className="h-px flex-1"
              style={{
                maxWidth: '80px',
                background: 'linear-gradient(to right, transparent, #C9A84C)',
              }}
            />
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M9 0L10.8 7.2L18 9L10.8 10.8L9 18L7.2 10.8L0 9L7.2 7.2Z"
                fill="#C9A84C"
                opacity="0.9"
              />
            </svg>
            <div
              className="h-px flex-1"
              style={{
                maxWidth: '80px',
                background: 'linear-gradient(to left, transparent, #C9A84C)',
              }}
            />
          </div>

          <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-white/50">
            Certified gemologists and Vedic consultants with decades of combined expertise.
          </p>
        </div>

        {/* ── Expert Rows — Alternating Editorial Layout ─────── */}
        <div className="space-y-8 md:space-y-12">
          {EXPERTS.map((expert, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-0`}
              >
                {/* ── Portrait Photo ─────────────────────────────── */}
                <div className="relative w-full shrink-0 md:w-[40%]">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '4 / 5' }}>
                    <Image
                      src={expert.photo}
                      alt={expert.name}
                      fill
                      className="object-cover object-top transition-transform duration-700 ease-out hover:scale-[1.03]"
                      sizes="(max-width: 768px) 100vw, 40vw"
                      priority={index === 0}
                    />
                    {/* Subtle vignette */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, transparent 50%, rgba(15,8,5,0.45) 100%)',
                      }}
                      aria-hidden
                    />
                    {/* Generation badge */}
                    <div
                      className="absolute bottom-0 left-0"
                      style={{
                        background: 'rgba(15,8,5,0.82)',
                        backdropFilter: 'blur(10px)',
                        borderTop: '1px solid rgba(201,168,76,0.35)',
                        borderRight: '1px solid rgba(201,168,76,0.35)',
                        padding: '8px 20px 8px 16px',
                      }}
                    >
                      <span
                        className="font-body text-[9px] font-semibold uppercase text-[#C9A84C]"
                        style={{ letterSpacing: '0.4em' }}
                      >
                        {expert.generation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Info Card — overlapping the photo ──────────── */}
                <div
                  className={`relative z-10 w-full -mt-10 ${isEven ? 'md:-ml-12 md:mt-0' : 'md:-mr-12 md:mt-0'} md:w-[60%]`}
                >
                  <div
                    className="group flex flex-col gap-2.5 p-5 sm:p-6"
                    style={{
                      background: 'linear-gradient(135deg, #FDF7EE 0%, #F9F2E6 100%)',
                      borderTop: '3px solid #C9A84C',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 2px 0 rgba(201,168,76,0.2) inset',
                    }}
                  >
                    {/* Role label */}
                    <span
                      className="font-body text-[9px] font-bold uppercase text-[#C9A84C] sm:text-[10px]"
                      style={{ letterSpacing: '0.4em' }}
                    >
                      {expert.primaryRole}
                    </span>

                    {/* Name */}
                    <h3
                      className="font-heading text-xl font-bold leading-tight text-[#1E0E06] sm:text-2xl md:text-[1.65rem]"
                      style={{ letterSpacing: '-0.02em', marginTop: '-2px' }}
                    >
                      {expert.name}
                    </h3>

                    {/* Gold rule */}
                    <div
                      className="h-px w-12"
                      style={{ background: '#C9A84C', marginTop: '-4px' }}
                    />

                    {/* Certifications / Specialties — highlighted */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {expert.specialties.map((s) => {
                        const isCert = /certified|gia|iig|egl/i.test(s);
                        return (
                          <span
                            key={s}
                            className={`font-body text-[9px] font-bold uppercase sm:text-[10px] ${
                              isCert
                                ? 'text-[#1E0E06]'
                                : 'text-[#6B4A30]'
                            }`}
                            style={{
                              letterSpacing: '0.15em',
                              border: isCert
                                ? '1.5px solid #C9A84C'
                                : '1px solid rgba(201,168,76,0.35)',
                              padding: isCert ? '5px 14px' : '4px 10px',
                              background: isCert
                                ? 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.12) 100%)'
                                : 'rgba(201,168,76,0.06)',
                              borderRadius: '2px',
                            }}
                          >
                            {isCert && (
                              <svg className="mr-1 -mt-px inline h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden>
                                <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.4 4.3 12.3l.7-4.1-3-2.9 4.2-.7z" fill="#C9A84C" />
                              </svg>
                            )}
                            {s}
                          </span>
                        );
                      })}
                    </div>

                    {/* Bio — compact */}
                    <p className="text-[11px] leading-relaxed text-[#5C4030] sm:text-xs line-clamp-3 md:line-clamp-none">
                      {expert.bio}
                    </p>

                    {/* Quote */}
                    <p
                      className="text-[11px] italic leading-relaxed text-[#9C7860] sm:text-xs"
                      style={{
                        borderLeft: '2px solid rgba(201,168,76,0.5)',
                        paddingLeft: '12px',
                      }}
                    >
                      &ldquo;{expert.quote}&rdquo;
                    </p>

                    {/* Book Consultation CTA */}
                    <div>
                      <a
                        href="/contact"
                        className="inline-flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-[#1E0E06] transition-all duration-300 hover:gap-4 sm:text-xs"
                        style={{
                          background: '#C9A84C',
                          padding: '10px 22px',
                        }}
                      >
                        Book Consultation
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M1 7h12M8 3l5 4-5 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Bottom Trust Footer ──────────────────────────────── */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <div
              className="h-px w-16"
              style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4))' }}
            />
            <div className="flex items-center gap-3">
              {['GIA', 'IIG', 'EGL'].map((cert) => (
                <span
                  key={cert}
                  className="font-body text-[8px] font-black uppercase text-[#C9A84C]/50"
                  style={{
                    letterSpacing: '0.25em',
                    border: '1px solid rgba(201,168,76,0.2)',
                    padding: '3px 9px',
                  }}
                >
                  {cert}
                </span>
              ))}
            </div>
            <div
              className="h-px w-16"
              style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.4))' }}
            />
          </div>
          <p
            className="font-body text-[9px] uppercase text-white/25"
            style={{ letterSpacing: '0.4em' }}
          >
            Certified · Trusted · Generational Excellence
          </p>
        </div>
      </div>
    </section>
  );
}
