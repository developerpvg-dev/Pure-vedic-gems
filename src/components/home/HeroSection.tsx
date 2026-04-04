'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Landmark, FlaskConical, Sparkles, PackageCheck } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      className="relative flex items-center overflow-hidden px-4 pb-12 pt-[108px] sm:px-6 md:px-10 lg:px-14 lg:pt-[130px]"
      style={{ minHeight: '100vh' }}
    >
      {/* Full-bleed background image */}
      <Image
        src="/herosectionimg.png"
        alt="Navaratna gemstone collection on golden mandala"
        fill
        className="object-cover object-center"
        priority
        quality={90}
      />

      {/* Gradient overlay — darkens left for text, fades right to reveal gems naturally */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(105deg, rgba(18,10,5,0.82) 0%, rgba(18,10,5,0.65) 38%, rgba(18,10,5,0.25) 62%, rgba(18,10,5,0.05) 100%)',
        }}
      />

      {/* Subtle vignette top/bottom */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Desktop layout */}
      <div
        className="relative z-10 mx-auto hidden w-full lg:block"
        style={{ maxWidth: '1400px' }}
      >
        {/* Left — Text Content (occupies ~50% width) */}
        <div style={{ maxWidth: '580px', animation: 'pvgSlideRight 1s ease-out' }}>
          {/* Heritage badge */}
          <div
            className="mb-8 inline-flex items-center gap-3 rounded border px-5 py-2"
            style={{
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              borderColor: 'rgba(201,168,76,0.4)',
              background: 'rgba(0,0,0,0.25)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              style={{ animation: 'pvgBlink 2s ease-in-out infinite' }}
            />
            Since 1937 &middot; Legacy Since 4 Generations
          </div>

          <h1
            className="font-heading"
            style={{
              fontSize: 'clamp(40px, 5vw, 72px)',
              lineHeight: 1.12,
              marginBottom: '28px',
              color: '#fff',
              animation: 'pvgSlideRight 1s ease-out 0.3s both',
              textShadow: '0 2px 24px rgba(0,0,0,0.5)',
            }}
          >
            Vedic Remedies
            <em className="block italic" style={{ fontStyle: 'italic', color: 'var(--accent)' }}>
              Refined
            </em>
          </h1>

          <p
            style={{
              fontSize: '17px',
              lineHeight: '1.9',
              maxWidth: '520px',
              marginBottom: '40px',
              color: 'rgba(255,255,255,0.78)',
              animation: 'pvgSlideRight 1s ease-out 0.5s both',
            }}
          >
            World&apos;s Oldest and Most Trusted Source for Natural, Certified and
            Vedic-Energised Gemstones, Rudrakshas and Yagyas Backed by Ancient Wisdom
            and Four Generations of Experience.
          </p>

          <div className="flex flex-wrap gap-4" style={{ animation: 'pvgSlideRight 1s ease-out 0.7s both' }}>
            <Link
              href="/shop"
              className="inline-flex items-center rounded px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'var(--pvg-accent)', color: '#1a0f08' }}
            >
              Explore Collection
            </Link>
            <Link
              href="/consultation"
              className="inline-flex items-center rounded border-2 px-10 py-4 text-[13px] font-semibold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5"
              style={{ borderColor: 'rgba(255,255,255,0.7)', color: '#fff', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)' }}
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile layout — single column */}
      <div className="relative z-10 mx-auto w-full lg:hidden" style={{ maxWidth: '640px' }}>
        <div
          className="mb-6 inline-flex items-center gap-3 rounded border px-4 py-2"
          style={{
            fontSize: '11px',
            letterSpacing: '3px',
            color: 'var(--accent)',
            borderColor: 'rgba(201,168,76,0.4)',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Since 1937 &middot; Legacy Since 4 Generations
        </div>
        <h1
          className="font-heading"
          style={{
            fontSize: 'clamp(32px, 8vw, 52px)',
            lineHeight: 1.15,
            marginBottom: '20px',
            color: '#fff',
            textShadow: '0 2px 20px rgba(0,0,0,0.6)',
          }}
        >
          Vedic Remedies
          <em className="block italic" style={{ color: 'var(--accent)' }}>Refined</em>
        </h1>
        <p
          className="mb-8"
          style={{ fontSize: '15px', lineHeight: '1.8', color: 'rgba(255,255,255,0.75)' }}
        >
          World&apos;s Oldest and Most Trusted Source for Natural, Certified and
          Vedic-Energised Gemstones, Rudrakshas and Yagyas Backed by Ancient Wisdom
          and Four Generations of Experience.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--pvg-accent)', color: '#1a0f08' }}
          >
            Explore Collection
          </Link>
          <Link
            href="/consultation"
            className="inline-flex items-center justify-center rounded border-2 px-8 py-3.5 text-[12px] font-semibold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5"
            style={{ borderColor: 'rgba(255,255,255,0.7)', color: '#fff', background: 'rgba(255,255,255,0.08)' }}
          >
            Book Consultation
          </Link>
        </div>
      </div>

      {/* Trust badges — bottom center */}
      <div
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-8 lg:flex"
        style={{ animation: 'pvgSlideRight 1s ease-out 1.2s both' }}
      >
        {([
          { Icon: Landmark, text: 'Since 1937', sub: '87+ Years Legacy' },
          { Icon: FlaskConical, text: 'Lab Certified', sub: 'GIA · IGI · GJEPC' },
          { Icon: Sparkles, text: 'Vedic Energized', sub: 'Authentic Puja' },
          { Icon: PackageCheck, text: 'Insured Delivery', sub: 'Worldwide Shipping' },
        ] as const).map((item) => (
          <div key={item.text} className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.35)' }}
            >
              <item.Icon className="h-4 w-4" style={{ color: 'rgb(201,168,76)' }} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#fff' }}>{item.text}</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
