'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';
import { CANONICAL_CATEGORY_OPTIONS } from '@/lib/constants/product-taxonomy';

type LabLogo = {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  category: string | null;
  sub_category: string | null;
  thumbnail_url?: string | null;
  images?: unknown;
  lab_logo_id?: string | null;
};

function thumb(product: ProductRow) {
  if (product.thumbnail_url) return product.thumbnail_url;
  if (Array.isArray(product.images) && typeof product.images[0] === 'string') return product.images[0];
  return null;
}

export default function AdminLabLogosPage() {
  const [labs, setLabs] = useState<LabLogo[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [savingLab, setSavingLab] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subOptions, setSubOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const loadLabs = useCallback(async () => {
    setLoadingLabs(true);
    try {
      const res = await fetch('/api/admin/lab-logos', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load labs');
      setLabs((data.labs ?? []) as LabLogo[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load labs');
    } finally {
      setLoadingLabs(false);
    }
  }, []);

  useEffect(() => {
    void loadLabs();
  }, [loadLabs]);

  useEffect(() => {
    if (!category) {
      setSubOptions([]);
      setSubCategory('');
      return;
    }
    void fetch(`/api/admin/products/filter-options?category=${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data) => {
        const options = (data.sub_categories ?? []) as Array<{ value: string; label: string }>;
        setSubOptions(options);
        if (!options.some((opt) => opt.value === subCategory)) setSubCategory('');
      })
      .catch(() => setSubOptions([]));
  }, [category, subCategory]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams({
        per_page: '40',
        status: 'active',
        sort_by: 'name',
        sort_order: 'asc',
      });
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (subCategory) params.set('sub_category', subCategory);

      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setProducts((data.products ?? []) as ProductRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Search failed');
      setProducts([]);
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

  async function createLab() {
    if (!name.trim() || !file) {
      toast.error('Name and image are required');
      return;
    }
    setSavingLab(true);
    try {
      const body = new FormData();
      body.append('name', name.trim());
      body.append('file', file);
      const res = await fetch('/api/admin/lab-logos', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save lab');
      setName('');
      setFile(null);
      toast.success('Lab logo added');
      await loadLabs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save lab');
    } finally {
      setSavingLab(false);
    }
  }

  async function deactivateLab(id: string) {
    const res = await fetch(`/api/admin/lab-logos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error('Failed to deactivate');
      return;
    }
    toast.success('Lab deactivated');
    await loadLabs();
  }

  async function assignLab(productId: string, labLogoId: string | null) {
    setAssigningId(productId);
    try {
      const res = await fetch('/api/admin/lab-logos/assign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, lab_logo_id: labLogoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assign failed');
      setProducts((rows) =>
        rows.map((row) => (row.id === productId ? { ...row, lab_logo_id: labLogoId } : row)),
      );
      toast.success(labLogoId ? 'Lab logo assigned' : 'Lab logo cleared');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Assign failed');
    } finally {
      setAssigningId(null);
    }
  }

  const activeLabs = labs.filter((lab) => lab.is_active);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Lab Logos"
        description="Upload lab badge images, then assign which logo each product shows on the shop cards."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">1. Lab images</h2>
          <p className="mt-1 text-sm text-gray-500">Add a name + logo. Prefer WebP/PNG ~240×80 with transparent background.</p>

          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Lab name (e.g. IGI)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-3 text-sm text-gray-700">
              <Upload className="h-4 w-4" />
              {file ? file.name : 'Choose logo image'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={() => void createLab()}
              disabled={savingLab}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingLab ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add lab
            </button>
          </div>

          <div className="mt-5 space-y-2">
            {loadingLabs ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : labs.length === 0 ? (
              <p className="text-sm text-gray-500">No lab logos yet.</p>
            ) : (
              labs.map((lab) => (
                <div
                  key={lab.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${lab.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}
                >
                  <div className="relative h-8 w-16 shrink-0 bg-white">
                    <Image src={lab.image_url} alt={lab.name} fill className="object-contain" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{lab.name}</p>
                    {!lab.is_active ? <p className="text-xs text-gray-400">Inactive</p> : null}
                  </div>
                  {lab.is_active ? (
                    <button
                      type="button"
                      onClick={() => void deactivateLab(lab.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Deactivate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">2. Assign to products</h2>
          <p className="mt-1 text-sm text-gray-500">Search / filter products, then pick the lab logo for each one. Cards show a logo only after assignment.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search SKU, tag, or name…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
              disabled={!category}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">All subcategories</option>
              {subOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {searching ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">Searching…</p>
            ) : products.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">No products found.</p>
            ) : (
              products.map((product) => {
                const src = thumb(product);
                return (
                  <div key={product.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {src ? (
                        <Image src={src} alt="" fill className="object-cover" sizes="48px" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {[product.sku, product.category, product.sub_category].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={product.lab_logo_id ?? ''}
                        disabled={assigningId === product.id || activeLabs.length === 0}
                        onChange={(event) => {
                          const value = event.target.value;
                          void assignLab(product.id, value ? value : null);
                        }}
                        className="min-w-[140px] rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">No logo</option>
                        {activeLabs.map((lab) => (
                          <option key={lab.id} value={lab.id}>
                            {lab.name}
                          </option>
                        ))}
                      </select>
                      {assigningId === product.id ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
