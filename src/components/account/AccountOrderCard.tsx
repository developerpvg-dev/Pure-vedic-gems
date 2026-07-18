'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MapPin, MessageCircle, Package, Phone, Star, Store } from 'lucide-react';
import { OrderJourneyTimeline } from '@/components/account/OrderJourneyTimeline';
import {
  getItemImageUrl,
  getItemLineTotal,
  isReviewEligibleStatus,
  type OrderLineItem,
} from '@/lib/customer/orders';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/constants/order-status';
import { formatPrice } from '@/lib/utils/format';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';
import { RETURN_STATUS_LABELS, type ReturnStatus } from '@/lib/orders/returns';
import { buildOrderPriceLines } from '@/lib/orders/price-breakdown-lines';

type ShippingAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

export type AccountOrderCardData = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  created_at: string;
  total: number;
  subtotal: number;
  jewelry_charges: number;
  metal_charges: number;
  certification_charges: number;
  energization_charges: number;
  shipping_cost: number;
  discount: number;
  coupon_code: string | null;
  coupon_discount: number;
  reward_discount: number;
  reward_points_redeemed: number;
  gst_amount: number;
  shipping_method: string | null;
  shipping_address: ShippingAddress | null;
  special_instructions: string | null;
  include_energization: boolean;
  energization_type: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  product_video_url: string | null;
  puja_video_url: string | null;
  assigned_designer_id?: string | null;
  design_completed_at?: string | null;
  items: OrderLineItem[];
  return_status?: string;
  return_eligible?: boolean;
  return_message?: string;
  return_reason?: string | null;
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  pending_payment: { label: 'Pending Payment', bg: '#fef9c3', text: '#854d0e' },
  confirmed: { label: 'Confirmed', bg: '#dcfce7', text: '#166534' },
  processing: { label: 'Processing', bg: '#dbeafe', text: '#1e40af' },
  design_assigned: { label: 'Design Assigned', bg: '#e0e7ff', text: '#3730a3' },
  design_in_progress: { label: 'Design In Progress', bg: '#e0e7ff', text: '#3730a3' },
  design_completed: { label: 'Product Completed', bg: '#e0e7ff', text: '#3730a3' },
  jewelry_making: { label: 'Jewelry Making', bg: '#dbeafe', text: '#1e40af' },
  certification: { label: 'Certification', bg: '#dbeafe', text: '#1e40af' },
  energization: { label: 'Energization', bg: '#dbeafe', text: '#1e40af' },
  quality_check: { label: 'Quality Check', bg: '#dbeafe', text: '#1e40af' },
  shipped: { label: 'Shipped', bg: '#ede9fe', text: '#5b21b6' },
  delivered: { label: 'Delivered', bg: '#dcfce7', text: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b' },
  refunded: { label: 'Refunded', bg: '#f3f4f6', text: '#374151' },
  placed: { label: 'Placed', bg: '#dbeafe', text: '#1e40af' },
};

function OrderItemRow({ item, showConfig = false }: { item: OrderLineItem; showConfig?: boolean }) {
  const imageUrl = getItemImageUrl(item);
  const lineTotal = getItemLineTotal(item);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--pvg-border)] bg-brand-bg-alt">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name ?? 'Product'}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--pvg-muted)]">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--pvg-text)]">{item.name ?? 'Product'}</p>
        <p className="mt-0.5 text-xs text-[var(--pvg-muted)]">
          {item.carat_weight ? `${item.carat_weight} ct` : ''}
          {item.origin ? `${item.carat_weight ? ' · ' : ''}${item.origin}` : ''}
          {item.sku ? `${item.carat_weight || item.origin ? ' · ' : ''}SKU ${item.sku}` : ''}
        </p>
        {showConfig && Boolean(item.configuration_summary || item.configuration_snapshot) ? (
          <div className="mt-1">
            <ConfigurationDetailsDisplay
              snapshot={item.configuration_snapshot}
              summary={item.configuration_summary}
              deliveryEtaLabel={item.delivery_eta_label}
              variant="compact"
            />
          </div>
        ) : null}
      </div>
      <p className="shrink-0 text-sm font-semibold text-[var(--pvg-primary)]">
        {formatPrice(lineTotal)}
      </p>
    </div>
  );
}

