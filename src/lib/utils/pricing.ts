/**
 * Server-side price recalculation utility.
 * NEVER trust client-sent prices — always recalculate from DB.
 *
 * Handles: gem price + making charges + metal charges + certification fee
 * + energization fee + shipping cost - discount
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { SHIPPING_METHODS } from '@/lib/validators/order';
import type { ShippingMethodId } from '@/lib/validators/order';
import type { Coupon } from '@/lib/types/database';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrderItemForPricing {
  product_id: string;
  quantity: number;
  configuration_id?: string;
}

export interface PricingBreakdown {
  items: Array<{
    product_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
  subtotal: number;
  jewelry_charges: number;
  metal_charges: number;
  certification_charges: number;
  energization_charges: number;
  shipping_cost: number;
  discount: number;
  gst_amount: number;
  total: number;
}

// ─── GST Rate (Gemstones: 3% is standard for precious stones in India) ──────
const GST_RATE = 0.03;

/**
 * Recalculate a complete order total from the database.
 * This is the single source of truth for pricing — called during order creation
 * and payment verification to prevent any client-side price manipulation.
 */
export async function recalculateOrderTotal(
  items: OrderItemForPricing[],
  shippingMethod: ShippingMethodId = 'standard',
  couponCode?: string,
  energizationType?: string
): Promise<PricingBreakdown> {
  const supabase = createAdminClient();

  // ── 1. Fetch current product prices from DB ────────────────────────────
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, price, in_stock')
    .in('id', productIds);

  if (prodError || !products) {
    throw new Error('Failed to fetch product prices');
  }

  // Build a map of product_id → product for O(1) lookups
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Verify all products exist and are in stock
  const pricedItems: PricingBreakdown['items'] = [];
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`);
    }
    if (!product.in_stock) {
      throw new Error(`Product "${product.name}" is currently out of stock`);
    }
    pricedItems.push({
      product_id: item.product_id,
      name: product.name,
      unit_price: product.price,
      quantity: item.quantity,
      line_total: product.price * item.quantity,
    });
  }

  const subtotal = pricedItems.reduce((sum, i) => sum + i.line_total, 0);

  // ── 2. Configuration charges (jewelry making, metal, etc.) ─────────────
  let jewelryCharges = 0;
  let metalCharges = 0;
  let certificationCharges = 0;

  const configIds = items
    .filter((i) => i.configuration_id)
    .map((i) => i.configuration_id!);

  if (configIds.length > 0) {
    const { data: configs } = await supabase
      .from('product_configurations')
      .select('id, making_charge, metal_price, certification_fee')
      .in('id', configIds);

    if (configs) {
      for (const cfg of configs) {
        jewelryCharges += cfg.making_charge ?? 0;
        metalCharges += cfg.metal_price ?? 0;
        certificationCharges += cfg.certification_fee ?? 0;
      }
    }
  }

  // ── 3. Energization charges ────────────────────────────────────────────
  let energizationCharges = 0;
  if (energizationType) {
    const { data: energization } = await supabase
      .from('energization_options')
      .select('price')
      .eq('name', energizationType)
      .single();

    if (energization) {
      energizationCharges = energization.price;
    }
  }

  // ── 4. Shipping cost ──────────────────────────────────────────────────
  const shippingConfig = SHIPPING_METHODS.find((m) => m.id === shippingMethod);
  const shippingCost = shippingConfig?.cost ?? 0;

  // ── 5. Coupon discount ────────────────────────────────────────────────
  let discount = 0;
  if (couponCode) {
    const rawResult = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();
    const coupon = rawResult.data as Coupon | null;

    if (coupon) {
      const now = new Date();
      const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
      const validTo = coupon.valid_until ? new Date(coupon.valid_until) : null;

      const isDateValid =
        (!validFrom || now >= validFrom) && (!validTo || now <= validTo);
      const isUsageValid =
        !coupon.usage_limit || coupon.used_count < coupon.usage_limit;
      const meetsMinimum =
        !coupon.min_order_amount || subtotal >= coupon.min_order_amount;

      if (isDateValid && isUsageValid && meetsMinimum) {
        if (coupon.discount_type === 'percentage') {
          discount = Math.round(subtotal * (coupon.discount_value / 100));
          if (coupon.max_discount) {
            discount = Math.min(discount, coupon.max_discount);
          }
        } else {
          discount = coupon.discount_value;
        }
      }
    }
  }

  // ── 6. GST calculation ────────────────────────────────────────────────
  const taxableAmount =
    subtotal + jewelryCharges + metalCharges + certificationCharges + energizationCharges - discount;
  const gstAmount = Math.round(taxableAmount * GST_RATE);

  // ── 7. Final total ───────────────────────────────────────────────────
  const total = taxableAmount + gstAmount + shippingCost;

  return {
    items: pricedItems,
    subtotal,
    jewelry_charges: jewelryCharges,
    metal_charges: metalCharges,
    certification_charges: certificationCharges,
    energization_charges: energizationCharges,
    shipping_cost: shippingCost,
    discount,
    gst_amount: gstAmount,
    total: Math.max(total, 0), // Safety: total should never be negative
  };
}
