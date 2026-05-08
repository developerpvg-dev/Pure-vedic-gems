'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, ChevronLeft, ChevronRight, Archive, RotateCcw, Lock, Unlock, Star, Upload, Download } from 'lucide-react';

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

const AVAILABILITY_OPTIONS = ['in_stock', 'reserved', 'sold', 'on_demand', 'out_of_stock', 'archived'];

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (availability) params.set('availability_status', availability);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    }
    setLoading(false);
  }, [page, search, category, status, availability]);

  useEffect(() => {
    void Promise.resolve().then(fetchProducts);
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

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

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 grid gap-2 lg:grid-cols-[1fr_160px_160px_190px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, tag, legacy ID, name, slug, category..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500">
          <option value="">All availability</option>
          {AVAILABILITY_OPTIONS.map((option) => <option key={option} value={option}>{label(option)}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
          Search
        </button>
      </form>

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
              <th className="p-3 font-medium text-gray-600">Availability</th>
              <th className="p-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No products found. Add your first product!</td></tr>
            ) : products.map((p) => {
              const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
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
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
