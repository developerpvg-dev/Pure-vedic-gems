'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SubCategory {
  slug: string;
  label: string;
}

interface SidebarCategory {
  slug: string;
  label: string;
  subcategories: SubCategory[];
}

interface GemApiItem {
  name: string;
  slug: string;
  sanskrit_name: string | null;
}

// Fallback gem subcategories shown until the API responds
const FALLBACK_NAVARATNA: SubCategory[] = [
  { slug: 'ruby', label: 'Ruby (Manik)' },
  { slug: 'pearl', label: 'Pearl (Moti)' },
  { slug: 'red-coral', label: 'Red Coral (Moonga)' },
  { slug: 'emerald', label: 'Emerald (Panna)' },
  { slug: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)' },
  { slug: 'diamond', label: 'Diamond (Heera)' },
  { slug: 'blue-sapphire', label: 'Blue Sapphire (Neelam)' },
  { slug: 'hessonite', label: 'Hessonite (Gomed)' },
  { slug: "cats-eye", label: "Cat's Eye (Lehsunia)" },
];

const FALLBACK_UPRATNA: SubCategory[] = [
  { slug: 'white-sapphire', label: 'White Sapphire' },
  { slug: 'opal', label: 'Opal' },
  { slug: 'turquoise', label: 'Turquoise (Firoza)' },
  { slug: 'amethyst', label: 'Amethyst' },
  { slug: 'citrine', label: 'Citrine' },
  { slug: 'moonstone', label: 'Moonstone' },
  { slug: 'peridot', label: 'Peridot' },
  { slug: 'garnet', label: 'Garnet' },
  { slug: 'aquamarine', label: 'Aquamarine' },
  { slug: 'rose-quartz', label: 'Rose Quartz' },
  { slug: 'lapis-lazuli', label: 'Lapis Lazuli' },
  { slug: 'tanzanite', label: 'Tanzanite' },
  { slug: 'tiger-eye', label: 'Tiger Eye' },
  { slug: 'bloodstone', label: 'Bloodstone' },
];

// Static categories that are not managed from the categories admin panel
const STATIC_CATEGORIES: SidebarCategory[] = [
  {
    slug: 'rudraksha',
    label: 'Rudraksha',
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
    slug: 'idols',
    label: 'Spiritual Idols',
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
    slug: 'jewelry',
    label: 'Vedic Jewellery',
    subcategories: [
      { slug: 'ring', label: 'Rings' },
      { slug: 'pendant', label: 'Pendants' },
      { slug: 'bracelets', label: 'Bracelets' },
      { slug: 'diamond-jewellery', label: 'Diamond Jewellery' },
      { slug: 'rudraksha-jewelry', label: 'Rudraksha Jewelry' },
      { slug: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas' },
      { slug: 'astro-gems-stock', label: 'Astro-Gems Stock' },
    ],
  },
  {
    slug: 'malas',
    label: 'Malas',
    subcategories: [],
  },
];

// Static fallback (before API loads) — kept for FilterBar backward-compat
export const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  { slug: 'navaratna', label: 'Navaratna Gems', subcategories: FALLBACK_NAVARATNA },
  { slug: 'upratna', label: 'Upratna Gems', subcategories: FALLBACK_UPRATNA },
  ...STATIC_CATEGORIES,
];

/**
 * Hook that returns sidebar categories where the navaratna/upratna subcategories
 * are fetched live from the DB so any admin rename/reorder is instantly reflected.
 */
export function useGemCategories(): SidebarCategory[] {
  const [gemCats, setGemCats] = useState<{ navaratna: SidebarCategory; upratna: SidebarCategory }>({
    navaratna: { slug: 'navaratna', label: 'Navaratna Gems', subcategories: FALLBACK_NAVARATNA },
    upratna: { slug: 'upratna', label: 'Upratna Gems', subcategories: FALLBACK_UPRATNA },
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/categories?type=navaratna').then(r => r.json()),
      fetch('/api/categories?type=upratna').then(r => r.json()),
    ]).then(([navData, upData]) => {
      setGemCats({
        navaratna: {
          slug: 'navaratna',
          label: 'Navaratna Gems',
          subcategories: Array.isArray(navData.categories) && navData.categories.length > 0
            ? navData.categories.map((c: GemApiItem) => ({
                slug: c.slug,
                label: c.sanskrit_name ? `${c.name} (${c.sanskrit_name})` : c.name,
              }))
            : FALLBACK_NAVARATNA,
        },
        upratna: {
          slug: 'upratna',
          label: 'Upratna Gems',
          subcategories: Array.isArray(upData.categories) && upData.categories.length > 0
            ? upData.categories.map((c: GemApiItem) => ({ slug: c.slug, label: c.name }))
            : FALLBACK_UPRATNA,
        },
      });
    }).catch(() => {});
  }, []);

  return [gemCats.navaratna, gemCats.upratna, ...STATIC_CATEGORIES];
}

