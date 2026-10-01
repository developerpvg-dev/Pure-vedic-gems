import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess } from '@/lib/admin/api';
import { OfflineOrderItemSchema, FulfillmentTypeSchema, ShippingAddressSchema, ShippingMethodIdSchema } from '@/lib/validators/order';
import { formatZodValidationError } from '@/lib/utils/api-validation';
import { recalculateOrderTotal, type PricingOfflineOptions } from '@/lib/utils/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { orderEditPricingOptions, type EditableOrderRow } from '@/lib/orders/admin-order-edit';

const QuoteSchema = z.object({
  items: z.array(OfflineOrderItemSchema).min(1),
  fulfillment_type: FulfillmentTypeSchema.default('in_store'),
  shipping_address: ShippingAddressSchema.optional(),
  shipping_method: ShippingMethodIdSchema.optional(),
  coupon_code: z.string().max(50).optional(),
  manual_discount: z.coerce.number().min(0).optional().default(0),
  energization_type: z.string().max(200).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  /** Editing an existing order — its own reserved/sold pieces and coupon stay valid. */
  order_id: z.string().uuid().optional(),
});

/**
 * POST /api/admin/orders/quote
 * Live server pricing for the offline POS wizard and admin order edit (no DB write).
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodValidationError(parsed.error), { status: 400 });
  }

  const data = parsed.data;
  const auth = await requireAdminAccess(data.order_id ? 'orders.edit' : 'orders.write');
  if ('error' in auth) return auth.error;

  let editOptions: PricingOfflineOptions = {};
  if (data.order_id) {
    const { data: order } = await asUntypedSupabase(createAdminClient())
      .from('orders')
      .select('id, order_number, items, coupon_code, reward_points_redeemed, reward_discount')
      .eq('id', data.order_id)
      .maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    editOptions = orderEditPricingOptions(order as EditableOrderRow);
  }

  const isDelivery = data.fulfillment_type === 'delivery';
  if (isDelivery && (!data.shipping_address || !data.shipping_method)) {
    return NextResponse.json(
      { error: 'Shipping address and method required for delivery quotes' },
      { status: 400 },
    );
  }

  const shippingAddress = data.shipping_address ?? {
    line1: 'In-store',
    line2: '',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    country: 'India',
    country_code: 'IN' as const,
  };

  try {
    const pricing = await recalculateOrderTotal(
      data.items.map((i) => ({
        line_id: i.line_id,
        product_id: i.product_id,
        quantity: i.quantity,
        configuration_id: i.configuration_id,
        manual_design: i.manual_design,
      })),
      isDelivery ? data.shipping_method! : 'pickup',
      data.coupon_code,
      data.energization_type,
      { state: shippingAddress.state, country_code: shippingAddress.country_code },
      { customerId: data.customer_id ?? null, pointsToRedeem: 0 },
      {
        ...editOptions,
        manualDiscount: data.manual_discount ?? 0,
        shippingCostOverride: isDelivery ? undefined : 0,
      },
    );
    return NextResponse.json({ pricing });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to calculate pricing';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
