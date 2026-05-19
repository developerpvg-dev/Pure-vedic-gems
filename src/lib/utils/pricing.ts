/**
 * Server-side price recalculation utility.
 * NEVER trust client-sent prices — always recalculate from DB.
 *
 * Handles: gem price + making charges + metal charges + certification fee
 * + energization fee + shipping cost - discount
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { SHIPPING_METHODS } from '@/lib/validators/order';
import type { ShippingAddress, ShippingMethodId } from '@/lib/validators/order';
import type { Coupon, ShippingMethod } from '@/lib/types/database';
import { buildTaxBreakdown, calculateGstComponent, resolveProductTax, taxBreakdownToJson } from '@/lib/utils/tax';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OrderItemForPricing {
  product_id: string;
  quantity: number;
  configuration_id?: string;
}

export interface PricingBreakdown {
  items: Array<{
    product_id: string;
    sku: string;
    tag_number: string | null;
    name: string;
    category: string;
    image_url: string;
    carat_weight: number | null;
    origin: string | null;
    sold_individually: boolean;
    hsn_code: string | null;
    gst_rate: number | null;
    tax_status: string | null;
    tax_class: string | null;
    tax_rate_percent: number;
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
  tax_breakdown: ReturnType<typeof taxBreakdownToJson>;
  total: number;
}

const PRODUCT_SELECT = `
  id, sku, tag_number, name, category, price, carat_weight, origin, images,
  thumbnail_url, in_stock, stock_quantity, stock_status, availability_status,
  is_active, sold_individually, backorders_allowed, reserved_until,
  reserved_by_customer_id, tax_status, tax_class, hsn_code, gst_rate
`;

type ProductForPricing = {
  id: string;
  sku: string;
  tag_number: string | null;
  name: string;
  category: string;
  price: number;
  carat_weight: number | null;
  origin: string | null;
  images: unknown;
  thumbnail_url: string | null;
  in_stock: boolean;
  stock_quantity: number;
  stock_status: string;
  availability_status: string;
  is_active: boolean;
  sold_individually: boolean;
  backorders_allowed: boolean;
  reserved_until: string | null;
  reserved_by_customer_id: string | null;
  tax_status: string | null;
  tax_class: string | null;
  hsn_code: string | null;
  gst_rate: number | null;
};

function getProductImage(product: ProductForPricing) {
  if (product.thumbnail_url) return product.thumbnail_url;
  if (Array.isArray(product.images) && typeof product.images[0] === 'string') {
    return product.images[0];
  }
  return '';
}

function isReservationActive(reservedUntil: string | null) {
  if (!reservedUntil) return false;
  const expires = new Date(reservedUntil).getTime();
  return !Number.isNaN(expires) && expires > Date.now();
}

async function getShippingMethod(
  methodId: ShippingMethodId,
  subtotal: number
): Promise<{ id: ShippingMethodId; cost: number; label: string }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('id', methodId)
    .eq('is_active', true)
    .maybeSingle();

  const method = data as ShippingMethod | null;
  if (method) {
    if (method.min_order_amount && subtotal < method.min_order_amount) {
      throw new Error(`${method.label} is not available for this order total.`);
    }
    if (method.max_order_amount && subtotal > method.max_order_amount) {
      throw new Error(`${method.label} is not available for this order total.`);
    }
    return {
      id: method.id as ShippingMethodId,
      label: method.label,
      cost: method.free_above && subtotal >= method.free_above ? 0 : Number(method.cost),
    };
  }

  const fallback = SHIPPING_METHODS.find((m) => m.id === methodId);
  if (!fallback) throw new Error('Invalid shipping method.');
  return fallback;
}

function values<T>(input: T[] | null | undefined) {
  return Array.isArray(input) ? input.filter(Boolean) : [];
}

/**
 * Recalculate a complete order total from the database.
 * This is the single source of truth for pricing — called during order creation
 * and payment verification to prevent any client-side price manipulation.
 */
