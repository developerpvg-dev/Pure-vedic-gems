import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { notifyUser } from '@/lib/notifications/in-app';
import { resolveOrderCustomerEmail } from '@/lib/orders/resolve-order-email';
import { sendMetalWeightAdjustmentEmail } from '@/lib/resend/send-metal-weight-adjustment';
import {
  applyMetalDeltaToOrderMoney,
  applyMetalWeightToPricing,
  buildMetalWeightNotifyCopy,
} from '@/lib/orders/metal-weight-adjust';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import type { Order } from '@/lib/types/database';
import type { OrderItemRecord } from '@/lib/types/order';
import type { Json } from '@/lib/types/database';

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update'),
    item_index: z.number().int().nonnegative(),
    metal_weight_grams: z.coerce.number().positive().max(5000),
    notify: z.boolean().default(true),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal('notify'),
    item_index: z.number().int().nonnegative().optional(),
    note: z.string().trim().max(500).optional(),
  }),
]);

async function sendMetalWeightNotifications(args: {
  order: Order;
  orderId: string;
  copy: ReturnType<typeof buildMetalWeightNotifyCopy>;
  oldWeightGrams: number;
  newWeightGrams: number;
  totalDelta: number;
  amountDue: number;
  refundDue: number;
  orderTotal: number;
  amountPaid: number;
  itemName?: string | null;
  note?: string | null;
  adminUserId: string;
}) {
  const recipient = await resolveOrderCustomerEmail(args.order);
  let emailId: string | null = null;

  if (recipient) {
    try {
      emailId = await sendMetalWeightAdjustmentEmail({
        to: recipient.email,
        customerName: recipient.name,
        orderNumber: args.order.order_number,
        itemName: args.itemName,
        oldWeightGrams: args.oldWeightGrams,
        newWeightGrams: args.newWeightGrams,
        kind: args.copy.kind,
        totalDelta: args.totalDelta,
        orderTotal: args.orderTotal,
        amountPaid: args.amountPaid,
        amountDue: args.amountDue,
        refundDue: args.refundDue,
        note: args.note,
      });
    } catch (err) {
      console.error('[metal-weight] email failed', err);
    }
  }

  if (args.order.customer_id) {
    await notifyUser({
      recipientUserId: args.order.customer_id,
      type: 'order_metal_weight_adjusted',
      title: args.copy.title,
      message: args.note ? `${args.copy.message} ${args.note}` : args.copy.message,
      href: '/account/orders',
      entityType: 'order',
      entityId: args.orderId,
      metadata: {
        order_number: args.order.order_number,
        old_weight_grams: args.oldWeightGrams,
        new_weight_grams: args.newWeightGrams,
        total_delta: args.totalDelta,
        amount_due: args.amountDue,
        refund_due: args.refundDue,
      },
    });
  }

  const db = asUntypedSupabase(createAdminClient());
  const now = new Date().toISOString();
  await db.from('order_tracking_events').insert({
    order_id: args.orderId,
    status: args.order.status,
    event_time: now,
    note: args.copy.message + (args.note ? ` ${args.note}` : ''),
    is_customer_visible: true,
    created_by: args.adminUserId,
  });

  await db.from('notification_log').insert({
    type: 'email',
    recipient: recipient?.email ?? 'unknown',
    template: 'order_metal_weight_adjusted',
    context: {
      order_id: args.orderId,
      order_number: args.order.order_number,
      amount_due: args.amountDue,
      refund_due: args.refundDue,
      resend_message_id: emailId,
    },
    status: emailId ? 'sent' : recipient ? 'failed' : 'skipped',
  });

  return {
    email_sent: Boolean(emailId),
    in_app_sent: Boolean(args.order.customer_id),
  };
}

