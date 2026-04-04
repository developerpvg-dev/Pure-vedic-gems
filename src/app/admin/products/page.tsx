'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  sub_category: string | null;
  price: number;
  carat_weight: number | null;
  origin: string | null;
  in_stock: boolean;
  is_active: boolean;
  featured: boolean;
  images: string[];
  created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? It will be hidden from the shop but can be re-enabled by editing the product.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchProducts();
    } else {
      alert('Failed to deactivate product. Please try again.');
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>
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
              <th className="p-3 font-medium text-gray-600">Status</th>
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
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </td>
                  <td className="p-3">
                    <span className="text-gray-600">{p.category}</span>
                    {p.sub_category && <span className="ml-1 text-gray-400">/ {p.sub_category}</span>}
                  </td>
                  <td className="p-3 font-medium text-gray-900">₹{p.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-gray-600">{p.carat_weight ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {p.featured && (
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/products/${p.id}`} className="text-amber-600 hover:underline text-sm">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deleting === p.id}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        title="Deactivate product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleting === p.id ? 'Removing…' : 'Delete'}
                      </button>
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
