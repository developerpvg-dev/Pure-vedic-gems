'use client';

import useSWR from 'swr';
import type { GoldRateData } from '@/lib/types/configurator';
import {
  laborRatesFromCatalog,
  parseMetalCatalogFromApi,
  pricingModesFromCatalog,
  ratesBySlugFromCatalog,
  type MetalCatalogEntry,
} from '@/lib/utils/metal-pricing-config';

const SLUG_TO_RATE_KEY: Record<string, keyof GoldRateData> = {
  gold_22k: 'gold_22k_per_gram',
  gold_18k: 'gold_18k_per_gram',
  gold_14k: 'gold_14k_per_gram',
  silver_925: 'silver_per_gram',
  panchdhatu: 'panchdhatu_per_gram',
  platinum: 'platinum_per_gram',
};

const EMPTY_MANUAL_PRICES: GoldRateData = {
  gold_22k_per_gram: 0,
  gold_18k_per_gram: 0,
  gold_14k_per_gram: 0,
  silver_per_gram: 0,
  panchdhatu_per_gram: 0,
  platinum_per_gram: 0,
  fetched_at: '',
  source: 'admin_metals',
  stale: false,
  manual_override: true,
};

async function fetchMetalCatalog(url: string): Promise<{
  prices: GoldRateData;
  catalog: MetalCatalogEntry[];
  laborRates: Record<string, number>;
  pricingModes: Record<string, 'weight' | 'fixed_sheet'>;
  ratesBySlug: Record<string, number>;
}> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load metal prices');
  const rows = await response.json();
  const catalog = parseMetalCatalogFromApi(rows);
  const prices = { ...EMPTY_MANUAL_PRICES } as GoldRateData;
  let latestUpdated = '';

  for (const row of catalog) {
    const key = SLUG_TO_RATE_KEY[row.slug];
    if (key) {
      switch (key) {
        case 'gold_22k_per_gram':
          prices.gold_22k_per_gram = row.price_per_gram;
          break;
        case 'gold_18k_per_gram':
          prices.gold_18k_per_gram = row.price_per_gram;
          break;
        case 'gold_14k_per_gram':
          prices.gold_14k_per_gram = row.price_per_gram;
          break;
        case 'silver_per_gram':
          prices.silver_per_gram = row.price_per_gram;
          break;
        case 'panchdhatu_per_gram':
          prices.panchdhatu_per_gram = row.price_per_gram;
          break;
        case 'platinum_per_gram':
          prices.platinum_per_gram = row.price_per_gram;
          break;
      }
    }
    const updatedAt = (rows as Array<{ slug?: string; updated_at?: string }>).find(
      (r) => r.slug === row.slug
    )?.updated_at;
    if (updatedAt && updatedAt > latestUpdated) {
      latestUpdated = updatedAt;
    }
  }

  prices.fetched_at = latestUpdated || new Date().toISOString();

  return {
    prices,
    catalog,
    laborRates: laborRatesFromCatalog(catalog),
    pricingModes: pricingModesFromCatalog(catalog),
    ratesBySlug: ratesBySlugFromCatalog(catalog),
  };
}

export function useManualMetalPrices() {
  const { data, error, isLoading } = useSWR('/api/metals', fetchMetalCatalog, {
    revalidateOnFocus: true,
    dedupingInterval: 30 * 1000,
    refreshInterval: 60 * 1000,
  });

  return {
    metalPrices: data?.prices ?? null,
    laborRates: data?.laborRates ?? null,
    pricingModes: data?.pricingModes ?? null,
    ratesBySlug: data?.ratesBySlug ?? null,
    metalCatalog: data?.catalog ?? null,
    isLoading,
    error: error ? 'Failed to load admin metal prices' : null,
  };
}

export function resolveMetalRatePerGram(
  slug: string,
  goldRate: GoldRateData | null,
  ratesBySlug?: Record<string, number> | null
): number {
  if (ratesBySlug?.[slug] && ratesBySlug[slug] > 0) return ratesBySlug[slug];
  const key = SLUG_TO_RATE_KEY[slug];
  if (key && goldRate) return (goldRate[key] as number) ?? 0;
  return 0;
}
