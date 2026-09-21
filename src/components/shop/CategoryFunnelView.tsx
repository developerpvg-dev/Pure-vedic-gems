'use client';

import { useEffect, useRef } from 'react';
import { trackProductFunnel } from '@/lib/utils/product-funnel-client';

/** One category_view per session for a shop/category listing. */
export function CategoryFunnelView({ category }: { category: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current || !category) return;
    fired.current = true;
    trackProductFunnel({
      event: 'category_view',
      category,
      source: 'category_listing',
    });
  }, [category]);
  return null;
}
