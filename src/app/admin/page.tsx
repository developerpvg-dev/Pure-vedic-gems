'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, Plus, ShoppingCart, DollarSign, TrendingUp,
  AlertCircle, Clock, Loader2, ArrowRight, Eye, MessageSquare,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingOrders: number;
  newEnquiries: number;
  activeProducts: number;
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

interface DashboardData {
  stats: DashboardStats;
  pipeline: Record<string, number>;
  chartData: ChartDay[];
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

  const { stats, pipeline, chartData, recentOrders } = data;

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
            {stats.activeProducts} active products
          </p>
        </div>
      </div>

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
                    <td className="px-4 py-2.5 text-gray-700 truncate max-w-[140px]">{order.customer}</td>
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
