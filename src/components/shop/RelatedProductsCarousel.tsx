'use client';

import { ProductCard } from '@/components/shop/ProductCard';
import { ProductHorizontalScroller } from '@/components/shop/ProductHorizontalScroller';
import type { ProductCard as ProductCardType } from '@/lib/types/product';

export function RelatedProductsCarousel({ products }: { products: ProductCardType[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-10 lg:mt-16">
      <div className="mb-3 text-center lg:mb-5">
        <h2 className="text-xl font-medium text-[#7A1515] lg:text-2xl">Related Gemstones</h2>
      </div>
      <ProductHorizontalScroller ariaLabel="Related gemstones">
        {products.map((p) => (
          <div
            key={p.id}
            role="listitem"
            className="w-[42vw] max-w-[180px] shrink-0 sm:w-[160px] sm:max-w-none md:w-[180px] lg:w-[200px]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </ProductHorizontalScroller>
    </section>
  );
}
