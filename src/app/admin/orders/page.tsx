import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Eye } from 'lucide-react';

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
  items: any[];
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-orange-600',
  authorized: 'text-blue-600',
  captured: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-purple-600',
};

export const revalidate = 60;

export default async function OrdersPage() {
  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  const allOrders = (orders ?? []) as unknown as Order[];

  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.payment_status === 'pending').length,
    paid: allOrders.filter(o => o.payment_status === 'captured').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Orders</h1>
        <p className="text-[var(--pvg-muted)]">Manage all customer orders</p>
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
            className="rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-surface)] p-4"
          >
            <p className="text-sm font-medium text-[var(--pvg-muted)]">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--pvg-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--pvg-bg-alt)] border-b border-[var(--pvg-border)]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Order #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Items
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Payment
                </th>
                <th className="px-4 py-3 text-left font-semibold text-[var(--pvg-muted)]">
                  Date
                </th>
                <th className="px-4 py-3 text-center font-semibold text-[var(--pvg-muted)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-[var(--pvg-muted)]"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                allOrders.map(order => (
                  <tr
                    key={order.id}
                    className="border-b border-[var(--pvg-border)] hover:bg-[var(--pvg-bg)] transition"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--pvg-primary)]">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--pvg-text)]">
                          {order.guest_name || 'Guest'}
                        </p>
                        <p className="text-xs text-[var(--pvg-muted)]">
                          {order.guest_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--pvg-text)]">
                      {Array.isArray(order.items) ? order.items.length : 0} item(s)
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--pvg-text)]">
                      ₹{(order.total ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          PAYMENT_STATUS_COLORS[order.payment_status] || 'text-gray-600'
                        }`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--pvg-muted)]">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--pvg-border)] px-2 py-1 text-xs font-semibold text-[var(--pvg-primary)] transition hover:border-[var(--pvg-primary)] hover:bg-[var(--pvg-gold-light)]"
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
