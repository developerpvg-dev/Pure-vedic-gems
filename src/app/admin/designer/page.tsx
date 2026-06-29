'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Palette, ChevronRight } from 'lucide-react';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';

type DesignOrder = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  design_routed_at: string | null;
  design_completed_at: string | null;
};

export default function DesignerPortalPage() {
  const [orders, setOrders] = useState<DesignOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/designer/orders');
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (res.ok) setOrders(data.orders ?? []);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Palette className="h-7 w-7 text-indigo-600" />
          Design Assignments
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Orders routed to you for ring, pendant, and jewelry design work.
        </p>
      </div>

      {!orders.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <Palette className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 font-medium text-gray-700">No assignments yet</p>
          <p className="mt-1 text-sm text-gray-500">Orders will appear here when an admin routes them to you.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="p-3">Order</th>
                <th className="p-3">Status</th>
                <th className="p-3">Routed</th>
                <th className="p-3">Total</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/80">
                  <td className="p-3 font-semibold text-gray-900">{order.order_number}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                      {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">
                    {order.design_routed_at
                      ? new Date(order.design_routed_at).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td className="p-3">₹{order.total.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/designer/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Open
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
