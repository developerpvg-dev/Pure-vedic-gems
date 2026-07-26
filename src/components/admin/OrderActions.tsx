'use client';

import { useMemo, useState, useCallback, type ReactNode } from 'react';
import {
  Loader2, Save, ChevronRight, ChevronDown, MessageCircle,
  PackageCheck, Gem, Ban, Banknote, RotateCcw, Plus, Trash2,
} from 'lucide-react';
import {
  FULFILLMENT_PROFILE_LABELS,
  getAdminStatusLabels,
  getAdminStatusPipeline,
  resolveOrderFulfillmentContext,
  type LineItemForFulfillment,
} from '@/lib/orders/fulfillment-profile';
import {
  RETURN_STATUSES,
  RETURN_STATUS_LABELS,
  areReturnImagesVerified,
  parseComplianceFlags,
  requiresVerifiedReturnImages,
  type ReturnStatus,
} from '@/lib/orders/returns';

const TERMINAL_STATUSES = ['cancelled', 'refunded', 'payment_review'] as const;

const field =
  'w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/5';
const labelCls = 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400';
const btnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50';
const btnGhost =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:opacity-50';

function Accordion({
  title,
  open,
  onToggle,
  children,
  badge,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  badge?: string | null;
}) {
  return (
    <div className="border-t border-stone-100">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left transition hover:bg-stone-50/80"
      >
        <span className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            {title}
          </span>
          {badge ? (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
              {badge}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <div className="space-y-3 px-5 pb-5">{children}</div> : null}
    </div>
  );
}

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
  productsMarkedSoldAt?: string | null;
  orderSource?: string | null;
  orderTotal?: number;
  customerPhone: string | null;
  customerName: string | null;
  orderNumber: string;
  orderItems?: LineItemForFulfillment[];
  includeEnergization?: boolean;
  certificationCharges?: number;
  energizationCharges?: number;
  currentReturnStatus?: string | null;
  cancelReason?: string | null;
  complianceFlags?: unknown;
  currentCommissionSource?: string | null;
  currentCommissionName?: string | null;
  currentCommissionAmount?: number | null;
  currentCommissions?: Array<{
    source: 'salesperson' | 'astrologer';
    name: string;
    amount: number;
  }>;
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
  productsMarkedSoldAt = null,
  orderSource = null,
  orderTotal = 0,
  customerPhone,
  customerName,
  orderNumber,
  orderItems = [],
  includeEnergization = false,
  certificationCharges = 0,
  energizationCharges = 0,
  currentReturnStatus = 'none',
  cancelReason = null,
  complianceFlags = null,
  currentCommissionSource = null,
  currentCommissionName = null,
  currentCommissionAmount = null,
  currentCommissions,
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
  const [markedSoldAt, setMarkedSoldAt] = useState(productsMarkedSoldAt);
  const [returnStatus, setReturnStatus] = useState(currentReturnStatus || 'none');
  const [savedReturnStatus, setSavedReturnStatus] = useState(currentReturnStatus || 'none');
  const [returnNote, setReturnNote] = useState('');
  const [flagsState, setFlagsState] = useState(complianceFlags);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [refundAmount, setRefundAmount] = useState(orderTotal > 0 ? String(orderTotal) : '');
  const [refundTxn, setRefundTxn] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('manual');
  const [refundProofs, setRefundProofs] = useState<FileList | null>(null);
  const [commissions, setCommissions] = useState(
    currentCommissions?.length
      ? currentCommissions.map((entry) => ({ ...entry, amount: String(entry.amount) }))
      : currentCommissionSource
        ? [{
            source: currentCommissionSource as 'salesperson' | 'astrologer',
            name: currentCommissionName ?? '',
            amount: currentCommissionAmount != null ? String(currentCommissionAmount) : '',
          }]
        : [],
  );

  const hasActiveReturn = (currentReturnStatus || 'none') !== 'none';
  const [openFulfill, setOpenFulfill] = useState(true);
  const [openInventory, setOpenInventory] = useState(true);
  const [openReturns, setOpenReturns] = useState(hasActiveReturn);
  const [openRefund, setOpenRefund] = useState(currentStatus === 'cancelled');
  const [openCommission, setOpenCommission] = useState(commissions.length > 0);

  const returnMeta = parseComplianceFlags(flagsState);
  const returnImages = returnMeta.return_image_urls ?? [];
  const imagesVerified = areReturnImagesVerified(returnMeta);
  const needsImageVerify = requiresVerifiedReturnImages(returnMeta, savedReturnStatus);
  const refundBlockedByImages = needsImageVerify && !imagesVerified;

  const fulfillmentContext = useMemo(
    () =>
      resolveOrderFulfillmentContext({
        items: orderItems,
        includeEnergization,
        certificationCharges,
        energizationCharges,
      }),
    [orderItems, includeEnergization, certificationCharges, energizationCharges],
  );

  const statusPipeline = useMemo(
    () => getAdminStatusPipeline(fulfillmentContext),
    [fulfillmentContext],
  );

  const statusLabels = useMemo(
    () => getAdminStatusLabels(fulfillmentContext),
    [fulfillmentContext],
  );

  const selectableStatuses = useMemo(
    () => [...statusPipeline, ...TERMINAL_STATUSES],
    [statusPipeline],
  );

  const currentIndex = statusPipeline.indexOf(status as (typeof statusPipeline)[number]);
  const nextStatus =
    currentIndex >= 0 && currentIndex < statusPipeline.length - 1
      ? statusPipeline[currentIndex + 1]
      : null;

  const craftingCompleteLabel =
    fulfillmentContext.profile === 'rudraksha_configured'
      ? 'Pendant completed'
      : fulfillmentContext.profile === 'configured_jewelry'
        ? 'Jewelry completed'
        : 'Product completed';

  const handleSave = useCallback(
    async (updates: Record<string, unknown>) => {
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
        setSuccess('Saved');
        setTimeout(() => setSuccess(''), 3000);
      } catch {
        setError('Network error');
      } finally {
        setSaving(false);
      }
    },
    [orderId],
  );

  const runOrderAction = useCallback(
    async (body: FormData | Record<string, unknown>) => {
      setSaving(true);
      setError('');
      setSuccess('');
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/actions`, {
          method: 'POST',
          ...(body instanceof FormData
            ? { body }
            : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Action failed');
          return;
        }
        if (data.status) setStatus(data.status);
        if (data.return_status) {
          setReturnStatus(data.return_status);
          setSavedReturnStatus(data.return_status);
        }
        if (data.compliance_flags) setFlagsState(data.compliance_flags);
        if (data.return_images_verified) {
          setFlagsState((current: unknown) => ({
            ...parseComplianceFlags(current),
            return_images_verified: true,
            return_images_verified_at: new Date().toISOString(),
          }));
        }
        if (data.products_marked_sold_at) setMarkedSoldAt(data.products_marked_sold_at);
        setSuccess(
          data.status === 'cancelled'
            ? 'Order cancelled — stock restored'
            : data.status === 'refunded'
              ? 'Refund recorded'
              : data.return_images_verified
                ? 'Customer return photos verified'
              : data.return_status
                ? `Return → ${RETURN_STATUS_LABELS[data.return_status as ReturnStatus] ?? data.return_status}`
                : 'Marked sold',
        );
        setTimeout(() => setSuccess(''), 4000);
      } catch {
        setError('Network error');
      } finally {
        setSaving(false);
      }
    },
    [orderId],
  );

  const advanceStatus = () => {
    if (nextStatus) handleSave({ status: nextStatus });
  };

  const markProductCompleted = () => handleSave({ status: 'design_completed' });

  const markSoldAfterBilling = () => {
    if (!confirm('Mark all items as Sold on the website?')) return;
    void runOrderAction({ action: 'mark_sold' });
  };

  const cancelOrder = () => {
    if (!confirm('Cancel this order and restore items to stock?')) return;
    const reason = prompt('Cancel reason (optional)', 'Cancelled by admin');
    if (reason === null) return;
    void runOrderAction({ action: 'cancel', reason: reason.trim() || 'Cancelled by admin' });
  };

  const recordManualRefund = () => {
    if (refundBlockedByImages) {
      setError('Verify the customer’s return photos before recording a refund');
      return;
    }
    if (!refundTxn.trim()) {
      setError('Transaction / UTR number is required');
      return;
    }
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid refund amount');
      return;
    }
    if (!confirm('Record this manual refund? Items will return to stock.')) return;
    const form = new FormData();
    form.set('action', 'record_refund');
    form.set('amount', String(amount));
    form.set('transaction_reference', refundTxn.trim());
    form.set('notes', refundNotes.trim());
    form.set('method', refundMethod);
    form.set('restore_stock', 'true');
    if (refundProofs) {
      Array.from(refundProofs).forEach((file) => form.append('proofs', file));
    }
    void runOrderAction(form);
  };

  const saveReturnStatus = () => {
    if (returnStatus === 'none') {
      setError('Pick a return status other than none');
      return;
    }
    if (returnStatus === 'approved' && refundBlockedByImages) {
      setError('Verify the customer’s return photos before approving the return/refund');
      return;
    }
    if (
      !confirm(
        `Update return to "${RETURN_STATUS_LABELS[returnStatus as ReturnStatus] ?? returnStatus}"?`,
      )
    ) {
      return;
    }
    void runOrderAction({
      action: 'update_return',
      return_status: returnStatus,
      note: returnNote.trim() || undefined,
    });
  };

  const verifyReturnImages = () => {
    if (!returnImages.length) {
      setError('No customer return photos to verify');
      return;
    }
    if (!confirm('Confirm these customer photos look valid for return/refund?')) return;
    void runOrderAction({ action: 'verify_return_images' });
  };

  const productCompleted =
    !!designCompletedAt ||
    status === 'design_completed' ||
    ['jewelry_making', 'certification', 'energization', 'quality_check', 'shipped', 'out_for_delivery', 'delivered', 'feedback'].includes(
      status,
    );

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
    `Hello ${customerName || 'Customer'},\n\nUpdate regarding your PureVedicGems order #${orderNumber}:\nStatus: ${statusLabels[status] || status}\n${tracking ? `Tracking: ${tracking}` : ''}\n\nThank you for shopping with us!`,
  );
  const whatsappUrl = customerPhone
    ? `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : null;

  const isTerminal = status === 'cancelled' || status === 'refunded';
  const showRefund = !isTerminal || status === 'cancelled';

  const savePayload = {
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
  };

  const commissionPayload = {
    commissions: commissions
      .filter((entry) => entry.name.trim() && entry.amount !== '')
      .map((entry) => ({
        source: entry.source,
        name: entry.name.trim(),
        amount: Number(entry.amount),
      })),
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <div className="border-b border-stone-100 px-5 py-3.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Manage order
        </h2>
        <p className="mt-1 text-xs text-stone-400">
          {FULFILLMENT_PROFILE_LABELS[fulfillmentContext.profile]}
        </p>
      </div>

      {status === 'cancelled' ? (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-900">
          <p className="font-semibold">Cancelled</p>
          {cancelReason ? <p className="mt-0.5 text-xs text-red-800/90">{cancelReason}</p> : null}
        </div>
      ) : null}

      {(success || error) && (
        <div className="border-b border-stone-100 px-5 py-2.5">
          {success ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800">
              {success}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      )}

      {/* Fulfillment — primary */}
      <Accordion title="Fulfillment" open={openFulfill} onToggle={() => setOpenFulfill((v) => !v)}>
        {nextStatus && !isTerminal ? (
          <button
            type="button"
            onClick={advanceStatus}
            disabled={saving}
            className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <span>Advance → {statusLabels[nextStatus] ?? nextStatus}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}

        {fulfillmentContext.needsCrafting ? (
          productCompleted ? (
            <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
              {craftingCompleteLabel}
              {designCompletedAt ? (
                <span className="mt-0.5 block text-xs text-stone-400">
                  {formatCompletedDate(designCompletedAt)}
                </span>
              ) : null}
            </p>
          ) : (
            <button
              type="button"
              onClick={markProductCompleted}
              disabled={saving || isTerminal}
              className={btnGhost}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
              Mark {craftingCompleteLabel.toLowerCase()}
            </button>
          )
        ) : null}

        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
            {selectableStatuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s] ?? s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {(fulfillmentContext.showProductVideo || fulfillmentContext.showPujaVideo) && (
          <div className="space-y-3 rounded-xl border border-stone-100 bg-stone-50/60 p-3">
            {fulfillmentContext.showProductVideo ? (
              <div>
                <label className={labelCls}>Product video URL</label>
                <input
                  value={productVideoUrl}
                  onChange={(e) => setProductVideoUrl(e.target.value)}
                  placeholder="Video link"
                  className={field}
                />
              </div>
            ) : null}
            {fulfillmentContext.showPujaVideo ? (
              <div>
                <label className={labelCls}>Puja video URL</label>
                <input
                  value={pujaVideoUrl}
                  onChange={(e) => setPujaVideoUrl(e.target.value)}
                  placeholder="Puja video link"
                  className={field}
                />
              </div>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <label className={labelCls}>Carrier</label>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Blue Dart, FedEx…"
              className={field}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Tracking number</label>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className={field}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Tracking URL</label>
            <input
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Shipped</label>
            <input
              type="date"
              value={shippedAt}
              onChange={(e) => setShippedAt(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Est. delivery</label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className={field}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Delivery status</label>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className={field}
            >
              {['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed'].map(
                (value) => (
                  <option key={value} value={value}>
                    {value.replace(/_/g, ' ')}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Internal notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={field}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSave(savePayload)}
          disabled={saving}
          className={btnPrimary}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => handleSave({ ...savePayload, notify_customer: true })}
          disabled={saving || (!tracking && !trackingUrl)}
          className={btnGhost}
        >
          <MessageCircle className="h-4 w-4" />
          Save &amp; notify customer
        </button>
      </Accordion>

      <Accordion
        title="Commission"
        open={openCommission}
        onToggle={() => setOpenCommission((v) => !v)}
        badge={commissions.length ? `${commissions.length} recipient${commissions.length === 1 ? '' : 's'}` : null}
      >
        <p className="text-xs text-stone-400">Internal only — not shown to customers.</p>
        {commissions.map((entry, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-stone-100 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                aria-label={`Commission source ${index + 1}`}
                value={entry.source}
                onChange={(e) =>
                  setCommissions((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, source: e.target.value as 'salesperson' | 'astrologer' }
                        : item,
                    ),
                  )
                }
                className={field}
              >
                <option value="salesperson">Salesperson</option>
                <option value="astrologer">Astrologer</option>
              </select>
              <input
                aria-label={`Commission name ${index + 1}`}
                value={entry.name}
                onChange={(e) =>
                  setCommissions((items) =>
                    items.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, name: e.target.value } : item,
                    ),
                  )
                }
                placeholder="Person’s name"
                className={field}
              />
              <div className="flex gap-2">
                <input
                  aria-label={`Commission amount ${index + 1}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={entry.amount}
                  onChange={(e) =>
                    setCommissions((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, amount: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Amount ₹"
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => setCommissions((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={`Remove commission recipient ${index + 1}`}
                  className="rounded-lg border border-stone-200 p-2 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setCommissions((items) => [
              ...items,
              { source: 'salesperson', name: '', amount: '' },
            ])
          }
          className={btnGhost}
        >
          <Plus className="h-4 w-4" /> Add recipient
        </button>
        <button
          type="button"
          onClick={() => handleSave(commissionPayload)}
          disabled={saving}
          className={btnPrimary}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save commission'}
        </button>
      </Accordion>

      <Accordion title="Inventory" open={openInventory} onToggle={() => setOpenInventory((v) => !v)}>
        {markedSoldAt ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            Marked sold {formatCompletedDate(markedSoldAt)} — items show as Sold on the website.
          </p>
        ) : (
          <>
            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
              {orderSource === 'offline'
                ? 'Offline sale: items are Reserved on the website until you mark them sold.'
                : 'Items stay Reserved after payment until you mark them sold (after billing).'}
            </p>
            <button
              type="button"
              onClick={markSoldAfterBilling}
              disabled={saving || isTerminal || status === 'pending_payment'}
              className={btnPrimary}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gem className="h-4 w-4" />}
              Mark items sold
            </button>
          </>
        )}
        {!isTerminal ? (
          <button type="button" onClick={cancelOrder} disabled={saving} className={btnGhost}>
            <Ban className="h-4 w-4 text-red-600" />
            <span className="text-red-700">Cancel &amp; restore stock</span>
          </button>
        ) : null}
      </Accordion>

      <Accordion
        title="Returns"
        open={openReturns}
        onToggle={() => setOpenReturns((v) => !v)}
        badge={hasActiveReturn ? RETURN_STATUS_LABELS[savedReturnStatus as ReturnStatus] : null}
      >
        {returnMeta.return_reason ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <span className="font-semibold">Customer:</span> {returnMeta.return_reason}
          </p>
        ) : null}
        {returnMeta.receipt_confirmed ? (
          <p className="rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
            Receipt:{' '}
            <span className="font-semibold">
              {returnMeta.receipt_ok ? 'Received properly' : 'Not received properly'}
            </span>
          </p>
        ) : null}
        {returnImages.length ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
              Customer return photos
            </p>
            <div className="flex flex-wrap gap-2">
              {returnImages.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative h-20 w-20 overflow-hidden rounded-lg border border-stone-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Customer return evidence" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
            {imagesVerified ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Photos verified
                {returnMeta.return_images_verified_at
                  ? ` · ${formatCompletedDate(returnMeta.return_images_verified_at)}`
                  : ''}
              </p>
            ) : (
              <button type="button" onClick={verifyReturnImages} disabled={saving} className={btnGhost}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
                Verify customer photos
              </button>
            )}
          </div>
        ) : hasActiveReturn ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            No customer photos on this return yet.
          </p>
        ) : null}
        {refundBlockedByImages ? (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
            Refund status stays locked until customer photos are verified.
          </p>
        ) : null}
        <div>
          <label className={labelCls}>Return status</label>
          <select
            value={returnStatus}
            onChange={(e) => setReturnStatus(e.target.value)}
            className={field}
          >
            {RETURN_STATUSES.map((value) => (
              <option key={value} value={value}>
                {RETURN_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Note to customer</label>
          <textarea
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
            rows={2}
            className={field}
          />
        </div>
        <button
          type="button"
          onClick={saveReturnStatus}
          disabled={
            saving ||
            returnStatus === 'none' ||
            returnStatus === savedReturnStatus ||
            (returnStatus === 'approved' && refundBlockedByImages)
          }
          className={btnGhost}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Update return
        </button>
      </Accordion>

      {showRefund ? (
        <Accordion title="Refund" open={openRefund} onToggle={() => setOpenRefund((v) => !v)}>
          <div>
            <label className={labelCls}>Amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>UTR / transaction *</label>
            <input
              value={refundTxn}
              onChange={(e) => setRefundTxn(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className={labelCls}>Method</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className={field}
            >
              <option value="manual">Manual / other</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="razorpay">Razorpay</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Proof files</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => setRefundProofs(e.target.files)}
              className="w-full text-xs text-stone-500"
            />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              rows={2}
              className={field}
            />
          </div>
          <button
            type="button"
            onClick={recordManualRefund}
            disabled={saving || status === 'refunded' || refundBlockedByImages}
            className={btnGhost}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Record refund
          </button>
        </Accordion>
      ) : null}

      {whatsappUrl ? (
        <div className="border-t border-stone-100 p-4">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp customer
          </a>
        </div>
      ) : null}
    </div>
  );
}
