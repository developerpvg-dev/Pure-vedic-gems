'use client';

import { useEffect, useState } from 'react';
import {
  normalizeStorefrontGroups,
  STORE_CATEGORY_GROUPS_FALLBACK,
  type StorefrontCategoryGroup,
} from '@/lib/categories/storefront';

const CACHE_KEY = 'pvg_storefront_categories_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function readCachedGroups(): StorefrontCategoryGroup[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: unknown };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return normalizeStorefrontGroups(data);
  } catch {
    return null;
  }
}

function writeCachedGroups(data: unknown) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // sessionStorage unavailable (private browsing quota, etc.) — ignore
  }
}

export function useStorefrontCategories(): StorefrontCategoryGroup[] {
  // Keep the first render identical between SSR and client to avoid hydration mismatch.
  const [groups, setGroups] = useState<StorefrontCategoryGroup[]>(STORE_CATEGORY_GROUPS_FALLBACK);

  useEffect(() => {
    let alive = true;

    const cached = readCachedGroups();
    if (cached && alive) {
      setGroups(cached);
    }

    fetch('/api/categories?scope=storefront', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!alive) return;
        writeCachedGroups(data);
        setGroups(normalizeStorefrontGroups(data));
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, []);

  return groups;
}