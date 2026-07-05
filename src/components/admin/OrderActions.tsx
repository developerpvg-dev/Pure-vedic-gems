'use client';

import { useMemo, useState, useCallback } from 'react';
import { Loader2, Save, ChevronRight, MessageCircle, PackageCheck } from 'lucide-react';
import {
  FULFILLMENT_PROFILE_LABELS,
  getAdminStatusLabels,
  getAdminStatusPipeline,
  resolveOrderFulfillmentContext,
  type LineItemForFulfillment,
} from '@/lib/orders/fulfillment-profile';

const TERMINAL_STATUSES = ['cancelled', 'refunded', 'payment_review'] as const;

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
  currentProductVideoUrl?: string | null;
  currentPujaVideoUrl?: string | null;
  currentDesignCompletedAt?: string | null;
  customerPhone: string | null;
  customerName: string | null;
  orderNumber: string;
  orderItems?: LineItemForFulfillment[];
  includeEnergization?: boolean;
  certificationCharges?: number;
  energizationCharges?: number;
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
  currentProductVideoUrl,
  currentPujaVideoUrl,
  currentDesignCompletedAt,
  customerPhone,
  customerName,
  orderNumber,
  orderItems = [],
  includeEnergization = false,
  certificationCharges = 0,
  energizationCharges = 0,
}: OrderActionsProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [tracking, setTracking] = useState(currentTracking ?? '');
  const [trackingUrl, setTrackingUrl] = useState(currentTrackingUrl ?? '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(currentEstDelivery ?? '');
  const [carrier, setCarrier] = useState(currentCarrier ?? '');
  const [shippedAt, setShippedAt] = useState(currentShippedAt?.slice(0, 10) ?? '');
  const [deliveryStatus, setDeliveryStatus] = useState(currentDeliveryStatus ?? 'pending');
  const [productVideoUrl, setProductVideoUrl] = useState(currentProductVideoUrl ?? '');
  const [pujaVideoUrl, setPujaVideoUrl] = useState(currentPujaVideoUrl ?? '');
  const [designCompletedAt, setDesignCompletedAt] = useState(currentDesignCompletedAt ?? '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fulfillmentContext = useMemo(
    () =>
      resolveOrderFulfillmentContext({
        items: orderItems,
        includeEnergization,
        certificationCharges,
        energizationCharges,
      }),
    [orderItems, includeEnergization, certificationCharges, energizationCharges]
  );

  const statusPipeline = useMemo(
    () => getAdminStatusPipeline(fulfillmentContext),
    [fulfillmentContext]
  );

  const statusLabels = useMemo(
    () => getAdminStatusLabels(fulfillmentContext),
    [fulfillmentContext]
  );

  const selectableStatuses = useMemo(
    () => [...statusPipeline, ...TERMINAL_STATUSES],
    [statusPipeline]
  );

  const currentIndex = statusPipeline.indexOf(status as (typeof statusPipeline)[number]);
  const deliveredIndex = statusPipeline.indexOf('delivered');
  const nextStatus =
    currentIndex >= 0 && currentIndex < deliveredIndex
      ? statusPipeline[currentIndex + 1]
      : null;

  const craftingCompleteLabel =
    fulfillmentContext.profile === 'rudraksha_configured'
      ? 'Pendant completed'
      : fulfillmentContext.profile === 'configured_jewelry'
        ? 'Jewelry completed'
        : 'Product completed';

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
      if (updates.status === 'design_completed') {
        setDesignCompletedAt(new Date().toISOString());
      }
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

  const markProductCompleted = () => {
    handleSave({ status: 'design_completed' });
  };

  const productCompleted =
    !!designCompletedAt ||
    status === 'design_completed' ||
    ['jewelry_making', 'certification', 'energization', 'quality_check', 'shipped', 'delivered'].includes(status);

  const formatCompletedDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${customerName || 'Customer'},\n\nUpdate regarding your PureVedicGems order #${orderNumber}:\nStatus: ${statusLabels[status] || status}\n${tracking ? `Tracking: ${tracking}` : ''}\n\nThank you for shopping with us!`
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
          <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
            Fulfillment: <span className="font-semibold">{FULFILLMENT_PROFILE_LABELS[fulfillmentContext.profile]}</span>
            {fulfillmentContext.mixed ? (
              <span className="mt-0.5 block text-amber-800/90">
                Mixed items — pipeline follows the most complex product type.
              </span>
            ) : null}
          </div>

          {/* Quick advance */}
          {nextStatus && status !== 'delivered' && status !== 'cancelled' && status !== 'refunded' && (
            <button
              onClick={advanceStatus}
              disabled={saving}
              className="flex w-full items-center justify-between rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
            >
              <span>Advance to: {statusLabels[nextStatus] ?? nextStatus}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {fulfillmentContext.needsCrafting ? (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-800">
              <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {craftingCompleteLabel}
            </p>
            {productCompleted ? (
              <p className="text-sm text-indigo-900">
                Marked complete
                {designCompletedAt ? (
                  <span className="mt-0.5 block text-xs font-normal text-indigo-700/90">
                    {formatCompletedDate(designCompletedAt)}
                  </span>
                ) : null}
              </p>
            ) : (
              <button
                type="button"
                onClick={markProductCompleted}
                disabled={saving || status === 'cancelled' || status === 'refunded'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                Mark {craftingCompleteLabel.toLowerCase()}
              </button>
            )}
            <p className="mt-2 text-[11px] text-indigo-700/80">
              Updates the crafting step on the customer tracking timeline.
            </p>
          </div>
          ) : null}

          {/* Manual status select */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            >
              {selectableStatuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s] ?? s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Fulfillment videos */}
          {(fulfillmentContext.showProductVideo || fulfillmentContext.showPujaVideo) && (
          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-violet-800">Customer videos</p>
            <div className="space-y-3">
              {fulfillmentContext.showProductVideo ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Product video URL</label>
                <input
                  value={productVideoUrl}
                  onChange={(e) => setProductVideoUrl(e.target.value)}
                  placeholder="YouTube, Google Drive, or Supabase video link"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">Customer sees a &quot;Watch Product Video&quot; button once saved.</p>
              </div>
              ) : null}
              {fulfillmentContext.showPujaVideo ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Puja / energization video URL</label>
                <input
                  value={pujaVideoUrl}
                  onChange={(e) => setPujaVideoUrl(e.target.value)}
                  placeholder="Link to puja ceremony video"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">Shown after product video, before shipment tracking.</p>
              </div>
              ) : null}
            </div>
          </div>
          )}

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
              product_video_url: productVideoUrl || null,
              puja_video_url: pujaVideoUrl || null,
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
              product_video_url: productVideoUrl || null,
              puja_video_url: pujaVideoUrl || null,
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
