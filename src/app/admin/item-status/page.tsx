'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Gem, Loader2, Lock, RotateCcw, Search } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageShell';

type ItemRow = {
  id: string;
  name: string;
  sku: string;
  tag_number: string | null;
  category: string;
  availability_status: string;
  is_active: boolean;
  in_stock: boolean;
  images: string[];
};

type OpAction = 'reserve' | 'sold' | 'activate';

const STATUS_STYLE: Record<string, string> = {
  in_stock: 'bg-emerald-50 text-emerald-800',
  reserved: 'bg-amber-50 text-amber-900',
  sold: 'bg-red-50 text-red-800',
  out_of_stock: 'bg-stone-100 text-stone-700',
  on_demand: 'bg-sky-50 text-sky-900',
  archived: 'bg-stone-200 text-stone-600',
};

function statusLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default function ItemStatusPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const search = useCallback(async (term: string) => {
    const q = term.trim();
    if (!q) {
      setItems([]);
      setTotal(0);
      setError('Enter a tag, name, or SKU to search');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const params = new URLSearchParams({
        search: q,
        per_page: '30',
        page: '1',
        sort_by: 'newest',
      });
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Search failed');
        setItems([]);
        setTotal(0);
        return;
      }
      setItems((data.products ?? []) as ItemRow[]);
      setTotal(Number(data.total) || 0);
      if (!(data.products ?? []).length) setError('No items matched that search');
    } catch {
      setError('Network error');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('q')?.trim();
    if (!initial) return;
    setQuery(initial);
    setSubmitted(initial);
    void search(initial);
  }, [search]);

  const runOp = async (item: ItemRow, action: OpAction) => {
    const labels: Record<OpAction, string> = {
      reserve: 'Reserve',
      sold: 'Mark sold',
      activate: 'Make active',
    };
    if (!confirm(`${labels[action]} “${item.name}”?`)) return;

    setBusyId(item.id);
    setError('');
    setMessage('');
    try {
      const body =
        action === 'reserve'
          ? { action: 'reserve', note: 'Reserved by accountant' }
          : action === 'sold'
            ? { action: 'sold', note: 'Marked sold by accountant' }
            : { action: 'activate' };

      const res = await fetch(`/api/admin/products/${item.id}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Failed to ${labels[action].toLowerCase()}`);
        return;
      }

      const nextStatus =
        action === 'reserve' ? 'reserved' : action === 'sold' ? 'sold' : 'in_stock';
      setItems((rows) =>
        rows.map((row) =>
          row.id === item.id
            ? {
                ...row,
                availability_status: nextStatus,
                is_active: action === 'activate' ? true : row.is_active,
                in_stock: action === 'activate',
              }
            : row,
        ),
      );
      setMessage(`${labels[action]} — ${item.tag_number || item.sku || item.name}`);
    } catch {
      setError('Network error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Item status"
        description="Search any piece by tag, name, or SKU — then mark it reserved, sold, or active on the website."
      />

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
          const url = new URL(window.location.href);
          if (query.trim()) url.searchParams.set('q', query.trim());
          else url.searchParams.delete('q');
          window.history.replaceState({}, '', url.toString());
          void search(query);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tag, name, or SKU — e.g. A704"
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {submitted && !loading && items.length > 0 ? (
        <p className="text-xs text-stone-500">
          {total} match{total === 1 ? '' : 'es'} for “{submitted}”
          {total > items.length ? ` · showing first ${items.length}` : ''}
        </p>
      ) : null}

      <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
        {loading ? (
          <li className="flex items-center gap-2 px-4 py-10 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching…
          </li>
        ) : null}

        {!loading && items.map((item) => {
          const thumb = Array.isArray(item.images) ? item.images[0] : null;
          const status = item.availability_status || (item.in_stock ? 'in_stock' : 'out_of_stock');
          const busy = busyId === item.id;
          const isSold = status === 'sold';
          const isReserved = status === 'reserved';
          const isActiveBuyable = item.is_active && status === 'in_stock';
          const meta = [item.tag_number, item.sku, item.category].filter(Boolean).join(' · ');

          return (
            <li key={item.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {thumb ? (
                    <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                      No img
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{item.name}</p>
                  {meta ? <p className="truncate text-[11px] text-stone-400">{meta}</p> : null}
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[status] ?? 'bg-stone-100 text-stone-700'}`}
                    >
                      {statusLabel(status)}
                    </span>
                    {!item.is_active ? (
                      <span className="inline-flex rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  disabled={busy || isReserved}
                  onClick={() => void runOp(item, 'reserve')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                  Reserve
                </button>
                <button
                  type="button"
                  disabled={busy || isSold}
                  onClick={() => void runOp(item, 'sold')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gem className="h-3.5 w-3.5" />}
                  Mark sold
                </button>
                <button
                  type="button"
                  disabled={busy || isActiveBuyable}
                  onClick={() => void runOp(item, 'activate')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Make active
                </button>
              </div>
            </li>
          );
        })}

        {!loading && !items.length && submitted ? (
          <li className="px-4 py-10 text-center text-sm text-stone-500">No results</li>
        ) : null}
        {!loading && !items.length && !submitted ? (
          <li className="px-4 py-10 text-center text-sm text-stone-500">
            Search for a piece to update its website status.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
