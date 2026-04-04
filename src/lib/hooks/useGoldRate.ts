'use client';

/**
 * useGoldRate — SWR hook for fetching live gold/metal rates.
 * Cached for 1 hour, auto-refreshes in background.
 */

import useSWR from 'swr';
import type { GoldRateData } from '@/lib/types/configurator';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useGoldRate() {
  const { data, error, isLoading } = useSWR<GoldRateData>(
    '/api/gold-rate',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60 * 60 * 1000, // 1 hour dedup
      refreshInterval: 60 * 60 * 1000,  // 1 hour auto-refresh
    }
  );

  return {
    goldRate: data ?? null,
    isLoading,
    error: error ? 'Failed to load metal rates' : null,
  };
}
