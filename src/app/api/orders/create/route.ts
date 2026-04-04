import { NextRequest, NextResponse } from 'next/server';
import { OrderCreateSchema } from '@/lib/validators/order';
import { recalculateOrderTotal } from '@/lib/utils/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';

/**
 * POST /api/orders/create
 *
 * Creates an order in the database with server-side price recalculation.
 * Supports both authenticated and guest checkout.
 *
 * Flow:
 * 1. Validate input with Zod
 * 2. Recalculate total server-side (prevents price tampering)
 * 3. Create order in DB with status 'pending_payment'
 * 4. Return order ID for Razorpay order creation
 */
export async function POST(req: NextRequest) {
  // ── Rate limiting: 10 order attempts per minute per IP ────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`order:${ip}`, 10, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  // ── Validate with Zod ────────────────────────────────────────────────
  const parsed = OrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const {
    items,
    contact,
    shipping_address,
    shipping_method,
    energization,
    special_instructions,
    coupon_code,
  } = parsed.data;

  // ── Get authenticated user (if logged in) ────────────────────────────
  let customerId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    customerId = user?.id ?? null;
  } catch {
    // Guest checkout — customerId stays null
  }

  // ── Server-side price recalculation (CRITICAL: prevents tampering) ───
  let pricing;
  try {
    pricing = await recalculateOrderTotal(
      items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        configuration_id: i.configuration_id,
      })),
      shipping_method,
      coupon_code,
      energization?.energization_type
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to calculate pricing';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Build order items JSONB with server-verified prices ──────────────
  const orderItems = pricing.items.map((pricedItem) => {
    const clientItem = items.find(
      (i) => i.product_id === pricedItem.product_id
    );
    return {
      product_id: pricedItem.product_id,
      name: pricedItem.name,
      sku: clientItem?.sku ?? '',
      quantity: pricedItem.quantity,
      unit_price: pricedItem.unit_price,
      line_total: pricedItem.line_total,
      carat_weight: clientItem?.carat_weight ?? null,
      origin: clientItem?.origin ?? null,
      image_url: clientItem?.image_url ?? '',
      category: clientItem?.category ?? '',
      configuration_id: clientItem?.configuration_id ?? null,
      configuration_summary: clientItem?.configuration_summary ?? null,
    };
  });

  // ── Insert order into database ───────────────────────────────────────
  const supabaseAdmin = createAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: customerId,
      guest_email: customerId ? null : contact.email,
      guest_phone: customerId ? null : contact.phone,
      guest_name: customerId ? null : contact.full_name,
      items: orderItems,
      subtotal: pricing.subtotal,
      jewelry_charges: pricing.jewelry_charges,
      metal_charges: pricing.metal_charges,
      certification_charges: pricing.certification_charges,
      energization_charges: pricing.energization_charges,
      shipping_cost: pricing.shipping_cost,
      discount: pricing.discount,
      coupon_code: coupon_code?.toUpperCase() ?? null,
      gst_amount: pricing.gst_amount,
      total: pricing.total,
      shipping_address,
      shipping_method,
      special_instructions: special_instructions ?? null,
      include_energization: energization?.include_energization ?? false,
      energization_type: energization?.energization_type ?? null,
      ceremony_gotra: energization?.ceremony_gotra ?? null,
      ceremony_dob: energization?.ceremony_dob ?? null,
      ceremony_rashi: energization?.ceremony_rashi ?? null,
      record_ceremony: energization?.record_ceremony ?? false,
      payment_status: 'pending',
      status: 'pending_payment',
    })
    .select('id, order_number, total')
    .single();

  if (orderError || !order) {
    console.error('[Orders] Failed to create order:', orderError);
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }

  // ── Increment coupon usage if applied ────────────────────────────────
  if (coupon_code && pricing.discount > 0) {
    const upperCode = coupon_code.toUpperCase();
    const { data: couponRow } = await supabaseAdmin
      .from('coupons')
      .select('used_count')
      .eq('code', upperCode)
      .single();
    if (couponRow) {
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: couponRow.used_count + 1 })
        .eq('code', upperCode)
        .then(null, () => {
          console.warn('[Orders] Failed to increment coupon usage');
        });
    }
  }

  return NextResponse.json({
    order_id: order.id,
    order_number: order.order_number,
    total: order.total,
    pricing_breakdown: {
      subtotal: pricing.subtotal,
      jewelry_charges: pricing.jewelry_charges,
      metal_charges: pricing.metal_charges,
      certification_charges: pricing.certification_charges,
      energization_charges: pricing.energization_charges,
      shipping_cost: pricing.shipping_cost,
      discount: pricing.discount,
      gst_amount: pricing.gst_amount,
      total: pricing.total,
    },
  });
}
