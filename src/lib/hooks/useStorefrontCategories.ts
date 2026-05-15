'use client';

import { useEffect, useState } from 'react';
import {
  normalizeStorefrontGroups,
  STORE_CATEGORY_GROUPS_FALLBACK,
  type StorefrontCategoryGroup,
} from '@/lib/categories/storefront';

export function useStorefrontCategories(): StorefrontCategoryGroup[] {
  const [groups, setGroups] = useState<StorefrontCategoryGroup[]>(STORE_CATEGORY_GROUPS_FALLBACK);

  useEffect(() => {
    let alive = true;

    fetch('/api/categories?scope=storefront', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (alive) setGroups(normalizeStorefrontGroups(data));
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return groups;
}