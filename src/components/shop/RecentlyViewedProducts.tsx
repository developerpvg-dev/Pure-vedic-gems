'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/format';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';

const STORAGE_KEY = 'pvg_recently_viewed_products';
const MAX_ITEMS = 8;

export interface RecentlyViewedProduct {
  id: string;
  name: string;
  href: string;
  imageUrl: string | null;
  price: number;
  meta: string | null;
}

function readStoredProducts(): RecentlyViewedProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function RecentlyViewedProducts({ current }: { current: RecentlyViewedProduct }) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    const stored = readStoredProducts().filter((item) => item.id !== current.id);
    startTransition(() => setItems(stored.slice(0, 4)));

    const next = [current, ...stored].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    trackStorefrontEvent('product_view', { product_id: current.id, product_name: current.name });
  }, [current]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[4px] text-[var(--pvg-accent)]">
          Recently Viewed
        </p>
        <h2 className="font-heading mt-1.5 text-xl font-semibold text-[var(--pvg-primary)]">
          Continue Exploring
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-brand-surface transition-all hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(61,43,31,0.12)]"
          >
            <div className="relative aspect-[5/6] bg-brand-bg-alt">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--pvg-accent)]">PVG</div>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-[13px] font-semibold text-[var(--pvg-primary)]">
                {item.name}
              </h3>
              {item.meta && <p className="mt-1 truncate text-[10px] text-[var(--pvg-muted)]">{item.meta}</p>}
              <p className="mt-2 text-sm font-bold text-[var(--pvg-primary)]">{formatPrice(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}