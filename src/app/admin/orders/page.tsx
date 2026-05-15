import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Eye } from 'lucide-react';
import type { Json } from '@/lib/types/database';

interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  items: Json;
}

interface CustomerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface OrdersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function customerDisplay(order: Order, profile?: CustomerProfile) {
  return {
    name: order.guest_name || profile?.full_name || profile?.email || 'Guest',
    email: order.guest_email || profile?.email || '',
    phone: order.guest_phone || profile?.phone || '',
  };
}

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

const ORDERS_PER_PAGE = 20;

function OrdersPagination({
  page,
  totalPages,
  total,
  searchParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  searchParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(pageNumber));
    return `/admin/orders?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (pageNumber) => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1
  );
  const from = (page - 1) * ORDERS_PER_PAGE + 1;
  const to = Math.min(total, page * ORDERS_PER_PAGE);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-brand-muted">Showing {from}-{to} of {total}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={buildHref(Math.max(1, page - 1))} className={`rounded-lg border border-brand-border px-3 py-1.5 text-sm transition ${page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-brand-bg-alt'}`}>
          Prev
        </Link>
        {pages.map((pageNumber, index) => {
          const previous = pages[index - 1];
          return (
            <span key={pageNumber} className="flex items-center gap-2">
              {previous && pageNumber - previous > 1 ? <span className="text-brand-muted">...</span> : null}
              <Link
                href={buildHref(pageNumber)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ${
                  pageNumber === page
                    ? 'border-brand-primary bg-brand-primary text-brand-bg'
                    : 'border-brand-border hover:bg-brand-bg-alt'
                }`}
              >
                {pageNumber}
              </Link>
            </span>
          );
        })}
        <Link href={buildHref(Math.min(totalPages, page + 1))} className={`rounded-lg border border-brand-border px-3 py-1.5 text-sm transition ${page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-brand-bg-alt'}`}>
          Next
        </Link>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const rawParams = await searchParams;
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : (value ?? '')])
  ) as Record<string, string>;
  const page = Math.max(1, Number(params.page ?? '1') || 1);
  const from = (page - 1) * ORDERS_PER_PAGE;
  const supabase = createAdminClient();

  const [ordersResult, pendingResult, paidResult, deliveredResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + ORDERS_PER_PAGE - 1),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('payment_status', 'captured'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
  ]);

  const allOrders = (ordersResult.data ?? []) as unknown as Order[];
  const total = ordersResult.count ?? 0;
  const totalPages = Math.ceil(total / ORDERS_PER_PAGE);
  const customerIds = Array.from(new Set(allOrders.map((order) => order.customer_id).filter((id): id is string => Boolean(id))));
  const { data: profiles } = customerIds.length
    ? await supabase
        .from('customer_profiles')
        .select('id, full_name, email, phone')
        .in('id', customerIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as CustomerProfile]));

  const stats = {
    total,
    pending: pendingResult.count ?? 0,
    paid: paidResult.count ?? 0,
    delivered: deliveredResult.count ?? 0,
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Orders</h1>
        <p className="text-brand-muted">Manage all customer orders</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orders', value: stats.total },
          { label: 'Pending Payment', value: stats.pending },
          { label: 'Paid', value: stats.paid },
          { label: 'Delivered', value: stats.delivered },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-lg border border-brand-border bg-brand-surface p-4"
          >
            <p className="text-sm font-medium text-brand-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-brand-border bg-brand-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-bg-alt border-b border-brand-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Order #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Items
                </th>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Payment
                </th>
                <th className="px-4 py-3 text-left font-semibold text-brand-muted">
                  Date
                </th>
                <th className="px-4 py-3 text-center font-semibold text-brand-muted">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-brand-muted"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                allOrders.map(order => {
                  const customer = customerDisplay(order, order.customer_id ? profileById.get(order.customer_id) : undefined);

                  return (
                  <tr
                    key={order.id}
                    className="border-b border-brand-border hover:bg-brand-bg transition"
                  >
                    <td className="px-4 py-3 font-medium text-brand-primary">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-brand-text">
                          {customer.name}
                        </p>
                        <p className="text-xs text-brand-muted">
                          {customer.email || customer.phone || 'No contact saved'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-text">
                      {Array.isArray(order.items) ? order.items.length : 0} item(s)
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-text">
                      ₹{(order.total ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          PAYMENT_STATUS_COLORS[order.payment_status] || 'text-gray-600'
                        }`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-border px-2 py-1 text-xs font-semibold text-brand-primary transition hover:border-brand-primary hover:bg-brand-gold-light"
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
      </div>
      <OrdersPagination page={page} totalPages={totalPages} total={total} searchParams={params} />
    </div>
  );
}
