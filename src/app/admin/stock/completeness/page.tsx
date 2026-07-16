'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileImage,
  FileText,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Video,
  XCircle,
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/lib/constants/product-taxonomy';

type Gap = 'any' | 'images' | 'description' | 'certificate' | 'video' | 'complete';

type Row = {
  id: string;
  sku: string | null;
  tag_number: string | null;
  name: string;
  category: string | null;
  sub_category: string | null;
  is_active: boolean;
  hasImages: boolean;
  hasDescription: boolean;
  hasCertificate: boolean;
  hasVideo: boolean;
  imageCount: number;
};

type Counts = {
  total: number;
  missingImages: number;
  missingDescription: number;
  missingCertificate: number;
  missingVideo: number;
  incomplete: number;
  complete: number;
};

const GAP_TABS: { id: Gap; label: string }[] = [
  { id: 'any', label: 'Incomplete' },
  { id: 'images', label: 'No images' },
  { id: 'description', label: 'No description' },
  { id: 'certificate', label: 'No certificate' },
  { id: 'video', label: 'No video' },
  { id: 'complete', label: 'Complete' },
];

function Mark({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" aria-label="Present" />
  ) : (
    <XCircle className="mx-auto h-4 w-4 text-red-500" aria-label="Missing" />
  );
}

export default function ContentCompletenessPage() {
  const [gap, setGap] = useState<Gap>('any');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const [subcategories, setSubcategories] = useState<Array<{ value: string; label: string }>>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [products, setProducts] = useState<Row[]>([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    void fetch(`/api/admin/products/filter-options${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.subcategories) ? data.subcategories : [];
        setSubcategories(
          list
            .map((item: { value?: string; label?: string } | string) =>
              typeof item === 'string'
                ? { value: item, label: item }
                : { value: item.value ?? '', label: item.label ?? item.value ?? '' },
            )
            .filter((item: { value: string }) => Boolean(item.value)),
        );
      })
      .catch(() => setSubcategories([]));
  }, [category]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ gap, limit: '200' });
    params.set('status', status);
    if (category) params.set('category', category);
    if (subCategory) params.set('sub_category', subCategory);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/products/completeness?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to load completeness');
      setCounts(null);
      setProducts([]);
    } else {
      setCounts(data.counts ?? null);
      setProducts(data.products ?? []);
      setTotalMatching(data.total_matching ?? 0);
    }
    setLoading(false);
  }, [gap, category, subCategory, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Content completeness</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Certificate = lab/number or cert file, or 2+ gallery images on gems (migrated cert scan). Video =
            YouTube on video_url (play thumb), not a gallery slot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="In scope" value={String(counts?.total ?? '—')} icon={<FileText className="h-4 w-4" />} />
        <Stat
          label="No images"
          value={String(counts?.missingImages ?? '—')}
          tone={counts?.missingImages ? 'amber' : undefined}
          icon={<ImageIcon className="h-4 w-4" />}
          onClick={() => setGap('images')}
        />
        <Stat
          label="No description"
          value={String(counts?.missingDescription ?? '—')}
          tone={counts?.missingDescription ? 'amber' : undefined}
          icon={<FileText className="h-4 w-4" />}
          onClick={() => setGap('description')}
        />
        <Stat
          label="No certificate"
          value={String(counts?.missingCertificate ?? '—')}
          tone={counts?.missingCertificate ? 'amber' : undefined}
          icon={<FileImage className="h-4 w-4" />}
          onClick={() => setGap('certificate')}
        />
        <Stat
          label="No video"
          value={String(counts?.missingVideo ?? '—')}
          tone={counts?.missingVideo ? 'amber' : undefined}
          icon={<Video className="h-4 w-4" />}
          onClick={() => setGap('video')}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, SKU, tag…"
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
        >
          <option value="active">Active products</option>
          <option value="inactive">Drafts only</option>
          <option value="all">All products</option>
        </select>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setSubCategory('');
          }}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={subCategory}
          onChange={(e) => setSubCategory(e.target.value)}
          disabled={!subcategories.length}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 disabled:opacity-50"
        >
          <option value="">All sub-categories</option>
          {subcategories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GAP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setGap(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              gap === tab.id
                ? 'bg-amber-700 text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.id === 'any' && counts ? ` (${counts.incomplete})` : ''}
            {tab.id === 'complete' && counts ? ` (${counts.complete})` : ''}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${totalMatching} product${totalMatching === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-2 py-2 text-center">Images</th>
                <th className="px-2 py-2 text-center">Desc</th>
                <th className="px-2 py-2 text-center">Cert</th>
                <th className="px-2 py-2 text-center">Video</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !products.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-600" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No products in this view
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.sku || '—'}
                        {p.tag_number ? ` · Tag ${p.tag_number}` : ''}
                        {p.imageCount ? ` · ${p.imageCount} gallery` : ''}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {p.category || '—'}
                      {p.sub_category ? (
                        <span className="block text-xs text-gray-400">{p.sub_category}</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <Mark ok={p.hasImages} />
                    </td>
                    <td className="px-2 py-3">
                      <Mark ok={p.hasDescription} />
                    </td>
                    <td className="px-2 py-3">
                      <Mark ok={p.hasCertificate} />
                    </td>
                    <td className="px-2 py-3">
                      <Mark ok={p.hasVideo} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-sm font-semibold text-amber-800 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  tone?: 'amber';
  icon: ReactNode;
  onClick?: () => void;
}) {
  const className = `rounded-md border bg-white px-4 py-3 text-left ${
    tone === 'amber' ? 'border-amber-200' : 'border-gray-200'
  } ${onClick ? 'cursor-pointer transition hover:shadow-sm' : ''}`;

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <span className={tone === 'amber' ? 'text-amber-700' : 'text-gray-400'}>{icon}</span>
      </div>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone === 'amber' ? 'text-amber-800' : 'text-gray-900'}`}>
        {value}
      </p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body}
      </button>
    );
  }
  return <div className={className}>{body}</div>;
}
