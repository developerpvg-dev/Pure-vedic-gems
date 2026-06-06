'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Flame, BookOpen, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';

export interface YagyaCardData {
  id: string;
  slug: string;
  sku: string;
  name: string;
  short_desc: string | null;
  price: number;
  image_url: string | null;
  planet: string | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  availability_status: string | null;
  sold_individually: boolean | null;
}

export function YagyaCard({ yagya }: { yagya: YagyaCardData }) {
  const imageSrc = yagya.image_url;
  const href = `/vedic-yagyas/${yagya.slug}`;
  const buyHref = `/vedic-yagyas/${yagya.slug}/buy`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm transition hover:shadow-lg">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-amber-50/40">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={yagya.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-contain p-6 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Flame className="h-16 w-16 text-amber-300" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5 text-center">
        <h3 className="font-serif text-lg font-semibold text-gray-900">{yagya.name}</h3>
        {yagya.short_desc && <p className="mt-1 text-sm text-gray-500">{yagya.short_desc}</p>}
        {yagya.price > 0 && (
          <p className="mt-3 text-sm font-medium text-amber-700">
            Suggested offering from <span className="text-lg font-bold">{formatPrice(yagya.price)}</span>
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Link
            href={href}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-600 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            <BookOpen className="h-4 w-4" />
            Read more
          </Link>
          <Link
            href={buyHref}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <ShoppingBag className="h-4 w-4" />
            Buy
          </Link>
        </div>
      </div>
    </div>
  );
}
