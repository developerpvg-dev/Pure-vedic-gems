'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Loader2, MessageCircle, Phone, ShoppingCart } from 'lucide-react';
import { AdminStatCard } from '@/components/admin/AdminPageShell';

type JourneyPayload = {
  summary: {
    category_views: number;
    product_clicks: number;
    product_views: number;
    add_to_cart: number;
    begin_checkout: number;
    checkout_abandon: number;
    purchase: number;
    whatsapp_clicks: number;
    call_clicks: number;
  };
  top_categories: {
    category: string;
    views: number;
    clicks: number;
    add_to_cart: number;
    whatsapp: number;
    call: number;
  }[];
  top_products: {
    product_id: string | null;
    sku: string | null;
    name: string;
    clicks: number;
    views: number;
    add_to_cart: number;
    whatsapp: number;
    call: number;
  }[];
  whatsapp_by_source: { source: string; count: number }[];
  call_by_source: { source: string; count: number }[];
  abandoned_checkouts: {
    id: string;
    step: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    updated_at: string;
  }[];
};

export default function ProductJourneyPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<JourneyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    try {
      const res = await fetch(`/api/admin/commerce/product-funnels?${params}`);
      const json = (await res.json().catch(() => null)) as (JourneyPayload & { error?: string }) | null;
      if (!res.ok) throw new Error(json?.error || 'Unable to load product journey');
      setData(json as JourneyPayload);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Unable to load');
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to products
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Product journey</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Category traffic, product clicks, cart, checkout abandon, WhatsApp &amp; call clicks.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
          <BarChart3 className="h-3.5 w-3.5" />
          Storefront funnel
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
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : s ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="Category views" value={s.category_views.toLocaleString('en-IN')} icon={BarChart3} tone="text-gray-900" bg="bg-gray-50" />
            <AdminStatCard label="Product clicks" value={s.product_clicks.toLocaleString('en-IN')} icon={ShoppingCart} tone="text-sky-700" bg="bg-sky-50" />
            <AdminStatCard label="Product views" value={s.product_views.toLocaleString('en-IN')} icon={ShoppingCart} tone="text-indigo-700" bg="bg-indigo-50" />
            <AdminStatCard label="Add to cart" value={s.add_to_cart.toLocaleString('en-IN')} icon={ShoppingCart} tone="text-amber-700" bg="bg-amber-50" />
            <AdminStatCard label="Begin checkout" value={s.begin_checkout.toLocaleString('en-IN')} icon={ShoppingCart} tone="text-emerald-700" bg="bg-emerald-50" />
            <AdminStatCard label="Checkout abandon" value={s.checkout_abandon.toLocaleString('en-IN')} icon={ShoppingCart} tone="text-rose-700" bg="bg-rose-50" />
            <AdminStatCard label="Purchases" value={s.purchase.toLocaleString('en-IN')} icon={ShoppingCart} tone="text-green-700" bg="bg-green-50" />
            <AdminStatCard label="WhatsApp clicks" value={s.whatsapp_clicks.toLocaleString('en-IN')} icon={MessageCircle} tone="text-emerald-800" bg="bg-emerald-50" />
            <AdminStatCard label="Call clicks" value={s.call_clicks.toLocaleString('en-IN')} icon={Phone} tone="text-yellow-800" bg="bg-yellow-50" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <p className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Top categories
              </p>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Views</th>
                    <th className="px-4 py-2">Clicks</th>
                    <th className="px-4 py-2">ATC</th>
                    <th className="px-4 py-2">WA</th>
                    <th className="px-4 py-2">Call</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.top_categories ?? []).map((row) => (
                    <tr key={row.category} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-medium">{row.category}</td>
                      <td className="px-4 py-2">{row.views}</td>
                      <td className="px-4 py-2">{row.clicks}</td>
                      <td className="px-4 py-2">{row.add_to_cart}</td>
                      <td className="px-4 py-2">{row.whatsapp}</td>
                      <td className="px-4 py-2">{row.call}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <p className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                Top products
              </p>
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Views</th>
                    <th className="px-4 py-2">Clicks</th>
                    <th className="px-4 py-2">ATC</th>
                    <th className="px-4 py-2">WA</th>
                    <th className="px-4 py-2">Call</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.top_products ?? []).map((row) => (
                    <tr key={row.product_id || row.sku || row.name} className="border-b border-gray-50">
                      <td className="px-4 py-2">
                        <p className="font-medium">{row.name}</p>
                        {row.sku ? <p className="text-[11px] text-gray-500">{row.sku}</p> : null}
                      </td>
                      <td className="px-4 py-2">{row.views}</td>
                      <td className="px-4 py-2">{row.clicks}</td>
                      <td className="px-4 py-2">{row.add_to_cart}</td>
                      <td className="px-4 py-2">{row.whatsapp}</td>
                      <td className="px-4 py-2">{row.call}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SourceTable title="WhatsApp by source" rows={data?.whatsapp_by_source ?? []} />
            <SourceTable title="Call by source" rows={data?.call_by_source ?? []} />
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <p className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Abandoned checkouts (contact saved)
            </p>
            {(data?.abandoned_checkouts ?? []).length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No active abandoned checkouts in this window.</p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Phone</th>
                    <th className="px-4 py-2">Step</th>
                    <th className="px-4 py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.abandoned_checkouts ?? []).map((row) => (
                    <tr key={row.id} className="border-b border-gray-50">
                      <td className="px-4 py-2">{row.full_name || '—'}</td>
                      <td className="px-4 py-2">{row.email || '—'}</td>
                      <td className="px-4 py-2">{row.phone || '—'}</td>
                      <td className="px-4 py-2">{row.step}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {new Date(row.updated_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function SourceTable({ title, rows }: { title: string; rows: { source: string; count: number }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <p className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2">Source</th>
            <th className="px-4 py-2">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.source} className="border-b border-gray-50">
              <td className="px-4 py-2 font-medium">{row.source}</td>
              <td className="px-4 py-2">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
