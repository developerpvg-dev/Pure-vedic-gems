/**
 * Server-side price recalculation utility.
 * NEVER trust client-sent prices — always recalculate from DB.
 *
 * Handles: gem price + making charges + metal charges + certification fee
 * + energization fee + shipping cost - discount
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { ShippingAddress, ShippingMethodId } from '@/lib/validators/order';
import type { Coupon, ShippingMethod } from '@/lib/types/database';
import { planAppliesToCountry, planAppliesToSubtotal } from '@/lib/shipping/plans';
import { buildTaxBreakdown, calculateGstComponent, resolveProductTax, taxBreakdownToJson } from '@/lib/utils/tax';
import { quoteRewardRedemption } from '@/lib/rewards/service';

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
  coupon_discount: number;
  reward_points_redeemed: number;
  reward_discount: number;
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
  subtotal: number,
  countryCode?: string | null
): Promise<{ id: ShippingMethodId; cost: number; label: string }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('id', methodId)
    .eq('is_active', true)
    .maybeSingle();

  const method = data as ShippingMethod | null;
  if (!method) {
    throw new Error('Invalid or unavailable shipping method.');
  }

  if (countryCode && !planAppliesToCountry(method.country_code, countryCode)) {
    throw new Error('Selected shipping method is not available for this country.');
  }

  if (!planAppliesToSubtotal(method, subtotal)) {
    throw new Error(`${method.label} is not available for this order total.`);
  }

  const cost = Number(method.cost);
  // ponytail: cost 0 is valid (free shipping tiers); negative is corrupt data
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error('Selected shipping method is not available.');
  }

  return {
    id: method.id as ShippingMethodId,
    label: method.label,
    cost,
  };
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
  shippingMethod: ShippingMethodId,
  couponCode?: string,
  energizationType?: string,
  shippingAddress?: Pick<ShippingAddress, 'state' | 'country_code'>,
  rewardOptions?: { customerId: string | null; pointsToRedeem?: number | null }
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
  const configIds = Array.from(
    new Set(
      items
        .filter((i) => i.configuration_id)
        .map((i) => i.configuration_id!)
    )
  );

  const configGemPriceMap = new Map<string, number>();
  if (configIds.length > 0) {
    const { data: gemConfigs, error: gemConfigError } = await supabase
      .from('product_configurations')
      .select('id, gem_price')
      .in('id', configIds);

    if (gemConfigError || !gemConfigs || gemConfigs.length !== configIds.length) {
      throw new Error('A configured cart item could not be verified. Please rebuild it from the configurator.');
    }

    for (const cfg of gemConfigs as Array<{ id: string; gem_price: number | null }>) {
      configGemPriceMap.set(cfg.id, Number(cfg.gem_price ?? 0));
    }
  }

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
    // ponytail: each piece is unique — never more than 1
    if (item.quantity > 1) {
      throw new Error(`Only 1 unit of "${product.name}" is available`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`"${product.name}" is no longer available`);
    }

    const productTax = resolveProductTax(product);

    const configuredGemPrice = item.configuration_id
      ? configGemPriceMap.get(item.configuration_id)
      : undefined;
    const unitPrice =
      configuredGemPrice !== undefined && configuredGemPrice > 0
        ? configuredGemPrice
        : product.price;

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
      unit_price: unitPrice,
      quantity: item.quantity,
      line_total: unitPrice * item.quantity,
    });
  }

  const subtotal = pricedItems.reduce((sum, i) => sum + i.line_total, 0);

  // ── 2. Configuration charges (jewelry making, metal, etc.) ─────────────
  let jewelryCharges = 0;
  let metalCharges = 0;
  let certificationCharges = 0;
  let energizationCharges = 0;

  const configIdsForCharges = configIds;

  if (configIdsForCharges.length > 0) {
    const configItemMap = new Map(
      items
        .filter((item) => item.configuration_id)
        .map((item) => [item.configuration_id!, item])
    );
    const { data: configs, error: configError } = await supabase
      .from('product_configurations')
      .select('id, product_id, making_charge, metal_price, certification_fee, energization_fee, custom_design_fee')
      .in('id', configIdsForCharges);

    // Fail closed: every requested configuration must resolve to an active row.
    // A missing/invalid configuration_id must never silently skip its charges.
    if (configError || !configs || configs.length !== configIdsForCharges.length) {
      throw new Error('A configured cart item could not be verified. Please rebuild it from the configurator.');
    }

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

  // ── 4. Shipping cost (eligibility vs full merchandise, not gem-only) ──
  // Configured carts store gem in `subtotal` and ring/metal/cert/puja as
  // separate charges — min/max order bands must include those charges.
  const merchandiseTotal =
    subtotal + jewelryCharges + metalCharges + certificationCharges + energizationCharges;

  const shippingConfig = await getShippingMethod(
    shippingMethod,
    merchandiseTotal,
    shippingAddress?.country_code ?? null
  );
  const shippingCost = shippingConfig.cost;

  // ── 5. Coupon discount ────────────────────────────────────────────────
  let couponDiscount = 0;
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
      !coupon.min_order_amount || merchandiseTotal >= coupon.min_order_amount;

    if (!isDateValid) throw new Error('Coupon code is not valid for today.');
    if (!isUsageValid) throw new Error('Coupon usage limit has been reached.');
    if (!meetsMinimum) throw new Error(`Coupon requires a minimum order of Rs. ${coupon.min_order_amount}.`);

    // ── Per-customer + first-time coupon enforcement ──────────────────────
    // These coupon types are tied to a customer identity, so a guest checkout
    // cannot satisfy them. Require sign-in rather than silently allowing reuse.
    const customerId = rewardOptions?.customerId ?? null;
    if ((coupon.usage_limit_per_customer || coupon.first_time_customers_only) && !customerId) {
      throw new Error('Please sign in to use this coupon.');
    }

    if (customerId && coupon.usage_limit_per_customer) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('customer_id', customerId);
      if ((count ?? 0) >= coupon.usage_limit_per_customer) {
        throw new Error('You have already used this coupon the maximum number of times.');
      }
    }

    if (customerId && coupon.first_time_customers_only) {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId)
        .eq('payment_status', 'captured');
      if ((count ?? 0) > 0) {
        throw new Error('This coupon is only valid for first-time customers.');
      }
    }

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
      couponDiscount = Math.round(eligibleSubtotal * (coupon.discount_value / 100));
      if (coupon.max_discount) {
        couponDiscount = Math.min(couponDiscount, coupon.max_discount);
      }
    } else {
      couponDiscount = Math.min(coupon.discount_value, eligibleSubtotal);
    }
  }

  const rewardQuote = await quoteRewardRedemption({
    customerId: rewardOptions?.customerId ?? null,
    requestedPoints: rewardOptions?.pointsToRedeem ?? 0,
    eligibleAmount: Math.max(0, subtotal - couponDiscount),
  });
  const rewardDiscount = rewardQuote?.discount_amount ?? 0;
  const rewardPointsRedeemed = rewardQuote?.points_to_redeem ?? 0;
  const discount = couponDiscount + rewardDiscount;

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
    coupon_discount: couponDiscount,
    reward_points_redeemed: rewardPointsRedeemed,
    reward_discount: rewardDiscount,
    gst_amount: gstAmount,
    tax_breakdown: taxBreakdownToJson(taxBreakdown),
    total: Math.max(total, 0), // Safety: total should never be negative
  };
}
