'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Archive, RotateCcw, Lock, Unlock, Star, Upload, Download, PackageCheck, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminAnalyticsPanel, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart, fmtInr } from '@/components/admin/AdminCharts';
import {
  AdminProductFilters,
  EMPTY_ADMIN_PRODUCT_FILTERS,
  adminProductFiltersToParams,
  type AdminProductFilterState,
} from '@/components/admin/AdminProductFilters';

interface AdminProduct {
  id: string;
  sku: string;
  tag_number: string | null;
  legacy_woo_id: number | null;
  name: string;
  slug: string;
  category: string;
  sub_category: string | null;
  price: number;
  carat_weight: number | null;
  origin: string | null;
  in_stock: boolean;
  stock_quantity: number;
  stock_status: string;
  availability_status: string;
  reserved_until: string | null;
  reservation_note: string | null;
  is_active: boolean;
  featured: boolean;
  is_directors_pick: boolean;
  display_order: number;
  images: string[];
  created_at: string;
}

const PRODUCTS_PER_PAGE = 20;

function readInitialFilters(): AdminProductFilterState {
  if (typeof window === 'undefined') return { ...EMPTY_ADMIN_PRODUCT_FILTERS };
  const params = new URLSearchParams(window.location.search);
  return {
    ...EMPTY_ADMIN_PRODUCT_FILTERS,
    search: params.get('search') ?? '',
    category: params.get('category') ?? '',
    sub_category: params.get('sub_category') ?? '',
    product_type: params.get('product_type') ?? '',
    status: params.get('status') ?? '',
    availability: params.get('availability_status') ?? '',
    stock: params.get('stock') ?? '',
    origin: params.get('origin') ?? '',
    planet: params.get('planet') ?? '',
    shape: params.get('shape') ?? '',
    quality_label: params.get('quality_label') ?? '',
    certificate_lab: params.get('certificate_lab') ?? '',
    treatment: params.get('treatment') ?? '',
    price_mode: params.get('price_mode') ?? '',
    min_price: params.get('min_price') ?? '',
    max_price: params.get('max_price') ?? '',
    min_carat: params.get('min_carat') ?? '',
    max_carat: params.get('max_carat') ?? '',
    featured: params.get('featured') ?? '',
    directors_pick: params.get('directors_pick') ?? '',
    configurator_enabled: params.get('configurator_enabled') ?? '',
    sort_by: params.get('sort_by') ?? 'newest',
    sort_order: params.get('sort_order') ?? 'desc',
  };
}

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<AdminProductFilterState>({ ...EMPTY_ADMIN_PRODUCT_FILTERS });
  const [filtersReady, setFiltersReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    summary: { totalProducts: number; activeProducts: number; lowStockCount: number; outOfStockCount: number; catalogValue: number; avgPrice: number };
    categoryBreakdown: Array<{ label: string; value: number; meta: number }>;
    availabilityBreakdown: Array<{ label: string; value: number; meta: number }>;
    creationTrend: Array<{ date: string; label: string; orders: number; revenue: number }>;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const syncUrl = useCallback((nextFilters: AdminProductFilterState, nextPage: number) => {
    const params = adminProductFiltersToParams(nextFilters, nextPage, PRODUCTS_PER_PAGE);
    params.delete('page');
    params.delete('per_page');
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  useEffect(() => {
    setFilters(readInitialFilters());
    const params = new URLSearchParams(window.location.search);
    const initialPage = Math.max(1, Number(params.get('page') ?? '1'));
    setPage(initialPage);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    syncUrl(filters, page);
  }, [filters, page, filtersReady, syncUrl]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = adminProductFiltersToParams(filters, page, PRODUCTS_PER_PAGE);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    }
    setLoading(false);
  }, [filters, page]);

  const updateFilters = useCallback((updates: Partial<AdminProductFilterState>) => {
    setFilters((current) => ({ ...current, ...updates }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...EMPTY_ADMIN_PRODUCT_FILTERS });
    setPage(1);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    void Promise.resolve().then(fetchProducts);
  }, [filtersReady, fetchProducts]);

  useEffect(() => {
    const params = adminProductFiltersToParams(filters, 1, PRODUCTS_PER_PAGE);
    params.delete('page');
    params.delete('per_page');
    params.delete('sort_by');
    params.delete('sort_order');
    fetch(`/api/admin/products/analytics?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAnalytics(data); })
      .catch(() => undefined);
  }, [filters]);

  const runOperation = async (id: string, body: Record<string, unknown>, failureMessage = 'Product update failed') => {
    setBusyProduct(id);
    const res = await fetch(`/api/admin/products/${id}/operations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      fetchProducts();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || failureMessage);
    }
    setBusyProduct(null);
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive "${name}"? It will be hidden from shop and can be restored later.`)) return;
    await runOperation(id, { action: 'archive', note: 'Archived from product list' }, 'Failed to archive product');
  };

  const handleStockUpdate = async (product: AdminProduct) => {
    // ponytail: each piece is unique — toggle available (1) ↔ unavailable (0)
    const nextStock = (product.stock_quantity ?? 0) > 0 ? 0 : 1;
    const label = nextStock === 1 ? 'Available' : 'Unavailable';
    if (!confirm(`Mark "${product.name}" as ${label}?`)) return;
    await runOperation(
      product.id,
      { action: 'stock_update', stock_quantity: nextStock, note: `Marked ${label.toLowerCase()}` },
      'Failed to update stock',
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/exports?type=products"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export
          </a>
          <Link
            href="/admin/products/import"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50"
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      <AdminProductFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />

      <AdminAnalyticsPanel
        title="Catalog analytics"
        subtitle={`${analytics?.summary.totalProducts ?? total} products in current filter scope`}
        open={analyticsOpen}
        onToggle={() => setAnalyticsOpen((v) => !v)}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Active products" value={(analytics?.summary.activeProducts ?? 0).toLocaleString('en-IN')} icon={Package} tone="text-blue-600" bg="bg-blue-50" />
          <AdminStatCard label="Catalog value" value={fmtInr(analytics?.summary.catalogValue ?? 0)} icon={Star} tone="text-green-600" bg="bg-green-50" subtext={`Avg ${fmtInr(analytics?.summary.avgPrice ?? 0)}`} />
          <AdminStatCard label="Low stock" value={(analytics?.summary.lowStockCount ?? 0).toLocaleString('en-IN')} icon={AlertTriangle} tone="text-amber-600" bg="bg-amber-50" />
          <AdminStatCard label="Out of stock" value={(analytics?.summary.outOfStockCount ?? 0).toLocaleString('en-IN')} icon={PackageCheck} tone="text-red-600" bg="bg-red-50" />
        </div>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">New products (30 days)</h3>
            {analytics ? <RevenueTrendChart data={analytics.creationTrend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="By category" icon={BarChart3} items={analytics?.categoryBreakdown.slice(0, 7) ?? []} />
          </div>
        </div>
      </AdminAnalyticsPanel>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="p-3 font-medium text-gray-600">Image</th>
              <th className="p-3 font-medium text-gray-600">Name / SKU</th>
              <th className="p-3 font-medium text-gray-600">Category</th>
              <th className="p-3 font-medium text-gray-600">Price</th>
              <th className="p-3 font-medium text-gray-600">Carat</th>
              <th className="p-3 font-medium text-gray-600">Stock</th>
              <th className="p-3 font-medium text-gray-600">Availability</th>
              <th className="p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">No products found. Add your first product!</td></tr>
            ) : products.map((p) => {
              const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
              const isAvailable = (p.stock_quantity ?? 0) > 0;
              return (
                <tr key={p.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                  <td className="p-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      {img ? (
                        <Image src={img} alt={p.name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">—</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}{p.tag_number ? ` · ${p.tag_number}` : ''}</p>
                    {p.legacy_woo_id && <p className="text-[10px] text-gray-400">Legacy #{p.legacy_woo_id}</p>}
                  </td>
                  <td className="p-3">
                    <span className="text-gray-600">{p.category}</span>
                    {p.sub_category && <span className="ml-1 text-gray-400">/ {p.sub_category}</span>}
                  </td>
                  <td className="p-3 font-medium text-gray-900">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-gray-600">{p.carat_weight ?? '—'}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Unique piece
                    </p>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                        {p.is_active ? 'Active' : 'Draft'}
                      </span>
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                        {label(p.availability_status || p.stock_status)}
                      </span>
                      {p.featured && (
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Featured
                        </span>
                      )}
                      {p.is_directors_pick && (
                        <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          Director&apos;s Pick #{p.display_order}
                        </span>
                      )}
                    </div>
                    {p.reserved_until && <p className="mt-1 text-[10px] text-gray-400">Reserved until {new Date(p.reserved_until).toLocaleDateString('en-IN')}</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/products/${p.id}`} className="text-amber-600 hover:underline text-sm">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleStockUpdate(p)}
                        disabled={busyProduct === p.id}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <PackageCheck className="h-3.5 w-3.5" /> Toggle stock
                      </button>
                      {p.availability_status === 'reserved' ? (
                        <button
                          onClick={() => runOperation(p.id, { action: 'release' }, 'Failed to release reservation')}
                          disabled={busyProduct === p.id}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Unlock className="h-3.5 w-3.5" /> Release
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const note = prompt('Reservation note', 'Held for customer/admin review') ?? undefined;
                            if (note === undefined) return;
                            void runOperation(p.id, { action: 'reserve', note }, 'Failed to reserve product');
                          }}
                          disabled={busyProduct === p.id || p.availability_status === 'archived'}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Lock className="h-3.5 w-3.5" /> Reserve
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const displayOrderPrompt = prompt('Display order', String(p.display_order || 0));
                          if (displayOrderPrompt === null) return;
                          const displayOrder = Number(displayOrderPrompt || p.display_order || 0);
                          const curatorNote = prompt('Curator note', '') ?? undefined;
                          void runOperation(p.id, { action: 'directors_pick', enabled: !p.is_directors_pick, display_order: displayOrder, curator_note: curatorNote }, 'Failed to update Director\'s Pick');
                        }}
                        disabled={busyProduct === p.id}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-purple-600 transition hover:bg-purple-50 disabled:opacity-50"
                      >
                        <Star className="h-3.5 w-3.5" /> {p.is_directors_pick ? 'Unpick' : 'Pick'}
                      </button>
                      {p.availability_status === 'archived' || !p.is_active ? (
                        <button
                          onClick={() => runOperation(p.id, { action: 'restore', availability_status: 'in_stock' }, 'Failed to restore product')}
                          disabled={busyProduct === p.id}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-600 transition hover:bg-green-50 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                      ) : (
                      <button
                        onClick={() => handleArchive(p.id, p.name)}
                        disabled={busyProduct === p.id}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        title="Archive product"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {busyProduct === p.id ? 'Saving…' : 'Archive'}
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PRODUCTS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
}
