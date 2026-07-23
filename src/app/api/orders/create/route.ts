import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { OrderCreateSchema } from '@/lib/validators/order';
import { recalculateOrderTotal } from '@/lib/utils/pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';
import { BANK_TRANSFER_HOLD_MS } from '@/lib/constants/bank-accounts';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import type { Json } from '@/lib/types/database';
import { TAX_POLICY_VERSION } from '@/lib/utils/tax';
import { cancelRewardRedemption, reserveRewardRedemption } from '@/lib/rewards/service';
import { getRudrakshaProductIdsFromSnapshot } from '@/lib/utils/rudraksha-order-display';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';

function createGuestOrderToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/** Prefer configurator snapshot ceremony details over the old checkout energization form. */
function deriveCeremonyFromCartItems(
  items: Array<{ configuration_snapshot?: unknown }>,
  fallback?: {
    include_energization?: boolean;
    energization_type?: string;
    ceremony_dob?: string;
    ceremony_gotra?: string;
    ceremony_rashi?: string;
    record_ceremony?: boolean;
  } | null,
) {
  for (const item of items) {
    const snap = parseConfigurationSnapshot(item.configuration_snapshot);
    const form = snap?.selections?.energization_form;
    const option = snap?.selections?.energization;
    if (!option && !form) continue;
    return {
      include_energization: true,
      energization_type: option?.name ?? fallback?.energization_type ?? null,
      ceremony_dob: form?.dob ?? fallback?.ceremony_dob ?? null,
      ceremony_gotra: form?.gotra ?? fallback?.ceremony_gotra ?? null,
      ceremony_rashi: form?.rashi ?? fallback?.ceremony_rashi ?? null,
      record_ceremony: Boolean(form?.record_ceremony ?? fallback?.record_ceremony),
    };
  }

  return {
    include_energization: Boolean(fallback?.include_energization),
    energization_type: fallback?.energization_type ?? null,
    ceremony_dob: fallback?.ceremony_dob ?? null,
    ceremony_gotra: fallback?.ceremony_gotra ?? null,
    ceremony_rashi: fallback?.ceremony_rashi ?? null,
    record_ceremony: Boolean(fallback?.record_ceremony),
  };
}

