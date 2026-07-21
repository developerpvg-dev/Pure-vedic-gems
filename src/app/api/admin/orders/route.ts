import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { applyAdminOrderFilters, cleanOrderSearch } from '@/lib/admin/order-filters';
import { OfflineOrderCreateSchema } from '@/lib/validators/order';
import { recalculateOrderTotal } from '@/lib/utils/pricing';
import type { Json } from '@/lib/types/database';
import { TAX_POLICY_VERSION } from '@/lib/utils/tax';
import { keepProductsReservedAfterPayment, releaseProductsForOrder } from '@/lib/inventory/order-availability';
import { applyPaymentToBalances, inferPaymentKind } from '@/lib/orders/counter-payments';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { createInAppNotifications } from '@/lib/notifications/in-app';

type OrderRow = {
  customer_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
};

type CustomerProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

const SORT_COLUMNS = ['created_at', 'total', 'order_number', 'status', 'payment_status'] as const;

const PICKUP_ADDRESS = {
  line1: 'In-store / counter sale',
  line2: '',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302001',
  country: 'India',
  country_code: 'IN' as const,
};

function customerDisplay(order: OrderRow, profile?: CustomerProfileRow) {
  return {
    name: order.guest_name || profile?.full_name || profile?.email || 'Guest',
    email: order.guest_email || profile?.email || '',
    phone: order.guest_phone || profile?.phone || '',
  };
}

