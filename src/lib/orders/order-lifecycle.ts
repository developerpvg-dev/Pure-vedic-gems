/**
 * Canonical order lifecycle — admin + customer stay in sync from this map.
 *
 * Payment → Confirmed → Processing → [Cert?] → [Jewelry*] → Product video? →
 * Energization? → Packed → Carrier (Shipped → In transit → OFD → Delivered|Failed) →
 * Feedback / Returns
 *
 * *Jewelry assign is admin-only (design_assigned). Customers see one Crafting step.
 */

export type LifecycleSectionId =
  | 'payment'
  | 'workshop'
  | 'media'
  | 'carrier'
  | 'returns'
  | 'refund'
  | 'inventory'
  | 'commission';

export const LIFECYCLE_SECTIONS: Record<
  LifecycleSectionId,
  { title: string; hint: string; tone: string; border: string; header: string; accent: string }
> = {
  payment: {
    title: '1 · Payment',
    hint: 'Razorpay auto-verifies via webhook. Bank transfer: Stock / Dispatch marks received.',
    tone: 'bg-amber-50/90',
    border: 'border-amber-200',
    header: 'text-amber-950',
    accent: 'bg-amber-100 text-amber-900',
  },
  workshop: {
    title: '2 · Workshop',
    hint: 'Confirm → process → cert (paid only) → jewelry craft → pack for shipping.',
    tone: 'bg-sky-50/80',
    border: 'border-sky-200',
    header: 'text-sky-950',
    accent: 'bg-sky-100 text-sky-900',
  },
  media: {
    title: '3 · Media',
    hint: 'Product videos / images + energization media — visible on customer tracking & review email.',
    tone: 'bg-violet-50/80',
    border: 'border-violet-200',
    header: 'text-violet-950',
    accent: 'bg-violet-100 text-violet-900',
  },
  carrier: {
    title: '4 · Carrier / Dispatch',
    hint: 'Parcel Dispatch: tracking, transit, OFD, delivery proofs or failed delivery.',
    tone: 'bg-teal-50/80',
    border: 'border-teal-200',
    header: 'text-teal-950',
    accent: 'bg-teal-100 text-teal-900',
  },
  returns: {
    title: '5 · Returns',
    hint: 'Requested → verified → pickup initiated → then refunds.',
    tone: 'bg-rose-50/80',
    border: 'border-rose-200',
    header: 'text-rose-950',
    accent: 'bg-rose-100 text-rose-900',
  },
  refund: {
    title: '6 · Refunds',
    hint: 'Record UTR + proofs after return photos are verified when required.',
    tone: 'bg-orange-50/80',
    border: 'border-orange-200',
    header: 'text-orange-950',
    accent: 'bg-orange-100 text-orange-900',
  },
  inventory: {
    title: 'Inventory',
    hint: 'Mark sold after billing; cancel restores stock.',
    tone: 'bg-stone-50',
    border: 'border-stone-200',
    header: 'text-stone-800',
    accent: 'bg-stone-100 text-stone-700',
  },
  commission: {
    title: 'Commission',
    hint: 'Internal only — never shown to customers.',
    tone: 'bg-stone-50',
    border: 'border-stone-200',
    header: 'text-stone-800',
    accent: 'bg-stone-100 text-stone-700',
  },
};

/** Admin statuses hidden from customer timeline (internal workshop gates). */
export const CUSTOMER_HIDDEN_ADMIN_STATUSES = new Set([
  'design_assigned', // Jewelry assign — internal
  'jewelry_making', // absorbed into crafting / pack
]);

export const CARRIER_DELIVERY_STATUSES = [
  'pending',
  'label_created',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned',
] as const;

export type CarrierDeliveryStatus = (typeof CARRIER_DELIVERY_STATUSES)[number];

export const CARRIER_DELIVERY_LABELS: Record<CarrierDeliveryStatus, string> = {
  pending: 'Pending handoff',
  label_created: 'Label created',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  failed: 'Delivery failed',
  returned: 'Returned to origin',
};

/** Statuses that auto-email + in-app notify the customer. */
export const AUTO_NOTIFY_ORDER_STATUSES = new Set([
  'shipped',
  'out_for_delivery',
  'delivered',
]);

export const AUTO_NOTIFY_DELIVERY_STATUSES = new Set([
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed',
]);
