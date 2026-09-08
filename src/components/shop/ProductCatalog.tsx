'use client';

import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/shop/ProductGrid';
import type { ProductCard as ProductCardType } from '@/lib/types/product';

export function ProductCatalog({ products }: { products: ProductCardType[] }) {
  const searchParams = useSearchParams();
  const layout = searchParams.get('view') === 'list' ? 'list' : 'grid';

  return <ProductGrid products={products} layout={layout} />;
}
