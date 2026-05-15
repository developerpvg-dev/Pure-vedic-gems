'use client';

import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { useStorefrontCategories } from '@/lib/hooks/useStorefrontCategories';

export function ShopCategoryDirectory() {
  const groups = useStorefrontCategories();

  return (
    <section className="mb-8" aria-label="Shop category directory">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-brand-accent">Browse by family</p>
          <h2 className="mt-1 text-2xl font-black text-brand-primary">Shop Categories</h2>
        </div>
        <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[1.5px] text-brand-primary transition hover:text-brand-accent">
          All Products
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <Link href="/shop/directors-pick" className="flex items-center justify-between gap-3 text-base font-black text-brand-primary transition hover:text-brand-accent">
            <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-amber-600" /> Director&apos;s Pick</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-brand-muted">
            Curated products ordered by Director&apos;s Pick display priority.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.slug} className="rounded-lg border border-brand-border bg-white p-4 shadow-sm transition hover:border-brand-accent">
            <Link href={group.href} className="flex items-center justify-between gap-3 text-base font-black text-brand-primary transition hover:text-brand-accent">
              {group.label}
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {group.subcategories.map((subcategory) => (
                <Link
                  key={`${group.slug}-${subcategory.slug}`}
                  href={subcategory.href}
                  className="rounded-full border border-brand-border bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-muted transition hover:border-brand-accent hover:text-brand-primary"
                >
                  {subcategory.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
