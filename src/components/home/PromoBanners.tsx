'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const BANNERS = [
  {
    image: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=1600&h=600&fit=crop&q=80',
    tag: 'Since 1937',
    headline: 'Four generations of trust, one commitment — bringing the cosmic power of authentic gemstones to every doorstep.',
    subtext: 'Pure Vedic Gems Pvt. Ltd.',
    href: '/about',
  },
  {
    image: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=1600&h=600&fit=crop&q=80',
    tag: 'Certified Natural Gems',
    headline: 'Every gemstone authenticated by GIA, IGI & GJEPC — your trust is our foundation.',
    subtext: 'Lab-Certified · Unheated · Untreated',
    href: '/shop',
  },
  {
    image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=1600&h=600&fit=crop&q=80',
    tag: 'Vedic Astrology',
    headline: 'Discover the gemstone aligned with your planetary chart — expert guidance from 4th generation gemologists.',
    subtext: 'Free Consultation Available',
    href: '/consultation',
  },
  {
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1600&h=600&fit=crop&q=80',
    tag: 'New Arrivals',
    headline: 'Colombian Emeralds, Burmese Rubies & Ceylon Sapphires — freshly sourced, ready to ship.',
    subtext: 'Explore Our Latest Collection',
    href: '/shop',
  },
];

export function PromoBanners() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const banner = BANNERS[current];

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: '320px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {BANNERS.map((b, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={b.image}
            alt={b.headline}
            fill
            className="object-cover"
            priority={i === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/30" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center md:min-h-[360px] md:px-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--pvg-accent)] md:w-12" />
          <span className="text-[10px] font-semibold uppercase tracking-[4px] text-[var(--pvg-accent)] md:text-xs">
            {banner.tag}
          </span>
          <span className="h-px w-8 bg-[var(--pvg-accent)] md:w-12" />
        </div>
        <blockquote className="mx-auto max-w-[750px] font-heading text-lg leading-relaxed text-white md:text-2xl md:leading-[1.6] lg:text-[28px]">
          &ldquo;{banner.headline}&rdquo;
        </blockquote>
        <p className="mt-4 text-xs tracking-[2px] text-white/50 md:text-sm">
          {banner.subtext}
        </p>
        <Link
          href={banner.href}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 transition-all hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
        >
          Learn More &rarr;
        </Link>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        aria-label="Previous banner"
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white md:left-5 md:h-11 md:w-11"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button
        onClick={next}
        aria-label="Next banner"
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/70 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white md:right-5 md:h-11 md:w-11"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 bg-[var(--pvg-accent)]'
                : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}