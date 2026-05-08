export const PAYMENT_STATUSES = [
  'pending',
  'authorized',
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
  'jewelry_making',
  'certification',
  'energization',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'payment_review',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAID_PAYMENT_STATUS: PaymentStatus = 'captured';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pending',
  authorized: 'Authorized',
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

export function isPaidPaymentStatus(status: string | null | undefined) {
  return status === PAID_PAYMENT_STATUS;
}
