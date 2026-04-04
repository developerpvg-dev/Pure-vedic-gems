'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './NavaratnaGrid.module.css';

interface GemCategoryItem {
  id: string;
  name: string;
  slug: string;
  planet: string | null;
  sanskrit_name: string | null;
  emoji: string | null;
  color: string | null;
  image_url: string | null;
  hover_image_url: string | null;
}

// Fallback images when DB has no image_url set
const FALLBACK_IMAGES: Record<string, string> = {
  'yellow-sapphire': 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80',
  'blue-sapphire': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80',
  ruby: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80',
  emerald: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&q=80',
  diamond: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80',
  hessonite: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80',
  'cats-eye': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80',
  pearl: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop&q=80',
  'red-coral': 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop&q=80',
};

// Hindi planet names
const PLANET_HINDI: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चन्द्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

export function NavaratnaGrid() {
  const [gems, setGems] = useState<GemCategoryItem[]>([]);

  useEffect(() => {
    fetch('/api/categories?type=navaratna')
      .then(res => res.json())
      .then(data => { if (data.categories) setGems(data.categories); })
      .catch(() => {});
  }, []);

  return (
    <section className="relative bg-[var(--pvg-surface)] px-8 py-14 md:px-14 md:py-20 overflow-hidden">
      {/* Pulsing celestial background */}
      <div className={`absolute inset-0 pointer-events-none ${styles.bgPulse}`}>
        <Image
          src="/navratnassectionbg.png"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority={false}
        />
      </div>
      {/* Section header */}
      <div className="relative z-10 mx-auto max-w-[1400px] text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
          The Sacred Nine
        </p>
        <h2
          className="font-heading text-[var(--pvg-primary)]"
          style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
        >
          Navaratna Gemstones
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-sm leading-relaxed text-[var(--pvg-muted)] md:text-base">
          Nine celestial gems aligned with the nine planets &mdash; each carrying unique cosmic energy.
        </p>
      </div>

      {/* Row: 6 gems per row on large screens, 3 on tablet, 2 on mobile */}
      <div className="relative z-10 mx-auto mt-10 flex max-w-[1400px] flex-wrap justify-center gap-2 md:mt-14 md:gap-3">
        {gems.map((gem) => {
          const imgSrc = gem.image_url || FALLBACK_IMAGES[gem.slug] || FALLBACK_IMAGES.ruby;
          const planetLabel = gem.planet
            ? `${gem.planet} · ${PLANET_HINDI[gem.planet] ?? ''}`
            : '';

          return (
            <Link
              key={gem.slug}
              href={`/shop/${gem.slug}`}
              className="group relative w-[calc(50%-4px)] overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] sm:w-[calc(33.333%-6px)] lg:w-[calc(16.666%-8px)]"
            >
              {/* Image area */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={imgSrc}
                  alt={gem.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width:640px) 50vw, (max-width:768px) 33vw, 16vw"
                />
                {/* Hover image overlay — fades in + scale */}
                {gem.hover_image_url && (
                  <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <Image
                      src={gem.hover_image_url}
                      alt={`${gem.name} hover`}
                      fill
                      className="object-cover transition-transform duration-500 scale-100 group-hover:scale-110"
                      sizes="(max-width:640px) 50vw, (max-width:768px) 33vw, 16vw"
                    />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              {/* Text */}
              <div className="relative p-2 md:p-3">
                <h4 className="font-heading text-xs font-semibold text-[var(--pvg-primary)] md:text-sm">
                  {gem.name}
                </h4>
                <p className="mt-0.5 text-[9px] text-[var(--pvg-muted)] md:text-[10px]">
                  {planetLabel}
                </p>
                <span
                  className="mt-1.5 inline-flex items-center text-[9px] font-semibold uppercase tracking-wider text-[var(--pvg-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:text-[10px]"
                >
                  Explore &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}