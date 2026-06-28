'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ExternalLink, GripVertical, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';
import { KNOWN_GEM_SUBCATEGORIES, knownSubcategoryHref } from '@/lib/categories/shop';
import { formatPrice } from '@/lib/utils/format';

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  legacy_woo_id: number | null;
  in_stock: boolean;
  availability_status: string | null;
  stock_status: string | null;
  thumbnail_url: string | null;
  price: number | null;
  carat_weight: number | null;
};

const NAVARATNA_OPTIONS = Object.entries(KNOWN_GEM_SUBCATEGORIES)
  .filter(([, meta]) => meta.category === 'navaratna')
  .map(([slug, meta]) => ({ slug, label: meta.label }));

export default function AdminCatalogOrderPage() {
  const [subCategory, setSubCategory] = useState(NAVARATNA_OPTIONS[0]?.slug ?? 'ruby');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const category = 'navaratna';
  const selectedLabel = NAVARATNA_OPTIONS.find((opt) => opt.slug === subCategory)?.label ?? subCategory;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, sub_category: subCategory });
      const res = await fetch(`/api/admin/catalog-order?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load products');
      setProducts((data.products ?? []) as CatalogProduct[]);
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [subCategory]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const reindex = useCallback((list: CatalogProduct[]) => {
    return list.map((product, index) => ({ ...product, display_order: index }));
  }, []);

  const moveItem = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= products.length || to >= products.length) return;
    const next = [...products];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setProducts(reindex(next));
    setDirty(true);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/catalog-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          sub_category: subCategory,
          items: products.map((product, index) => ({
            id: product.id,
            display_order: index,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save order');
      toast.success(`Saved order for ${selectedLabel}`);
      setDirty(false);
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const storefrontHref = useMemo(() => knownSubcategoryHref(subCategory), [subCategory]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catalog Display Order"
        description="Drag or use arrows to set how products appear in each Navaratna collection. Out-of-stock items still appear last on the storefront."
        actions={(
          <>
            <Link
              href={storefrontHref}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              View shop
            </Link>
            <button
              type="button"
              onClick={() => void saveOrder()}
              disabled={!dirty || saving || loading || products.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save order
            </button>
          </>
        )}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label htmlFor="sub-category" className="block text-sm font-medium text-gray-700">
          Navaratna category
        </label>
        <select
          id="sub-category"
          value={subCategory}
          onChange={(event) => setSubCategory(event.target.value)}
          className="mt-2 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {NAVARATNA_OPTIONS.map((option) => (
            <option key={option.slug} value={option.slug}>{option.label}</option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          {products.length} active products · positions 0–{Math.max(products.length - 1, 0)}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No active products in this category.
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((product, index) => (
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
              className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition ${
                dragIndex === index ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200'
              }`}
            >
              <button
                type="button"
                className="cursor-grab text-gray-400 active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </button>

              <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-gray-500">
                {index + 1}
              </span>

              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {product.thumbnail_url ? (
                  <Image src={product.thumbnail_url} alt="" fill className="object-cover" sizes="56px" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {product.carat_weight ? `${product.carat_weight} ct · ` : ''}
                  {product.price != null ? formatPrice(product.price) : 'Price on request'}
                  {product.legacy_woo_id ? ` · Woo #${product.legacy_woo_id}` : ''}
                </p>
              </div>

              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                product.in_stock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {product.in_stock ? 'In stock' : 'Out of stock'}
              </span>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, index - 1)}
                  disabled={index === 0}
                  className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, index + 1)}
                  disabled={index === products.length - 1}
                  className="rounded border border-gray-200 p-1 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
