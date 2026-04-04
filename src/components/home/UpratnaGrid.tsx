'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

// Fallback images when DB has no image_url
const FALLBACK_IMAGES: Record<string, string> = {
  opal: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80',
  turquoise: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80',
  amethyst: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80',
  moonstone: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop&q=80',
  garnet: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop&q=80',
  peridot: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&q=80',
  tanzanite: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80',
  'lapis-lazuli': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80',
  citrine: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80',
  aquamarine: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80',
};

const PLANET_HINDI: Record<string, string> = {
  Sun: 'सूर्य', Moon: 'चन्द्र', Mars: 'मंगल', Mercury: 'बुध',
  Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

export function UpratnaGrid() {
  const [gems, setGems] = useState<GemCategoryItem[]>([]);

  useEffect(() => {
    fetch('/api/categories?type=upratna')
      .then(res => res.json())
      .then(data => { if (data.categories) setGems(data.categories); })
      .catch(() => {});
  }, []);

  return (
    <section className="bg-[var(--pvg-bg)] px-8 py-14 md:px-14 md:py-20">
      {/* Section header */}
      <div className="mx-auto max-w-[1400px] text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
          Semi-Precious Gems
        </p>
        <h2
          className="font-heading text-[var(--pvg-primary)]"
          style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}
        >
          Upratna Gemstones
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-sm leading-relaxed text-[var(--pvg-muted)] md:text-base">
          Powerful semi-precious gems — affordable alternatives with potent Vedic properties for healing and astrological balance.
        </p>
      </div>

      {/* Gems grid — shows first 10 ordered by sort_order */}
      <div className="mx-auto mt-10 flex max-w-[1400px] flex-wrap justify-center gap-2 md:mt-14 md:gap-3">
        {gems.slice(0, 10).map((gem) => {
          const imgSrc = gem.image_url || FALLBACK_IMAGES[gem.slug] || FALLBACK_IMAGES.opal;
          const planetLabel = gem.planet
            ? `${gem.planet} · ${PLANET_HINDI[gem.planet] ?? ''}`
            : '';

          return (
            <Link
              key={gem.slug}
              href={`/shop/${gem.slug}`}
              className="group relative w-[calc(50%-4px)] overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] sm:w-[calc(33.333%-6px)] lg:w-[calc(16.666%-8px)]"
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
                <span className="mt-1.5 inline-flex items-center text-[9px] font-semibold uppercase tracking-wider text-[var(--pvg-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:text-[10px]">
                  Explore &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View All button */}
      <div className="mx-auto mt-10 max-w-[1400px] text-center">
        <Link
          href="/shop/upratna"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--pvg-primary)] px-8 py-3 text-sm font-semibold text-[var(--pvg-primary)] transition-all duration-300 hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)]"
        >
          View All Upratna Gems &rarr;
        </Link>
      </div>
    </section>
  );
}
