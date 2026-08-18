'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { useFlatShopCategories } from '@/lib/hooks/useFlatShopCategories';

export function FlatShopSidebar() {
  const categories = useFlatShopCategories();
  const pathname = usePathname();
  const pathParts = pathname.split('/').filter(Boolean);
  const storefrontParts = pathParts[0] === 'shop'
    ? pathParts.slice(1)
    : pathParts[0] === 'gemstones'
      ? pathParts.slice(1)
      : pathParts[0] === 'rudraksha'
        ? ['rudraksha', ...pathParts.slice(1)]
        : [];
  const currentSlug = storefrontParts[0] ?? '';
  const [query, setQuery] = useState('');

  const filtered = categories.filter((cat) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return cat.label.toLowerCase().includes(q) || cat.slug.includes(q);
  });

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-32 space-y-4">
        <div className="overflow-hidden rounded-lg border border-brand-border bg-white shadow-[0_16px_42px_rgba(61,43,31,0.08)]">
          <div className="border-b border-brand-border bg-[linear-gradient(135deg,rgba(61,43,31,0.96),rgba(122,21,21,0.9))] px-5 py-5 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">Shop</p>
            <h3 className="text-lg font-semibold leading-tight">All Categories</h3>
          </div>

          <div className="border-b border-brand-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-md border border-brand-border bg-brand-bg-alt/50 py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-brand-accent"
                aria-label="Search categories"
              />
            </div>
          </div>

          <div className="max-h-[calc(100vh-280px)] space-y-0.5 overflow-y-auto p-2">
            <Link
              href="/gemstones"
              className="block rounded-md px-3 py-2.5 text-[14px] font-medium transition-all"
              style={{
                color: !currentSlug ? 'var(--pvg-primary)' : 'var(--pvg-text)',
                background: !currentSlug ? 'var(--pvg-gold-light)' : 'transparent',
                boxShadow: !currentSlug ? 'inset 3px 0 0 var(--pvg-accent)' : 'inset 3px 0 0 transparent',
              }}
            >
              All Products
            </Link>
            <Link
              href="/shop/directors-pick"
              className="block rounded-md px-3 py-2.5 text-[14px] font-medium transition-all"
              style={{
                color: currentSlug === 'directors-pick' ? 'var(--pvg-primary)' : 'var(--pvg-text)',
                background: currentSlug === 'directors-pick' ? 'var(--pvg-gold-light)' : 'transparent',
                boxShadow: currentSlug === 'directors-pick' ? 'inset 3px 0 0 var(--pvg-accent)' : 'inset 3px 0 0 transparent',
              }}
            >
              Director&apos;s Pick
            </Link>

            {filtered.map((cat) => {
              const isActive = cat.slug === currentSlug;
              return (
                <Link
                  key={cat.slug}
                  href={cat.href}
                  className="block rounded-md px-3 py-2 text-[13px] transition-all"
                  style={{
                    color: isActive ? 'var(--pvg-primary)' : 'var(--pvg-muted)',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--pvg-gold-light)' : 'transparent',
                    boxShadow: isActive ? 'inset 3px 0 0 var(--pvg-accent)' : 'inset 3px 0 0 transparent',
                  }}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