async function reserveUniquePhysicalProducts({
  orderId,
  orderNumber,
  customerId,
  holdUntil,
  items,
  configuredSnapshots = [],
}: {
  orderId: string;
  orderNumber: string;
  customerId: string | null;
  holdUntil: string;
  items: Awaited<ReturnType<typeof recalculateOrderTotal>>['items'];
  configuredSnapshots?: unknown[];
}) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const reserveTargets = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    if (!item.sold_individually) continue;
    reserveTargets.set(item.product_id, {
      name: item.name,
      quantity: item.quantity,
    });
  }

  for (const snapshot of configuredSnapshots) {
    const beadIds = getRudrakshaProductIdsFromSnapshot(snapshot);
    if (beadIds.length === 0) continue;

    const { data: beadProducts } = await supabase
      .from('products')
      .select('id, name, sold_individually')
      .in('id', beadIds);

    for (const bead of (beadProducts ?? []) as Array<{
      id: string;
      name: string;
      sold_individually: boolean;
    }>) {
      if (!bead.sold_individually || reserveTargets.has(bead.id)) continue;
      reserveTargets.set(bead.id, { name: bead.name, quantity: 1 });
    }
  }

  for (const [productId, target] of reserveTargets) {
    const { data, error } = await supabase
      .from('products')
      .update({
        availability_status: 'reserved',
        reserved_until: holdUntil,
        reserved_by_customer_id: customerId,
        reserved_quantity: target.quantity,
        reservation_note: `Payment hold for ${orderNumber}`,
      })
      .eq('id', productId)
      .or(`reserved_until.is.null,reserved_until.lt.${now}`)
      .select('id');

    if (error || !data || data.length === 0) {
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          payment_failure_reason: 'Product reservation failed before payment.',
        })
        .eq('id', orderId);
      throw new Error(`Product "${target.name}" was just reserved by another customer.`);
    }
  }
}

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
    reward_points_to_redeem,
    checkout_consent,
    payment_method,
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
  // Energization fee already lives on product_configurations; do not add a second checkout fee.
  try {
    pricing = await recalculateOrderTotal(
      items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        configuration_id: i.configuration_id,
      })),
      shipping_method,
      coupon_code,
      undefined,
      shipping_address,
      { customerId, pointsToRedeem: reward_points_to_redeem }
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
      sku: pricedItem.sku,
      tag_number: pricedItem.tag_number,
      quantity: pricedItem.quantity,
      unit_price: pricedItem.unit_price,
      line_total: pricedItem.line_total,
      carat_weight: pricedItem.carat_weight,
      origin: pricedItem.origin,
      image_url: pricedItem.image_url || clientItem?.image_url || '',
      category: pricedItem.category,
      configuration_id: clientItem?.configuration_id ?? null,
      configuration_summary: clientItem?.configuration_summary ?? null,
      configuration_snapshot: clientItem?.configuration_snapshot ?? null,
      delivery_eta_label: clientItem?.delivery_eta_label ?? null,
    };
  });

  // ── Insert order into database ───────────────────────────────────────
  const supabaseAdmin = createAdminClient();
  const guestAccess = customerId ? null : createGuestOrderToken();
  // ponytail: Razorpay keeps 20m hold; bank transfer needs days for NEFT/IMPS + proof review
  const holdMs = payment_method === 'bank_transfer' ? BANK_TRANSFER_HOLD_MS : 20 * 60 * 1000;
  const reservationHoldUntil = new Date(Date.now() + holdMs).toISOString();

  const ceremony = deriveCeremonyFromCartItems(items, energization);

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: customerId,
      // Always store checkout contact so /track-order email/phone lookup works for logged-in orders too.
      guest_email: contact.email,
      guest_phone: contact.phone,
      guest_name: contact.full_name,
      items: orderItems as Json,
      subtotal: pricing.subtotal,
      jewelry_charges: pricing.jewelry_charges,
      metal_charges: pricing.metal_charges,
      certification_charges: pricing.certification_charges,
      energization_charges: pricing.energization_charges,
      shipping_cost: pricing.shipping_cost,
      discount: pricing.discount,
      coupon_discount: pricing.coupon_discount,
      coupon_code: coupon_code?.toUpperCase() ?? null,
      reward_points_redeemed: pricing.reward_points_redeemed,
      reward_discount: pricing.reward_discount,
      reward_points_earned: 0,
      gst_amount: pricing.gst_amount,
      tax_breakdown: pricing.tax_breakdown,
      total: pricing.total,
      shipping_address,
      shipping_method,
      buyer_business_name: contact.business_name || null,
      buyer_gstin: contact.billing_gstin || null,
      billing_address: shipping_address,
      tax_invoice_required: Boolean(contact.billing_gstin),
      invoice_status: contact.billing_gstin ? 'pending' : 'not_required',
      policy_acceptance: {
        ...checkout_consent,
        accepted_at: new Date().toISOString(),
        tax_policy_version: TAX_POLICY_VERSION,
      } as Json,
      compliance_flags: {
        gst_invoice_requested: Boolean(contact.billing_gstin),
        high_value_manual_review: pricing.total >= 200000,
      } as Json,
      special_instructions: special_instructions ?? null,
      include_energization: ceremony.include_energization,
      energization_type: ceremony.energization_type,
      ceremony_gotra: ceremony.ceremony_gotra,
      ceremony_dob: ceremony.ceremony_dob,
      ceremony_rashi: ceremony.ceremony_rashi,
      record_ceremony: ceremony.record_ceremony,
      payment_status: 'pending',
      payment_method: payment_method === 'bank_transfer' ? 'bank_transfer' : null,
      status: 'pending_payment',
      guest_access_token: guestAccess?.hash ?? null,
      reservation_expires_at: reservationHoldUntil,
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

  if (customerId && pricing.reward_points_redeemed > 0) {
    try {
      await reserveRewardRedemption({
        customerId,
        orderId: order.id,
        points: pricing.reward_points_redeemed,
        discountAmount: pricing.reward_discount,
      });
    } catch (error) {
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          payment_failure_reason: 'Reward point reservation failed before payment.',
        })
        .eq('id', order.id);
      const message = error instanceof Error ? error.message : 'Unable to reserve reward points.';
      return NextResponse.json({ error: message }, { status: 409 });
    }
  }

  try {
    await reserveUniquePhysicalProducts({
      orderId: order.id,
      orderNumber: order.order_number,
      customerId,
      holdUntil: reservationHoldUntil,
      items: pricing.items,
      configuredSnapshots: items
        .map((item) => item.configuration_snapshot)
        .filter(Boolean),
    });
  } catch (error) {
    await cancelRewardRedemption(order.id);
    const message = error instanceof Error ? error.message : 'Unable to reserve products.';
    return NextResponse.json({ error: message }, { status: 409 });
  }

  await createInAppNotifications([
    {
      audience: 'admin',
      type: 'order_created',
      title: 'New order started',
      message: `${contact.full_name} created order ${order.order_number} for ₹${Number(order.total ?? 0).toLocaleString('en-IN')}.`,
      href: `/admin/orders/${order.id}`,
      entityType: 'order',
      entityId: order.id,
      metadata: { order_number: order.order_number, total: order.total, payment_status: 'pending' },
    },
    ...(customerId ? [{
      audience: 'user' as const,
      recipientUserId: customerId,
      type: 'order_pending_payment',
      title: 'Order created',
      message: `Order ${order.order_number} is waiting for payment confirmation.`,
      href: '/account/orders',
      entityType: 'order',
      entityId: order.id,
      metadata: { order_number: order.order_number, total: order.total },
    }] : []),
  ]);

  const response = NextResponse.json({
    order_id: order.id,
    order_number: order.order_number,
    total: order.total,
    guest_order_token: guestAccess?.token ?? null,
    reservation_expires_at: reservationHoldUntil,
    order_status_label: ORDER_STATUS_LABELS.pending_payment,
    pricing_breakdown: {
      subtotal: pricing.subtotal,
      jewelry_charges: pricing.jewelry_charges,
      metal_charges: pricing.metal_charges,
      certification_charges: pricing.certification_charges,
      energization_charges: pricing.energization_charges,
      shipping_cost: pricing.shipping_cost,
      discount: pricing.discount,
      coupon_discount: pricing.coupon_discount,
      reward_points_redeemed: pricing.reward_points_redeemed,
      reward_discount: pricing.reward_discount,
      gst_amount: pricing.gst_amount,
      tax_breakdown: pricing.tax_breakdown,
      total: pricing.total,
    },
  });

  if (guestAccess) {
    response.cookies.set({
      name: 'pvg_guest_order_token',
      value: `${order.id}.${guestAccess.token}`,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });
  }

  return response;
}
