'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, MapPin, Package } from 'lucide-react';
import { OrderJourneyTimeline } from '@/components/account/OrderJourneyTimeline';
import { ReorderButton } from '@/components/account/ReorderButton';
import {
  getItemImageUrl,
  getItemLineTotal,
  type OrderLineItem,
} from '@/lib/customer/orders';
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/constants/order-status';
import { formatPrice } from '@/lib/utils/format';

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
};

function OrderItemRow({ item, showConfig = false }: { item: OrderLineItem; showConfig?: boolean }) {
  const imageUrl = getItemImageUrl(item);
  const lineTotal = getItemLineTotal(item);

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#ede6d5] bg-[#faf8f4]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name ?? 'Product'}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#b8a99a]">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--pvg-text)]">{item.name ?? 'Product'}</p>
        <p className="mt-0.5 text-xs text-[var(--pvg-muted)]">
          {item.quantity && item.quantity > 1 ? `Qty ${item.quantity} · ` : ''}
          {item.carat_weight ? `${item.carat_weight} ct · ` : ''}
          {item.origin ?? ''}
          {item.sku ? (item.carat_weight || item.origin ? ` · SKU ${item.sku}` : `SKU ${item.sku}`) : ''}
        </p>
        {showConfig && item.configuration_summary ? (
          <p className="mt-1 text-xs text-[#6b5b4e]">{item.configuration_summary}</p>
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

export function AccountOrderCard({ order }: { order: AccountOrderCardData }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const statusInfo = STATUS_BADGE[order.status] ?? {
    label: ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status.replace(/_/g, ' '),
    bg: '#faf8f4',
    text: '#6b5b4e',
  };
  const showJourney = order.status !== 'cancelled' && order.status !== 'refunded';
  const paymentLabel =
    PAYMENT_STATUS_LABELS[order.payment_status as PaymentStatus] ??
    order.payment_status?.replace(/_/g, ' ') ??
    '—';
  const fulfillmentLabel =
    ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status.replace(/_/g, ' ');
  const address = order.shipping_address;

  return (
    <div className="pvg-account-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ede6d5] bg-[#faf8f4] px-5 py-4 md:px-6">
        <div>
          <p className="pvg-account-card-title text-lg">{order.order_number}</p>
          <p className="pvg-account-row-meta">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: statusInfo.bg, color: statusInfo.text }}
          >
            {statusInfo.label}
          </span>
          <span className="text-xl font-bold" style={{ color: 'var(--pvg-primary)' }}>
            ₹{order.total.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {showJourney ? (
        <OrderJourneyTimeline
          status={order.status}
          payment_status={order.payment_status}
          assigned_designer_id={order.assigned_designer_id}
          design_completed_at={order.design_completed_at}
          product_video_url={order.product_video_url}
          puja_video_url={order.puja_video_url}
          tracking_number={order.tracking_number}
          tracking_url={order.tracking_url}
          carrier={order.carrier}
          estimated_delivery={order.estimated_delivery}
        />
      ) : null}

      {order.items.length > 0 ? (
        <div className="divide-y border-t border-[#ede6d5] px-6" style={{ borderColor: 'var(--pvg-border)' }}>
          {order.items.slice(0, detailsOpen ? order.items.length : 2).map((item, index) => (
            <OrderItemRow key={`${item.product_id ?? item.name}-${index}`} item={item} />
          ))}
          {!detailsOpen && order.items.length > 2 ? (
            <p className="py-2 text-xs text-[var(--pvg-muted)]">
              +{order.items.length - 2} more item(s) — open details to view all
            </p>
          ) : null}
        </div>
      ) : null}

      {detailsOpen ? (
        <div className="border-t border-[#ede6d5] bg-[#fdfcf9] px-6 py-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
                Order items
              </h3>
              <div className="mt-2 divide-y border-[#ede6d5]">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
                  Status
                </h3>
                <dl className="mt-2 space-y-2 text-sm">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
                  Price breakdown
                </h3>
                <div className="mt-2 space-y-1.5 rounded-lg border border-[#ede6d5] bg-white p-4">
                  <PriceRow label="Subtotal" amount={order.subtotal} />
                  <PriceRow label="Jewelry charges" amount={order.jewelry_charges} />
                  <PriceRow label="Metal charges" amount={order.metal_charges} />
                  <PriceRow label="Certification" amount={order.certification_charges} />
                  <PriceRow label="Energization / Puja" amount={order.energization_charges} />
                  {order.shipping_cost === 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pvg-muted)]">Shipping</span>
                      <span className="font-medium text-green-700">FREE</span>
                    </div>
                  ) : (
                    <PriceRow label="Shipping" amount={order.shipping_cost} />
                  )}
                  <PriceRow label="Discount" amount={order.discount} />
                  {order.coupon_code ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pvg-muted)]">Coupon ({order.coupon_code})</span>
                      <span className="text-green-700">−{formatPrice(order.coupon_discount)}</span>
                    </div>
                  ) : null}
                  {order.reward_discount > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--pvg-muted)]">
                        Rewards ({order.reward_points_redeemed} pts)
                      </span>
                      <span className="text-green-700">−{formatPrice(order.reward_discount)}</span>
                    </div>
                  ) : null}
                  <PriceRow label="GST (3%)" amount={order.gst_amount} />
                  <div className="border-t border-[#ede6d5] pt-2">
                    <PriceRow label="Total paid" amount={order.total} highlight />
                  </div>
                </div>
              </div>

              {address?.line1 ? (
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
                    Energization
                  </h3>
                  <p className="mt-1 text-sm text-[var(--pvg-text)]">
                    {order.energization_type.replace(/_/g, ' ')}
                  </p>
                </div>
              ) : null}

              {order.special_instructions ? (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--pvg-muted)]">
                    Special instructions
                  </h3>
                  <p className="mt-1 text-sm text-[var(--pvg-text)]">{order.special_instructions}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="flex flex-wrap items-center justify-end gap-2 border-t px-6 py-3"
        style={{ borderColor: 'var(--pvg-border)' }}
      >
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pvg-border)] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
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
        <ReorderButton orderId={order.id} />
      </div>
    </div>
  );
}
