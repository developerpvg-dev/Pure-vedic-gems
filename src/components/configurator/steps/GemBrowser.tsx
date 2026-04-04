'use client';

/**
 * Step 2 — Browse & Select Stone (Compact)
 * Smaller product cards, horizontal-first layout to reduce scrolling.
 */

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatPrice, buildProductMeta } from '@/lib/utils/format';
import type { ProductCard } from '@/lib/types/product';
import type { GemCategory } from '@/lib/types/configurator';

interface GemBrowserProps {
  category: GemCategory;
  selected: ProductCard | null;
  onSelect: (product: ProductCard) => void;
}

const PRICE_RANGES = [
  { label: 'All', min: 0, max: 0 },
  { label: '<₹25K', min: 0, max: 25000 },
  { label: '₹25K–1L', min: 25000, max: 100000 },
  { label: '₹1L–5L', min: 100000, max: 500000 },
  { label: '₹5L+', min: 500000, max: 0 },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Carat ↓', value: 'carat_desc' },
];

export default function GemBrowser({ category, selected, onSelect }: GemBrowserProps) {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(0);
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const BASE_CATEGORIES = ['navaratna', 'upratna', 'gemstone', 'rudraksha', 'jewelry', 'mala', 'idol'];
      const isBaseCategory = BASE_CATEGORIES.includes(category);

      if (category === 'other') {
        // Show all
      } else if (isBaseCategory) {
        params.set('category', category);
      } else {
        try {
          const catRes = await fetch(`/api/categories`);
          const catData = await catRes.json();
          const matched = (catData?.categories ?? []).find(
            (c: Record<string, unknown>) => String(c.slug) === category
          );
          if (matched) {
            const parentCat = matched.type === 'upratna' ? 'upratna' : 'navaratna';
            params.set('category', parentCat);
          }
        } catch {
          params.set('category', 'navaratna');
        }
        params.set('sub_category', category);
      }

      params.set('configurator_enabled', 'true');
      const range = PRICE_RANGES[priceRange];
      if (range.min > 0) params.set('min_price', String(range.min));
      if (range.max > 0) params.set('max_price', String(range.max));

      if (sort === 'price_asc') { params.set('sort_by', 'price'); params.set('sort_order', 'asc'); }
      else if (sort === 'price_desc') { params.set('sort_by', 'price'); params.set('sort_order', 'desc'); }
      else if (sort === 'carat_desc') { params.set('sort_by', 'carat'); params.set('sort_order', 'desc'); }

      params.set('per_page', '24');
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
      setError('Failed to load gemstones. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, priceRange, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <div>
      {/* Compact filters — single row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <div className="relative flex-1 min-w-36">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
        <div className="flex gap-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() => setPriceRange(idx)}
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                priceRange === idx
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
          className="h-7 rounded-md border border-border bg-card px-1.5 text-[10px] text-foreground"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Product grid — compact cards */}
      <div className="mt-3">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm font-medium text-primary">{error}</p>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={fetchProducts}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm font-medium text-primary">No stones found</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Adjust filters or search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => {
              const isChosen = selected?.id === product.id;
              return (
                <button
                  key={product.id}
                  onClick={() => onSelect(product)}
                  aria-pressed={isChosen}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border text-left transition-all duration-150',
                    'hover:shadow-sm hover:border-accent',
                    isChosen
                      ? 'border-accent ring-1 ring-accent/30 shadow-sm'
                      : 'border-border'
                  )}
                >
                  {/* Square image */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.thumbnail_url || (product.images as string[] | null)?.[0] ? (
                      <Image
                        src={product.thumbnail_url || (product.images as string[])[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl">💎</div>
                    )}
                    {isChosen && (
                      <div className="absolute inset-0 bg-accent/15 flex items-center justify-center">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-accent-foreground">
                          ✓
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Info — compact */}
                  <div className="p-1.5">
                    <p className="truncate text-[11px] font-medium text-primary leading-tight">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground truncate">
                      {buildProductMeta({ carat_weight: product.carat_weight, origin: product.origin, shape: product.shape })}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-accent">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
