'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react';
import type { ErpSyncReport, ErpTagDetail } from '@/lib/erp/types';
import type { FormKind } from '@/components/admin/product-form/kinds';
import { KIND_CONFIGS, KIND_ORDER } from '@/components/admin/product-form/kinds';
import { suggestErpProductKind } from '@/lib/erp/erp-prefill';
import { STOCK_CATEGORIES, suggestStockCategoryFromFilename, type StockCategoryId } from '@/lib/erp/stock-categories';
import { ErpTagDetailPanel } from '@/components/admin/ErpTagDetailPanel';
import { ErpAddProductActions } from '@/components/admin/ErpAddProductActions';

const PAGE_SIZE = 40;

type TabId = 'upload' | 'compare' | 'sold-offline' | 'add' | 'sold-online' | 'orphans' | 'lookup';
type Availability = 'sold' | 'reserved';

const TAB_IDS: TabId[] = ['upload', 'compare', 'sold-offline', 'add', 'sold-online', 'orphans', 'lookup'];

function useSearchFilter<T>(items: T[], query: string, pick: (item: T) => string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => pick(item).toLowerCase().includes(q));
  }, [items, query, pick]);
}

function parseTab(value: string | null): TabId {
  if (value && (TAB_IDS as string[]).includes(value)) return value as TabId;
  return 'upload';
}

export default function ErpSyncAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sync…
        </div>
      }
    >
      <ErpSyncAdminContent />
    </Suspense>
  );
}

function ErpSyncAdminContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creatingTgno, setCreatingTgno] = useState<string | null>(null);
  const [report, setReport] = useState<ErpSyncReport | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabId>(() => parseTab(searchParams.get('tab')));
  const [sessionRole, setSessionRole] = useState<string | null>(null);

  const [uploadCategory, setUploadCategory] = useState<StockCategoryId>('emerald');
  const [uploading, setUploading] = useState(false);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StockCategoryId | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<FormKind | 'all'>('all');
  const [liveOnlyOrphans, setLiveOnlyOrphans] = useState(true);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [tagLookup, setTagLookup] = useState('');
  const [tagDetail, setTagDetail] = useState<ErpTagDetail | null>(null);
  const [tagDetailLoading, setTagDetailLoading] = useState(false);
  const [tagDetailError, setTagDetailError] = useState('');
  const [markSoldTag, setMarkSoldTag] = useState('');
  const [ackingId, setAckingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/erp-sync');
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to load stock sync status');
    else setReport(data.report ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setTab(parseTab(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/session');
      if (!res.ok) return;
      const data = await res.json().catch(() => ({}));
      setSessionRole(data.role ?? null);
    })();
  }, []);

  useEffect(() => {
    setQuery('');
    setLimit(PAGE_SIZE);
  }, [tab]);

  async function uploadExcel(fileList: FileList | null, category: StockCategoryId) {
    if (!fileList?.length) return;
    const cat = STOCK_CATEGORIES.find((c) => c.id === category);
    if (
      !confirm(
        `Update “${cat?.label ?? category}” from ${fileList.length} file(s)?\n\n` +
          `• Tags in sheet → in stock offline\n` +
          `• Previously in this category but missing → sold offline\n` +
          `• Other categories stay unchanged`
      )
    ) {
      return;
    }

    setUploading(true);
    setUploadCategory(category);
    setMessage(`Importing ${cat?.label ?? category}…`);
    setError('');
    const form = new FormData();
    form.append('stock_category', category);
    for (const file of Array.from(fileList)) form.append('files', file);

    const res = await fetch('/api/admin/erp-sync', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Excel upload failed');
      setMessage('');
    } else {
      setReport(data.report ?? null);
      setCategoryFilter(category);
      const needAdd = data.missingOnWebsiteForCategory ?? 0;
      const soldLive = data.soldOfflineStillLive ?? 0;
      setMessage(
        `${data.stockCategoryLabel ?? cat?.label}: ${data.tagCount ?? 0} tags in stock.` +
          (soldLive > 0 ? ` ${soldLive} still live on website.` : '') +
          (needAdd > 0 ? ` ${needAdd} to add on website.` : '')
      );
      setTab('compare');
    }
    setUploading(false);
  }

  async function resetCache() {
    if (
      !confirm(
        'Clear all uploaded Excel stock data?\n\n' +
          'You can then re-upload each stock sheet for a fresh comparison.\n' +
          'Website products are not deleted.'
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_cache' }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to reset');
    else {
      setReport(data.report ?? null);
      setMessage('Excel cache cleared. Upload each stock sheet again for a fresh comparison.');
      setTab('upload');
    }
    setBusy(false);
  }

  async function applyAvailability(productIds: string[] | undefined, availability: Availability) {
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply_stock', product_ids: productIds, availability }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to update products');
    else {
      setReport(data.report ?? null);
      setMessage(`Marked ${data.updated ?? 0} product(s) as ${availability} on the website.`);
    }
    setBusy(false);
  }

  async function markByTag(availability: Availability, tgnoInput?: string) {
    const tgno = (tgnoInput ?? markSoldTag).trim();
    if (!tgno) return;
    if (!confirm(`Mark tag ${tgno} as ${availability} on the website?`)) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_sold_by_tag', tgno, availability }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to update tag');
    else {
      setReport(data.report ?? null);
      setMessage(`${data.product?.name ?? tgno} → ${availability} on website.`);
      setMarkSoldTag('');
    }
    setBusy(false);
  }

  async function ackOutbound(id: string, ack: Availability) {
    setAckingId(id);
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ack_outbound', id, ack }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Failed to update task');
    else {
      setReport(data.report ?? null);
      setMessage(`Confirmed: ${ack} in MMI.`);
    }
    setAckingId(null);
  }

  async function viewTag(tgno: string) {
    const trimmed = tgno.trim();
    if (!trimmed) return;
    setTagLookup(trimmed);
    setTagDetailLoading(true);
    setTagDetail(null);
    setTagDetailError('');
    const res = await fetch(`/api/admin/erp-sync/tag?tgno=${encodeURIComponent(trimmed)}`);
    const data = await res.json();
    if (!res.ok) {
      setTagDetailError(data.error || 'Tag not found');
      if (data.detail) setTagDetail(data.detail);
    } else {
      setTagDetail(data.detail ?? null);
      setTagDetailError('');
    }
    setTagDetailLoading(false);
  }

  async function createDraft(tgno: string, kind: FormKind = 'jewellery') {
    setCreatingTgno(tgno);
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_draft', tgno, kind }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create draft');
      setCreatingTgno(null);
    } else {
      window.location.href = data.editUrl;
    }
  }

  const counts = report?.counts;
  const soldOffline = useMemo(
    () => report?.stockMismatches.filter((r) => r.websitePurchasable && !r.erpInStock) ?? [],
    [report]
  );
  const soldOnline = useMemo(
    () => report?.stockMismatches.filter((r) => !r.websitePurchasable && r.erpInStock) ?? [],
    [report]
  );
  const pendingMmi = report?.pendingOutboundTasks ?? [];
  const orphans = useMemo(() => {
    const rows = report?.orphansOnWebsite ?? [];
    return liveOnlyOrphans ? rows.filter((r) => r.websitePurchasable) : rows;
  }, [report, liveOnlyOrphans]);

  const categorySoldOffline = useMemo(
    () => soldOffline.filter((r) => categoryFilter === 'all' || r.stockCategory === categoryFilter),
    [soldOffline, categoryFilter]
  );
  const categorySoldOnline = useMemo(
    () => soldOnline.filter((r) => categoryFilter === 'all' || r.stockCategory === categoryFilter),
    [soldOnline, categoryFilter]
  );
  const categoryMissing = useMemo(() => {
    let rows = report?.missingOnWebsite ?? [];
    if (categoryFilter !== 'all') rows = rows.filter((r) => r.stockCategory === categoryFilter);
    return rows;
  }, [report, categoryFilter]);

  const filteredSoldOffline = useSearchFilter(categorySoldOffline, query, (r) => `${r.tgno} ${r.productName}`);
  const filteredMissing = useMemo(() => {
    let rows = categoryMissing;
    if (kindFilter !== 'all') rows = rows.filter((r) => suggestErpProductKind(r.name) === kindFilter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((r) => `${r.tgno} ${r.name} ${r.remarks ?? ''}`.toLowerCase().includes(q));
    return rows;
  }, [categoryMissing, kindFilter, query]);
  const filteredSoldOnline = useSearchFilter(categorySoldOnline, query, (r) => `${r.tgno} ${r.productName}`);
  const filteredOrphans = useSearchFilter(orphans, query, (r) => `${r.tagNumber} ${r.productName} ${r.category ?? ''}`);

  const sheetLabel =
    categoryFilter === 'all'
      ? null
      : STOCK_CATEGORIES.find((c) => c.id === categoryFilter)?.label ?? categoryFilter;

  const tabs: Array<{ id: TabId; label: string; count?: number; tone?: 'red' | 'amber' | 'violet' | 'slate' }> = [
    { id: 'upload', label: 'Upload', count: counts?.categoriesUploaded, tone: 'slate' },
    { id: 'compare', label: 'Compare', tone: 'slate' },
    {
      id: 'sold-offline',
      label: 'Sold offline',
      count: categoryFilter === 'all' ? counts?.soldOfflineStillLive : categorySoldOffline.length,
      tone: 'red',
    },
    {
      id: 'add',
      label: 'Add to website',
      count: categoryFilter === 'all' ? counts?.missingOnWebsite : categoryMissing.length,
      tone: 'amber',
    },
    {
      id: 'sold-online',
      label: 'Sold online',
      count:
        categoryFilter === 'all'
          ? (counts?.soldOnlineStillInStore ?? 0) + (counts?.pendingOutbound ?? 0)
          : categorySoldOnline.length + pendingMmi.length,
      tone: 'violet',
    },
    { id: 'orphans', label: 'Website only', count: counts?.orphansLive, tone: 'slate' },
    { id: 'lookup', label: 'Look up' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <Link
          href={sessionRole === 'stock_manager' ? '/admin/stock' : '/admin/products'}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-amber-800"
        >
          <ArrowLeft className="h-4 w-4" />
          {sessionRole === 'stock_manager' ? 'Back to stock dashboard' : 'Back to products'}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Store stock sync</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-500">
          Upload each MMI in-stock Excel sheet. We match tags to website products (tag number or SKU),
          then show what to mark sold, add, or check.
        </p>
      </div>

      {error && <Banner tone="red">{error}</Banner>}
      {message && <Banner tone="green">{message}</Banner>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : report ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Excel in stock" value={String(report.erpTagCount)} />
            <Stat label="Matched live" value={String(report.matchedInStock)} />
            <Stat label="Sold offline / still live" value={String(counts?.soldOfflineStillLive ?? 0)} tone="red" />
            <Stat label="Need to add" value={String(counts?.missingOnWebsite ?? 0)} tone="amber" />
            <Stat
              label="Sheets uploaded"
              value={`${counts?.categoriesUploaded ?? 0}/${counts?.categoriesTotal ?? STOCK_CATEGORIES.length}`}
            />
          </section>

          <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-px" aria-label="Sync sections">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? 'border-amber-700 text-amber-900' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t.label}
                  {typeof t.count === 'number' && t.id !== 'lookup' && t.id !== 'compare' && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                        active
                          ? 'bg-amber-100 text-amber-900'
                          : t.tone === 'red' && t.count > 0
                            ? 'bg-red-100 text-red-800'
                            : t.tone === 'amber' && t.count > 0
                              ? 'bg-amber-100 text-amber-800'
                              : t.tone === 'violet' && t.count > 0
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {tab === 'upload' && (
            <section className="space-y-4">
              <Panel
                title="Upload in-stock Excel"
                hint="One category at a time. Sheet = what’s currently in the offline store. Filename auto-selects the category when possible."
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label htmlFor="upload-stock-category" className="text-xs font-medium text-gray-500">
                      Category
                    </label>
                    <select
                      id="upload-stock-category"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as StockCategoryId)}
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm"
                    >
                      {STOCK_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const files = e.target.files;
                        const guessed = files?.[0] ? suggestStockCategoryFromFilename(files[0].name) : null;
                        const category = guessed ?? uploadCategory;
                        if (guessed) setUploadCategory(guessed);
                        void uploadExcel(files, category);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void resetCache()}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Clear Excel cache (fresh start)
                  </button>
                  <p className="text-xs text-gray-500">Clears offline Excel data only — then re-upload each stock sheet.</p>
                </div>
              </Panel>

              <Panel title="Upload checklist" hint="Tick off each MMI stock sheet. Open Compare after uploading.">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(report.categoryCoverage ?? []).map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-sm ${
                        c.uploaded ? 'border-emerald-200 bg-emerald-50/60' : 'border-dashed border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{c.label}</p>
                        <p className="text-xs text-gray-500">
                          {c.uploaded
                            ? `${c.excelInStock} in Excel · ${c.matchedLive} matched live`
                            : 'Not uploaded yet'}
                        </p>
                      </div>
                      {c.uploaded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUploadCategory(c.id as StockCategoryId)}
                          className="text-xs font-semibold text-amber-800 hover:underline"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}

          {tab === 'compare' && (
            <Panel
              title="Category comparison — offline Excel vs website"
              hint="Per MMI sheet: what’s in Excel, what’s matched live on the website, and what still needs action. Matching uses tag number or SKU."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      <th className="px-2 py-2 font-semibold">Category</th>
                      <th className="px-2 py-2 font-semibold">Status</th>
                      <th className="px-2 py-2 text-right font-semibold">Excel</th>
                      <th className="px-2 py-2 text-right font-semibold">Matched live</th>
                      <th className="px-2 py-2 text-right font-semibold">Need add</th>
                      <th className="px-2 py-2 text-right font-semibold">Sold offline</th>
                      <th className="px-2 py-2 text-right font-semibold">Sold online</th>
                      <th className="px-2 py-2 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(report.categoryCoverage ?? []).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/80">
                        <td className="px-2 py-3 font-medium text-gray-900">{c.label}</td>
                        <td className="px-2 py-3">
                          {c.uploaded ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-800">
                              Uploaded
                            </span>
                          ) : (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums text-gray-800">{c.excelInStock}</td>
                        <td className="px-2 py-3 text-right tabular-nums text-gray-800">{c.matchedLive}</td>
                        <td className={`px-2 py-3 text-right tabular-nums ${c.needAdd ? 'font-semibold text-amber-800' : 'text-gray-500'}`}>
                          {c.needAdd}
                        </td>
                        <td className={`px-2 py-3 text-right tabular-nums ${c.soldOfflineStillLive ? 'font-semibold text-red-700' : 'text-gray-500'}`}>
                          {c.soldOfflineStillLive}
                        </td>
                        <td className={`px-2 py-3 text-right tabular-nums ${c.soldOnlineStillInExcel ? 'font-semibold text-violet-700' : 'text-gray-500'}`}>
                          {c.soldOnlineStillInExcel}
                        </td>
                        <td className="px-2 py-3 text-right">
                          {c.uploaded && (
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryFilter(c.id as StockCategoryId);
                                if (c.soldOfflineStillLive > 0) setTab('sold-offline');
                                else if (c.needAdd > 0) setTab('add');
                                else if (c.soldOnlineStillInExcel > 0) setTab('sold-online');
                              }}
                              className="text-xs font-semibold text-amber-800 hover:underline"
                            >
                              Open diffs
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Last sync: {report.syncedAt ? new Date(report.syncedAt).toLocaleString() : 'never'} · Website tagged
                products matched: {report.websiteTaggedCount}
              </p>
            </Panel>
          )}

          {tab !== 'upload' && tab !== 'compare' && tab !== 'lookup' && (
            <div className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLimit(PAGE_SIZE);
                  }}
                  placeholder="Filter by tag, name…"
                  className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm"
                />
              </div>
              {(tab === 'sold-offline' || tab === 'add' || tab === 'sold-online') && (
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value as StockCategoryId | 'all');
                    setLimit(PAGE_SIZE);
                  }}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  aria-label="Filter by Excel category"
                >
                  <option value="all">All sheets</option>
                  {STOCK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
              {categoryFilter !== 'all' && (tab === 'sold-offline' || tab === 'add' || tab === 'sold-online') && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setLimit(PAGE_SIZE);
                  }}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Show all sheets
                </button>
              )}
              {tab === 'add' && (
                <select
                  value={kindFilter}
                  onChange={(e) => {
                    setKindFilter(e.target.value as FormKind | 'all');
                    setLimit(PAGE_SIZE);
                  }}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  aria-label="Filter by product type"
                >
                  <option value="all">All product types</option>
                  {KIND_ORDER.map((kind) => (
                    <option key={kind} value={kind}>
                      {KIND_CONFIGS[kind].label}
                    </option>
                  ))}
                </select>
              )}
              {tab === 'orphans' && (
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={liveOnlyOrphans}
                    onChange={(e) => setLiveOnlyOrphans(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Live for sale only
                </label>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Filter className="h-3.5 w-3.5" /> filters
              </span>
            </div>
          )}

          {tab === 'sold-offline' && (
            <DiffPanel
              title="Sold offline — still for sale on website"
              hint="Tag missing from latest Excel for its category. Mark sold/reserved so customers cannot buy it online."
              count={filteredSoldOffline.length}
              empty="Nothing here — offline and website agree for live products."
              toolbar={
                filteredSoldOffline.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void applyAvailability(
                          filteredSoldOffline.map((r) => r.productId),
                          'reserved'
                        )
                      }
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Mark all reserved
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void applyAvailability(
                          filteredSoldOffline.map((r) => r.productId),
                          'sold'
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark all sold
                    </button>
                  </div>
                ) : null
              }
              footer={
                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void markByTag('sold');
                  }}
                >
                  <input
                    type="search"
                    value={markSoldTag}
                    onChange={(e) => setMarkSoldTag(e.target.value)}
                    placeholder="Tag e.g. A704"
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-sm"
                  />
                  <button
                    type="button"
                    disabled={!markSoldTag.trim() || busy}
                    onClick={() => void markByTag('reserved')}
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                  >
                    Reserve
                  </button>
                  <button
                    type="submit"
                    disabled={!markSoldTag.trim() || busy}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Mark sold
                  </button>
                </form>
              }
            >
              {filteredSoldOffline.slice(0, limit).map((row) => (
                <Row
                  key={row.productId}
                  title={row.productName}
                  meta={
                    <>
                      Tag <Mono>{row.tgno}</Mono>
                      {row.stockCategory ? ` · ${getStockCategoryLabel(row.stockCategory)}` : ''}
                      {' · '}
                      {row.availabilityStatus}
                    </>
                  }
                  actions={
                    <>
                      <GhostBtn onClick={() => void viewTag(row.tgno)}>
                        <Eye className="h-4 w-4" /> View
                      </GhostBtn>
                      <Link href={`/admin/products/${row.productId}`} target="_blank" rel="noopener noreferrer" className={ghostCls}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void applyAvailability([row.productId], 'reserved')}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                      >
                        Reserve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void applyAvailability([row.productId], 'sold')}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Mark sold
                      </button>
                    </>
                  }
                />
              ))}
              <ShowMore total={filteredSoldOffline.length} shown={limit} onMore={() => setLimit((n) => n + PAGE_SIZE)} />
            </DiffPanel>
          )}

          {tab === 'add' && (
            <>
              {sheetLabel && categoryMissing.length === 0 && (report.missingOnWebsite?.length ?? 0) > 0 ? (
                <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  <p className="font-medium">
                    Nothing to add for <span className="font-semibold">{sheetLabel}</span>.
                  </p>
                  <p className="mt-1 text-amber-800">
                    {report.missingOnWebsite!.length} tag{report.missingOnWebsite!.length === 1 ? '' : 's'} need
                    adding from other sheets.{' '}
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={() => {
                        setCategoryFilter('all');
                        setLimit(PAGE_SIZE);
                      }}
                    >
                      Show all sheets
                    </button>
                  </p>
                </div>
              ) : null}
            <DiffPanel
              title="In store — not on website"
              hint="In Excel stock, but no matching website product (tag / SKU)."
              count={filteredMissing.length}
              empty={
                (report.missingOnWebsite?.length ?? 0) === 0
                  ? 'Every Excel in-stock tag already has a website match.'
                  : 'No items match these filters.'
              }
            >
              {filteredMissing.slice(0, limit).map((row) => {
                const rowKind = suggestErpProductKind(row.name);
                return (
                  <Row
                    key={row.tgno}
                    title={row.name}
                    badge={KIND_CONFIGS[rowKind].shortLabel}
                    meta={
                      <>
                        Tag <Mono>{row.tgno}</Mono>
                        {row.stockCategory ? ` · ${getStockCategoryLabel(row.stockCategory)}` : ''}
                        {row.remarks ? ` · Cert ${row.remarks}` : ''}
                      </>
                    }
                    actions={
                      <>
                        <GhostBtn onClick={() => void viewTag(row.tgno)}>
                          <Eye className="h-4 w-4" /> View
                        </GhostBtn>
                        <ErpAddProductActions
                          tgno={row.tgno}
                          name={row.name}
                          remarks={row.remarks}
                          estimatedPrice={row.estimatedPrice}
                          suggestedKind={rowKind}
                          creatingDraft={creatingTgno === row.tgno}
                          onCreateDraft={(tgno, kind) => void createDraft(tgno, kind)}
                        />
                      </>
                    }
                  />
                );
              })}
              <ShowMore total={filteredMissing.length} shown={limit} onMore={() => setLimit((n) => n + PAGE_SIZE)} />
            </DiffPanel>
            </>
          )}

          {tab === 'sold-online' && (
            <div className="space-y-4">
              {sheetLabel && categorySoldOnline.length === 0 && soldOnline.length > 0 ? (
                <div className="rounded-md border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
                  <p className="font-medium">
                    No sold-online mismatches in <span className="font-semibold">{sheetLabel}</span>.
                  </p>
                  <p className="mt-1 text-violet-800">
                    {soldOnline.length} item{soldOnline.length === 1 ? '' : 's'} exist in other Excel sheets.
                    After upload, the sheet filter stays on the file you uploaded — switch to{' '}
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={() => {
                        setCategoryFilter('all');
                        setLimit(PAGE_SIZE);
                      }}
                    >
                      All sheets
                    </button>{' '}
                    to see them.
                  </p>
                </div>
              ) : null}
              <DiffPanel
                title="Website sale — update MMI"
                hint="1) Update offline MMI as reserved or sold. 2) Confirm here to clear the alert. Stays until confirmed."
                count={pendingMmi.length}
                empty="No pending MMI updates from website sales."
              >
                {pendingMmi.map((task) => (
                  <Row
                    key={task.id}
                    title={task.productName ?? 'Product'}
                    meta={
                      <>
                        Tag <Mono>{task.tag_number}</Mono>
                        {task.orderNumber ? ` · Order ${task.orderNumber}` : ''}
                        {' · '}
                        {new Date(task.created_at).toLocaleString()}
                      </>
                    }
                    actions={
                      <>
                        <GhostBtn onClick={() => void viewTag(task.tag_number)}>View</GhostBtn>
                        <button
                          type="button"
                          disabled={ackingId === task.id}
                          onClick={() => void ackOutbound(task.id, 'reserved')}
                          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                        >
                          I reserved in MMI
                        </button>
                        <button
                          type="button"
                          disabled={ackingId === task.id}
                          onClick={() => void ackOutbound(task.id, 'sold')}
                          className="rounded-md bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                        >
                          I marked sold in MMI
                        </button>
                      </>
                    }
                  />
                ))}
              </DiffPanel>

              <DiffPanel
                title="Sold online — still in Excel stock"
                hint="Unavailable on website but still listed in the latest Excel. Fix in MMI, then re-upload that category sheet."
                count={filteredSoldOnline.length}
                empty="No reverse mismatches."
              >
                {filteredSoldOnline.slice(0, limit).map((row) => (
                  <Row
                    key={row.productId}
                    title={row.productName}
                    meta={
                      <>
                        Tag <Mono>{row.tgno}</Mono>
                        {row.stockCategory ? ` · ${getStockCategoryLabel(row.stockCategory)}` : ''}
                        {' · site: '}
                        {row.availabilityStatus}
                      </>
                    }
                    actions={
                      <>
                        <GhostBtn onClick={() => void viewTag(row.tgno)}>
                          <Eye className="h-4 w-4" /> View
                        </GhostBtn>
                        <Link href={`/admin/products/${row.productId}`} target="_blank" rel="noopener noreferrer" className={ghostCls}>
                          Edit
                        </Link>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700">
                          <AlertTriangle className="h-4 w-4" /> Re-upload Excel after MMI
                        </span>
                      </>
                    }
                  />
                ))}
                <ShowMore total={filteredSoldOnline.length} shown={limit} onMore={() => setLimit((n) => n + PAGE_SIZE)} />
              </DiffPanel>
            </div>
          )}

          {tab === 'orphans' && (
            <DiffPanel
              title="On website — not in any uploaded Excel"
              hint="Tag/SKU never seen in uploaded sheets. Often jewellery or a category not uploaded yet. Confirm in MMI before marking sold."
              count={filteredOrphans.length}
              empty="No website-only tags for this filter."
            >
              {filteredOrphans.slice(0, limit).map((row) => (
                <Row
                  key={row.productId}
                  title={row.productName}
                  badge={row.websitePurchasable ? 'Live' : 'Not live'}
                  meta={
                    <>
                      Tag <Mono>{row.tagNumber}</Mono>
                      {row.category ? ` · ${row.category}` : ''}
                    </>
                  }
                  actions={
                    <>
                      <GhostBtn onClick={() => void viewTag(row.tagNumber)}>
                        <Eye className="h-4 w-4" /> View
                      </GhostBtn>
                      <Link href={`/admin/products/${row.productId}`} target="_blank" rel="noopener noreferrer" className={ghostCls}>
                        Edit
                      </Link>
                      {row.websitePurchasable && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void markByTag('reserved', row.tagNumber)}
                            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                          >
                            Reserve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void markByTag('sold', row.tagNumber)}
                            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Mark sold
                          </button>
                        </>
                      )}
                    </>
                  }
                />
              ))}
              <ShowMore total={filteredOrphans.length} shown={limit} onMore={() => setLimit((n) => n + PAGE_SIZE)} />
            </DiffPanel>
          )}

          {tab === 'lookup' && (
            <Panel title="Look up any tag" hint="Checks Excel cache + website (tag_number or SKU).">
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  void viewTag(tagLookup);
                }}
              >
                <input
                  type="search"
                  value={tagLookup}
                  onChange={(e) => setTagLookup(e.target.value)}
                  placeholder="e.g. A704"
                  className="flex-1 rounded-md border border-gray-200 px-3 py-2.5 font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={!tagLookup.trim() || tagDetailLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {tagDetailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  View details
                </button>
              </form>
            </Panel>
          )}
        </>
      ) : null}

      <ErpTagDetailPanel
        detail={tagDetail}
        loading={tagDetailLoading}
        error={tagDetailError}
        creatingDraft={Boolean(creatingTgno && tagDetail?.tgno === creatingTgno)}
        onClose={() => {
          setTagDetail(null);
          setTagDetailError('');
          setTagDetailLoading(false);
        }}
        onCreateDraft={(tgno, kind) => void createDraft(tgno, kind)}
      />
    </div>
  );
}

