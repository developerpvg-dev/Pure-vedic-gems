'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SubCat {
  slug: string;
  label: string;
  image?: string;
}

interface CategorySection {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  subcategories: SubCat[];
}

const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27400%27%3E%3Crect fill=%27%23f5f0e8%27 width=%27400%27 height=%27400%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23c9a84c%27 font-size=%2740%27%3E%E2%9C%A6%3C/text%3E%3C/svg%3E';

const SECTIONS: CategorySection[] = [
  {
    id: 'rudraksha',
    title: 'Sacred Rudraksha Collection',
    subtitle: 'Finest quality X-Ray certified genuine Rudraksha beads, energized with powerful Rudra Mantras',
    href: '/shop/rudraksha',
    subcategories: [
      { slug: '1-mukhi', label: '1 Mukhi' },
      { slug: '2-mukhi', label: '2 Mukhi' },
      { slug: '3-mukhi', label: '3 Mukhi' },
      { slug: '4-mukhi', label: '4 Mukhi' },
      { slug: '5-mukhi', label: '5 Mukhi' },
      { slug: '6-mukhi', label: '6 Mukhi' },
      { slug: '7-mukhi', label: '7 Mukhi' },
      { slug: '8-mukhi', label: '8 Mukhi' },
      { slug: '9-mukhi', label: '9 Mukhi' },
      { slug: '10-mukhi', label: '10 Mukhi' },
      { slug: '11-mukhi', label: '11 Mukhi' },
      { slug: '12-mukhi', label: '12 Mukhi' },
      { slug: '13-mukhi', label: '13 Mukhi' },
      { slug: '14-mukhi', label: '14 Mukhi' },
      { slug: 'gauri-shankar', label: 'Gauri Shankar' },
    ],
  },
  {
    id: 'idols',
    title: 'Spiritual Idols',
    subtitle: 'Handcrafted sacred deities and yantras, blessed and energized for divine grace',
    href: '/shop/idols',
    subcategories: [
      { slug: 'shree-yantra', label: 'Shree Yantra' },
      { slug: 'durga-devi', label: 'Durga Devi' },
      { slug: 'hanuman', label: 'Hanuman' },
      { slug: 'shiv-ji', label: 'Shiv Ji' },
      { slug: 'shivling', label: 'Shivling' },
      { slug: 'ganesha', label: 'Ganesha' },
      { slug: 'lakshmi', label: 'Lakshmi' },
      { slug: 'nandi', label: 'Nandi' },
    ],
  },
  {
    id: 'jewelry',
    title: 'Vedic Jewellery',
    subtitle: 'Authentic Astro-Rashi jewellery handcrafted in Gold, Silver and Panchdhatu',
    href: '/shop/jewelry',
    subcategories: [
      { slug: 'bracelets', label: 'Bracelets' },
      { slug: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas' },
      { slug: 'rudraksha-jewelry', label: 'Rudraksha Jewelry' },
      { slug: 'diamond-jewellery', label: 'Diamond Jewellery' },
      { slug: 'malas', label: 'Malas' },
      { slug: 'astro-gems-stock', label: 'Astro-Gems Stock' },
      { slug: 'ring', label: 'Rings' },
      { slug: 'pendant', label: 'Pendants' },
    ],
  },
];

function SubCategoryCard({ sub, parentSlug }: { sub: SubCat; parentSlug: string }) {
  const img = sub.image || PLACEHOLDER;
  return (
    <Link
      href={`/shop/${parentSlug}/${sub.slug}`}
      className="group block w-[140px] shrink-0"
    >
      <div className="relative h-[170px] w-full overflow-hidden rounded-2xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-[var(--pvg-accent)]/15">
        <Image
          src={img}
          alt={sub.label}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="140px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Label */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <span className="text-[12px] font-bold leading-tight text-white drop-shadow-sm sm:text-[13px]">
            {sub.label}
          </span>
        </div>
        {/* Hover accent border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition-colors duration-300 group-hover:border-[var(--pvg-accent)]" />
      </div>
    </Link>
  );
}

function ScrollableSection({ section }: { section: CategorySection }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--pvg-border)] bg-gradient-to-br from-[var(--pvg-bg)] to-[var(--pvg-surface)] px-5 py-6 shadow-sm md:px-8 md:py-7">
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3
            className="font-heading font-semibold text-[var(--pvg-primary)]"
            style={{ fontSize: 'clamp(18px, 2.2vw, 26px)' }}
          >
            {section.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--pvg-muted)] sm:text-[13px]">
            {section.subtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">{/* scroll buttons */}
          <button
            onClick={() => scroll('left')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition-colors hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition-colors hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Link
            href={section.href}
            className="ml-1 hidden items-center gap-1 rounded-full border border-[var(--pvg-primary)] px-4 py-1.5 text-[10px] font-semibold text-[var(--pvg-primary)] transition-all hover:bg-[var(--pvg-primary)] hover:text-[var(--pvg-bg)] sm:inline-flex"
          >
            View All
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-2 sm:gap-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {section.subcategories.map((sub) => (
          <div key={sub.slug} style={{ scrollSnapAlign: 'start' }}>
            <SubCategoryCard sub={sub} parentSlug={section.id === 'idols' ? 'idol' : section.id} />
          </div>
        ))}
      </div>

      {/* Mobile View All */}
      <div className="mt-3 text-center sm:hidden">
        <Link
          href={section.href}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--pvg-accent)]"
        >
          View All {section.title}
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M1 7h12M8 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export function CategoryShowcase() {
  return (
    <section className="bg-[var(--pvg-surface)] px-4 py-14 md:px-6 md:py-20 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Section header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[4px] text-[var(--pvg-accent)]">
            Our Collections
          </p>
          <h2
            className="font-heading text-[var(--pvg-primary)]"
            style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
          >
            Explore by Category
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--pvg-muted)] md:text-base">
            Discover our complete range of sacred Rudraksha, spiritual idols, and handcrafted Vedic jewellery.
          </p>
        </div>

        {/* Category sections */}
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <ScrollableSection key={section.id} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
}
