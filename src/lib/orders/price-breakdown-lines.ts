/**
 * Single source of order charge lines for confirmation, email, account, admin.
 * Amounts come from orders.* columns written by recalculateOrderTotal.
 *
 * Customer-facing: jewellery weight-tax is baked into the Jewellery (or product)
 * amount. Never emit a "GST" line or label.
 */

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

/** Build display rows that sum to order.total when applied with signs. Never includes a GST row. */
export function buildOrderPriceLines(order: OrderChargeFields): OrderPriceLine[] {
  const metalEx = n(order.metal_charges);
  const jewelryEx = n(order.jewelry_charges);
  const jewelleryEx = metalEx + jewelryEx;
  const gst = n(order.gst_amount);

  // Always fold gst_amount into jewellery or product subtotal — never show a tax line.
  let jewelleryAmt = jewelleryEx;
  let subtotalAmt = n(order.subtotal);
  if (gst > 0) {
    if (jewelleryEx > 0) jewelleryAmt = jewelleryEx + gst;
    else subtotalAmt += gst;
  }

  const lines: OrderPriceLine[] = [
    { key: 'subtotal', label: 'Gemstone / product subtotal', amount: subtotalAmt, sign: 1 },
    {
      key: 'jewelry',
      label: 'Jewellery',
      amount: jewelleryAmt,
      sign: 1,
    },
    { key: 'cert', label: 'Certification', amount: n(order.certification_charges), sign: 1 },
    { key: 'energization', label: 'Energization / puja', amount: n(order.energization_charges), sign: 1 },
    { key: 'shipping', label: 'Shipping', amount: n(order.shipping_cost), sign: 1 },
  ];

  const couponDiscount = n(order.coupon_discount);
  const rewardDiscount = n(order.reward_discount);
  const combinedDiscount = n(order.discount);
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

  return lines.filter((line) => line.amount > 0);
}

/** Snapshot piece total (ex-tax components) × qty when configured; else gem line_total. */
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
