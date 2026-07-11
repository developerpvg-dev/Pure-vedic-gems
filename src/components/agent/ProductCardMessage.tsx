'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { AgentProductCard } from '@/lib/agent/types';

export function ProductCardMessage({ products }: { products: AgentProductCard[] }) {
  if (!products?.length) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {products.map((product) => (
        <Link
          key={product.id}
          href={product.href}
          className="flex gap-3 rounded-lg border border-[#e8dcc8] bg-white p-2 shadow-sm transition hover:border-[#8b1a1a]/40"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#f7f2ea]">
            {product.thumbnailUrl ? (
              <Image src={product.thumbnailUrl} alt={product.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-[#8b7355]">PVG</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#3d2b1f]">{product.name}</p>
            {product.hindiName ? (
              <p className="truncate text-xs text-[#8b7355]">{product.hindiName}</p>
            ) : null}
            {product.planet ? (
              <p className="text-[10px] uppercase tracking-wide text-[#8b1a1a]">{product.planet}</p>
            ) : null}
            {product.price != null ? (
              <p className="mt-0.5 text-sm font-bold text-[#8b1a1a]">
                ₹{product.price.toLocaleString('en-IN')}
                {!product.inStock ? ' · Ask availability' : ''}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
