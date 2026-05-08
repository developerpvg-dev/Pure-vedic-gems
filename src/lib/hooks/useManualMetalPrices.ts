'use client';

import useSWR from 'swr';
import type { GoldRateData } from '@/lib/types/configurator';

type MetalPriceRow = {
  slug: string;
  price_per_gram: number;
  updated_at?: string | null;
};

type MetalRateKey =
  | 'gold_22k_per_gram'
  | 'gold_18k_per_gram'
  | 'silver_per_gram'
  | 'panchdhatu_per_gram'
  | 'platinum_per_gram';

const SLUG_TO_RATE_KEY: Record<string, MetalRateKey> = {
  gold_22k: 'gold_22k_per_gram',
  gold_18k: 'gold_18k_per_gram',
  silver_925: 'silver_per_gram',
  panchdhatu: 'panchdhatu_per_gram',
  platinum: 'platinum_per_gram',
};

const EMPTY_MANUAL_PRICES: GoldRateData = {
  gold_22k_per_gram: 0,
  gold_18k_per_gram: 0,
  silver_per_gram: 0,
  panchdhatu_per_gram: 0,
  platinum_per_gram: 0,
  fetched_at: '',
  source: 'admin_metals',
  stale: false,
  manual_override: true,
};

async function fetchManualMetalPrices(url: string): Promise<GoldRateData> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load metal prices');
  const rows = await response.json() as MetalPriceRow[];
  const prices: GoldRateData = { ...EMPTY_MANUAL_PRICES };
  let latestUpdated = '';

  for (const row of rows) {
    const key = SLUG_TO_RATE_KEY[row.slug];
    if (key && typeof row.price_per_gram === 'number') {
      prices[key] = row.price_per_gram;
    }
    if (row.updated_at && row.updated_at > latestUpdated) {
      latestUpdated = row.updated_at;
    }
  }

  prices.fetched_at = latestUpdated || new Date().toISOString();
  return prices;
}

export function useManualMetalPrices() {
  const { data, error, isLoading } = useSWR<GoldRateData>(
    '/api/metals',
    fetchManualMetalPrices,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30 * 1000,
      refreshInterval: 60 * 1000,
    }
  );

  return {
    metalPrices: data ?? null,
    isLoading,
    error: error ? 'Failed to load admin metal prices' : null,
  };
}