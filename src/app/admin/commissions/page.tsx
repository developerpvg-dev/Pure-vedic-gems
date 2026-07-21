'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, RefreshCw, Users } from 'lucide-react';
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { fmtInr } from '@/components/admin/AdminCharts';

type CommissionOrder = {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total: number;
  guest_name: string | null;
  commission_source: string | null;
  commission_name: string | null;
  commission_amount: number | null;
};

type PersonRow = {
  name: string;
  source: string;
  orders: number;
  commission: number;
  orderValue: number;
};

type CommissionsData = {
  needsMigration?: boolean;
  periodLabel: string;
  totals: { orders: number; commission: number; orderValue: number };
  byPerson: PersonRow[];
  orders: CommissionOrder[];
};

type Preset = {
  id: string;
  label: string;
  from: string;
  to: string;
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildPresets(now = new Date()): Preset[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = now.getDate();
  const lastDayThisMonth = new Date(y, m + 1, 0).getDate();
  const lastMonthStart = new Date(y, m - 1, 1);
  const lastMonthEnd = new Date(y, m, 0);

  return [
    {
      id: 'this_month',
      label: 'This month',
      from: isoDate(new Date(y, m, 1)),
      to: isoDate(new Date(y, m, lastDayThisMonth)),
    },
    {
      id: 'last_month',
      label: 'Last month',
      from: isoDate(lastMonthStart),
      to: isoDate(lastMonthEnd),
    },
    {
      id: 'half_1',
      label: 'Bi-month 1–15',
      from: isoDate(new Date(y, m, 1)),
      to: isoDate(new Date(y, m, Math.min(15, lastDayThisMonth))),
    },
    {
      id: 'half_2',
      label: 'Bi-month 16–end',
      from: isoDate(new Date(y, m, Math.min(16, lastDayThisMonth))),
      to: isoDate(new Date(y, m, lastDayThisMonth)),
    },
    {
      id: 'last_15',
      label: 'Last 15 days',
      from: isoDate(new Date(y, m, day - 14)),
      to: isoDate(now),
    },
  ];
}

function sourceLabel(source: string | null) {
  if (source === 'salesperson') return 'Salesperson';
  if (source === 'astrologer') return 'Astrologer';
  return '—';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CommissionsPage() {
  const presets = useMemo(() => buildPresets(), []);
  const [presetId, setPresetId] = useState('this_month');
  const [fromDate, setFromDate] = useState(presets[0].from);
  const [toDate, setToDate] = useState(presets[0].to);
  const [source, setSource] = useState('');
  const [name, setName] = useState('');
  const [data, setData] = useState<CommissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (source) params.set('source', source);
    if (name.trim()) params.set('name', name.trim());
    const res = await fetch(`/api/admin/commissions?${params}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(json.error || 'Failed to load');
      setData(null);
      return;
    }
    setData(json as CommissionsData);
  }, [fromDate, toDate, source, name]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyPreset(preset: Preset) {
    setPresetId(preset.id);
    setFromDate(preset.from);
    setToDate(preset.to);
  }

  function exportCsv() {
    if (!data?.orders.length) return;
    const headers = [
      'Order No',
      'Date',
      'Customer',
      'Source',
      'Name',
      'Commission',
      'Order Total',
      'Status',
    ];
    const rows = data.orders.map((o) => [
      o.order_number,
      o.created_at.slice(0, 10),
      o.guest_name ?? '',
      sourceLabel(o.commission_source),
      o.commission_name ?? '',
      o.commission_amount ?? 0,
      o.total,
      o.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <AdminPageHeader
        title="Commission Tracker"
        description="Internal salesperson & astrologer commissions by date range"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!data?.orders.length}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        }
      />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick range</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                presetId === p.id
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="block text-xs text-gray-500">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPresetId('custom');
                setFromDate(e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-gray-500">
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setPresetId('custom');
                setToDate(e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-gray-500">
            Source
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="salesperson">Salesperson</option>
              <option value="astrologer">Astrologer</option>
            </select>
          </label>
          <label className="block text-xs text-gray-500">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Filter by name"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {data?.needsMigration ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Run <code className="font-mono text-xs">supabase/week39_order_commission.sql</code> in
          Supabase first.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading && !data ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : data && !data.needsMigration ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminStatCard
              label="Orders with commission"
              value={data.totals.orders.toLocaleString('en-IN')}
              icon={Users}
              tone="text-stone-800"
              bg="bg-stone-50"
              subtext={data.periodLabel}
            />
            <AdminStatCard
              label="Total commission"
              value={fmtInr(data.totals.commission)}
              icon={Users}
              tone="text-emerald-700"
              bg="bg-emerald-50"
            />
            <AdminStatCard
              label="Order value"
              value={fmtInr(data.totals.orderValue)}
              icon={Users}
              tone="text-amber-700"
              bg="bg-amber-50"
            />
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">By person</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 tabular-nums">Orders</th>
                    <th className="px-4 py-3 tabular-nums">Commission</th>
                    <th className="px-4 py-3 tabular-nums">Order value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPerson.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                        No commission records in this range
                      </td>
                    </tr>
                  ) : (
                    data.byPerson.map((row) => (
                      <tr key={`${row.source}-${row.name}`} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600">{sourceLabel(row.source)}</td>
                        <td className="px-4 py-3 tabular-nums">{row.orders}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold text-emerald-800">
                          {fmtInr(row.commission)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{fmtInr(row.orderValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-bold text-gray-900">Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 tabular-nums">Commission</th>
                    <th className="px-4 py-3 tabular-nums">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        No orders
                      </td>
                    </tr>
                  ) : (
                    data.orders.map((o) => (
                      <tr key={o.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="font-medium text-amber-800 hover:underline"
                          >
                            {o.order_number}
                          </Link>
                          {o.guest_name ? (
                            <p className="text-xs text-gray-400">{o.guest_name}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(o.created_at)}</td>
                        <td className="px-4 py-3">{sourceLabel(o.commission_source)}</td>
                        <td className="px-4 py-3">{o.commission_name || '—'}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold text-emerald-800">
                          {o.commission_amount != null ? fmtInr(Number(o.commission_amount)) : '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{fmtInr(Number(o.total) || 0)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
