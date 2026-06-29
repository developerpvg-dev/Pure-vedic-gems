'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { DESIGNER_STATUS_OPTIONS } from '@/lib/orders/design-workflow';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';

type DesignOrderDetail = {
  id: string;
  order_number: string;
  status: string;
  items: unknown;
  shipping_address: Record<string, string> | null;
  special_instructions: string | null;
  design_notes: string | null;
  design_routed_at: string | null;
  design_completed_at: string | null;
};

export default function DesignerOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<DesignOrderDetail | null>(null);
  const [status, setStatus] = useState('');
  const [designNotes, setDesignNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/admin/designer/orders/${orderId}`);
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Order not found');
        return;
      }
      const o = data.order as DesignOrderDetail;
      setOrder(o);
      setStatus(o.status);
      setDesignNotes(o.design_notes ?? '');
    })();
  }, [orderId]);

  const save = useCallback(async () => {
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/designer/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, design_notes: designNotes }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Update failed');
      return;
    }
    setOrder(data.order);
    setMessage('Status updated. Customer can see progress on their order timeline.');
  }, [orderId, status, designNotes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        {error || 'Order not found'}
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/designer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to assignments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status}
          {order.design_routed_at ? ` · Routed ${new Date(order.design_routed_at).toLocaleString('en-IN')}` : ''}
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Order items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item, index) => {
            const row = item as Record<string, unknown>;
            return (
              <li key={index} className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="font-semibold text-gray-900">{String(row.name ?? row.product_name ?? 'Item')}</p>
                {row.configuration_snapshot ? (
                  <pre className="mt-1 max-h-40 overflow-auto text-[11px] text-gray-600">
                    {JSON.stringify(row.configuration_snapshot, null, 2)}
                  </pre>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {order.special_instructions ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-900">Customer instructions</h2>
          <p className="mt-2 text-sm text-amber-950">{order.special_instructions}</p>
        </section>
      ) : null}

      <section className="rounded-xl border border-indigo-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-800">Update design status</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {DESIGNER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Design notes (internal)</label>
            <textarea
              value={designNotes}
              onChange={(e) => setDesignNotes(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="CAD notes, revisions, metal confirmation…"
            />
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save status
          </button>
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
