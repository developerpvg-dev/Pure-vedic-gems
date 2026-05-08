'use client';

import { useState, useCallback } from 'react';
import { Loader2, Save, ChevronRight, MessageCircle } from 'lucide-react';

const VALID_STATUSES = [
  'pending_payment', 'placed', 'confirmed', 'processing',
  'jewelry_making', 'certification', 'energization',
  'quality_check', 'shipped', 'delivered', 'cancelled', 'refunded',
  'payment_review',
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending Payment',
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  jewelry_making: 'Jewelry Making',
  certification: 'Certification',
  energization: 'Energization',
  quality_check: 'Quality Check',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  payment_review: 'Payment Review',
};

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
  currentNotes: string | null;
  currentTracking: string | null;
  currentTrackingUrl: string | null;
  currentEstDelivery: string | null;
  currentCarrier?: string | null;
  currentShippedAt?: string | null;
  currentDeliveryStatus?: string | null;
  customerPhone: string | null;
  customerName: string | null;
  orderNumber: string;
}

export function OrderActions({
  orderId,
  currentStatus,
  currentNotes,
  currentTracking,
  currentTrackingUrl,
  currentEstDelivery,
  currentCarrier,
  currentShippedAt,
  currentDeliveryStatus,
  customerPhone,
  customerName,
  orderNumber,
}: OrderActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [tracking, setTracking] = useState(currentTracking ?? '');
  const [trackingUrl, setTrackingUrl] = useState(currentTrackingUrl ?? '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(currentEstDelivery ?? '');
  const [carrier, setCarrier] = useState(currentCarrier ?? '');
  const [shippedAt, setShippedAt] = useState(currentShippedAt?.slice(0, 10) ?? '');
  const [deliveryStatus, setDeliveryStatus] = useState(currentDeliveryStatus ?? 'pending');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Find next status in pipeline
  const currentIndex = VALID_STATUSES.indexOf(status as typeof VALID_STATUSES[number]);
  const deliveredIndex = VALID_STATUSES.indexOf('delivered');
  const nextStatus = currentIndex >= 0 && currentIndex < deliveredIndex ? VALID_STATUSES[currentIndex + 1] : null;

  const handleSave = useCallback(async (updates: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update');
        return;
      }
      if (updates.status) setStatus(updates.status as string);
      setSuccess('Updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }, [orderId]);

  const advanceStatus = () => {
    if (nextStatus) handleSave({ status: nextStatus });
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${customerName || 'Customer'},\n\nUpdate regarding your PureVedicGems order #${orderNumber}:\nStatus: ${STATUS_LABELS[status] || status}\n${tracking ? `Tracking: ${tracking}` : ''}\n\nThank you for shopping with us!`
  );
  const whatsappUrl = customerPhone
    ? `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  return (
    <div className="space-y-5">
      {/* Status Update */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600">Update Order</h2>
        </div>
        <div className="space-y-4 p-4">
          {/* Quick advance */}
          {nextStatus && status !== 'delivered' && status !== 'cancelled' && status !== 'refunded' && (
            <button
              onClick={advanceStatus}
              disabled={saving}
              className="flex w-full items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
            >
              <span>Advance to: {STATUS_LABELS[nextStatus]}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Manual status select */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            >
              {VALID_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Tracking */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Carrier</label>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Blue Dart, FedEx, DHL..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tracking Number</label>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Enter tracking number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tracking URL</label>
            <input
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://tracking.example.com/..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Delivery Status</label>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            >
              {['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed'].map((value) => (
                <option key={value} value={value}>{value.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Shipped Date</label>
            <input
              type="date"
              value={shippedAt}
              onChange={(e) => setShippedAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Estimated Delivery</label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add internal notes about this order..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={() => handleSave({
              status,
              carrier: carrier || null,
              tracking_number: tracking || null,
              tracking_url: trackingUrl || null,
              delivery_status: deliveryStatus || null,
              shipped_at: shippedAt ? `${shippedAt}T00:00:00.000Z` : null,
              estimated_delivery: estimatedDelivery || null,
              admin_notes: notes || null,
            })}
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={() => handleSave({
              status,
              carrier: carrier || null,
              tracking_number: tracking || null,
              tracking_url: trackingUrl || null,
              delivery_status: deliveryStatus || null,
              shipped_at: shippedAt ? `${shippedAt}T00:00:00.000Z` : null,
              estimated_delivery: estimatedDelivery || null,
              notify_customer: true,
            })}
            disabled={saving || (!tracking && !trackingUrl)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" />
            Send Tracking Update
          </button>

          {success && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 text-center">{success}</p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 text-center">{error}</p>
          )}
        </div>
      </section>

      {/* WhatsApp Notify */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4" />
          Notify Customer via WhatsApp
        </a>
      )}
    </div>
  );
}
