'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Loader2, ShoppingBag, Users } from 'lucide-react';
import { AdminStatCard } from '@/components/admin/AdminPageShell';

type InsightsPayload = {
  orders: {
    summary: { order_count: number; paid_count: number; revenue: number; aov: number };
    by_day: { date: string; orders: number; revenue: number }[];
    recent: {
      order_number: string;
      created_at: string;
      total: number;
      status: string;
      payment_status: string;
      order_source: string;
      items: { name: string; sku: string | null; quantity: number; line_total: number | null; design: string | null }[];
    }[];
    top_products: { name: string; sku: string | null; units: number; revenue: number }[];
    top_designs: { design: string; units: number }[];
  };
  leads: {
    summary: { total: number; drafts: number; submitted: number };
    by_source: { source: string; total: number; drafts: number; submitted: number }[];
    by_day: { date: string; count: number }[];
  };
};

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function SeoInsightsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    try {
      const res = await fetch(`/api/admin/seo/insights?${params}`);
      const json = (await res.json().catch(() => null)) as (InsightsPayload & { error?: string }) | null;
      if (!res.ok) throw new Error(json?.error || 'Unable to load insights');
      setData(json as InsightsPayload);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Unable to load');
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const o = data?.orders.summary;
  const l = data?.leads.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Orders &amp; leads</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Aggregate tracking only — no customer names, emails, or phones.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
          <BarChart3 className="h-3.5 w-3.5" />
          Anonymized
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-medium text-gray-500">
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void fetchData()}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : data && o && l ? (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Orders</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard label="Orders" value={o.order_count.toLocaleString('en-IN')} icon={ShoppingBag} tone="text-gray-900" bg="bg-gray-50" />
              <AdminStatCard label="Paid orders" value={o.paid_count.toLocaleString('en-IN')} icon={ShoppingBag} tone="text-emerald-700" bg="bg-emerald-50" />
              <AdminStatCard label="Revenue (paid)" value={inr(o.revenue)} icon={BarChart3} tone="text-amber-800" bg="bg-amber-50" />
              <AdminStatCard label="Avg order value" value={inr(o.aov)} icon={BarChart3} tone="text-indigo-700" bg="bg-indigo-50" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Order</th>
                    <th className="px-4 py-2 font-semibold">Date</th>
                    <th className="px-4 py-2 font-semibold">Products / design</th>
                    <th className="px-4 py-2 font-semibold">Amount</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.recent.map((row) => (
                    <tr key={row.order_number} className="border-b border-gray-50 align-top">
                      <td className="px-4 py-2 font-medium text-gray-900">{row.order_number}</td>
                      <td className="px-4 py-2 text-gray-600">{row.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-2 text-gray-800">
                        <ul className="space-y-1">
                          {row.items.map((item, idx) => (
                            <li key={`${row.order_number}-${idx}`}>
                              {item.name}
                              {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                              {item.design ? (
                                <span className="block text-xs text-gray-500">Design: {item.design}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-2 font-semibold">{inr(Math.round(row.total))}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {row.status}
                        <span className="block text-gray-400">{row.payment_status} · {row.order_source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <p className="border-b border-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Top products
                </p>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-2">Product</th>
                      <th className="px-4 py-2">Units</th>
                      <th className="px-4 py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.top_products.map((p) => (
                      <tr key={p.sku || p.name} className="border-t border-gray-50">
                        <td className="px-4 py-2">
                          {p.name}
                          {p.sku ? <span className="block text-xs text-gray-400">{p.sku}</span> : null}
                        </td>
                        <td className="px-4 py-2">{p.units}</td>
                        <td className="px-4 py-2">{inr(Math.round(p.revenue))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <p className="border-b border-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Top designs
                </p>
                {data.orders.top_designs.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500">No design names on orders in this window.</p>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-gray-400">
                      <tr>
                        <th className="px-4 py-2">Design</th>
                        <th className="px-4 py-2">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.top_designs.map((d) => (
                        <tr key={d.design} className="border-t border-gray-50">
                          <td className="px-4 py-2">{d.design}</td>
                          <td className="px-4 py-2">{d.units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">Leads (no contact details)</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminStatCard label="Total leads" value={l.total.toLocaleString('en-IN')} icon={Users} tone="text-gray-900" bg="bg-gray-50" />
              <AdminStatCard label="Submitted" value={l.submitted.toLocaleString('en-IN')} icon={Users} tone="text-emerald-700" bg="bg-emerald-50" />
              <AdminStatCard label="Incomplete drafts" value={l.drafts.toLocaleString('en-IN')} icon={Users} tone="text-amber-700" bg="bg-amber-50" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <p className="border-b border-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  By source
                </p>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-2">Source</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Submitted</th>
                      <th className="px-4 py-2">Drafts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leads.by_source.map((row) => (
                      <tr key={row.source} className="border-t border-gray-50">
                        <td className="px-4 py-2 font-medium">{row.source}</td>
                        <td className="px-4 py-2">{row.total}</td>
                        <td className="px-4 py-2">{row.submitted}</td>
                        <td className="px-4 py-2">{row.drafts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <p className="border-b border-gray-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  By date
                </p>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.leads.by_day].reverse().map((row) => (
                      <tr key={row.date} className="border-t border-gray-50">
                        <td className="px-4 py-2">{row.date}</td>
                        <td className="px-4 py-2">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
