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
        <h2 className="text-2xl font-medium" style={{ color: '#7A1515' }}>
          Continue exploring
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group relative flex flex-col overflow-hidden rounded-lg bg-white transition-shadow duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]"
          >
            {/* Image — matches ProductCard 115% portrait ratio */}
            <div className="relative overflow-hidden bg-[#f2f2f2]" style={{ paddingBottom: '115%' }}>
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-brand-accent">PVG</div>
              )}
            </div>
            <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
              <h3 className="line-clamp-1 text-[13px] font-semibold leading-snug text-gray-900">
                {item.name}
              </h3>
              {item.meta && (
                <p className="mt-0.5 truncate text-[10px] font-normal text-brand-muted">{item.meta}</p>
              )}
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{formatPrice(item.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}