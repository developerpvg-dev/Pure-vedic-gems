import type { z } from 'zod';
import type { PricingBreakdown, PricingOfflineOptions } from '@/lib/utils/pricing';
import type { OfflineOrderItemSchema } from '@/lib/validators/order';
import { collectOrderProductIds, type OrderInventorySource } from '@/lib/inventory/order-availability';
import { roundMoney } from '@/lib/orders/counter-payments';

type AdminOrderClientItem = z.infer<typeof OfflineOrderItemSchema>;

/** Order `items` JSON from server-priced lines + the admin form's line metadata (create + edit). */
export function buildAdminOrderItems(
  pricedItems: PricingBreakdown['items'],
  clientItems: AdminOrderClientItem[],
) {
  return pricedItems.map((pricedItem) => {
    const clientItem = clientItems.find((i) =>
      pricedItem.line_id
        ? i.line_id === pricedItem.line_id
        : Boolean(pricedItem.product_id && i.product_id === pricedItem.product_id),
    );
    const manualSnapshot = clientItem?.manual_design
      ? {
          source: 'offline_manual_design',
          manual_design: clientItem.manual_design,
        }
      : null;
    const designBits =
      clientItem?.design_id || clientItem?.design_name
        ? {
            design_id: clientItem.design_id ?? null,
            design_name: clientItem.design_name ?? null,
          }
        : null;
    const snapshot =
      clientItem?.configuration_snapshot ??
      manualSnapshot ??
      (designBits
        ? { source: 'offline_pos', selections: { design: designBits } }
        : null);

    return {
      product_id: pricedItem.product_id || null,
      name: clientItem?.name || pricedItem.name,
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
        (clientItem?.manual_design?.description
          ? `Manual design: ${clientItem.manual_design.description}`
          : clientItem?.manual_design
            ? 'Customer-provided manual design'
            : null) ??
        (clientItem?.design_name ? `Design: ${clientItem.design_name}` : null),
      configuration_snapshot: snapshot,
    };
  });
}

export type EditableOrderRow = OrderInventorySource & {
  coupon_code?: string | null;
  reward_points_redeemed?: number | null;
  reward_discount?: number | null;
};

/** Re-price an existing order: its own pieces, coupon and reward redemption stay valid. */
export function orderEditPricingOptions(order: EditableOrderRow): PricingOfflineOptions {
  const rewardDiscount = Number(order.reward_discount ?? 0);
  return {
    heldProductIds: collectOrderProductIds(order),
    keepCouponCode: order.coupon_code ?? null,
    rewardOverride:
      rewardDiscount > 0
        ? { points: Number(order.reward_points_redeemed ?? 0), discount: rewardDiscount }
        : undefined,
  };
}

/**
 * Balances after the total changes. Money already received stays as recorded;
 * `overpaid` > 0 means the new total is below what was paid (refund the difference).
 */
export function editedOrderBalances(
  order: { total: number; amount_paid?: number | null; payment_status?: string | null },
  newTotal: number,
) {
  const storedPaid = Number(order.amount_paid ?? 0);
  // Older online orders predate amount_paid — captured meant fully paid.
  const paid = roundMoney(
    storedPaid > 0 ? storedPaid : order.payment_status === 'captured' ? Number(order.total) : 0,
  );
  const total = roundMoney(newTotal);
  const due = roundMoney(Math.max(0, total - paid));
  const paymentStatus =
    paid <= 0.009 ? order.payment_status ?? 'pending' : due > 0.009 ? 'partial' : 'captured';
  return {
    amount_paid: paid,
    amount_due: due,
    payment_status: paymentStatus,
    overpaid: roundMoney(Math.max(0, paid - total)),
  };
}
