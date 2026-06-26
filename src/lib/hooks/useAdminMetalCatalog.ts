'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  laborRatesFromCatalog,
  parseAdminMetalCatalogFromApi,
  pricingModesFromCatalog,
  ratesBySlugFromCatalog,
  type MetalCatalogEntry,
} from '@/lib/utils/metal-pricing-config';

export function useAdminMetalCatalog() {
  const [catalog, setCatalog] = useState<MetalCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/metals');
      if (!res.ok) throw new Error('Failed to load metals');
      const data = await res.json();
      const parsed = parseAdminMetalCatalogFromApi(data);
      setCatalog(parsed);
      return parsed;
    } catch {
      toast.error('Failed to load metal catalog');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const ratesBySlug = ratesBySlugFromCatalog(catalog);
  const laborRates = laborRatesFromCatalog(catalog);
  const pricingModes = pricingModesFromCatalog(catalog);

  return {
    catalog,
    loading,
    reload,
    ratesBySlug,
    laborRates,
    pricingModes,
  };
}

export function nameToMetalSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
