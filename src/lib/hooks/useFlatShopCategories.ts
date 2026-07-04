'use client';

import { useEffect, useState } from 'react';
import type { ShopCategoryBrowseCard } from '@/lib/types/shop-category-page';

export function useFlatShopCategories(): ShopCategoryBrowseCard[] {
  const [categories, setCategories] = useState<ShopCategoryBrowseCard[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/shop-categories')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}