export async function recalculateOrderTotal(
  items: OrderItemForPricing[],
  shippingMethod: ShippingMethodId = 'standard',
  couponCode?: string,
  energizationType?: string,
  shippingAddress?: Pick<ShippingAddress, 'state'>
): Promise<PricingBreakdown> {
  const supabase = createAdminClient();

  // ── 1. Fetch current product prices from DB ────────────────────────────
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .in('id', productIds);

  if (prodError || !products) {
    throw new Error('Failed to fetch product prices');
  }

  // Build a map of product_id → product for O(1) lookups
  const productMap = new Map((products as ProductForPricing[]).map((p) => [p.id, p]));

  // Verify all products exist and are in stock
  const pricedItems: PricingBreakdown['items'] = [];
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new Error(`Product ${item.product_id} not found`);
    }
    if (!product.is_active) {
      throw new Error(`Product "${product.name}" is no longer available`);
    }
    if (!product.in_stock || product.stock_status === 'out_of_stock') {
      throw new Error(`Product "${product.name}" is currently out of stock`);
    }
    if (['sold', 'archived', 'out_of_stock'].includes(product.availability_status)) {
      throw new Error(`Product "${product.name}" is not available for purchase`);
    }
    if (product.availability_status === 'reserved' && isReservationActive(product.reserved_until)) {
      throw new Error(`Product "${product.name}" is currently reserved`);
    }
    if (product.sold_individually && item.quantity > 1) {
      throw new Error(`Only 1 unit of "${product.name}" is available`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`Only ${product.stock_quantity} unit(s) of "${product.name}" are available`);
    }

    const productTax = resolveProductTax(product);

    pricedItems.push({
      product_id: item.product_id,
      sku: product.sku,
      tag_number: product.tag_number,
      name: product.name,
      category: product.category,
      image_url: getProductImage(product),
      carat_weight: product.carat_weight,
      origin: product.origin,
      sold_individually: product.sold_individually,
      hsn_code: productTax.hsn_code,
      gst_rate: product.gst_rate,
      tax_status: product.tax_status,
      tax_class: productTax.tax_class,
      tax_rate_percent: productTax.rate_percent,
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
  let energizationCharges = 0;

  const configIds = items
    .filter((i) => i.configuration_id)
    .map((i) => i.configuration_id!);

  if (configIds.length > 0) {
    const configItemMap = new Map(
      items
        .filter((item) => item.configuration_id)
        .map((item) => [item.configuration_id!, item])
    );
    const { data: configs } = await supabase
      .from('product_configurations')
      .select('id, product_id, making_charge, metal_price, certification_fee, energization_fee, custom_design_fee')
      .in('id', configIds);

    if (configs) {
      for (const cfg of configs) {
        const sourceItem = configItemMap.get(cfg.id);
        if (!sourceItem || sourceItem.product_id !== cfg.product_id) {
          throw new Error('A configured cart item could not be verified. Please rebuild it from the configurator.');
        }
        const quantity = sourceItem.quantity;
        jewelryCharges += ((cfg.making_charge ?? 0) + (cfg.custom_design_fee ?? 0)) * quantity;
        metalCharges += (cfg.metal_price ?? 0) * quantity;
        certificationCharges += (cfg.certification_fee ?? 0) * quantity;
        energizationCharges += (cfg.energization_fee ?? 0) * quantity;
      }
    }
  }

  // ── 3. Energization charges ────────────────────────────────────────────
  if (energizationType) {
    const { data: energization } = await supabase
      .from('energization_options')
      .select('price')
      .eq('name', energizationType)
      .single();

    if (energization) {
      energizationCharges += energization.price;
    }
  }

  // ── 4. Shipping cost ──────────────────────────────────────────────────
  const shippingConfig = await getShippingMethod(shippingMethod, subtotal);
  const shippingCost = shippingConfig.cost;

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

    if (!coupon) {
      throw new Error('Coupon code is invalid or inactive.');
    }

    const now = new Date();
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
    const validTo = coupon.valid_until ? new Date(coupon.valid_until) : null;
    const isDateValid =
      (!validFrom || now >= validFrom) && (!validTo || now <= validTo);
    const isUsageValid =
      !coupon.usage_limit || coupon.used_count < coupon.usage_limit;
    const meetsMinimum =
      !coupon.min_order_amount || subtotal >= coupon.min_order_amount;

    if (!isDateValid) throw new Error('Coupon code is not valid for today.');
    if (!isUsageValid) throw new Error('Coupon usage limit has been reached.');
    if (!meetsMinimum) throw new Error(`Coupon requires a minimum order of Rs. ${coupon.min_order_amount}.`);

    const includeProducts = values(coupon.applies_to_product_ids);
    const includeCategories = values(coupon.applies_to_category_slugs);
    const excludeProducts = values(coupon.excluded_product_ids);
    const excludeCategories = values(coupon.excluded_category_slugs);

    const eligibleItems = pricedItems.filter((item) => {
      if (excludeProducts.includes(item.product_id)) return false;
      if (excludeCategories.includes(item.category)) return false;
      if (includeProducts.length > 0 && !includeProducts.includes(item.product_id)) return false;
      if (includeCategories.length > 0 && !includeCategories.includes(item.category)) return false;
      return true;
    });

    const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.line_total, 0);
    if (eligibleSubtotal <= 0) {
      throw new Error('Coupon is not valid for the items in this cart.');
    }

    if (coupon.discount_type === 'percentage') {
      discount = Math.round(eligibleSubtotal * (coupon.discount_value / 100));
      if (coupon.max_discount) {
        discount = Math.min(discount, coupon.max_discount);
      }
    } else {
      discount = Math.min(coupon.discount_value, eligibleSubtotal);
    }
  }

  // ── 6. GST calculation ────────────────────────────────────────────────
  const itemDiscountRatio = subtotal > 0 ? Math.min(discount / subtotal, 1) : 0;
  const productTaxComponents = pricedItems.map((item) => calculateGstComponent({
    label: item.name,
    component: 'product',
    amount: item.line_total * (1 - itemDiscountRatio),
    ratePercent: item.tax_rate_percent,
    hsnCode: item.hsn_code,
    destinationState: shippingAddress?.state,
  }));
  const taxBreakdown = buildTaxBreakdown(shippingAddress?.state, [
    ...productTaxComponents,
    calculateGstComponent({ label: 'Metal value', component: 'metal', amount: metalCharges, ratePercent: 3, hsnCode: '7113', destinationState: shippingAddress?.state }),
    calculateGstComponent({ label: 'Making and custom design charges', component: 'making_charge', amount: jewelryCharges, ratePercent: 5, hsnCode: null, destinationState: shippingAddress?.state }),
    calculateGstComponent({ label: 'Certification charges', component: 'certification', amount: certificationCharges, ratePercent: 18, hsnCode: null, destinationState: shippingAddress?.state }),
    calculateGstComponent({ label: 'Energization and ritual services', component: 'energization', amount: energizationCharges, ratePercent: 18, hsnCode: null, destinationState: shippingAddress?.state }),
    calculateGstComponent({ label: 'Shipping, insurance, and handling', component: 'shipping', amount: shippingCost, ratePercent: 18, hsnCode: '9968', destinationState: shippingAddress?.state }),
  ]);
  const gstAmount = Math.round(taxBreakdown.totals.gst_amount);

  const taxableAmount =
    subtotal + jewelryCharges + metalCharges + certificationCharges + energizationCharges - discount;

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
    tax_breakdown: taxBreakdownToJson(taxBreakdown),
    total: Math.max(total, 0), // Safety: total should never be negative
  };
}
