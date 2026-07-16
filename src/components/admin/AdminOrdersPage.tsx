'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Loader2,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { fmtInr, MetricBars, RevenueTrendChart, StatCard } from '@/components/admin/AdminCharts';
import {
  AdminOrderFilters,
  EMPTY_ADMIN_ORDER_FILTERS,
  adminOrderFiltersToParams,
  analyticsParamsFromFilters,
  type AdminOrderFilterState,
} from '@/components/admin/AdminOrderFilters';

interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  total: number;
  reward_points_redeemed: number;
  reward_discount: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  items: unknown;
  customer_display?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface OrderAnalytics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    capturedCount: number;
    deliveredCount: number;
    pendingPaymentCount: number;
    cancelledCount: number;
    guestCount: number;
    registeredCount: number;
  };
  trend: Array<{
    date: string;
    label: string;
    orders: number;
    revenue: number;
    capturedRevenue: number;
  }>;
  statusBreakdown: Array<{ label: string; value: number; meta: number }>;
  paymentBreakdown: Array<{ label: string; value: number; meta: number }>;
  paymentMethodBreakdown: Array<{ label: string; value: number; meta: number }>;
  sampleSize: number;
}

const ORDERS_PER_PAGE = 20;

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-gray-100 text-gray-800',
  placed: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  processing: 'bg-yellow-100 text-yellow-800',
  jewelry_making: 'bg-yellow-100 text-yellow-800',
  certification: 'bg-cyan-100 text-cyan-800',
  energization: 'bg-violet-100 text-violet-800',
  quality_check: 'bg-orange-100 text-orange-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-pink-100 text-pink-800',
  payment_review: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-orange-600',
  authorized: 'text-blue-600',
  captured: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-purple-600',
  amount_mismatch: 'text-red-600',
  cancelled: 'text-red-600',
};

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function readInitialFilters(): AdminOrderFilterState {
  if (typeof window === 'undefined') return { ...EMPTY_ADMIN_ORDER_FILTERS };
  const params = new URLSearchParams(window.location.search);
  return {
    ...EMPTY_ADMIN_ORDER_FILTERS,
    search: params.get('search') ?? '',
    status: params.get('status') ?? '',
    payment_status: params.get('payment_status') ?? '',
    date_from: params.get('date_from') ?? '',
    date_to: params.get('date_to') ?? '',
    period: (params.get('period') as AdminOrderFilterState['period']) || '30d',
    min_total: params.get('min_total') ?? '',
    max_total: params.get('max_total') ?? '',
    payment_method: params.get('payment_method') ?? '',
    include_energization: params.get('include_energization') ?? '',
    refund_status: params.get('refund_status') ?? '',
    invoice_status: params.get('invoice_status') ?? '',
    customer_type: params.get('customer_type') ?? '',
    sort_by: params.get('sort_by') ?? 'created_at',
    sort_order: params.get('sort_order') ?? 'desc',
  };
}

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<AdminOrderFilterState>({ ...EMPTY_ADMIN_ORDER_FILTERS });
  const [filtersReady, setFiltersReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<OrderAnalytics | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);

  const syncUrl = useCallback((nextFilters: AdminOrderFilterState) => {
    const params = adminOrderFiltersToParams(nextFilters, 1, ORDERS_PER_PAGE);
    params.delete('page');
    params.delete('limit');
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  useEffect(() => {
    setFilters(readInitialFilters());
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    syncUrl(filters);
  }, [filters, filtersReady, syncUrl]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = adminOrderFiltersToParams(filters, page, ORDERS_PER_PAGE);
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    }
    setLoading(false);
  }, [filters, page]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const params = analyticsParamsFromFilters(filters);
    const res = await fetch(`/api/admin/orders/analytics?${params}`);
    if (res.ok) {
      setAnalytics(await res.json());
    }
    setAnalyticsLoading(false);
  }, [filters]);

  useEffect(() => {
    if (!filtersReady) return;
    void fetchOrders();
  }, [filtersReady, fetchOrders]);

  useEffect(() => {
    if (!filtersReady) return;
    void fetchAnalytics();
  }, [filtersReady, fetchAnalytics]);

  const updateFilters = useCallback((updates: Partial<AdminOrderFilterState>) => {
    setFilters((current) => ({ ...current, ...updates }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...EMPTY_ADMIN_ORDER_FILTERS });
    setPage(1);
  }, []);

  const summary = analytics?.summary;
  const periodLabel = filters.date_from || filters.date_to
    ? 'Custom date range'
    : filters.period === 'all'
      ? 'All time'
      : `Last ${filters.period.replace('d', ' days')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {analyticsLoading ? 'Loading analytics…' : `${summary?.totalOrders?.toLocaleString('en-IN') ?? total.toLocaleString('en-IN')} orders in view`}
          </p>
        </div>
        <a
          href="/api/admin/exports?type=orders"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <AdminOrderFilters filters={filters} onChange={updateFilters} onClear={clearFilters} />

      {/* Analytics panel */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setAnalyticsOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition hover:bg-gray-50 sm:px-5"
        >
          <div>
            <h2 className="text-sm font-bold text-gray-900">Analytics overview</h2>
            <p className="text-xs text-gray-500">{periodLabel}{analytics?.sampleSize ? ` · ${analytics.sampleSize.toLocaleString('en-IN')} orders analyzed` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {analyticsLoading && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
            {analyticsOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </div>
        </button>

        {analyticsOpen && (
          <div className="space-y-5 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Filtered orders"
                value={analyticsLoading ? '…' : (summary?.totalOrders ?? 0).toLocaleString('en-IN')}
                icon={ShoppingCart}
                tone="text-blue-600"
                bg="bg-blue-50"
                subtext={`${summary?.capturedCount ?? 0} captured`}
              />
              <StatCard
                label="Captured revenue"
                value={analyticsLoading ? '…' : fmtInr(summary?.totalRevenue ?? 0)}
                icon={DollarSign}
                tone="text-green-600"
                bg="bg-green-50"
              />
              <StatCard
                label="Avg order value"
                value={analyticsLoading ? '…' : fmtInr(summary?.avgOrderValue ?? 0)}
                icon={TrendingUp}
                tone="text-amber-600"
                bg="bg-amber-50"
              />
              <StatCard
                label="Delivered"
                value={analyticsLoading ? '…' : (summary?.deliveredCount ?? 0).toLocaleString('en-IN')}
                icon={PackageCheck}
                tone="text-emerald-600"
                bg="bg-emerald-50"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Pending payment', value: summary?.pendingPaymentCount, icon: CreditCard },
                { label: 'Registered customers', value: summary?.registeredCount, icon: Users },
                { label: 'Cancelled / refunded', value: summary?.cancelledCount, icon: XCircle },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                  <item.icon className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs text-gray-500">{item.label}</p>
                    <p className="text-base font-bold tabular-nums text-gray-900">
                      {analyticsLoading ? '…' : (item.value ?? 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-5">
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Order trends</h3>
                {analytics && !analyticsLoading ? (
                  <RevenueTrendChart data={analytics.trend} />
                ) : (
                  <div className="flex min-h-40 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
                <MetricBars
                  embedded
                  title="Order pipeline"
                  icon={BarChart3}
                  items={(analytics?.statusBreakdown ?? []).slice(0, 7)}
                  emptyLabel={analyticsLoading ? 'Loading…' : 'No orders in range'}
                />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <MetricBars
                  embedded
                  title="Payment status"
                  icon={CreditCard}
                  items={(analytics?.paymentBreakdown ?? []).slice(0, 6)}
                  emptyLabel={analyticsLoading ? 'Loading…' : 'No payment data'}
                />
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <MetricBars
                  embedded
                  title="Payment methods"
                  icon={DollarSign}
                  items={(analytics?.paymentMethodBreakdown ?? []).slice(0, 6)}
                  emptyLabel={analyticsLoading ? 'Loading…' : 'No payment method data'}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Orders table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-bold text-gray-900">
            Order list
            {total > 0 && <span className="ml-1.5 font-normal text-gray-500">({total.toLocaleString('en-IN')})</span>}
          </h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-600" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No orders match these filters</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customer = order.customer_display ?? {
                    name: order.guest_name || 'Guest',
                    email: order.guest_email || '',
                    phone: order.guest_phone || '',
                  };

                  return (
                    <tr key={order.id} className="transition hover:bg-gray-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-amber-700">{order.order_number}</td>
                      <td className="max-w-[180px] px-4 py-3">
                        <p className="truncate font-medium text-gray-900">{customer.name}</p>
                        <p className="truncate text-xs text-gray-400">{customer.email || customer.phone || 'No contact saved'}</p>
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-gray-600">
                        {Array.isArray(order.items) ? (
                          <div>
                            <p>{order.items.length} item{order.items.length === 1 ? '' : 's'}</p>
                            {(() => {
                              const tags = order.items
                                .map((item) =>
                                  item && typeof item === 'object' && 'tag_number' in item
                                    ? String((item as { tag_number?: string | null }).tag_number || '').trim()
                                    : '',
                                )
                                .filter(Boolean);
                              if (!tags.length) return null;
                              return (
                                <p className="mt-0.5 truncate text-xs font-medium text-amber-800" title={tags.join(', ')}>
                                  Tag: {tags.join(', ')}
                                </p>
                              );
                            })()}
                          </div>
                        ) : (
                          0
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-semibold tabular-nums text-gray-900">{fmtInr(order.total ?? 0)}</p>
                        {(order.reward_discount ?? 0) > 0 && (
                          <p className="text-xs font-medium text-green-700">
                            {order.reward_points_redeemed.toLocaleString('en-IN')} pts
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {label(order.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`text-xs font-semibold ${PAYMENT_STATUS_COLORS[order.payment_status] || 'text-gray-600'}`}>
                          {label(order.payment_status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-4 py-3 sm:px-5">
          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={ORDERS_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      </section>
    </div>
  );
}
