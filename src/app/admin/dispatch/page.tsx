'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Package, RefreshCw, Truck } from 'lucide-react';

type StageRow = {
  status: string;
  label: string;
  count: number;
};

const STAGE_TONE: Record<string, string> = {
  quality_check: 'border-orange-200 bg-orange-50 text-orange-950',
  shipped: 'border-purple-200 bg-purple-50 text-purple-950',
  out_for_delivery: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  delivered: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  feedback: 'border-teal-200 bg-teal-50 text-teal-950',
};

export default function DispatchDashboardPage() {
  const [stages, setStages] = useState<StageRow[]>([]);
  const [totalOpen, setTotalOpen] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/dispatch');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Failed to load dispatch board');
      setLoading(false);
      return;
    }
    setStages(data.stages ?? []);
    setTotalOpen(data.totalOpen ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dispatch dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Shipping pipeline — QC, in transit, out for delivery, delivered, and customer feedback.
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
            href="/admin/orders?period=all"
            className="inline-flex items-center gap-2 rounded-md bg-amber-700 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            <Package className="h-4 w-4" />
            All orders
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Open in pipeline</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">
              {loading ? '…' : totalOpen.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => (
          <Link
            key={stage.status}
            href={`/admin/orders?status=${encodeURIComponent(stage.status)}&period=all`}
            className={`rounded-xl border p-5 transition hover:shadow-sm ${STAGE_TONE[stage.status] ?? 'border-gray-200 bg-white text-gray-900'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stage.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {loading ? '…' : stage.count.toLocaleString('en-IN')}
            </p>
            <p className="mt-2 text-xs font-medium opacity-70">View orders →</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/leads"
          className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/40"
        >
          <MessageSquare className="mt-0.5 h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Leads</p>
            <p className="text-xs text-gray-500">Assign, follow up, and manage enquiries</p>
          </div>
        </Link>
        <Link
          href="/admin/orders?status=feedback&period=all"
          className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-200 hover:bg-amber-50/40"
        >
          <Package className="mt-0.5 h-5 w-5 text-gray-500" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Collect feedback</p>
            <p className="text-xs text-gray-500">Orders in the feedback stage after delivery</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