export function ShopSidebar() {
  const categories = useGemCategories();
  const pathname = usePathname();
  // Extract current slug from /shop/[slug]
  const currentSlug = pathname.split('/shop/')[1]?.split('/')[0] ?? '';

  // Determine which category is active (parent match or subcategory match)
  const findActiveParent = () => {
    for (const cat of categories) {
      if (cat.slug === currentSlug) return cat.slug;
      if (cat.subcategories.some(s => s.slug === currentSlug)) return cat.slug;
    }
    return '';
  };

  const activeParent = findActiveParent();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeParent) initial[activeParent] = true;
    return initial;
  });

  const toggle = (slug: string) => {
    setExpanded(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  return (
    <aside className="hidden w-[220px] shrink-0 lg:block">
      <div className="sticky top-[140px]">
        {/* Card wrapper */}
        <div className="overflow-hidden rounded-xl border border-[var(--pvg-border)]" style={{ background: 'var(--pvg-surface)' }}>
          {/* Header strip */}
          <div
            className="flex items-center gap-2 border-b border-[var(--pvg-border)] px-4 py-3"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)' }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--pvg-accent)' }}
            />
            <h3
              className="text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: 'var(--pvg-accent)' }}
            >
              Browse Categories
            </h3>
          </div>

          {/* Items */}
          <div className="space-y-px p-2">
            {/* All Products */}
            <Link
              href="/shop"
              className="flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-all"
              style={{
                color: !currentSlug ? 'var(--pvg-accent)' : 'var(--pvg-text)',
                background: !currentSlug ? 'var(--pvg-gold-light)' : 'transparent',
                borderLeft: !currentSlug ? '3px solid var(--pvg-accent)' : '3px solid transparent',
              }}
            >
              All Products
            </Link>

            {categories.map(cat => {
              const isActive = cat.slug === currentSlug;
              const isExpanded = expanded[cat.slug] ?? false;
              const hasSubs = cat.subcategories.length > 0;

              return (
                <div key={cat.slug}>
                  <div className="flex items-center">
                    <Link
                      href={`/shop/${cat.slug}`}
                      className="flex-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-all"
                      style={{
                        color: isActive ? 'var(--pvg-accent)' : 'var(--pvg-text)',
                        background: isActive ? 'var(--pvg-gold-light)' : 'transparent',
                        borderLeft: isActive ? '3px solid var(--pvg-accent)' : '3px solid transparent',
                      }}
                    >
                      {cat.label}
                    </Link>
                    {hasSubs && (
                      <button
                        onClick={() => toggle(cat.slug)}
                        className="mr-1 flex h-6 w-6 items-center justify-center rounded text-[var(--pvg-muted)] transition-colors hover:text-[var(--pvg-accent)]"
                        aria-label={`Toggle ${cat.label} subcategories`}
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Subcategories */}
                  {hasSubs && isExpanded && (
                    <div className="ml-4 mt-0.5 space-y-px rounded-lg border border-[var(--pvg-border)] p-1" style={{ background: 'rgba(0,0,0,0.02)' }}>
                      {cat.subcategories.map(sub => {
                        const isSubActive = sub.slug === currentSlug;
                        return (
                          <Link
                            key={sub.slug}
                            href={`/shop/${sub.slug}`}
                            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-[12px] transition-all"
                            style={{
                              color: isSubActive ? 'var(--pvg-accent)' : 'var(--pvg-muted)',
                              fontWeight: isSubActive ? 600 : 400,
                              background: isSubActive ? 'var(--pvg-gold-light)' : 'transparent',
                              borderLeft: isSubActive ? '2px solid var(--pvg-accent)' : '2px solid transparent',
                            }}
                          >
                            {isSubActive && (
                              <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--pvg-accent)' }} />
                            )}
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