function PriceRow({ label, amount, highlight }: { label: string; amount: number; highlight?: boolean }) {
  if (!amount) return null;
  return (
    <div className={`flex justify-between text-sm ${highlight ? 'font-semibold' : ''}`}>
      <span className="text-[var(--pvg-muted)]">{label}</span>
      <span className={highlight ? 'text-[var(--pvg-accent)] text-base' : 'text-[var(--pvg-text)]'}>
        {formatPrice(amount)}
      </span>
    </div>
  );
}

const CUSTOMER_CANCELLABLE = new Set(['pending_payment', 'placed', 'confirmed']);

export function AccountOrderCard({
  order,
  defaultDetailsOpen = false,
  allowCancel = true,
}: {
  order: AccountOrderCardData;
  defaultDetailsOpen?: boolean;
  allowCancel?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(defaultDetailsOpen);
  const [status, setStatus] = useState(order.status);
  const [returnStatus, setReturnStatus] = useState(order.return_status || 'none');
  const [submittedReturnReason, setSubmittedReturnReason] = useState(order.return_reason ?? '');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState('');
  const statusInfo = STATUS_BADGE[status] ?? {
    label: ORDER_STATUS_LABELS[status as OrderStatus] ?? status.replace(/_/g, ' '),
    bg: '#faf8f4',
    text: '#6b5b4e',
  };
  const showJourney = status !== 'cancelled' && status !== 'refunded';
  const canCancel = allowCancel && CUSTOMER_CANCELLABLE.has(status);
  const canReturn = Boolean(order.return_eligible) && returnStatus === 'none';
  const canReview = isReviewEligibleStatus(status);
  const returnLabel =
    RETURN_STATUS_LABELS[returnStatus as ReturnStatus] ?? returnStatus.replace(/_/g, ' ');
  const paymentLabel =
    PAYMENT_STATUS_LABELS[order.payment_status as PaymentStatus] ??
    order.payment_status?.replace(/_/g, ' ') ??
    '—';
  const fulfillmentLabel =
    ORDER_STATUS_LABELS[status as OrderStatus] ?? status.replace(/_/g, ' ');
  const address = order.shipping_address;
  const expertWhatsApp = `https://wa.me/919871582404?text=${encodeURIComponent(
    `Hi, I need help with my order ${order.order_number} before cancelling.`,
  )}`;
  const expertCall = 'tel:+919310172512';

  async function handleConfirmCancel() {
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(data.error || 'Could not cancel order');
        return;
      }
      setStatus('cancelled');
      setCancelConfirmOpen(false);
      setDetailsOpen(false);
    } catch {
      setCancelError('Network error — please try again');
    } finally {
      setCancelling(false);
    }
  }

  async function handleRequestReturn() {
    if (!returnReason.trim()) {
      setReturnError('Please share a reason for the return');
      return;
    }
    setReturning(true);
    setReturnError('');
    try {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: returnReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReturnError(data.error || 'Could not submit return request');
        return;
      }
      setReturnStatus(data.return_status || 'requested');
      setSubmittedReturnReason(returnReason.trim());
      setReturnOpen(false);
    } catch {
      setReturnError('Network error — please try again');
    } finally {
      setReturning(false);
    }
  }

  return (
    <div className="pvg-account-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--pvg-border)] bg-brand-bg-alt/80 px-5 py-4 md:px-6">
        <div className="min-w-0">
          <p className="pvg-account-card-title text-lg tracking-tight">{order.order_number}</p>
          <p className="pvg-account-row-meta mt-0.5">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: statusInfo.bg, color: statusInfo.text }}
          >
            {statusInfo.label}
          </span>
          {returnStatus !== 'none' ? (
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
              style={{ background: '#ffedd5', color: '#9a3412' }}
            >
              {returnLabel}
            </span>
          ) : null}
          <span className="text-xl font-bold text-[var(--pvg-primary)]">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      {status === 'cancelled' ? (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-900 md:px-6">
          This order was cancelled. If a payment was made, our team will process the refund.
        </div>
      ) : null}

      {showJourney ? (
        <OrderJourneyTimeline
          status={status}
          payment_status={order.payment_status}
          assigned_designer_id={order.assigned_designer_id}
          design_completed_at={order.design_completed_at}
          product_video_url={order.product_video_url}
          puja_video_url={order.puja_video_url}
          tracking_number={order.tracking_number}
          tracking_url={order.tracking_url}
          carrier={order.carrier}
          estimated_delivery={order.estimated_delivery}
          items={order.items}
          include_energization={order.include_energization}
          energization_charges={order.energization_charges}
          certification_charges={order.certification_charges}
        />
      ) : null}

      {order.items.length > 0 ? (
        <div className="divide-y divide-[var(--pvg-border)] border-t border-[var(--pvg-border)] px-5 md:px-6">
          {order.items.slice(0, detailsOpen ? order.items.length : 2).map((item, index) => (
            <OrderItemRow key={`${item.product_id ?? item.name}-${index}`} item={item} />
          ))}
          {!detailsOpen && order.items.length > 2 ? (
            <p className="py-2 text-xs text-[var(--pvg-muted)]">
              +{order.items.length - 2} more piece{order.items.length - 2 === 1 ? '' : 's'} — open details to view all
            </p>
          ) : null}
        </div>
      ) : null}

      {detailsOpen ? (
        <div className="border-t border-[var(--pvg-border)] bg-brand-bg-alt/40 px-5 py-5 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
                Order pieces
              </h3>
              <div className="mt-2 divide-y divide-[var(--pvg-border)] rounded-xl border border-[var(--pvg-border)] bg-brand-surface px-3">
                {order.items.map((item, index) => (
                  <OrderItemRow
                    key={`detail-${item.product_id ?? item.name}-${index}`}
                    item={item}
                    showConfig
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
                  Status
                </h3>
                <dl className="mt-2 space-y-2 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--pvg-muted)]">Fulfillment</dt>
                    <dd className="font-semibold text-[var(--pvg-primary)]">{fulfillmentLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--pvg-muted)]">Payment</dt>
                    <dd className="font-semibold text-[var(--pvg-text)]">{paymentLabel}</dd>
                  </div>
                  {order.shipping_method ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--pvg-muted)]">Shipping method</dt>
                      <dd className="text-right font-medium text-[var(--pvg-text)]">
                        {order.shipping_method.replace(/_/g, ' ')}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
                  Price breakdown
                </h3>
                <div className="mt-2 space-y-1.5 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-4">
                  {buildOrderPriceLines(order).map((line) => (
                    <div key={line.key} className="flex justify-between text-sm">
                      <span className="text-[var(--pvg-muted)]">{line.label}</span>
                      <span
                        className={
                          line.sign < 0
                            ? 'text-green-700'
                            : line.key === 'gst'
                              ? 'font-medium text-[var(--pvg-text)]'
                              : 'text-[var(--pvg-text)]'
                        }
                      >
                        {line.sign < 0 ? '−' : ''}
                        {formatPrice(line.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[var(--pvg-border)] pt-2">
                    <PriceRow label="Total paid" amount={order.total} highlight />
                  </div>
                </div>
              </div>

              {address?.line1 ? (
                <div>
                  <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    Shipping address
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--pvg-text)]">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ''}
                    <br />
                    {address.city}, {address.state} {address.pincode}
                    <br />
                    {address.country}
                  </p>
                </div>
              ) : null}

              {order.include_energization && order.energization_type ? (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
                    Energization
                  </h3>
                  <p className="mt-1 text-sm text-[var(--pvg-text)]">
                    {order.energization_type.replace(/_/g, ' ')}
                  </p>
                </div>
              ) : null}

              {order.special_instructions ? (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-muted)]">
                    Special instructions
                  </h3>
                  <p className="mt-1 text-sm text-[var(--pvg-text)]">{order.special_instructions}</p>
                </div>
              ) : null}

              {canCancel ? (
                <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-4">
                  {!cancelConfirmOpen ? (
                    <>
                      <p className="text-sm font-semibold text-[var(--pvg-primary)]">Need to cancel?</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                        You can talk to our experts first — they are happy to help before you cancel.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelError('');
                          setCancelConfirmOpen(true);
                        }}
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Cancel this order
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[var(--pvg-primary)]">
                        Confirm cancellation?
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                        Before you cancel, speak with an expert — they can guide you on your order{' '}
                        <span className="font-medium text-[var(--pvg-text)]">{order.order_number}</span>.
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <a
                          href={expertWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-white transition hover:opacity-90"
                          style={{ background: '#25D366' }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          WhatsApp
                        </a>
                        <a
                          href={expertCall}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--pvg-border)] bg-brand-bg-alt px-3 py-2.5 text-xs font-semibold text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)]"
                        >
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          Call expert
                        </a>
                      </div>
                      {cancelError ? (
                        <p className="mt-2 text-xs text-red-700">{cancelError}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void handleConfirmCancel()}
                          disabled={cancelling}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-50 sm:flex-none"
                        >
                          {cancelling ? 'Cancelling…' : 'Yes, confirm cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelConfirmOpen(false);
                            setCancelError('');
                          }}
                          disabled={cancelling}
                          className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--pvg-border)] px-4 py-2.5 text-xs font-semibold text-[var(--pvg-primary)] transition hover:bg-brand-bg-alt disabled:opacity-50 sm:flex-none"
                        >
                          Keep my order
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {status === 'delivered' || returnStatus !== 'none' ? (
                <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-4">
                  <p className="text-sm font-semibold text-[var(--pvg-primary)]">Returns</p>
                  {returnStatus !== 'none' ? (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                      Status: <span className="font-semibold text-[var(--pvg-text)]">{returnLabel}</span>
                      {submittedReturnReason ? (
                        <span className="mt-1 block">Your reason: {submittedReturnReason}</span>
                      ) : null}
                    </p>
                  ) : canReturn ? (
                    !returnOpen ? (
                      <>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                          {order.return_message ?? 'You can request a return for this order.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setReturnError('');
                            setReturnOpen(true);
                          }}
                          className="mt-3 inline-flex items-center justify-center rounded-lg border border-amber-200 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
                        >
                          Request a return
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                          Tell us why you want to return this order.
                        </p>
                        <textarea
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          rows={3}
                          className="mt-2 w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg-alt px-3 py-2 text-sm outline-none focus:border-[var(--pvg-accent)]"
                          placeholder="Reason for return"
                        />
                        {returnError ? (
                          <p className="mt-2 text-xs text-red-700">{returnError}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleRequestReturn()}
                            disabled={returning}
                            className="inline-flex items-center justify-center rounded-lg bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
                          >
                            {returning ? 'Submitting…' : 'Submit return request'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReturnOpen(false);
                              setReturnError('');
                            }}
                            disabled={returning}
                            className="inline-flex items-center justify-center rounded-lg border border-[var(--pvg-border)] px-4 py-2.5 text-xs font-semibold text-[var(--pvg-primary)] transition hover:bg-brand-bg-alt disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                      {order.return_message ?? 'This order is no longer eligible for return.'}
                    </p>
                  )}
                </div>
              ) : null}

              {canReview ? (
                <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-4">
                  <p className="text-sm font-semibold text-[var(--pvg-primary)]">Write a review</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--pvg-muted)]">
                    Share your experience with the pieces from this order.
                  </p>
                  <Link
                    href="/account/reviews"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[var(--pvg-border)] px-4 py-2 text-xs font-semibold text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)]"
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden="true" />
                    Review products
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[var(--pvg-border)] bg-brand-surface px-5 py-3.5 md:px-6">
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pvg-border)] bg-brand-surface px-4 py-2.5 text-xs font-semibold tracking-wide text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
        >
          {detailsOpen ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              View details
            </>
          )}
        </button>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide text-white transition hover:opacity-90"
          style={{ background: 'var(--pvg-primary)' }}
        >
          <Store className="h-3.5 w-3.5" aria-hidden="true" />
          Shop more
        </Link>
      </div>
    </div>
  );
}
