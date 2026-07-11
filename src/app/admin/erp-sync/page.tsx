'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw, Store, PlusCircle, CheckCircle2, Search } from 'lucide-react';
import type { ErpSyncReport } from '@/lib/erp/types';

const PAGE_SIZE = 50;

function useFilteredList<T>(items: T[], query: string, pick: (item: T) => string) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => pick(item).toLowerCase().includes(q));
  }, [items, query, pick]);
}

export default function ErpSyncAdminPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [creatingTgno, setCreatingTgno] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [report, setReport] = useState<ErpSyncReport | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [missingQuery, setMissingQuery] = useState('');
  const [missingLimit, setMissingLimit] = useState(PAGE_SIZE);
  const [offlineLimit, setOfflineLimit] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/erp-sync');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load ERP sync status');
      setConfigured(Boolean(data.configured));
    } else {
      setConfigured(Boolean(data.configured));
      setReport(data.report ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runSync() {
    if (!confirm('Pull latest in-stock tags from offline ERP? Uses 1 API credit and may take 20–30 seconds.')) return;
    setSyncing(true);
    setMessage('Syncing from ERP… this can take up to 30 seconds for large inventories.');
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Sync failed');
      setMessage('');
    } else {
      setReport(data.report ?? null);
      setMissingLimit(PAGE_SIZE);
      setOfflineLimit(PAGE_SIZE);
      setMessage(`ERP sync completed — ${data.tagCount ?? data.report?.erpTagCount ?? 0} in-stock tags cached.`);
    }
    setSyncing(false);
  }

  async function applyStock(productIds?: string[]) {
    setApplying(true);
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply_stock', product_ids: productIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to apply stock');
    } else {
      setReport(data.report ?? null);
      setMessage(`Marked ${data.updated ?? 0} product(s) sold out on website.`);
    }
    setApplying(false);
  }

  async function createDraft(tgno: string) {
    setCreatingTgno(tgno);
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/erp-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_draft', tgno }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create draft');
    } else {
      setMessage(`Draft created for tag ${tgno}.`);
      window.location.href = data.editUrl;
      return;
    }
    setCreatingTgno(null);
  }

  const offlineSoldOnWebsite = report?.stockMismatches.filter((row) => row.websitePurchasable && !row.erpInStock) ?? [];
  const websiteSoldErpInStock = report?.stockMismatches.filter((row) => !row.websitePurchasable && row.erpInStock) ?? [];

  const filteredMissing = useFilteredList(
    report?.missingOnWebsite ?? [],
    missingQuery,
    (row) => `${row.tgno} ${row.name} ${row.remarks ?? ''}`
  );
  const visibleMissing = filteredMissing.slice(0, missingLimit);
  const visibleOffline = offlineSoldOnWebsite.slice(0, offlineLimit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/admin/products" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-amber-700">
            <ArrowLeft className="h-4 w-4" /> Back to products
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Store ERP Sync</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Compare offline MMI ERP tag stock with website products. Uses Tag Stock API with <code className="rounded bg-gray-100 px-1">groupby: &quot;&quot;</code> (1 API call, cached locally).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runSync()}
          disabled={!configured || syncing || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Sync from ERP
        </button>
      </div>

      {!configured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add <code className="rounded bg-white px-1">MMI_ERP_API_TOKEN</code> to your environment to enable ERP sync.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sync status…
        </div>
      ) : report ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Last sync" value={report.syncedAt ? new Date(report.syncedAt).toLocaleString() : 'Never'} />
            <StatCard label="API calls used" value={`${report.apiCallsUsed} / ${report.apiCallsUsed + report.apiCallsRemaining}`} />
            <StatCard label="ERP in-stock tags" value={String(report.erpTagCount)} />
            <StatCard label="Matched on website" value={String(report.matchedInStock)} />
            <StatCard label="Website tagged products" value={String(report.websiteTaggedCount)} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white">
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">In store, not on website</h2>
                <p className="text-sm text-gray-500">ERP in-stock tags with no matching website product.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{report.missingOnWebsite.length}</span>
            </header>
            {report.missingOnWebsite.length === 0 ? (
              <EmptyState text="No missing products — all in-stock ERP tags are on the website." />
            ) : (
              <>
                <div className="border-b border-gray-100 px-5 py-3">
                  <div className="relative max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={missingQuery}
                      onChange={(e) => { setMissingQuery(e.target.value); setMissingLimit(PAGE_SIZE); }}
                      placeholder="Search tag, name, remarks…"
                      className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {visibleMissing.map((row) => (
                    <div key={row.tgno} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{row.name}</p>
                        <p className="text-sm text-gray-500">
                          Tag <span className="font-mono">{row.tgno}</span>
                          {row.remarks ? ` · ${row.remarks}` : ''}
                          {row.estimatedPrice > 0 ? ` · ₹${row.estimatedPrice.toLocaleString('en-IN')}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/products/new/jewellery?tag_number=${encodeURIComponent(row.tgno)}&name=${encodeURIComponent(row.name)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <PlusCircle className="h-4 w-4" /> Add manually
                        </Link>
                        <button
                          type="button"
                          onClick={() => void createDraft(row.tgno)}
                          disabled={creatingTgno === row.tgno}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                          {creatingTgno === row.tgno ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                          Create draft
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredMissing.length > visibleMissing.length && (
                  <div className="border-t border-gray-100 px-5 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setMissingLimit((n) => n + PAGE_SIZE)}
                      className="text-sm font-medium text-amber-700 hover:underline"
                    >
                      Show more ({filteredMissing.length - visibleMissing.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Sold offline — still live on website</h2>
                <p className="text-sm text-gray-500">Tag not in ERP in-stock list but website still shows as purchasable.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">{offlineSoldOnWebsite.length}</span>
                {offlineSoldOnWebsite.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void applyStock()}
                    disabled={applying}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Mark all sold out
                  </button>
                )}
              </div>
            </header>
            {offlineSoldOnWebsite.length === 0 ? (
              <EmptyState text="No offline-sold mismatches." />
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {visibleOffline.map((row) => (
                    <div key={row.productId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{row.productName}</p>
                        <p className="text-sm text-gray-500">Tag <span className="font-mono">{row.tgno}</span></p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${row.productId}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Edit product
                        </Link>
                        <button
                          type="button"
                          onClick={() => void applyStock([row.productId])}
                          disabled={applying}
                          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Mark sold out
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {offlineSoldOnWebsite.length > visibleOffline.length && (
                  <div className="border-t border-gray-100 px-5 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setOfflineLimit((n) => n + PAGE_SIZE)}
                      className="text-sm font-medium text-amber-700 hover:underline"
                    >
                      Show more ({offlineSoldOnWebsite.length - visibleOffline.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white">
            <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Sold on website — still in ERP</h2>
                <p className="text-sm text-gray-500">
                  Queued for ERP once write API is available ({report.pendingOutbound} pending).
                </p>
              </div>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">{websiteSoldErpInStock.length}</span>
            </header>
            {websiteSoldErpInStock.length === 0 ? (
              <EmptyState text="No website-sold / ERP-in-stock mismatches." />
            ) : (
              <div className="divide-y divide-gray-100">
                {websiteSoldErpInStock.map((row) => (
                  <div key={row.productId} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{row.productName}</p>
                      <p className="text-sm text-gray-500">
                        Tag <span className="font-mono">{row.tgno}</span> · website: {row.availabilityStatus}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-violet-500" aria-hidden />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-sm text-gray-500">{text}</p>;
}
