'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Download, IndianRupee, TrendingUp, CreditCard, Package, BarChart3 } from 'lucide-react';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart, fmtInr } from '@/components/admin/AdminCharts';

interface FinanceData {
  revenue: {
    filtered: number;
    total: number;
    thisMonth: number;
    thisWeek: number;
    today: number;
    consultations: number;
    combined: number;
  };
  paymentStatusCounts: Record<string, { count: number; total: number }>;
  paymentMethodCounts: Record<string, number>;
  paymentStatusBreakdown: Array<{ label: string; value: number; meta: number }>;
  topProducts: { id: string; name: string; revenue: number; quantity: number }[];
  trend: Array<{ date: string; label: string; orders: number; revenue: number; capturedRevenue?: number }>;
  periodLabel: string;
  sampleSize: number;
}

const PERIODS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '1 year' },
  { value: 'all', label: 'All time' },
];

function formatINR(n: number) {
  return fmtInr(n);
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const fetchFinance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate && toDate) {
        params.set('from', fromDate);
        params.set('to', toDate);
      } else {
        params.set('period', period);
      }
      const res = await fetch(`/api/admin/finance?${params}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Access denied');
        setData(null);
        return;
      }
      setData(await res.json());
      setError('');
    } catch {
      setError('Failed to load finance data');
    }
    setLoading(false);
  }, [fromDate, period, toDate]);

  useEffect(() => {
    void fetchFinance();
  }, [fetchFinance]);

  async function handleExport() {
    if (!fromDate || !toDate) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/finance?from=${fromDate}T00:00:00Z&to=${toDate}T23:59:59Z`);
      const json = await res.json();
      const orders = json.dateRangeOrders || [];
      if (orders.length === 0) {
        alert('No orders in selected range.');
        return;
      }
      const headers = ['Order No', 'Customer', 'Email', 'Amount', 'Payment Status', 'Payment Method', 'Order Status', 'Date'];
      const rows = orders.map((o: Record<string, unknown>) => [
        o.order_number, o.guest_name, o.guest_email, o.total, o.payment_status, o.payment_method, o.status, o.created_at,
      ]);
      const csv = [headers.join(','), ...rows.map((r: unknown[]) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${fromDate}_to_${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
    setExporting(false);
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-center text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const paymentMethods = Object.entries(data.paymentMethodCounts).filter(([, count]) => count > 0);
  const paymentStatuses = data.paymentStatusBreakdown.filter((item) => item.value > 0);

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-5 sm:space-y-6">
      <AdminPageHeader title="Finance Dashboard" description="Revenue analytics, payment breakdowns, and exports" />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick period</p>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPeriod(p.value);
                    setFromDate('');
                    setToDate('');
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    period === p.value && !fromDate
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Custom range</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label className="block text-xs text-gray-500">
                From
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-gray-500">
                To
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => void fetchFinance()}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto"
              >
                Apply range
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Period revenue"
          value={formatINR(data.revenue.filtered)}
          icon={IndianRupee}
          tone="text-green-600"
          bg="bg-green-50"
          subtext={data.periodLabel}
        />
        <AdminStatCard
          label="Consultation revenue"
          value={formatINR(data.revenue.consultations)}
          icon={TrendingUp}
          tone="text-purple-600"
          bg="bg-purple-50"
        />
        <AdminStatCard
          label="Combined revenue"
          value={formatINR(data.revenue.combined)}
          icon={IndianRupee}
          tone="text-emerald-600"
          bg="bg-emerald-50"
        />
        <AdminStatCard
          label="Today"
          value={formatINR(data.revenue.today)}
          icon={TrendingUp}
          tone="text-amber-600"
          bg="bg-amber-50"
          subtext={`Month: ${formatINR(data.revenue.thisMonth)}`}
        />
      </div>

      <AdminAnalyticsPanel
        title="Revenue analytics"
        subtitle={`${data.periodLabel} · ${data.sampleSize.toLocaleString('en-IN')} orders`}
        loading={loading}
        open={analyticsOpen}
        onToggle={() => setAnalyticsOpen((v) => !v)}
      >
        <div className="min-w-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 p-3 sm:p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Revenue trend</h3>
          <div className="min-w-0 max-w-full overflow-x-auto [scrollbar-width:thin]">
            <RevenueTrendChart data={data.trend} />
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-5">
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 p-3 sm:p-4">
            <MetricBars embedded title="Payment status" icon={CreditCard} items={paymentStatuses.slice(0, 8)} />
          </div>
          <div className="min-w-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/50 p-3 sm:p-4">
            <MetricBars
              embedded
              title="Payment methods"
              icon={BarChart3}
              items={paymentMethods.map(([label, count]) => ({ label: label.replace(/_/g, ' '), value: count }))}
            />
          </div>
        </div>
      </AdminAnalyticsPanel>

      <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Package className="h-4 w-4 shrink-0 text-amber-600" />
          Top products by revenue
        </h2>

        {data.topProducts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No sales data in this period</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3 md:hidden">
              {data.topProducts.map((p, i) => (
                <li key={p.id} className="rounded-lg border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-400">#{i + 1}</p>
                      <p className="mt-0.5 break-words text-sm font-semibold text-gray-900">{p.name}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-green-600">{formatINR(p.revenue)}</p>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Qty: {p.quantity.toLocaleString('en-IN')}</p>
                </li>
              ))}
            </ul>

            <div className="mt-4 hidden md:block">
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                      <th className="pb-2 pr-4">#</th>
                      <th className="pb-2 pr-4">Product</th>
                      <th className="pb-2 pr-4 text-right">Qty</th>
                      <th className="pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={p.id} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-400">{i + 1}</td>
                        <td className="max-w-[280px] py-2 pr-4 font-medium text-gray-900">
                          <span className="line-clamp-2">{p.name}</span>
                        </td>
                        <td className="py-2 pr-4 text-right text-gray-600">{p.quantity}</td>
                        <td className="py-2 text-right font-semibold text-green-600">{formatINR(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Download className="h-4 w-4 shrink-0" />
          Export orders CSV
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">Set a custom date range above, then export matching orders.</p>
          <button
            type="button"
            onClick={handleExport}
            disabled={!fromDate || !toDate || exporting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 sm:w-auto"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download CSV
          </button>
        </div>
      </section>
    </div>
  );
}
