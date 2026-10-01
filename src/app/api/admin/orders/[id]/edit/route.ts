import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { AdminOrderEditSchema } from '@/lib/validators/order';
import { formatZodValidationError } from '@/lib/utils/api-validation';
import { recalculateOrderTotal } from '@/lib/utils/pricing';
import type { Json } from '@/lib/types/database';
import {
  collectOrderProductIds,
  keepProductsReservedAfterPayment,
  markProductsSoldForOrder,
  releaseProductsForOrder,
} from '@/lib/inventory/order-availability';
import {
  buildAdminOrderItems,
  editedOrderBalances,
  orderEditPricingOptions,
} from '@/lib/orders/admin-order-edit';
import { logAdminAction } from '@/lib/utils/admin-log';

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  order_source: string | null;
  items: unknown;
  total: number;
  amount_paid: number | null;
  payment_status: string | null;
  coupon_code: string | null;
  reward_points_redeemed: number | null;
  reward_discount: number | null;
  products_marked_sold_at: string | null;
  invoice_status: string | null;
  guest_phone: string | null;
  guest_name: string | null;
  guest_email: string | null;
};

/**
 * POST /api/admin/orders/[id]/edit
 * Rewrite an existing online or offline order (items, designs, charges, coupon,
 * customer, fulfillment). Re-priced server-side; recorded payments are kept.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.edit');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = AdminOrderEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(formatZodValidationError(parsed.error), { status: 400 });
  }
  const data = parsed.data;

  const db = asUntypedSupabase(createAdminClient());
  const { data: raw } = await db.from('orders').select('*').eq('id', id).maybeSingle();
  if (!raw) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const order = raw as OrderRow;

  if (['cancelled', 'refunded'].includes(order.status)) {
    return NextResponse.json({ error: `Order is ${order.status} — it can no longer be edited.` }, { status: 400 });
  }

  const isOffline = order.order_source === 'offline';
  const isDelivery = data.fulfillment_type === 'delivery';
  const shippingAddress = isDelivery ? data.shipping_address! : data.customer_address;

  let pricing;
  try {
    pricing = await recalculateOrderTotal(
      data.items.map((i) => ({
        line_id: i.line_id,
        product_id: i.product_id,
        quantity: i.quantity,
        configuration_id: i.configuration_id,
        manual_design: i.manual_design,
      })),
      isDelivery ? data.shipping_method! : 'pickup',
      data.coupon_code,
      undefined,
      { state: shippingAddress.state, country_code: shippingAddress.country_code },
      { customerId: data.customer_id ?? null, pointsToRedeem: 0 },
      {
        ...orderEditPricingOptions(order),
        manualDiscount: data.manual_discount ?? 0,
        shippingCostOverride: isDelivery ? undefined : 0,
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to calculate pricing' },
      { status: 400 },
    );
  }

  const orderItems = buildAdminOrderItems(pricing.items, data.items);

  // Inventory: claim newly added pieces first so a failed claim leaves the order untouched.
  const oldIds = collectOrderProductIds(order);
  const newIds = collectOrderProductIds({ ...order, items: orderItems });
  const addedIds = newIds.filter((pid) => !oldIds.includes(pid));
  const removedIds = oldIds.filter((pid) => !newIds.includes(pid));
  const addedOrder = { ...order, items: addedIds.map((pid) => ({ product_id: pid })) };

  // ponytail: added pieces get the long paid hold even on unpaid orders; payment-expiry release still clears it by note
  const hold = addedIds.length ? await keepProductsReservedAfterPayment(addedOrder) : { reservedIds: [], failedIds: [] };
  if (hold.failedIds.length) {
    if (hold.reservedIds.length) await releaseProductsForOrder(addedOrder, hold.reservedIds);
    return NextResponse.json(
      { error: 'One or more new items could not be reserved (already sold or held). Order was not changed.' },
      { status: 409 },
    );
  }

  const balances = editedOrderBalances(order, pricing.total);
  const gstin = data.contact.billing_gstin || null;
  const commissions = data.commissions;

  const { error: updateError } = await db
    .from('orders')
    .update({
      customer_id: data.customer_id ?? null,
      guest_name: data.contact.full_name,
      guest_phone: data.contact.phone,
      guest_email: data.contact.email || null,
      items: orderItems as Json,
      subtotal: pricing.subtotal,
      jewelry_charges: pricing.jewelry_charges,
      metal_charges: pricing.metal_charges,
      certification_charges: pricing.certification_charges,
      energization_charges: pricing.energization_charges,
      shipping_cost: pricing.shipping_cost,
      discount: pricing.discount,
      coupon_discount: pricing.coupon_discount,
      coupon_code: data.coupon_code?.toUpperCase() || null,
      reward_points_redeemed: pricing.reward_points_redeemed,
      reward_discount: pricing.reward_discount,
      manual_discount: pricing.manual_discount,
      gst_amount: pricing.gst_amount,
      tax_breakdown: pricing.tax_breakdown,
      total: pricing.total,
      amount_paid: balances.amount_paid,
      amount_due: balances.amount_due,
      payment_status: balances.payment_status,
      shipping_address: shippingAddress,
      shipping_method: isDelivery ? data.shipping_method : data.fulfillment_type,
      // Online checkout keeps its own billing address; offline uses the customer address.
      ...(isOffline ? { billing_address: data.customer_address, fulfillment_type: data.fulfillment_type } : {}),
      buyer_gstin: gstin,
      tax_invoice_required: Boolean(gstin),
      ...(gstin && order.invoice_status === 'not_required' ? { invoice_status: 'pending' } : {}),
      special_instructions: data.special_instructions ?? null,
      commissions: commissions as Json,
      commission_source: commissions[0]?.source ?? null,
      commission_name: commissions[0]?.name ?? null,
      commission_amount: commissions[0]?.amount ?? null,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[admin/orders/edit] update failed', updateError);
    if (hold.reservedIds.length) await releaseProductsForOrder(addedOrder, hold.reservedIds);
    return NextResponse.json({ error: 'Failed to save order changes.' }, { status: 500 });
  }

  // Order already billed → new pieces go straight to Sold, like the rest of the order.
  if (order.products_marked_sold_at && addedIds.length) await markProductsSoldForOrder(addedOrder);
  const restoredIds = removedIds.length ? await releaseProductsForOrder(order, removedIds) : [];

  // ponytail: coupon_redemptions / used_count are not re-synced when an edit swaps the coupon
  const note = `Order edited by admin: total ₹${Number(order.total).toLocaleString('en-IN')} → ₹${pricing.total.toLocaleString('en-IN')}${
    addedIds.length ? ` · ${addedIds.length} item(s) added` : ''
  }${removedIds.length ? ` · ${removedIds.length} item(s) removed` : ''}`;
  await db.from('order_tracking_events').insert({
    order_id: id,
    status: order.status,
    note,
    is_customer_visible: false,
    created_by: auth.user.id,
  });

  await logAdminAction({
    userId: auth.user.id,
    action: 'order_edit',
    resourceType: 'order',
    resourceId: id,
    details: {
      order_number: order.order_number,
      previous_total: order.total,
      total: pricing.total,
      added_product_ids: addedIds,
      removed_product_ids: removedIds,
      restored_product_ids: restoredIds,
      coupon_code: data.coupon_code ?? null,
    },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    order_id: id,
    total: pricing.total,
    amount_paid: balances.amount_paid,
    amount_due: balances.amount_due,
    payment_status: balances.payment_status,
    overpaid: balances.overpaid,
  });
}