/**
 * GET /api/admin/orders
 * Paginated, filterable order list.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;
  const sortByParam = searchParams.get('sort_by') ?? 'created_at';
  const sortBy = (SORT_COLUMNS as readonly string[]).includes(sortByParam)
    ? (sortByParam as (typeof SORT_COLUMNS)[number])
    : 'created_at';
  const ascending = searchParams.get('sort_order') === 'asc';

  const supabase = createAdminClient();
  let matchedProfileIds: string[] = [];

  if (search) {
    const searchTerm = `%${cleanOrderSearch(search)}%`;
    const { data: profileMatches } = await supabase
      .from('customer_profiles')
      .select('id')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .limit(50);

    matchedProfileIds = (profileMatches ?? []).map((profile) => profile.id);
  }

  let query = supabase.from('orders').select('*', { count: 'exact' });

  query = applyAdminOrderFilters(query as never, {
    status: searchParams.get('status'),
    payment_status: searchParams.get('payment_status'),
    search,
    date_from: searchParams.get('date_from'),
    date_to: searchParams.get('date_to'),
    period: searchParams.get('period'),
    min_total: searchParams.get('min_total'),
    max_total: searchParams.get('max_total'),
    payment_method: searchParams.get('payment_method'),
    include_energization: searchParams.get('include_energization'),
    refund_status: searchParams.get('refund_status'),
    return_status: searchParams.get('return_status'),
    invoice_status: searchParams.get('invoice_status'),
    customer_type: searchParams.get('customer_type'),
    order_source: searchParams.get('order_source'),
    matchedProfileIds,
  }) as typeof query;

  query = query.order(sortBy, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin/orders] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }

  const orders = (data ?? []) as unknown as OrderRow[];
  const customerIds = Array.from(new Set(orders.map((order) => order.customer_id).filter((id): id is string => Boolean(id))));
  const { data: profiles } = customerIds.length
    ? await supabase
        .from('customer_profiles')
        .select('id, full_name, email, phone')
        .in('id', customerIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile as CustomerProfileRow]));

  const returnedOrders = (data ?? []) as unknown as Array<OrderRow & Record<string, unknown>>;

  return NextResponse.json({
    orders: returnedOrders.map((order) => ({
      ...order,
      customer_display: customerDisplay(order, order.customer_id ? profileById.get(order.customer_id) : undefined),
    })),
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

/**
 * POST /api/admin/orders
 * Create an offline / POS order with counter payment (advance or full).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = OfflineOrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const isDelivery = data.fulfillment_type === 'delivery';
  const shippingAddress = isDelivery ? data.shipping_address! : PICKUP_ADDRESS;
  const shippingMethod = isDelivery ? data.shipping_method! : 'pickup';

  let pricing;
  try {
    pricing = await recalculateOrderTotal(
      data.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        configuration_id: i.configuration_id,
      })),
      shippingMethod,
      data.coupon_code,
      data.energization_type,
      { state: shippingAddress.state, country_code: shippingAddress.country_code },
      { customerId: data.customer_id ?? null, pointsToRedeem: 0 },
      {
        manualDiscount: data.manual_discount ?? 0,
        shippingCostOverride: isDelivery ? undefined : 0,
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to calculate pricing';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const orderItems = pricing.items.map((pricedItem) => {
    const clientItem = data.items.find((i) => i.product_id === pricedItem.product_id);
    const designBits =
      clientItem?.design_id || clientItem?.design_name
        ? {
            design_id: clientItem.design_id ?? null,
            design_name: clientItem.design_name ?? null,
          }
        : null;
    const snapshot =
      clientItem?.configuration_snapshot ??
      (designBits
        ? { source: 'offline_pos', selections: { design: designBits } }
        : null);

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
      configuration_summary:
        clientItem?.configuration_summary ??
        (clientItem?.design_name ? `Design: ${clientItem.design_name}` : null),
      configuration_snapshot: snapshot,
    };
  });

  let balances;
  try {
    balances = applyPaymentToBalances(pricing.total, 0, data.payment.amount);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payment amount';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const paymentKind =
    data.payment.kind ?? inferPaymentKind(data.payment.amount, pricing.total, 0);
  const includeEnergization = Boolean(data.energization_type);
  const invoiceNumber = `INV-OFF-${Date.now().toString(36).toUpperCase()}`;

  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      customer_id: data.customer_id ?? null,
      guest_email: data.contact.email || null,
      guest_phone: data.contact.phone,
      guest_name: data.contact.full_name,
      items: orderItems as Json,
      subtotal: pricing.subtotal,
      jewelry_charges: pricing.jewelry_charges,
      metal_charges: pricing.metal_charges,
      certification_charges: pricing.certification_charges,
      energization_charges: pricing.energization_charges,
      shipping_cost: pricing.shipping_cost,
      discount: pricing.discount,
      coupon_discount: pricing.coupon_discount,
      coupon_code: data.coupon_code?.toUpperCase() ?? null,
      reward_points_redeemed: 0,
      reward_discount: 0,
      reward_points_earned: 0,
      manual_discount: pricing.manual_discount,
      gst_amount: pricing.gst_amount,
      tax_breakdown: pricing.tax_breakdown,
      total: pricing.total,
      amount_paid: balances.amount_paid,
      amount_due: balances.amount_due,
      order_source: 'offline',
      fulfillment_type: data.fulfillment_type,
      created_by_admin_id: auth.user.id,
      shipping_address: shippingAddress,
      shipping_method: isDelivery ? data.shipping_method : data.fulfillment_type,
      buyer_business_name: data.contact.business_name || null,
      buyer_gstin: data.contact.billing_gstin || null,
      billing_address: shippingAddress,
      tax_invoice_required: Boolean(data.contact.billing_gstin),
      invoice_status: data.contact.billing_gstin ? 'pending' : 'not_required',
      invoice_number: invoiceNumber,
      policy_acceptance: {
        offline_pos: true,
        accepted_at: new Date().toISOString(),
        tax_policy_version: TAX_POLICY_VERSION,
        recorded_by: auth.user.id,
      } as Json,
      compliance_flags: {
        gst_invoice_requested: Boolean(data.contact.billing_gstin),
        offline_order: true,
      } as Json,
      special_instructions: data.special_instructions ?? null,
      include_energization: includeEnergization,
      energization_type: data.energization_type ?? null,
      ceremony_gotra: data.ceremony_gotra ?? null,
      ceremony_dob: data.ceremony_dob ?? null,
      ceremony_rashi: data.ceremony_rashi ?? null,
      record_ceremony: Boolean(data.record_ceremony),
      payment_method: data.payment.method,
      payment_status: balances.payment_status,
      status: 'confirmed',
      commission_source: data.commission_source ?? null,
      commission_name: data.commission_name ?? null,
      commission_amount: data.commission_amount ?? null,
    })
    .select('id, order_number, total, amount_paid, amount_due, payment_status, invoice_number')
    .single();

  if (orderError || !order) {
    console.error('[admin/orders] create failed:', orderError);
    const detail = String((orderError as { message?: string } | null)?.message ?? '');
    const needsMigration =
      detail.includes('order_source') ||
      detail.includes('amount_paid') ||
      detail.includes('manual_discount') ||
      detail.includes('fulfillment_type') ||
      detail.includes('partial');
    return NextResponse.json(
      {
        error: needsMigration
          ? 'Offline orders require migration week40_offline_orders.sql. Run it in Supabase SQL editor.'
          : 'Failed to create offline order.',
      },
      { status: needsMigration ? 503 : 500 },
    );
  }

  const orderRow = order as {
    id: string;
    order_number: string;
    total: number;
    amount_paid: number;
    amount_due: number;
    payment_status: string;
    invoice_number: string | null;
  };

  const { error: payError } = await db.from('order_payments').insert({
    order_id: orderRow.id,
    amount: data.payment.amount,
    method: data.payment.method,
    kind: paymentKind,
    reference: data.payment.reference || null,
    notes: data.payment.notes || null,
    recorded_by: auth.user.id,
    paid_at: new Date().toISOString(),
  });

  if (payError) {
    console.error('[admin/orders] payment insert failed:', payError);
    await db.from('orders').delete().eq('id', orderRow.id);
    return NextResponse.json(
      {
        error: String(payError.message ?? '').includes('order_payments')
          ? 'Offline payments require migration week40_offline_orders.sql.'
          : 'Failed to record payment.',
      },
      { status: 500 },
    );
  }

  const hold = await keepProductsReservedAfterPayment({
    id: orderRow.id,
    order_number: orderRow.order_number,
    guest_phone: data.contact.phone,
    guest_name: data.contact.full_name,
    guest_email: data.contact.email || null,
    items: orderItems,
  });

  if (hold.failedIds.length > 0) {
    console.error('[admin/orders] reserve failed for products:', hold.failedIds);
    // Undo any pieces we did reserve, then drop the order
    await releaseProductsForOrder({
      id: orderRow.id,
      order_number: orderRow.order_number,
      items: orderItems,
    });
    await db.from('order_payments').delete().eq('order_id', orderRow.id);
    await db.from('orders').delete().eq('id', orderRow.id);
    return NextResponse.json(
      {
        error:
          'One or more items could not be reserved (already sold or held). Order was not created.',
        failed_product_ids: hold.failedIds,
      },
      { status: 409 },
    );
  }

  await db.from('order_tracking_events').insert({
    order_id: orderRow.id,
    status: 'confirmed',
    note: `Offline order created (${data.fulfillment_type}). ${paymentKind} ₹${data.payment.amount} via ${data.payment.method}. Items reserved until marked sold.`,
    is_customer_visible: true,
    created_by: auth.user.id,
  });

  await logAdminAction({
    userId: auth.user.id,
    action: 'offline_order_create',
    resourceType: 'order',
    resourceId: orderRow.id,
    details: {
      order_number: orderRow.order_number,
      total: orderRow.total,
      amount_paid: orderRow.amount_paid,
      payment_method: data.payment.method,
      fulfillment_type: data.fulfillment_type,
    },
    ipAddress: getRequestIp(request),
  });

  await createInAppNotifications([
    {
      audience: 'admin',
      type: 'order_created',
      title: 'Offline order created',
      message: `${data.contact.full_name} — ${orderRow.order_number} — ₹${Number(orderRow.total).toLocaleString('en-IN')}`,
      href: `/admin/orders/${orderRow.id}`,
      entityType: 'order',
      entityId: orderRow.id,
      metadata: {
        order_number: orderRow.order_number,
        order_source: 'offline',
        payment_status: orderRow.payment_status,
      },
    },
  ]);

  return NextResponse.json({
    order_id: orderRow.id,
    order_number: orderRow.order_number,
    total: orderRow.total,
    amount_paid: orderRow.amount_paid,
    amount_due: orderRow.amount_due,
    payment_status: orderRow.payment_status,
    invoice_number: orderRow.invoice_number,
  });
}
