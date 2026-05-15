'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { STORE_CATEGORY_GROUPS_FALLBACK, type StorefrontCategoryGroup } from '@/lib/categories/storefront';
import { useStorefrontCategories } from '@/lib/hooks/useStorefrontCategories';

export const SIDEBAR_CATEGORIES: StorefrontCategoryGroup[] = STORE_CATEGORY_GROUPS_FALLBACK;

export function useGemCategories(): StorefrontCategoryGroup[] {
  return useStorefrontCategories();
}

export function ShopSidebar() {
  const categories = useStorefrontCategories();
  const pathname = usePathname();
  const shopParts = pathname.split('/shop/')[1]?.split('/').filter(Boolean) ?? [];
  const currentParentSlug = shopParts[0] ?? '';
  const currentChildSlug = shopParts[1] ?? '';
  const currentSlug = currentChildSlug || currentParentSlug;
  const isDirectorsPick = currentParentSlug === 'directors-pick';

  // Determine which category is active (parent match or subcategory match)
  const findActiveParent = () => {
    for (const cat of categories) {
      if (cat.slug === currentParentSlug) return cat.slug;
      if (!currentChildSlug && cat.subcategories.some(s => s.slug === currentParentSlug)) return cat.slug;
      if (cat.subcategories.some(s => s.slug === currentChildSlug)) return cat.slug;
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
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-32 space-y-4">
        <div className="overflow-hidden rounded-lg border border-brand-border bg-white shadow-[0_16px_42px_rgba(61,43,31,0.08)]">
          <div className="border-b border-brand-border bg-[linear-gradient(135deg,rgba(61,43,31,0.96),rgba(122,21,21,0.9))] px-5 py-5 text-white">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">Catalog</p>
              <h3 className="text-lg font-semibold leading-tight">Browse Families</h3>
            </div>
          </div>

          <div className="space-y-1.5 p-3">
            <Link
              href="/shop"
              className="flex items-center justify-between rounded-md px-3 py-3 text-[15px] font-medium transition-all"
              style={{
                color: !currentSlug ? 'var(--pvg-primary)' : 'var(--pvg-text)',
                background: !currentSlug ? 'var(--pvg-gold-light)' : 'transparent',
                boxShadow: !currentSlug ? 'inset 3px 0 0 var(--pvg-accent)' : 'inset 3px 0 0 transparent',
              }}
            >
              <span>All Products</span>
              <span className="text-xs text-brand-muted">All</span>
            </Link>

            <Link
              href="/shop/directors-pick"
              className="flex items-center justify-between rounded-md px-3 py-3 text-[15px] font-medium transition-all"
              style={{
                color: isDirectorsPick ? 'var(--pvg-primary)' : 'var(--pvg-text)',
                background: isDirectorsPick ? 'var(--pvg-gold-light)' : 'transparent',
                boxShadow: isDirectorsPick ? 'inset 3px 0 0 var(--pvg-accent)' : 'inset 3px 0 0 transparent',
              }}
            >
              <span>Director&apos;s Pick</span>
              <span className="text-xs text-brand-muted">Curated</span>
            </Link>

            {categories.map(cat => {
              const isActive = cat.slug === currentParentSlug && !currentChildSlug;
              const isExpanded = expanded[cat.slug] ?? false;
              const hasSubs = cat.subcategories.length > 0;

              return (
                <div key={cat.slug} className="rounded-lg">
                  <div className="flex items-center gap-1">
                    <Link
                      href={cat.href}
                      className="flex-1 rounded-md px-3 py-3 text-[15px] font-medium transition-all"
                      style={{
                        color: isActive ? 'var(--pvg-primary)' : 'var(--pvg-text)',
                        background: isActive ? 'var(--pvg-gold-light)' : 'transparent',
                        boxShadow: isActive ? 'inset 3px 0 0 var(--pvg-accent)' : 'inset 3px 0 0 transparent',
                      }}
                    >
                      {cat.label}
                    </Link>
                    {hasSubs && (
                      <button
                        onClick={() => toggle(cat.slug)}
                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-gold-light hover:text-brand-primary"
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
                    <div className="ml-5 mt-1 space-y-1 rounded-lg border border-brand-border bg-brand-bg-alt/35 p-2">
                      {cat.subcategories.map(sub => {
                        const isSubActive = sub.slug === currentChildSlug || (!currentChildSlug && sub.slug === currentParentSlug);
                        return (
                          <Link
                            key={sub.slug}
                            href={sub.href}
                            className="block rounded-md px-3 py-2 text-[13px] transition-all"
                            style={{
                              color: isSubActive ? 'var(--pvg-primary)' : 'var(--pvg-muted)',
                              fontWeight: isSubActive ? 600 : 400,
                              background: isSubActive ? 'var(--pvg-gold-light)' : 'transparent',
                            }}
                          >
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
