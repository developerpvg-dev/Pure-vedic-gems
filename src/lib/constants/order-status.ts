import { orderHasCustomDesignPricingPending } from '@/lib/utils/configuration-snapshot';

export const PAYMENT_STATUSES = [
  'pending',
  'authorized',
  'partial',
  'captured',
  'failed',
  'refunded',
  'amount_mismatch',
  'cancelled',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  'pending_payment',
  'placed',
  'confirmed',
  'processing',
  'design_assigned',
  'design_in_progress',
  'design_completed',
  'jewelry_making',
  'certification',
  'energization',
  'quality_check',
  'shipped',
  'out_for_delivery',
  'delivered',
  'feedback',
  'cancelled',
  'refunded',
  'payment_review',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAID_PAYMENT_STATUS: PaymentStatus = 'captured';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  authorized: 'Authorized',
  partial: 'Advance Paid',
  captured: 'Captured',
  failed: 'Failed',
  refunded: 'Refunded',
  amount_mismatch: 'Amount Review',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  design_assigned: 'Product Crafting Started',
  design_in_progress: 'Product In Progress',
  design_completed: 'Product Completed',
  jewelry_making: 'Jewelry Making',
  certification: 'Certification',
  energization: 'Energization',
  quality_check: 'Packed for Shipping',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  feedback: 'Feedback',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  payment_review: 'Payment Review',
};

export function isPaidPaymentStatus(status: string | null | undefined) {
  return status === PAID_PAYMENT_STATUS;
}

/** Fully settled for customer/admin UI — false while any custom design price is still TBD. */
export function isOrderFullyPaid(args: {
  payment_status: string | null | undefined;
  amount_due?: number | null;
  items?: Array<{ configuration_snapshot?: unknown }>;
}): boolean {
  if (args.items && orderHasCustomDesignPricingPending(args.items)) return false;
  if (Number(args.amount_due ?? 0) > 0.009) return false;
  return isPaidPaymentStatus(args.payment_status);
}

export function paymentStatusLabelForOrder(args: {
  payment_status: string | null | undefined;
  amount_due?: number | null;
  items?: Array<{ configuration_snapshot?: unknown }>;
}): string {
  if (args.items && orderHasCustomDesignPricingPending(args.items)) {
    return 'Custom design price TBD';
  }
  const status = args.payment_status as PaymentStatus | undefined;
  if (status && PAYMENT_STATUS_LABELS[status]) return PAYMENT_STATUS_LABELS[status];
  return args.payment_status ?? 'Pending';
}

/** Customer self-serve cancel: early statuses only, within 24h of order.created_at. */
export const CUSTOMER_CANCELLABLE_STATUSES = [
  'pending_payment',
  'placed',
  'confirmed',
] as const;

export const CUSTOMER_CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isCustomerCancellable(
  status: string,
  createdAt: string | Date | null | undefined,
  now = Date.now(),
): boolean {
  if (!(CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status)) return false;
  if (createdAt == null) return false;
  const t = typeof createdAt === 'string' ? Date.parse(createdAt) : createdAt.getTime();
  if (!Number.isFinite(t)) return false;
  return now - t <= CUSTOMER_CANCEL_WINDOW_MS;
}

// ponytail: `npx tsx -e "import { __cancelWindowSelfCheck } from './src/lib/constants/order-status.ts'; __cancelWindowSelfCheck()"`
export function __cancelWindowSelfCheck() {
  const now = Date.now();
  const fresh = new Date(now - 60 * 60 * 1000).toISOString();
  const stale = new Date(now - 25 * 60 * 60 * 1000).toISOString();
  console.assert(isCustomerCancellable('placed', fresh, now), 'within 24h');
  console.assert(!isCustomerCancellable('placed', stale, now), 'past 24h');
  console.assert(!isCustomerCancellable('shipped', fresh, now), 'wrong status');
  console.log('cancel-window self-check ok');
}