const ghostCls =
  'inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50';

function GhostBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={ghostCls}>
      {children}
    </button>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono font-semibold text-gray-800">{children}</span>;
}

function getStockCategoryLabel(id: string) {
  return STOCK_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

function Banner({ tone, children }: { tone: 'red' | 'green'; children: ReactNode }) {
  const cls =
    tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  return <div className={`rounded-md border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'amber' | 'red' }) {
  const valueColor = tone === 'red' ? 'text-red-700' : tone === 'amber' ? 'text-amber-800' : 'text-gray-900';
  return (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DiffPanel({
  title,
  hint,
  count,
  empty,
  toolbar,
  footer,
  children,
}: {
  title: string;
  hint: string;
  count: number;
  empty: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold tabular-nums text-gray-700">{count}</span>
          {toolbar}
        </div>
      </header>
      {count === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{empty}</p>
      ) : (
        <div className="divide-y divide-gray-100">{children}</div>
      )}
      {footer && <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">{footer}</div>}
    </section>
  );
}

function Row({
  title,
  meta,
  badge,
  actions,
}: {
  title: string;
  meta: ReactNode;
  badge?: string;
  actions: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-900">{title}</p>
          {badge && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">{badge}</span>}
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{meta}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
    </div>
  );
}

function ShowMore({ total, shown, onMore }: { total: number; shown: number; onMore: () => void }) {
  if (total <= shown) return null;
  return (
    <div className="border-t border-gray-100 px-5 py-3 text-center">
      <button type="button" onClick={onMore} className="text-sm font-medium text-amber-800 hover:underline">
        Show more ({total - shown} remaining)
      </button>
    </div>
  );
}
