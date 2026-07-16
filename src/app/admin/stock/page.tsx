'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PackagePlus,
  RefreshCw,
  Store,
} from 'lucide-react';
import type { ErpSyncReport } from '@/lib/erp/types';

function syncHref(tab: string) {
  return `/admin/erp-sync?tab=${encodeURIComponent(tab)}`;
}

export default function StockManagerDashboardPage() {
  const [report, setReport] = useState<ErpSyncReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/erp-sync');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || 'Failed to load stock status');
    else setReport(data.report ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = report?.counts;
  const soldOnline =
    (counts?.soldOnlineStillInStore ?? 0) + (counts?.pendingOutbound ?? 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Stock dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Track offline MMI Excel stock vs the website. Upload sheets and clear mismatches from Store sync.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <Link
            href={syncHref('upload')}
            className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            <Store className="h-4 w-4" />
            Open sync
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading && !report ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading status…
        </div>
      ) : report ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Excel in stock"
              value={String(report.erpTagCount)}
              hint={report.syncedAt ? `Last sync ${new Date(report.syncedAt).toLocaleString()}` : 'No Excel uploaded yet'}
            />
            <Stat label="Matched live" value={String(report.matchedInStock)} />
            <Stat
              label="Sheets uploaded"
              value={`${counts?.categoriesUploaded ?? 0}/${counts?.categoriesTotal ?? 0}`}
            />
            <Stat
              label="Needs attention"
              value={String(
                (counts?.soldOfflineStillLive ?? 0) +
                  (counts?.missingOnWebsite ?? 0) +
                  soldOnline +
                  (counts?.orphansLive ?? 0)
              )}
              tone={
                (counts?.soldOfflineStillLive ?? 0) + (counts?.missingOnWebsite ?? 0) + soldOnline > 0
                  ? 'red'
                  : undefined
              }
            />
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <ActionCard
              tone="red"
              title="Sold offline — still live on website"
              count={counts?.soldOfflineStillLive ?? 0}
              description="Missing from latest Excel but still for sale online. Mark sold or reserved."
              href={syncHref('sold-offline')}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <ActionCard
              tone="amber"
              title="In store — not on website"
              count={counts?.missingOnWebsite ?? 0}
              description="In Excel stock with no matching website product. Add manually or create a draft."
              href={syncHref('add')}
              icon={<PackagePlus className="h-5 w-5" />}
            />
            <ActionCard
              tone="violet"
              title="Sold online — update MMI"
              count={soldOnline}
              description="Website sales waiting for MMI update, or still listed in Excel after online sale."
              href={syncHref('sold-online')}
              icon={<Store className="h-5 w-5" />}
            />
            <ActionCard
              tone="slate"
              title="Website only"
              count={counts?.orphansLive ?? 0}
              description="Live on website but not in any uploaded Excel sheet (often jewellery / sheet not uploaded)."
              href={syncHref('orphans')}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Content completeness</h2>
                <p className="text-sm text-gray-500">
                  Images, description, certificate, and product video gaps on existing products.
                </p>
              </div>
              <Link
                href="/admin/stock/completeness"
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:underline"
              >
                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          <section className="rounded-md border border-gray-200 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-900">Category status</h2>
                <p className="text-sm text-gray-500">Offline Excel sheet vs matched live website products.</p>
              </div>
              <Link href={syncHref('compare')} className="text-sm font-semibold text-amber-800 hover:underline">
                Full compare
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right">Excel</th>
                    <th className="px-2 py-2 text-right">Matched</th>
                    <th className="px-2 py-2 text-right">Need add</th>
                    <th className="px-2 py-2 text-right">Sold offline</th>
                    <th className="px-2 py-2" />
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
                      <td className="px-2 py-3 text-right tabular-nums">{c.excelInStock}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{c.matchedLive}</td>
                      <td
                        className={`px-2 py-3 text-right tabular-nums ${
                          c.needAdd ? 'font-semibold text-amber-800' : 'text-gray-500'
                        }`}
                      >
                        {c.needAdd}
                      </td>
                      <td
                        className={`px-2 py-3 text-right tabular-nums ${
                          c.soldOfflineStillLive ? 'font-semibold text-red-700' : 'text-gray-500'
                        }`}
                      >
                        {c.soldOfflineStillLive}
                      </td>
                      <td className="px-2 py-3 text-right">
                        {c.uploaded ? (
                          <Link
                            href={
                              c.soldOfflineStillLive > 0
                                ? syncHref('sold-offline')
                                : c.needAdd > 0
                                  ? syncHref('add')
                                  : syncHref('compare')
                            }
                            className="text-xs font-semibold text-amber-800 hover:underline"
                          >
                            Review
                          </Link>
                        ) : (
                          <Link href={syncHref('upload')} className="text-xs font-semibold text-amber-800 hover:underline">
                            Upload
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(counts?.categoriesUploaded ?? 0) === 0 && (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No Excel sheets uploaded yet. Open Store sync and upload each in-stock MMI sheet for a fresh comparison.
                Ask an owner to set your role to Stock Manager if you cannot access this page.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'red';
}) {
  return (
    <div className={`rounded-md border bg-white px-4 py-3 ${tone === 'red' ? 'border-red-200' : 'border-gray-200'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone === 'red' ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

function ActionCard({
  title,
  count,
  description,
  href,
  tone,
  icon,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  tone: 'red' | 'amber' | 'violet' | 'slate';
  icon: ReactNode;
}) {
  const border =
    tone === 'red'
      ? 'border-red-200'
      : tone === 'amber'
        ? 'border-amber-200'
        : tone === 'violet'
          ? 'border-violet-200'
          : 'border-gray-200';
  const badge =
    tone === 'red'
      ? 'bg-red-100 text-red-800'
      : tone === 'amber'
        ? 'bg-amber-100 text-amber-900'
        : tone === 'violet'
          ? 'bg-violet-100 text-violet-800'
          : 'bg-gray-100 text-gray-700';
  const iconColor =
    tone === 'red'
      ? 'text-red-600'
      : tone === 'amber'
        ? 'text-amber-700'
        : tone === 'violet'
          ? 'text-violet-700'
          : 'text-gray-500';

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-md border bg-white p-4 transition hover:shadow-sm ${border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-md bg-gray-50 p-2 ${iconColor}`}>{icon}</div>
        <span className={`rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${badge}`}>{count}</span>
      </div>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-gray-500">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 group-hover:underline">
        Open <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
