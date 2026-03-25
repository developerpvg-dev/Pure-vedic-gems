'use client';

import Link from 'next/link';
import Image from 'next/image';

const GEMS = [
  { name: 'Yellow Sapphire', planet: 'Jupiter \u00B7 \u0917\u0941\u0930\u0941', slug: 'yellow-sapphire', color: '#E8B840', img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80' },
  { name: 'Blue Sapphire', planet: 'Saturn \u00B7 \u0936\u0928\u093F', slug: 'blue-sapphire', color: '#3B5EC2', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80' },
  { name: 'Ruby', planet: 'Sun \u00B7 \u0938\u0942\u0930\u094D\u092F', slug: 'ruby', color: '#C0292E', img: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80' },
  { name: 'Emerald', planet: 'Mercury \u00B7 \u092C\u0941\u0927', slug: 'emerald', color: '#2F9E5A', img: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&q=80' },
  { name: 'Diamond', planet: 'Venus \u00B7 \u0936\u0941\u0915\u094D\u0930', slug: 'diamond', color: '#B8C4D0', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80' },
  { name: 'Hessonite', planet: 'Rahu \u00B7 \u0930\u093E\u0939\u0941', slug: 'hessonite', color: '#D17B3A', img: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80' },
  { name: "Cat's Eye", planet: 'Ketu \u00B7 \u0915\u0947\u0924\u0941', slug: 'cats-eye', color: '#8B9B3E', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80' },
  { name: 'Pearl', planet: 'Moon \u00B7 \u091A\u0902\u0926\u094D\u0930', slug: 'pearl', color: '#D4CFC4', img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop&q=80' },
  { name: 'Red Coral', planet: 'Mars \u00B7 \u092E\u0902\u0917\u0932', slug: 'red-coral', color: '#E05030', img: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop&q=80' },
  { name: 'Rudraksha', planet: 'Shiva \u00B7 \u0936\u093F\u0935', slug: 'rudraksha', color: '#6B4423', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80' },
  { name: 'Opal', planet: 'Venus \u00B7 \u0936\u0941\u0915\u094D\u0930', slug: 'opal', color: '#5BC0BE', img: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80' },
  { name: 'Turquoise', planet: 'Jupiter \u00B7 \u0917\u0941\u0930\u0941', slug: 'turquoise', color: '#3AAFA9', img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80' },
];

export function NavaratnaGrid() {
  return (
    <section className="bg-[var(--pvg-surface)] px-4 py-14 md:px-6 md:py-20">
      {/* Section header */}
      <div className="mx-auto max-w-[1400px] text-center">
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

      {/* 4-col card grid */}
      <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-2 gap-3 sm:grid-cols-3 md:mt-14 md:grid-cols-4 lg:grid-cols-6 md:gap-4">
        {GEMS.map((gem) => (
          <Link
            key={gem.slug}
            href={`/shop/${gem.slug}`}
            className="group relative overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
          >
            {/* Image area */}
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={gem.img}
                alt={gem.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width:640px) 50vw, (max-width:768px) 33vw, 25vw"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            {/* Text */}
            <div className="relative p-3 md:p-4">
              <h4 className="font-heading text-sm font-semibold text-[var(--pvg-primary)] md:text-[15px]">
                {gem.name}
              </h4>
              <p className="mt-0.5 text-[10px] text-[var(--pvg-muted)] md:text-xs">
                {gem.planet}
              </p>
              <span
                className="mt-2 inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-[var(--pvg-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:text-[11px]"
              >
                Explore &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}