'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = ['All', 'Sapphires', 'Ruby', 'Emerald', 'Pearl', 'Rudraksha', 'Coral'] as const;
type Category = (typeof CATEGORIES)[number];

interface Product {
  id: string;
  img: string;
  badge: string;
  name: string;
  meta: string;
  price: string;
  perCt: string;
  category: Category;
  color: string;
}

const PRODUCTS: Product[] = [
  { id: '1', img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80', badge: 'GIA', name: 'Yellow Sapphire', meta: '3.15 ct · Ceylon · Oval · Unheated', price: '₹1,89,000', perCt: '/ ₹60k per ct', category: 'Sapphires', color: '#E8B840' },
  { id: '2', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80', badge: 'IGI', name: 'Blue Sapphire', meta: '2.88 ct · Kashmir · Cushion · Natural', price: '₹4,50,000', perCt: '/ ₹1.56L per ct', category: 'Sapphires', color: '#3B5EC2' },
  { id: '3', img: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80', badge: 'GRS', name: 'Burmese Ruby', meta: '1.94 ct · Burma · Oval · Unheated', price: '₹3,20,000', perCt: '/ ₹1.65L per ct', category: 'Ruby', color: '#C0292E' },
  { id: '4', img: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&q=80', badge: 'GIA', name: 'Colombian Emerald', meta: '2.45 ct · Colombia · Emerald Cut', price: '₹2,10,000', perCt: '/ ₹86k per ct', category: 'Emerald', color: '#2F9E5A' },
  { id: '5', img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop&q=80', badge: 'Certified', name: 'South Sea Pearl', meta: '12mm · Australia · Round · AAA+', price: '₹75,000', perCt: '/ premium grade', category: 'Pearl', color: '#D4CFC4' },
  { id: '6', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80', badge: 'Blessed', name: '5 Mukhi Rudraksha', meta: '108 Beads · Nepal · Certified · Energized', price: '₹12,500', perCt: '/ per mala', category: 'Rudraksha', color: '#6B4423' },
  { id: '7', img: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop&q=80', badge: 'Italian', name: 'Red Coral Moonga', meta: '8.20 ct · Italy · Triangular · Natural', price: '₹35,000', perCt: '/ ₹4.3k per ct', category: 'Coral', color: '#E05030' },
  { id: '8', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80', badge: 'GIA', name: 'Natural Diamond', meta: '1.02 ct · GIA · VS1 · F Color', price: '₹3,20,000', perCt: '/ certified', category: 'Emerald', color: '#B8C4D0' },
];

export function CollectionShowcase() {
  const [active, setActive] = useState<Category>('All');
  const filtered = active === 'All' ? PRODUCTS : PRODUCTS.filter((p) => p.category === active);

  return (
    <section
      className="relative px-4 py-14 md:px-6 md:py-20"
      style={{
        backgroundImage: 'url(/collection-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle overlay to keep text readable */}
      <div className="pointer-events-none absolute inset-0 bg-white/40" />
      <div className="relative mx-auto max-w-[1400px] text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
          Our Collection
        </p>
        <h2 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}>
          Curated Vedic Gemstones
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-sm leading-relaxed text-[var(--pvg-muted)] md:text-base">
          Every stone is hand-selected, lab-certified, and energized through authentic Vedic ceremonies.
        </p>

        {/* Filter tabs */}
        <div className="mt-8 flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:overflow-visible md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-medium transition-all md:px-5 md:py-2.5 md:text-[13px] ${
                active === cat
                  ? 'border-[var(--pvg-primary)] bg-[var(--pvg-primary)] text-[var(--pvg-bg)]'
                  : 'border-[var(--pvg-border)] bg-[var(--pvg-surface)] text-[var(--pvg-text)] hover:border-[var(--pvg-primary)] hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid — matching Navaratna style */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg)] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)]"
            >
              {/* Image area */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width:640px) 50vw, (max-width:768px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {/* Badge */}
                <span className="absolute left-2 top-2 rounded-full bg-[var(--pvg-primary)] px-2.5 py-0.5 text-[9px] font-semibold tracking-wide text-[var(--pvg-bg)] md:left-3 md:top-3 md:px-3 md:text-[10px]">
                  {p.badge}
                </span>
              </div>
              {/* Info */}
              <div className="p-3 md:p-4">
                <h4 className="font-heading text-sm font-semibold text-[var(--pvg-primary)] md:text-[15px]">
                  {p.name}
                </h4>
                <p className="mt-0.5 text-[10px] text-[var(--pvg-muted)] md:text-xs">{p.meta}</p>
                <div className="mt-2">
                  <span className="text-sm font-bold text-[var(--pvg-primary)] md:text-base">{p.price}</span>
                  <span className="ml-1 text-[9px] text-[var(--pvg-muted)] md:text-[10px]">{p.perCt}</span>
                </div>
                <div className="mt-2.5 flex gap-1.5 md:gap-2">
                  <Link
                    href={`/shop/gemstone/${p.id}`}
                    className="flex-1 rounded-full bg-[var(--pvg-primary)] py-1.5 text-center text-[9px] font-semibold text-[var(--pvg-bg)] transition-opacity hover:opacity-85 md:py-2 md:text-[11px]"
                  >
                    Buy Loose
                  </Link>
                  <Link
                    href={`/configure?gem=${p.id}`}
                    className="flex-1 rounded-full border border-[var(--pvg-primary)] py-1.5 text-center text-[9px] font-semibold text-[var(--pvg-primary)] transition-colors hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)] md:py-2 md:text-[11px]"
                  >
                    Make Jewelry
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