/**
 * POST /api/admin/orders/[id]/metal-weight
 * Update actual metal weight on a jewelry line, or resend the adjustment notification.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminAccess('orders.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const orderRow = order as Order;
  const items = (Array.isArray(orderRow.items) ? orderRow.items : []) as unknown as OrderItemRecord[];

  if (parsed.data.action === 'notify') {
    const idx =
      parsed.data.item_index ??
      items.findIndex((item) => {
        const p = parseConfigurationSnapshot(item.configuration_snapshot)?.pricing;
        return Number(p?.metal_weight_grams ?? 0) > 0 && Number(p?.gold_rate_per_gram ?? 0) > 0;
      });
    if (idx < 0 || idx >= items.length) {
      return NextResponse.json({ error: 'No jewelry line with metal weight found.' }, { status: 400 });
    }
    const item = items[idx]!;
    const pricing = parseConfigurationSnapshot(item.configuration_snapshot)?.pricing;
    if (!pricing) {
      return NextResponse.json({ error: 'Selected item has no configuration pricing.' }, { status: 400 });
    }
    const newWeight = Number(pricing.metal_weight_grams ?? 0);
    const oldWeight = Number(pricing.quoted_metal_weight_grams ?? newWeight);
    const amountPaid = Number(orderRow.amount_paid ?? 0);
    const amountDue = Number(orderRow.amount_due ?? Math.max(0, Number(orderRow.total) - amountPaid));
    const refundDue = Math.max(0, amountPaid - Number(orderRow.total));
    const totalDelta = Number(orderRow.total) - (
      // ponytail: notify-only has no fresh delta; derive sign from due/refund
      refundDue > 0 ? -refundDue : amountDue > 0 ? amountDue : 0
    );
    const copy = buildMetalWeightNotifyCopy({
      orderNumber: orderRow.order_number,
      oldWeightGrams: oldWeight,
      newWeightGrams: newWeight,
      totalDelta,
      amountDue,
      refundDue,
      itemName: item.name,
    });

    const notifyResult = await sendMetalWeightNotifications({
      order: orderRow,
      orderId: id,
      copy,
      oldWeightGrams: oldWeight,
      newWeightGrams: newWeight,
      totalDelta,
      amountDue,
      refundDue,
      orderTotal: Number(orderRow.total),
      amountPaid,
      itemName: item.name,
      note: parsed.data.note ?? null,
      adminUserId: auth.user.id,
    });

    await logAdminAction({
      userId: auth.user.id,
      action: 'order_metal_weight_notify',
      resourceType: 'order',
      resourceId: id,
      details: { order_number: orderRow.order_number, item_index: idx },
      ipAddress: getRequestIp(request),
    });

    return NextResponse.json({ success: true, ...notifyResult, copy });
  }

  const { item_index, metal_weight_grams, notify, note } = parsed.data;
  if (item_index >= items.length) {
    return NextResponse.json({ error: 'Invalid item index.' }, { status: 400 });
  }

  const item = items[item_index]!;
  let adjust;
  try {
    adjust = applyMetalWeightToPricing(item.configuration_snapshot, metal_weight_grams);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to adjust metal weight.' },
      { status: 400 },
    );
  }

  if (adjust.kind === 'unchanged' && adjust.oldWeightGrams === adjust.newWeightGrams) {
    return NextResponse.json({ error: 'Metal weight is unchanged.' }, { status: 400 });
  }

  const snap = parseConfigurationSnapshot(item.configuration_snapshot) ?? {};
  const nextSnapshot = {
    ...snap,
    pricing: adjust.nextPricing,
  };

  const nextItems = items.map((row, i) =>
    i === item_index
      ? { ...row, configuration_snapshot: nextSnapshot }
      : row,
  );

  const money = applyMetalDeltaToOrderMoney({
    metal_charges: Number(orderRow.metal_charges ?? 0),
    jewelry_charges: Number(orderRow.jewelry_charges ?? 0),
    gst_amount: Number(orderRow.gst_amount ?? 0),
    total: Number(orderRow.total ?? 0),
    amount_paid: Number(orderRow.amount_paid ?? 0),
    quantity: item.quantity ?? 1,
    metalDelta: adjust.metalDelta,
    makingDelta: adjust.makingDelta,
    gstDelta: adjust.gstDelta,
    totalDelta: adjust.totalDelta,
  });

  const { error: updateError } = await db
    .from('orders')
    .update({
      items: nextItems as unknown as Json,
      metal_charges: money.metal_charges,
      jewelry_charges: money.jewelry_charges,
      gst_amount: money.gst_amount,
      total: money.total,
      amount_due: money.amount_due,
      payment_status: money.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[metal-weight] order update failed', updateError);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }

  if (item.configuration_id) {
    const diamond = Number(adjust.nextPricing.diamond_charge ?? 0);
    const makingOnly = Number(adjust.nextPricing.making_charge ?? 0);
    await db
      .from('product_configurations')
      .update({
        metal_weight_grams: adjust.newWeightGrams,
        metal_price: adjust.newMetalPrice,
        // Column stores making + diamond (same as create config).
        making_charge: makingOnly + diamond,
        total_price: adjust.nextPricing.total ?? null,
        configuration_snapshot: nextSnapshot as unknown as Json,
        pricing_snapshot: adjust.nextPricing as unknown as Json,
      })
      .eq('id', item.configuration_id);
  }

  const copy = buildMetalWeightNotifyCopy({
    orderNumber: orderRow.order_number,
    oldWeightGrams: adjust.oldWeightGrams,
    newWeightGrams: adjust.newWeightGrams,
    totalDelta: adjust.totalDelta * Math.max(1, item.quantity ?? 1),
    amountDue: money.amount_due,
    refundDue: money.refund_due,
    itemName: item.name,
  });

  let notifyResult = { email_sent: false, in_app_sent: false };
  if (notify) {
    notifyResult = await sendMetalWeightNotifications({
      order: { ...orderRow, total: money.total, amount_due: money.amount_due, payment_status: money.payment_status },
      orderId: id,
      copy,
      oldWeightGrams: adjust.oldWeightGrams,
      newWeightGrams: adjust.newWeightGrams,
      totalDelta: adjust.totalDelta * Math.max(1, item.quantity ?? 1),
      amountDue: money.amount_due,
      refundDue: money.refund_due,
      orderTotal: money.total,
      amountPaid: Number(orderRow.amount_paid ?? 0),
      itemName: item.name,
      note: note ?? null,
      adminUserId: auth.user.id,
    });
  } else {
    // Still leave an internal trail when notify is off.
    await db.from('order_tracking_events').insert({
      order_id: id,
      status: orderRow.status,
      event_time: new Date().toISOString(),
      note: `[Admin] ${copy.message}`,
      is_customer_visible: false,
      created_by: auth.user.id,
    });
  }

  await logAdminAction({
    userId: auth.user.id,
    action: 'order_metal_weight_update',
    resourceType: 'order',
    resourceId: id,
    details: {
      order_number: orderRow.order_number,
      item_index,
      old_weight: adjust.oldWeightGrams,
      new_weight: adjust.newWeightGrams,
      total_delta: adjust.totalDelta,
      amount_due: money.amount_due,
      refund_due: money.refund_due,
      notified: notify,
    },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    success: true,
    adjust,
    money,
    copy,
    ...notifyResult,
  });
}
