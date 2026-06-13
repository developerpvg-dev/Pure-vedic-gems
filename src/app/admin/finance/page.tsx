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
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
  }
  if (error && !data) {
    return <div className="py-20 text-center"><p className="text-sm text-red-600">{error}</p></div>;
  }
  if (!data) return null;

  const paymentMethods = Object.entries(data.paymentMethodCounts);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Finance Dashboard" description="Revenue analytics, payment breakdowns, and exports" />

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => { setPeriod(p.value); setFromDate(''); setToDate(''); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${period === p.value && !fromDate ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-gray-500">
              From
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs text-gray-500">
              To
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <button type="button" onClick={() => void fetchFinance()} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              Apply range
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Period revenue" value={formatINR(data.revenue.filtered)} icon={IndianRupee} tone="text-green-600" bg="bg-green-50" subtext={data.periodLabel} />
        <AdminStatCard label="Consultation revenue" value={formatINR(data.revenue.consultations)} icon={TrendingUp} tone="text-purple-600" bg="bg-purple-50" />
        <AdminStatCard label="Combined revenue" value={formatINR(data.revenue.combined)} icon={IndianRupee} tone="text-emerald-600" bg="bg-emerald-50" />
        <AdminStatCard label="Today" value={formatINR(data.revenue.today)} icon={TrendingUp} tone="text-amber-600" bg="bg-amber-50" subtext={`Month: ${formatINR(data.revenue.thisMonth)}`} />
      </div>

      <AdminAnalyticsPanel
        title="Revenue analytics"
        subtitle={`${data.periodLabel} · ${data.sampleSize.toLocaleString('en-IN')} orders`}
        loading={loading}
        open={analyticsOpen}
        onToggle={() => setAnalyticsOpen((v) => !v)}
      >
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Revenue trend</h3>
          <RevenueTrendChart data={data.trend} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Payment status" icon={CreditCard} items={data.paymentStatusBreakdown.slice(0, 8)} />
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Payment methods" icon={BarChart3} items={paymentMethods.map(([label, count]) => ({ label: label.replace(/_/g, ' '), value: count }))} />
          </div>
        </div>
      </AdminAnalyticsPanel>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Package className="h-4 w-4 text-amber-600" /> Top products by revenue
        </h2>
        <div className="mt-4 overflow-x-auto">
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No sales data in this period</p>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
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
                    <td className="py-2 pr-4 font-medium text-gray-900">{p.name}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{p.quantity}</td>
                    <td className="py-2 text-right font-semibold text-green-600">{formatINR(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Download className="h-4 w-4" /> Export orders CSV
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <p className="text-sm text-gray-500 sm:flex-1">Use the custom date range above, then export matching orders.</p>
          <button onClick={handleExport} disabled={!fromDate || !toDate || exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
