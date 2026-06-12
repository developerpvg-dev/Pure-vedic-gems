'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/format';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';

const STORAGE_KEY = 'pvg_recently_viewed_products';
const MAX_ITEMS = 8;
const LEGACY_WORDPRESS_UPLOAD_RE = /^https?:\/\/(?:www\.)?purevedicgems\.(?:com|in)\/wp-content\/uploads\//i;

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

function sanitizeProduct(item: RecentlyViewedProduct): RecentlyViewedProduct {
  if (!item.imageUrl || !LEGACY_WORDPRESS_UPLOAD_RE.test(item.imageUrl)) return item;
  return { ...item, imageUrl: null };
}

export function RecentlyViewedProducts({ current }: { current: RecentlyViewedProduct }) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    const safeCurrent = sanitizeProduct(current);
    const stored = readStoredProducts()
      .map(sanitizeProduct)
      .filter((item) => item.id !== safeCurrent.id);
    startTransition(() => setItems(stored.slice(0, 4)));

    const next = [safeCurrent, ...stored].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    trackStorefrontEvent('product_view', { product_id: safeCurrent.id, product_name: safeCurrent.name });
  }, [current]);

  if (items.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-16">
      <div className="mb-3 text-center sm:mb-5">
        <h2 className="text-xl font-medium sm:text-2xl" style={{ color: '#7A1515' }}>
          Continue exploring
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_2px_10px_rgba(61,43,31,0.06)] transition-shadow duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]"
          >
            {/* Image — matches ProductCard 115% portrait ratio */}
            <div className="relative overflow-hidden bg-[#f2f2f2]" style={{ paddingBottom: '115%' }}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 46vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-brand-accent sm:text-sm">PVG</div>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col px-2 pb-2 pt-1.5 sm:px-3 sm:pb-3 sm:pt-2">
              <h3 className="line-clamp-2 min-h-8 text-[11px] font-semibold leading-snug text-gray-900 sm:line-clamp-1 sm:min-h-0 sm:text-[13px]">
                {item.name}
              </h3>
              {item.meta && (
                <p className="mt-0.5 truncate text-[9px] font-normal text-brand-muted sm:text-[10px]">{item.meta}</p>
              )}
              <p className="mt-1 text-[12px] font-semibold text-gray-900 sm:text-[14px]">{formatPrice(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}