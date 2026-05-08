'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, IndianRupee, TrendingUp, CreditCard, Package } from 'lucide-react';

interface FinanceData {
  revenue: { total: number; thisMonth: number; thisWeek: number; today: number };
  paymentStatusCounts: Record<string, { count: number; total: number }>;
  paymentMethodCounts: Record<string, number>;
  topProducts: { id: string; name: string; revenue: number; quantity: number }[];
  dateRangeOrders: Record<string, unknown>[];
}

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/finance');
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.error || 'Access denied');
          setLoading(false);
          return;
        }
        setData(await res.json());
      } catch {
        setError('Failed to load finance data');
      }
      setLoading(false);
    })();
  }, []);

  async function handleExport() {
    if (!fromDate || !toDate) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/finance?from=${fromDate}T00:00:00Z&to=${toDate}T23:59:59Z`);
      const json = await res.json();
      const orders = json.dateRangeOrders || [];
      if (orders.length === 0) {
        alert('No orders in selected range.');
        setExporting(false);
        return;
      }

      // Build CSV
      const headers = ['Order No', 'Customer', 'Email', 'Amount', 'Payment Status', 'Payment Method', 'Order Status', 'Date'];
      const rows = orders.map((o: Record<string, unknown>) => [
        o.order_number, o.guest_name, o.guest_email,
        o.total, o.payment_status, o.payment_method,
        o.status, o.created_at,
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

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
  }
  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }
  if (!data) return null;

  const paymentStatuses = Object.entries(data.paymentStatusCounts);
  const paymentMethods = Object.entries(data.paymentMethodCounts);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Finance Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Revenue, payment analytics, and export</p>
      </div>

      {/* Revenue Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: data.revenue.total, icon: IndianRupee, color: 'text-green-600' },
          { label: 'This Month', value: data.revenue.thisMonth, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'This Week', value: data.revenue.thisWeek, icon: TrendingUp, color: 'text-amber-600' },
          { label: 'Today', value: data.revenue.today, icon: TrendingUp, color: 'text-purple-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
            </div>
            <p className={`mt-2 text-lg font-bold sm:text-xl ${card.color}`}>{formatINR(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Payment Status Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CreditCard className="h-4 w-4" /> Orders by Payment Status
          </h2>
          <div className="mt-4 space-y-2">
            {paymentStatuses.length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet</p>
            ) : (
              paymentStatuses.map(([status, info]) => (
                <div key={status} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm capitalize text-gray-700">{status.replace('_', ' ')}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{info.count} orders</span>
                    <span className="ml-2 text-xs text-gray-500">{formatINR(info.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CreditCard className="h-4 w-4" /> Payment Methods
          </h2>
          <div className="mt-4 space-y-2">
            {paymentMethods.length === 0 ? (
              <p className="text-sm text-gray-400">No payment data yet</p>
            ) : (
              paymentMethods.map(([method, count]) => (
                <div key={method} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm capitalize text-gray-700">{method.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Package className="h-4 w-4" /> Top Selling Products (by Revenue)
          </h2>
          <div className="mt-4">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400">No sales data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                      <th className="pb-2 pr-4">#</th>
                      <th className="pb-2 pr-4">Product</th>
                      <th className="pb-2 pr-4 text-right">Qty Sold</th>
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
              </div>
            )}
          </div>
        </div>

        {/* CSV Export */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Download className="h-4 w-4" /> Export Orders (CSV)
          </h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </div>
            <button onClick={handleExport} disabled={!fromDate || !toDate || exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
