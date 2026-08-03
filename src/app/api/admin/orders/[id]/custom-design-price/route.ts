import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { notifyUser } from '@/lib/notifications/in-app';
import { resolveOrderCustomerEmail } from '@/lib/orders/resolve-order-email';
import { sendBalanceDueEmail } from '@/lib/resend/send-balance-due';
import {
  applyCustomDesignDeltaToOrderMoney,
  applyCustomDesignPriceToPricing,
  buildCustomDesignPriceNotifyCopy,
} from '@/lib/orders/custom-design-price-adjust';
import { applyJewelleryGstDeltaToTaxBreakdown } from '@/lib/orders/tax-breakdown-display';
import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import type { Order } from '@/lib/types/database';
import type { OrderItemRecord } from '@/lib/types/order';
import type { Json } from '@/lib/types/database';

const bodySchema = z.object({
  item_index: z.number().int().nonnegative(),
  mode: z.enum(['weight', 'fixed']),
  metal: z.string().trim().min(1).max(80).optional().nullable(),
  metal_weight_grams: z.coerce.number().positive().max(5000).optional(),
  gold_rate_per_gram: z.coerce.number().positive().max(1_000_000).optional(),
  labor_rate_percent: z.coerce.number().min(0).max(200).optional(),
  making_charge: z.coerce.number().min(0).max(10_000_000).optional(),
  metal_price: z.coerce.number().min(0).max(10_000_000).optional(),
  diamond_charge: z.coerce.number().min(0).max(10_000_000).optional(),
  custom_design_fee: z.coerce.number().min(0).max(10_000_000).optional(),
  notify: z.boolean().default(true),
  note: z.string().trim().max(500).optional(),
});

/**
 * POST /api/admin/orders/[id]/custom-design-price
 * Set metal/weight/labor (or fixed making) on a custom-design line after review.
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
  const { item_index, notify, note, ...priceInput } = parsed.data;

  if (item_index >= items.length) {
    return NextResponse.json({ error: 'Invalid item index.' }, { status: 400 });
  }

  const item = items[item_index]!;
  let adjust;
  try {
    adjust = applyCustomDesignPriceToPricing(item.configuration_snapshot, priceInput);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to set custom design price.' },
      { status: 400 },
    );
  }

  const snap = parseConfigurationSnapshot(item.configuration_snapshot) ?? {};
  const nextSnapshot = {
    ...snap,
    selections: adjust.nextSelections,
    pricing: adjust.nextPricing,
  };

  const nextItems = items.map((row, i) =>
    i === item_index ? { ...row, configuration_snapshot: nextSnapshot } : row,
  );

  const money = applyCustomDesignDeltaToOrderMoney({
    metal_charges: Number(orderRow.metal_charges ?? 0),
    jewelry_charges: Number(orderRow.jewelry_charges ?? 0),
    gst_amount: Number(orderRow.gst_amount ?? 0),
    total: Number(orderRow.total ?? 0),
    amount_paid: Number(orderRow.amount_paid ?? 0),
    quantity: item.quantity ?? 1,
    metalDelta: adjust.metalDelta,
    makingDelta: adjust.makingDelta,
    diamondDelta: adjust.diamondDelta,
    customFeeDelta: adjust.customFeeDelta,
    gstDelta: adjust.gstDelta,
    totalDelta: adjust.totalDelta,
  });

  const qty = Math.max(1, Math.round(item.quantity ?? 1));
  const jewelleryTaxableDelta =
    (adjust.metalDelta + adjust.makingDelta + adjust.diamondDelta + adjust.customFeeDelta) * qty;
  const nextTaxBreakdown = applyJewelleryGstDeltaToTaxBreakdown(orderRow.tax_breakdown, {
    gstDelta: adjust.gstDelta * qty,
    jewelleryTaxableDelta,
    nextGstAmount: money.gst_amount,
  });

  const { error: updateError } = await db
    .from('orders')
    .update({
      items: nextItems as unknown as Json,
      metal_charges: money.metal_charges,
      jewelry_charges: money.jewelry_charges,
      gst_amount: money.gst_amount,
      tax_breakdown: (nextTaxBreakdown ?? orderRow.tax_breakdown) as Json,
      total: money.total,
      amount_due: money.amount_due,
      payment_status: money.payment_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[custom-design-price] order update failed', updateError);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }

  if (item.configuration_id) {
    const diamond = Number(adjust.nextPricing.diamond_charge ?? 0);
    const makingOnly = Number(adjust.nextPricing.making_charge ?? 0);
    await db
      .from('product_configurations')
      .update({
        metal: adjust.nextSelections.metal ?? null,
        metal_weight_grams: adjust.nextPricing.metal_weight_grams ?? null,
        metal_price: adjust.nextPricing.metal_price ?? null,
        gold_rate_per_gram: adjust.nextPricing.gold_rate_per_gram ?? null,
        making_charge: makingOnly + diamond,
        custom_design_fee: adjust.nextPricing.custom_design_fee ?? 0,
        custom_design_status: 'priced',
        total_price: adjust.nextPricing.total ?? null,
        configuration_snapshot: nextSnapshot as unknown as Json,
        pricing_snapshot: adjust.nextPricing as unknown as Json,
        status: 'draft',
      })
      .eq('id', item.configuration_id);
  }

  const copy = buildCustomDesignPriceNotifyCopy({
    orderNumber: orderRow.order_number,
    amountDue: money.amount_due,
    totalDelta: adjust.totalDelta * Math.max(1, item.quantity ?? 1),
    itemName: item.name,
  });

  let emailSent = false;
  let inAppSent = false;

  if (notify) {
    const recipient = await resolveOrderCustomerEmail(orderRow);
    if (recipient && money.amount_due > 0.009) {
      try {
        const messageId = await sendBalanceDueEmail({
          to: recipient.email,
          customerName: recipient.name,
          orderNumber: orderRow.order_number,
          total: money.total,
          amountPaid: Number(orderRow.amount_paid ?? 0),
          amountDue: money.amount_due,
          note: note
            ? `${copy.message} ${note}`
            : `${copy.message} Your custom design mounting has been added to the order total.`,
        });
        emailSent = Boolean(messageId);
      } catch (err) {
        console.error('[custom-design-price] email failed', err);
      }
    }

    if (orderRow.customer_id) {
      await notifyUser({
        recipientUserId: orderRow.customer_id,
        type: 'order_custom_design_priced',
        title: copy.title,
        message: note ? `${copy.message} ${note}` : copy.message,
        href: '/account/orders',
        entityType: 'order',
        entityId: id,
        metadata: {
          order_number: orderRow.order_number,
          amount_due: money.amount_due,
          total_delta: adjust.totalDelta,
        },
      });
      inAppSent = true;
    }

    await db.from('order_tracking_events').insert({
      order_id: id,
      status: orderRow.status,
      event_time: new Date().toISOString(),
      note: copy.message + (note ? ` ${note}` : ''),
      is_customer_visible: true,
      created_by: auth.user.id,
    });
  } else {
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
    action: 'order_custom_design_price',
    resourceType: 'order',
    resourceId: id,
    details: {
      order_number: orderRow.order_number,
      item_index,
      mode: priceInput.mode,
      total_delta: adjust.totalDelta,
      amount_due: money.amount_due,
      notified: notify,
    },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({
    success: true,
    adjust,
    money,
    copy,
    email_sent: emailSent,
    in_app_sent: inAppSent,
  });
}
