'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Palette, UserPlus } from 'lucide-react';

type Designer = { id: string; name: string };

interface OrderAssignDesignerProps {
  orderId: string;
  currentDesignerId: string | null;
  currentDesignerName?: string | null;
  orderStatus: string;
  needsDesigner?: boolean;
}

export function OrderAssignDesigner({
  orderId,
  currentDesignerId,
  currentDesignerName,
  orderStatus,
  needsDesigner = true,
}: OrderAssignDesignerProps) {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [selectedId, setSelectedId] = useState(currentDesignerId ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canRoute = ['processing', 'confirmed', 'placed', 'design_assigned', 'design_in_progress'].includes(orderStatus);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/designers');
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (res.ok) setDesigners(data.designers ?? []);
    })();
  }, []);

  const assign = useCallback(async () => {
    if (!selectedId) {
      setError('Select a designer');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/admin/orders/${orderId}/assign-designer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designer_id: selectedId }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to assign designer');
      return;
    }
    setMessage('Order routed to designer. They will receive an email with order details.');
  }, [orderId, selectedId]);

  if (!needsDesigner) {
    return (
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-600">
            <Palette className="h-4 w-4" />
            Design routing
          </h2>
        </div>
        <p className="p-4 text-xs text-gray-500">
          Designer routing is not required for this order type. Use status updates for preparation, certification, and shipping.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-indigo-200 bg-white">
      <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-800">
          <Palette className="h-4 w-4" />
          Jewelry Design Routing
        </h2>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-xs text-gray-500">
          After processing, route this order to a designer for ring, pendant, or custom jewelry design — before product video.
        </p>

        {currentDesignerId ? (
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
            Assigned to <strong>{currentDesignerName || 'designer'}</strong>
          </p>
        ) : null}

        {loading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-600" />
        ) : designers.length === 0 ? (
          <p className="text-sm text-amber-800">
            No designers on the team yet. Invite one from Settings → Team.
          </p>
        ) : (
          <>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!canRoute || saving}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:bg-gray-50"
            >
              <option value="">Select designer…</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void assign()}
              disabled={!canRoute || saving || !selectedId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {currentDesignerId ? 'Re-route to designer' : 'Route to designer'}
            </button>
          </>
        )}

        {!canRoute ? (
          <p className="text-xs text-gray-400">Routing is available once the order is in processing.</p>
        ) : null}

        {message ? <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p> : null}
        {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
