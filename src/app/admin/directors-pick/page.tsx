'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';
import { CANONICAL_CATEGORY_OPTIONS } from '@/lib/constants/product-taxonomy';
import { reorderWithInsertAt } from '@/lib/admin/catalog-order-categories';
import { formatPrice } from '@/lib/utils/format';

type PickProduct = {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
  category: string | null;
  sub_category: string | null;
  price: number | null;
  carat_weight: number | null;
  origin: string | null;
  display_order: number;
  curator_note: string | null;
  thumbnail_url: string | null;
  images: unknown;
  is_active: boolean | null;
};

type SearchProduct = PickProduct & {
  is_directors_pick?: boolean;
};

function productThumb(product: { thumbnail_url: string | null; images: unknown }) {
  if (product.thumbnail_url) return product.thumbnail_url;
  if (Array.isArray(product.images) && product.images[0] && typeof product.images[0] === 'string') {
    return product.images[0];
  }
  return null;
}

function PositionInput({
  position,
  max,
  onCommit,
}: {
  position: number;
  max: number;
  onCommit: (targetPosition: number) => void;
}) {
  const [value, setValue] = useState(String(position));

  useEffect(() => {
    setValue(String(position));
  }, [position]);

  function commit() {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      setValue(String(position));
      return;
    }
    onCommit(parsed);
  }

  return (
    <input
      type="number"
      min={1}
      max={max}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commit();
          (event.target as HTMLInputElement).blur();
        }
      }}
      aria-label={`Display position, currently ${position}`}
      className="w-14 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm font-semibold tabular-nums text-gray-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
    />
  );
}

export default function AdminDirectorsPickPage() {
  const [picks, setPicks] = useState<PickProduct[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subOptions, setSubOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const pickIds = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);

  const loadPicks = useCallback(async () => {
    setLoadingPicks(true);
    try {
      const res = await fetch('/api/admin/directors-pick');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load picks');
      setPicks((data.picks ?? []) as PickProduct[]);
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load picks');
      setPicks([]);
    } finally {
      setLoadingPicks(false);
    }
  }, []);

  useEffect(() => {
    void loadPicks();
  }, [loadPicks]);

  useEffect(() => {
    if (!category) {
      setSubOptions([]);
      setSubCategory('');
      return;
    }
    const params = new URLSearchParams({ category });
    void fetch(`/api/admin/products/filter-options?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const options = (data.sub_categories ?? []) as Array<{ value: string; label: string }>;
        setSubOptions(options);
        if (!options.some((opt) => opt.value === subCategory)) {
          setSubCategory('');
        }
      })
      .catch(() => setSubOptions([]));
  }, [category, subCategory]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({ per_page: '30', status: 'active', sort_by: 'name', sort_order: 'asc' });
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (subCategory) params.set('sub_category', subCategory);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchResults((data.products ?? []) as SearchProduct[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [search, category, subCategory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runSearch();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [runSearch]);

  const reindex = useCallback((list: PickProduct[]) => {
    return list.map((product, index) => ({ ...product, display_order: index }));
  }, []);

  const applyOrder = useCallback(
    (next: PickProduct[]) => {
      setPicks(reindex(next));
      setDirty(true);
    },
    [reindex]
  );

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= picks.length || to >= picks.length) return;
    applyOrder(reorderWithInsertAt(picks, from, to + 1));
  };

  const moveToPosition = (from: number, targetPosition: number) => {
    applyOrder(reorderWithInsertAt(picks, from, targetPosition));
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      const res = await fetch('/api/admin/directors-pick', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: picks.map((p, index) => ({ id: p.id, display_order: index })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save order');
      toast.success('Order saved');
      setDirty(false);
      await loadPicks();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save order');
    } finally {
      setSavingOrder(false);
    }
  };

  const addToPicks = async (product: SearchProduct) => {
    if (pickIds.has(product.id)) return;
    setAddingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'directors_pick',
          enabled: true,
          display_order: picks.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');
      toast.success(`Added "${product.name}" to Director's Pick`);
      await loadPicks();
      void runSearch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setAddingId(null);
    }
  };

  const removeFromPicks = async (product: PickProduct) => {
    setRemovingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'directors_pick', enabled: false, display_order: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove product');
      toast.success(`Removed "${product.name}" from Director's Pick`);
      await loadPicks();
      void runSearch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove product');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <AdminPageHeader
          title="Director's Pick"
          description="Curate homepage picks from existing products. The first 5 in order appear on the homepage."
        />
      </div>

      <section className="rounded-xl border border-purple-200 bg-purple-50/40 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-700" />
            <h2 className="text-base font-semibold text-gray-900">Current picks ({picks.length})</h2>
          </div>
          {dirty ? (
            <button
              type="button"
              onClick={() => void saveOrder()}
              disabled={savingOrder}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60"
            >
              {savingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save order
            </button>
          ) : null}
        </div>

        {loadingPicks ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : picks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-purple-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
            No products in Director&apos;s Pick yet. Search below and add existing products.
          </p>
        ) : (
          <ul className="space-y-2">
            {picks.map((product, index) => {
              const thumb = productThumb(product);
              const onHomepage = index < 5;
              return (
                <li
                  key={product.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) moveItem(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${onHomepage ? 'border-purple-200' : 'border-gray-200'} ${dragIndex === index ? 'opacity-50' : ''}`}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-400" />
                  <PositionInput
                    position={index + 1}
                    max={picks.length}
                    onCommit={(pos) => moveToPosition(index, pos)}
                  />
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg">💎</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {[product.category, product.sub_category, product.sku].filter(Boolean).join(' · ')}
                      {product.price != null ? ` · ${formatPrice(product.price)}` : ''}
                    </p>
                  </div>
                  {onHomepage ? (
                    <span className="hidden shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-800 sm:inline">
                      Homepage
                    </span>
                  ) : null}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === picks.length - 1}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeFromPicks(product)}
                      disabled={removingId === product.id}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Remove from Director's Pick"
                    >
                      {removingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Add from catalog</h2>
        <p className="mb-4 text-sm text-gray-500">Search and filter existing products, then add them to Director&apos;s Pick.</p>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, SKU…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500"
          >
            <option value="">All categories</option>
            {CANONICAL_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={subCategory}
            onChange={(event) => setSubCategory(event.target.value)}
            disabled={!category || subOptions.length === 0}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">All sub-categories</option>
            {subOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {searching ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : searchResults.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No products match your filters.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100">
            {searchResults.map((product) => {
              const thumb = productThumb(product);
              const alreadyAdded = pickIds.has(product.id);
              return (
                <li key={product.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm">💎</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {[product.category, product.sub_category].filter(Boolean).join(' · ')}
                      {product.price != null ? ` · ${formatPrice(product.price)}` : ''}
                    </p>
                  </div>
                  {alreadyAdded ? (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void addToPicks(product)}
                      disabled={addingId === product.id}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-800 hover:bg-purple-100 disabled:opacity-50"
                    >
                      {addingId === product.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add to pick
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
