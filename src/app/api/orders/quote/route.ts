import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import {
  OrderItemSchema,
  ShippingAddressSchema,
  ShippingMethodIdSchema,
} from '@/lib/validators/order';
import { recalculateOrderTotal } from '@/lib/utils/pricing';

const QuoteSchema = z.object({
  items: z.array(
    OrderItemSchema.pick({ product_id: true, quantity: true, configuration_id: true }),
  ).min(1),
  shipping_address: ShippingAddressSchema,
  shipping_method: ShippingMethodIdSchema,
  coupon_code: z.string().max(50).trim().optional(),
  reward_points_to_redeem: z.coerce.number().int().min(0).max(1000000).optional().default(0),
});

/**
 * POST /api/orders/quote
 * Live server pricing for checkout (coupon validation, no DB write).
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`orders-quote:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  let customerId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    customerId = user?.id ?? null;
  } catch {
    // guest quote
  }

  const data = parsed.data;
  try {
    const pricing = await recalculateOrderTotal(
      data.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        configuration_id: i.configuration_id,
      })),
      data.shipping_method,
      data.coupon_code,
      undefined,
      data.shipping_address,
      { customerId, pointsToRedeem: data.reward_points_to_redeem },
    );
    return NextResponse.json({ pricing });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to calculate pricing';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
