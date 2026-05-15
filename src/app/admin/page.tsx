'use client';

import { useState, useEffect, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Package, Plus, ShoppingCart, DollarSign, TrendingUp,
  AlertCircle, Clock, Loader2, ArrowRight, Eye, MessageSquare,
  BarChart3, CreditCard, PieChart, Users,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingOrders: number;
  newEnquiries: number;
  activeProducts: number;
  lowStockProducts: number;
  totalConsultations: number;
  consultationRevenue: number;
}

interface CurrentAdmin {
  role: string;
  normalizedRole: string;
  name: string | null;
}

interface CountTotal {
  count: number;
  total: number;
}

interface ChartDay {
  date: string;
  revenue: number;
  orders: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer: string;
  total: number;
  status: string;
  payment_status: string;
  items_count: number;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  sku: string | null;
  name: string;
  category: string | null;
  sub_category: string | null;
  stock_quantity: number;
  availability_status: string;
}

interface DashboardData {
  currentAdmin: CurrentAdmin;
  stats: DashboardStats;
  pipeline: Record<string, number>;
  paymentStatus: Record<string, CountTotal>;
  consultationStatus: Record<string, number>;
  consultationPayments: Record<string, CountTotal>;
  enquiryStatus: Record<string, number>;
  productAvailability: Record<string, number>;
  productCategories: Record<string, number>;
  teamRoles: Record<string, number>;
  chartData: ChartDay[];
  lowStockProducts: LowStockProduct[];
  recentOrders: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  processing: 'bg-yellow-100 text-yellow-800',
  jewelry_making: 'bg-orange-100 text-orange-800',
  certification: 'bg-teal-100 text-teal-800',
  energization: 'bg-purple-100 text-purple-800',
  quality_check: 'bg-pink-100 text-pink-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function topEntries(record: Record<string, number>, limit = 6) {
  return Object.entries(record)
    .map(([label, value]) => ({ label: labelize(label), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function countTotalEntries(record: Record<string, CountTotal>, limit = 6) {
  return Object.entries(record)
    .map(([label, value]) => ({ label: labelize(label), value: value.count, meta: fmt(value.total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function RevenueChart({ data }: { data: ChartDay[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((day) => {
        const height = Math.max((day.revenue / maxRevenue) * 100, 4);
        const dateObj = new Date(day.date);
        const label = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
        return (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 font-medium">
              {day.orders > 0 ? day.orders : ''}
            </span>
            <div
              className="w-full rounded-t bg-amber-400 hover:bg-amber-500 transition-colors cursor-default"
              style={{ height: `${height}%` }}
              title={`${label}: ${fmt(day.revenue)} (${day.orders} orders)`}
            />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MetricBars({
  title,
  icon: Icon,
  items,
  emptyLabel = 'No data yet',
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  items: { label: string; value: number; meta?: string }[];
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
        <Icon className="h-4 w-4 text-amber-600" />
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-4 text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const width = Math.max((item.value / max) * 100, 5);
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-700">{item.label}</span>
                  <span className="shrink-0 font-bold text-gray-900">{item.value.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${width}%` }} />
                </div>
                {item.meta && <p className="mt-1 text-xs font-medium text-gray-400">{item.meta}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoleChartGrid({ data }: { data: DashboardData }) {
  const role = data.currentAdmin.normalizedRole;
  const roleLabel = labelize(role);

  const commonPanels = [
    <MetricBars key="orders" title="Order Pipeline" icon={BarChart3} items={topEntries(data.pipeline, 7)} />,
    <MetricBars key="payments" title="Payment Status" icon={CreditCard} items={countTotalEntries(data.paymentStatus)} />,
    <MetricBars key="consultations" title="Consultations" icon={MessageSquare} items={topEntries(data.consultationStatus)} />,
  ];

  const panelsByRole: Record<string, ReactNode[]> = {
    finance: [
      <MetricBars key="payments" title="Payment Status" icon={CreditCard} items={countTotalEntries(data.paymentStatus)} />,
      <MetricBars key="consult-payment" title="Consultation Payments" icon={DollarSign} items={countTotalEntries(data.consultationPayments)} />,
      <MetricBars key="orders" title="Order Pipeline" icon={BarChart3} items={topEntries(data.pipeline, 7)} />,
    ],
    sales: [
      <MetricBars key="consultations" title="Consultation Funnel" icon={MessageSquare} items={topEntries(data.consultationStatus)} />,
      <MetricBars key="enquiries" title="Lead Status" icon={PieChart} items={topEntries(data.enquiryStatus)} />,
      <MetricBars key="orders" title="Order Pipeline" icon={BarChart3} items={topEntries(data.pipeline, 7)} />,
    ],
    support: [
      <MetricBars key="enquiries" title="Lead Status" icon={PieChart} items={topEntries(data.enquiryStatus)} />,
      <MetricBars key="consultations" title="Consultation Funnel" icon={MessageSquare} items={topEntries(data.consultationStatus)} />,
      <MetricBars key="orders" title="Order Pipeline" icon={BarChart3} items={topEntries(data.pipeline, 7)} />,
    ],
    inventory: [
      <MetricBars key="availability" title="Product Availability" icon={Package} items={topEntries(data.productAvailability)} />,
      <MetricBars key="categories" title="Category Mix" icon={PieChart} items={topEntries(data.productCategories)} />,
      <MetricBars key="orders" title="Order Pipeline" icon={BarChart3} items={topEntries(data.pipeline, 7)} />,
    ],
    content: [
      <MetricBars key="categories" title="Category Mix" icon={PieChart} items={topEntries(data.productCategories)} />,
      <MetricBars key="availability" title="Product Availability" icon={Package} items={topEntries(data.productAvailability)} />,
      <MetricBars key="consultations" title="Consultations" icon={MessageSquare} items={topEntries(data.consultationStatus)} />,
    ],
    fulfillment: [
      <MetricBars key="orders" title="Order Pipeline" icon={BarChart3} items={topEntries(data.pipeline, 7)} />,
      <MetricBars key="availability" title="Product Availability" icon={Package} items={topEntries(data.productAvailability)} />,
      <MetricBars key="payments" title="Payment Status" icon={CreditCard} items={countTotalEntries(data.paymentStatus)} />,
    ],
    owner: [
      ...commonPanels,
      <MetricBars key="roles" title="Team Role Mix" icon={Users} items={topEntries(data.teamRoles)} />,
    ],
    admin: [
      ...commonPanels,
      <MetricBars key="roles" title="Team Role Mix" icon={Users} items={topEntries(data.teamRoles)} />,
    ],
  };

  const panels = panelsByRole[role] ?? commonPanels;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Role Graphs</p>
          <h2 className="text-lg font-bold text-gray-950">{roleLabel} View</h2>
        </div>
        <p className="text-sm font-medium text-amber-900">Charts are prioritized for this admin role.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {panels}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('Failed to load dashboard');
        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-gray-500">{error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const { stats, pipeline, chartData, lowStockProducts, recentOrders } = data;

  const PIPELINE_STAGES = [
    'placed', 'confirmed', 'processing', 'jewelry_making',
    'certification', 'energization', 'quality_check', 'shipped', 'delivered',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Today&apos;s Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(stats.todayRevenue)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {stats.todayOrders} order{stats.todayOrders !== 1 ? 's' : ''} today
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">All-time orders</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Need attention</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalRevenue)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {stats.activeProducts} active products, {stats.totalConsultations} consultations
          </p>
        </div>
      </div>

      <RoleChartGrid data={data} />

      {stats.lowStockProducts > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-base font-bold">Low Stock Inventory</h2>
              </div>
              <p className="mt-1 text-sm text-amber-800">
                {stats.lowStockProducts} active product{stats.lowStockProducts === 1 ? '' : 's'} have stock below 5.
              </p>
            </div>
            <Link
              href="/admin/products?stock=low"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Review Stock <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {lowStockProducts.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm transition hover:border-amber-300"
              >
                <p className="truncate font-semibold text-gray-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">{product.sku || product.category || 'Product'}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                  {product.stock_quantity} unit{product.stock_quantity === 1 ? '' : 's'} left
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Order Pipeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Order Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((stage) => {
            const count = pipeline[stage] ?? 0;
            const colorClass = STATUS_COLORS[stage] ?? 'bg-gray-100 text-gray-700';
            return (
              <Link
                key={stage}
                href={`/admin/orders?status=${stage}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80 ${colorClass}`}
              >
                {stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                <span className="ml-0.5 rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              Revenue — Last 7 Days
            </h2>
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/orders" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                  View All Orders
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link href="/admin/products" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500" />
                  Manage Products
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              <Link href="/admin/products/new" className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-500" />
                  Add New Product
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              </Link>
              {stats.newEnquiries > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2.5 text-sm font-medium text-yellow-800">
                  <MessageSquare className="h-4 w-4" />
                  {stats.newEnquiries} new enquir{stats.newEnquiries > 1 ? 'ies' : 'y'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-amber-600 transition hover:text-amber-700"
          >
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Order #</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Items</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Total</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No orders yet
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 font-medium text-amber-700">{order.order_number}</td>
                    <td className="px-4 py-2.5 text-gray-700 truncate max-w-35">{order.customer}</td>
                    <td className="px-4 py-2.5 text-gray-600">{order.items_count}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{fmt(order.total)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {order.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
