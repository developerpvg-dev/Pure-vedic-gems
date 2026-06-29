'use client';

/**
 * Step 2 — Browse & Select Stone (Compact)
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { buildProductMeta, formatProductListPrice } from '@/lib/utils/format';
import { isProductPriceOnRequest, isProductPurchasable } from '@/lib/shop/product-pricing';
import { productHref } from '@/lib/categories/storefront';
import { isRudrakshaStorefrontSlug } from '@/lib/constants/rudraksha-subcategories';
import { toast } from 'sonner';
import type { ProductCard } from '@/lib/types/product';
import type { ProductListResponse } from '@/lib/types/product';
import type { GemCategory } from '@/lib/types/configurator';

interface GemBrowserProps {
  category: GemCategory;
  selected: ProductCard | null;
  onSelect: (product: ProductCard) => void;
  rudrakshaMode?: boolean;
  comboProducts?: ProductCard[];
  onToggleCombo?: (product: ProductCard) => void;
  onContinueRudraksha?: () => void;
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

const BASE_CATEGORIES = ['navaratna', 'upratna', 'gemstone', 'rudraksha', 'jewelry', 'mala', 'idol'];
const PER_PAGE = 20;

async function resolveCatalogFilters(category: GemCategory): Promise<{
  category?: string;
  sub_category?: string;
}> {
  if (category === 'other') {
    return {};
  }

  if (BASE_CATEGORIES.includes(category)) {
    return { category };
  }

  if (category === 'rudraksha' || isRudrakshaStorefrontSlug(category)) {
    return category === 'rudraksha'
      ? { category: 'rudraksha' }
      : { category: 'rudraksha', sub_category: category };
  }

  try {
    const catRes = await fetch('/api/categories');
    const catData = await catRes.json();
    const matched = (catData?.categories ?? []).find(
      (c: Record<string, unknown>) => String(c.slug) === category
    );
    if (matched) {
      const parentCat = matched.type === 'upratna' ? 'upratna' : 'navaratna';
      return { category: parentCat, sub_category: category };
    }
  } catch {
    // fall through
  }

  return { category: 'navaratna', sub_category: category };
}

function pageWindow(page: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) =>
      pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1
  );
}

export default function GemBrowser({
  category,
  selected,
  onSelect,
  rudrakshaMode = false,
  comboProducts = [],
  onToggleCombo,
  onContinueRudraksha,
}: GemBrowserProps) {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState(0);
  const [sort, setSort] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [category, priceRange, sort, debouncedSearch]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalogFilters = await resolveCatalogFilters(category);
      const params = new URLSearchParams();

      if (catalogFilters.category) {
        params.set('category', catalogFilters.category);
      }
      if (catalogFilters.sub_category) {
        params.set('sub_category', catalogFilters.sub_category);
      }

      params.set('configurator_enabled', 'true');

      const range = PRICE_RANGES[priceRange];
      if (range.min > 0) params.set('min_price', String(range.min));
      if (range.max > 0) params.set('max_price', String(range.max));

      if (sort === 'price_asc') {
        params.set('sort_by', 'price');
        params.set('sort_order', 'asc');
      } else if (sort === 'price_desc') {
        params.set('sort_by', 'price');
        params.set('sort_order', 'desc');
      } else if (sort === 'carat_desc') {
        params.set('sort_by', 'carat');
        params.set('sort_order', 'desc');
      }

      if (debouncedSearch) {
        params.set('q', debouncedSearch);
      }

      params.set('per_page', String(PER_PAGE));
      params.set('page', String(page));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as ProductListResponse;

      setProducts((data.products ?? []).filter((product) => isProductPurchasable(product)));
      setTotalCount(data.total ?? 0);
      setTotalPages(Math.max(1, data.total_pages ?? 1));
    } catch {
      setProducts([]);
      setTotalCount(0);
      setTotalPages(1);
      setError('Failed to load gemstones. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, priceRange, sort, debouncedSearch, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const pageNumbers = useMemo(() => pageWindow(page, totalPages), [page, totalPages]);
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangeEnd = Math.min(page * PER_PAGE, totalCount);
  const selectedBeadCount =
    (selected ? 1 : 0) + comboProducts.filter((item) => item.id !== selected?.id).length;

  function handleProductClick(product: ProductCard, onRequest: boolean) {
    if (onRequest) {
      toast.info('This bead is available on request', {
        description: 'Open the product page to enquire via WhatsApp or contact form.',
        action: {
          label: 'View bead',
          onClick: () => {
            window.location.href = productHref(product);
          },
        },
      });
      return;
    }

    if (!rudrakshaMode) {
      onSelect(product);
      return;
    }

    if (selected?.id === product.id) {
      return;
    }

    if (!selected) {
      onSelect(product);
      return;
    }

    onToggleCombo?.(product);
  }

  function isProductInRudrakshaSelection(productId: string) {
    if (selected?.id === productId) return true;
    return comboProducts.some((item) => item.id === productId);
  }

  return (
    <div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <div className="relative min-w-36 flex-1">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
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
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {!loading && !error && rudrakshaMode && (
        <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            Select one or more Rudraksha beads. Choose 3 or more to unlock multi-bead pendant designs.
          </p>
          {selectedBeadCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-primary">
              {selectedBeadCount} bead{selectedBeadCount === 1 ? '' : 's'} selected
              {selectedBeadCount >= 3 ? ' · Multi-bead designs available' : ''}
            </p>
          )}
        </div>
      )}

      {!loading && !error && totalCount > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Showing {rangeStart}–{rangeEnd} of {totalCount} stone{totalCount === 1 ? '' : 's'}
        </p>
      )}

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
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchProducts}>
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm font-medium text-primary">No stones found</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Adjust filters or search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => {
                const isChosen = rudrakshaMode
                  ? isProductInRudrakshaSelection(product.id)
                  : selected?.id === product.id;
                const isPrimary = selected?.id === product.id;
                const priceDisplay = formatProductListPrice(product);
                const onRequest = isProductPriceOnRequest(product);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductClick(product, onRequest)}
                    aria-pressed={isChosen}
                    aria-disabled={onRequest}
                    className={cn(
                      'group relative overflow-hidden rounded-lg border text-left transition-all duration-150',
                      onRequest
                        ? 'cursor-not-allowed border-[#7A1515]/20 opacity-90'
                        : 'hover:border-accent hover:shadow-sm',
                      isChosen
                        ? 'border-accent shadow-sm ring-1 ring-accent/30'
                        : 'border-border'
                    )}
                  >
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
                      {onRequest && (
                        <div className="absolute left-1 top-1 z-10 rounded bg-[#7A1515]/95 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                          On Request
                        </div>
                      )}
                      {isChosen && (
                        <div className="absolute inset-0 flex items-center justify-center bg-accent/15">
                          <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-accent-foreground">
                            {rudrakshaMode && isPrimary ? 'Primary' : '✓'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-[11px] font-medium leading-tight text-primary">
                        {product.name}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                        {buildProductMeta({
                          carat_weight: product.carat_weight,
                          origin: product.origin,
                          shape: product.shape,
                        })}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-[11px] font-semibold',
                          priceDisplay.label === 'Price on Request'
                            ? 'text-[#7A1515]'
                            : 'text-accent'
                        )}
                      >
                        {priceDisplay.label}
                      </p>
                      {priceDisplay.detail && (
                        <p className="text-[9px] text-muted-foreground">{priceDisplay.detail}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                className="mt-4 flex flex-wrap items-center justify-center gap-1.5"
                aria-label="Stone pagination"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Button>

                {pageNumbers.map((pageNumber, index) => {
                  const previous = pageNumbers[index - 1];
                  return (
                    <span key={pageNumber} className="flex items-center gap-1.5">
                      {previous && pageNumber - previous > 1 ? (
                        <span className="px-1 text-xs text-muted-foreground">…</span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        aria-current={pageNumber === page ? 'page' : undefined}
                        className={cn(
                          'flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors',
                          pageNumber === page
                            ? 'border-accent bg-accent text-accent-foreground'
                            : 'border-border bg-card text-foreground hover:border-accent/50'
                        )}
                      >
                        {pageNumber}
                      </button>
                    </span>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </nav>
            )}
            {rudrakshaMode && selected && onContinueRudraksha && (
              <div className="mt-4 flex justify-end">
                <Button type="button" size="sm" className="h-9 px-4 text-xs" onClick={onContinueRudraksha}>
                  Continue with {selectedBeadCount} bead{selectedBeadCount === 1 ? '' : 's'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
