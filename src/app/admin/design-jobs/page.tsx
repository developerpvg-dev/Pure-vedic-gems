'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Palette, RefreshCw } from 'lucide-react';

import { isDesignJobOverdue } from '@/lib/orders/design-jobs';

type DesignJob = {
  id: string;
  order_number: string;
  status: string;
  designer_display: string;
  design_price: number | null;
  design_due_at: string | null;
  design_routed_at: string | null;
  design_completed_at: string | null;
  item_count: number;
  item_summary?: string;
  days_taken?: number | null;
  total: number;
  order_source?: string | null;
};

type SummaryRow = {
  designer: string;
  open: number;
  in_progress?: number;
  completed: number;
  overdue: number;
  design_price_total?: number;
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtInr(n: number | null | undefined) {
  if (n == null) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

function isOverdue(job: DesignJob) {
  return isDesignJobOverdue(job);
}

export default function DesignJobsPage() {
  const [jobs, setJobs] = useState<DesignJob[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsMigration, setNeedsMigration] = useState(false);
  const [designerFilter, setDesignerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateField, setDateField] = useState<'routed' | 'completed'>('routed');

  const queryString = useCallback(() => {
    const params = new URLSearchParams();
    if (designerFilter.trim()) params.set('designer', designerFilter.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    params.set('date_field', dateField);
    return params.toString();
  }, [designerFilter, statusFilter, fromDate, toDate, dateField]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/admin/design-jobs?${queryString()}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Failed to load design jobs');
      return;
    }
    setJobs(data.jobs ?? []);
    setSummary(data.summary ?? []);
    setNeedsMigration(Boolean(data.needsMigration));
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-[var(--pvg-primary)] sm:text-3xl">
            <Palette className="h-7 w-7" />
            Design Jobs
          </h1>
          <p className="mt-1 text-sm text-[var(--pvg-muted)]">
            Track which designer has which jewelry orders, when work was returned, and designer-wise output by date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/design-jobs?${queryString()}&format=csv`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {summary.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((row) => (
            <button
              key={row.designer}
              type="button"
              onClick={() => setDesignerFilter(row.designer === 'Unassigned' ? '' : row.designer)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <p className="font-semibold text-gray-900">{row.designer}</p>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold text-indigo-700">{row.open}</span> open
                {row.in_progress ? (
                  <span className="ml-2 text-violet-700">{row.in_progress} in progress</span>
                ) : null}
                {row.overdue > 0 ? (
                  <span className="ml-2 font-semibold text-red-600">{row.overdue} overdue</span>
                ) : null}
                <span className="ml-2 text-gray-400">· {row.completed} returned</span>
              </p>
              {row.design_price_total != null && row.design_price_total > 0 ? (
                <p className="mt-1 text-xs text-gray-500">Making ₹ {row.design_price_total.toLocaleString('en-IN')}</p>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <input
          value={designerFilter}
          onChange={(e) => setDesignerFilter(e.target.value)}
          placeholder="Filter by designer name"
          className="min-w-[180px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">All design statuses</option>
          <option value="design_assigned">Design assigned</option>
          <option value="design_in_progress">In progress</option>
          <option value="design_completed">Completed / returned</option>
        </select>
        <select
          value={dateField}
          onChange={(e) => setDateField(e.target.value as 'routed' | 'completed')}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="routed">Filter by assigned date</option>
          <option value="completed">Filter by returned date</option>
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          aria-label="From date"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          aria-label="To date"
        />
      </div>

      {needsMigration ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Showing portal designer assignments only. Run{' '}
          <code className="font-mono text-xs">supabase/week35_workshop_designers.sql</code> in
          Supabase to enable name-only designers, making price, and due dates.
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">
            No design jobs in this range. Assign a designer from an order that needs jewelry making.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Designer</th>
                  <th className="px-4 py-3">Design / items</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Returned</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Making ₹</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className={isOverdue(job) ? 'bg-red-50/60' : ''}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${job.id}`}
                        className="font-semibold text-indigo-700 hover:underline"
                      >
                        {job.order_number}
                      </Link>
                      {job.order_source === 'offline' ? (
                        <span className="ml-2 rounded bg-stone-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                          Offline
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{job.designer_display}</td>
                    <td className="max-w-[220px] px-4 py-3 text-gray-600">
                      <p className="truncate" title={job.item_summary || undefined}>
                        {job.item_summary || `${job.item_count} item${job.item_count === 1 ? '' : 's'}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${isOverdue(job) ? 'font-semibold text-red-700' : 'text-gray-700'}`}>
                      {fmtDate(job.design_due_at)}
                      {isOverdue(job) ? ' · overdue' : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(job.design_routed_at)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(job.design_completed_at)}</td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {job.days_taken != null ? job.days_taken : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{fmtInr(job.design_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
