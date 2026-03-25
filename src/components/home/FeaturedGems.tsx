'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FEATURED = [
  { id: '1', img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80', badge: "Director's Choice", name: 'Ceylon Yellow Sapphire', meta: '4.22 ct · Sri Lanka · Oval · Unheated · GIA', price: '₹2,85,000' },
  { id: '2', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80', badge: 'Rare', name: 'Kashmir Blue Sapphire', meta: '3.10 ct · Kashmir · Cushion · Untreated · GRS', price: '₹8,50,000' },
  { id: '3', img: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop&q=80', badge: 'Blessed', name: '5 Mukhi Rudraksha Mala', meta: '108 Beads · Nepal · Certified · Energized', price: '₹12,500' },
  { id: '4', img: 'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=400&h=400&fit=crop&q=80', badge: 'Premium', name: 'Burmese Pigeon Blood Ruby', meta: '2.18 ct · Burma · Oval · GRS', price: '₹5,60,000' },
  { id: '5', img: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400&h=400&fit=crop&q=80', badge: 'GIA', name: 'Zambian Emerald', meta: '3.75 ct · Zambia · Octagon · Minor Oil', price: '₹1,45,000' },
  { id: '6', img: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop&q=80', badge: 'Rare', name: 'Hessonite Garnet', meta: '5.10 ct · Sri Lanka · Oval · Natural', price: '₹28,000' },
  { id: '7', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop&q=80', badge: 'Certified', name: 'Natural Diamond', meta: '1.02 ct · GIA · VS1 · F Color', price: '₹3,20,000' },
  { id: '8', img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop&q=80', badge: 'Blessed', name: 'South Sea Pearl', meta: '12mm · Australia · Round · AAA+', price: '₹75,000' },
  { id: '9', img: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=400&h=400&fit=crop&q=80', badge: 'Italian', name: 'Red Coral Moonga', meta: '8.20 ct · Italy · Triangular · Natural', price: '₹35,000' },
  { id: '10', img: 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80', badge: 'Rare', name: "Chrysoberyl Cat's Eye", meta: '3.45 ct · Sri Lanka · Cabochon · Sharp Eye', price: '₹1,90,000' },
];

export function FeaturedGems() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const scrollContainer = scrollRef.current;
    if (!section || !scrollContainer) return;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      // The section has extra height (padding for scroll distance).
      // The sticky container stays in view. We measure how far through the
      // extra scroll distance we've gone.
      const stickyH = window.innerHeight;
      const scrollDistance = section.offsetHeight - stickyH;
      // How far the section top has moved past the viewport top
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));

      setScrollProgress(progress);

      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      scrollContainer.scrollLeft = progress * maxScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={sectionRef} style={{ height: '250vh' }}>
      <div ref={stickyRef} className="sticky top-0 flex h-screen flex-col justify-center bg-[var(--pvg-surface)] px-4 md:px-6">
        <div className="mx-auto w-full max-w-[1400px]">
          {/* Header */}
          <div className="mb-6 text-center md:mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-[var(--pvg-accent)]">
              Premium Collection
            </p>
            <h2 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}>
              Featured Gemstones
            </h2>
            <p className="mx-auto mt-3 max-w-[500px] text-sm leading-relaxed text-[var(--pvg-muted)]">
              Exceptional quality stones, personally curated by our gemologists.
            </p>
          </div>

          {/* Scroll progress bar */}
          <div className="mx-auto mb-5 h-[3px] max-w-[300px] overflow-hidden rounded-full bg-[var(--pvg-border)]">
            <div
              className="h-full rounded-full bg-[var(--pvg-accent)]"
              style={{ width: `${scrollProgress * 100}%`, transition: 'width 60ms linear' }}
            />
          </div>

          {/* Horizontal scroll track */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-hidden pb-2 md:gap-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FEATURED.map((gem) => (
              <div
                key={gem.id}
                className="group w-[200px] shrink-0 overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-bg)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] md:w-[240px]"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={gem.img}
                    alt={gem.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="240px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-[var(--pvg-primary)] px-2.5 py-0.5 text-[9px] font-semibold tracking-wide text-[var(--pvg-bg)] md:left-3 md:top-3 md:px-3 md:text-[10px]">
                    {gem.badge}
                  </span>
                </div>
                <div className="p-3 md:p-4">
                  <h4 className="font-heading text-sm font-semibold text-[var(--pvg-primary)] md:text-[15px]">
                    {gem.name}
                  </h4>
                  <p className="mt-0.5 text-[10px] text-[var(--pvg-muted)] md:text-xs">{gem.meta}</p>
                  <p className="mt-2 text-sm font-bold text-[var(--pvg-primary)] md:text-base">{gem.price}</p>
                  <div className="mt-2.5 flex gap-1.5 md:gap-2">
                    <Link
                      href={`/shop/gemstone/${gem.id}`}
                      className="flex-1 rounded-full bg-[var(--pvg-primary)] py-1.5 text-center text-[9px] font-semibold text-[var(--pvg-bg)] transition-opacity hover:opacity-85 md:py-2 md:text-[11px]"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/configure?gem=${gem.id}`}
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
      </div>
    </div>
  );
}