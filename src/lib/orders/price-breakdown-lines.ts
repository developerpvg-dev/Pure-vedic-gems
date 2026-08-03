/**
 * Single source of order charge lines for confirmation, email, account, admin.
 * Amounts come from orders.* columns written by recalculateOrderTotal.
 */

import { gstSummaryLabel, parseOrderTaxBreakdown } from '@/lib/orders/tax-breakdown-display';

export type OrderChargeFields = {
  subtotal: number;
  jewelry_charges?: number | null;
  metal_charges?: number | null;
  certification_charges?: number | null;
  energization_charges?: number | null;
  shipping_cost?: number | null;
  discount?: number | null;
  coupon_discount?: number | null;
  coupon_code?: string | null;
  reward_discount?: number | null;
  reward_points_redeemed?: number | null;
  gst_amount?: number | null;
  tax_breakdown?: unknown;
  total?: number | null;
};

export type OrderPriceLine = {
  key: string;
  label: string;
  amount: number;
  /** +1 add, -1 subtract */
  sign: 1 | -1;
};

function n(value: number | null | undefined) {
  return Number(value ?? 0);
}

/** Build display rows that sum to order.total when applied with signs. */
export function buildOrderPriceLines(order: OrderChargeFields): OrderPriceLine[] {
  const lines: OrderPriceLine[] = [
    { key: 'subtotal', label: 'Gemstone / product subtotal', amount: n(order.subtotal), sign: 1 },
    { key: 'jewelry', label: 'Making / labor / stone add-on', amount: n(order.jewelry_charges), sign: 1 },
    { key: 'metal', label: 'Metal value', amount: n(order.metal_charges), sign: 1 },
    { key: 'cert', label: 'Certification', amount: n(order.certification_charges), sign: 1 },
    { key: 'energization', label: 'Energization / puja', amount: n(order.energization_charges), sign: 1 },
    { key: 'shipping', label: 'Shipping', amount: n(order.shipping_cost), sign: 1 },
  ];

  const couponDiscount = n(order.coupon_discount);
  const rewardDiscount = n(order.reward_discount);
  const combinedDiscount = n(order.discount);
  // Prefer split coupon/reward lines; fall back to combined discount only if splits are empty.
  if (couponDiscount > 0) {
    lines.push({
      key: 'coupon',
      label: order.coupon_code ? `Coupon (${order.coupon_code})` : 'Coupon discount',
      amount: couponDiscount,
      sign: -1,
    });
  }
  if (rewardDiscount > 0) {
    const pts = n(order.reward_points_redeemed);
    lines.push({
      key: 'rewards',
      label: pts > 0 ? `Rewards (${pts.toLocaleString('en-IN')} pts)` : 'Rewards discount',
      amount: rewardDiscount,
      sign: -1,
    });
  }
  if (couponDiscount <= 0 && rewardDiscount <= 0 && combinedDiscount > 0) {
    lines.push({ key: 'discount', label: 'Discount', amount: combinedDiscount, sign: -1 });
  }

  const taxView = parseOrderTaxBreakdown(order.tax_breakdown);
  lines.push({
    key: 'gst',
    label: gstSummaryLabel(taxView),
    amount: n(order.gst_amount),
    sign: 1,
  });

  return lines.filter((line) => line.amount > 0);
}

/** Snapshot piece total (ex-GST) × qty when configured; else gem line_total. */
export function orderItemMerchandiseTotal(item: {
  line_total: number;
  quantity: number;
  configuration_snapshot?: unknown;
}): number {
  const snap = item.configuration_snapshot;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    const pricing = (snap as { pricing?: { total?: number } }).pricing;
    const piece = Number(pricing?.total ?? 0);
    if (piece > 0) return Math.round(piece * Math.max(item.quantity, 1));
  }
  return n(item.line_total);
}
