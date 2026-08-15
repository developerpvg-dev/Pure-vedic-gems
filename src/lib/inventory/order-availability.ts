import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { notifyLowStockProduct } from '@/lib/inventory/stock-alerts';
import { queueErpOutboundSale } from '@/lib/erp/sync';
import { getRudrakshaProductIdsFromSnapshot } from '@/lib/utils/rudraksha-order-display';
import { cancelRewardRedemption } from '@/lib/rewards/service';
import { revalidateProductSurfaces } from '@/lib/shop/revalidate';

export type OrderInventoryItem = {
  product_id?: string | null;
  name?: string;
  quantity?: number;
  tag_number?: string | null;
  configuration_snapshot?: unknown;
};

export type OrderInventorySource = {
  id: string;
  order_number: string;
  guest_phone?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  items?: unknown;
};

export function paymentHoldNote(orderNumber: string) {
  return `Payment hold for ${orderNumber}`;
}

export function paidHoldNote(orderNumber: string) {
  return `Paid hold for ${orderNumber}`;
}

function orderLineItems(order: OrderInventorySource): OrderInventoryItem[] {
  return Array.isArray(order.items) ? (order.items as OrderInventoryItem[]) : [];
}

/** Collect unique physical product IDs tied to an order (lines + configured beads). */
export function collectOrderProductIds(order: OrderInventorySource): string[] {
  const ids = new Set<string>();
  for (const item of orderLineItems(order)) {
    if (item.product_id) ids.add(item.product_id);
    for (const beadId of getRudrakshaProductIdsFromSnapshot(item.configuration_snapshot)) {
      ids.add(beadId);
    }
  }
  return Array.from(ids);
}

function holdNotesForOrder(orderNumber: string) {
  return [paymentHoldNote(orderNumber), paidHoldNote(orderNumber)];
}

export type ReservePaidHoldResult = {
  reservedIds: string[];
  failedIds: string[];
};

/**
 * Keep unique pieces reserved after payment is captured / offline POS create.
 * Storefront shows "Reserved" until admin marks sold after billing.
 *
 * Claims only when the piece is still in stock, or already held for this order
 * (payment hold → paid hold upgrade). Won't steal another order's reservation.
 */
export async function keepProductsReservedAfterPayment(
  order: OrderInventorySource,
): Promise<ReservePaidHoldResult> {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);
  const note = paidHoldNote(order.order_number);
  const priorHold = paymentHoldNote(order.order_number);
  // Far-future expiry so soft-expiry helpers don't clear a paid hold
  const reservedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const reservedIds: string[] = [];
  const failedIds: string[] = [];

  for (const productId of collectOrderProductIds(order)) {
    const { data, error } = await db
      .from('products')
      .update({
        in_stock: false,
        stock_quantity: 0,
        availability_status: 'reserved',
        stock_status: 'out_of_stock',
        reserved_until: reservedUntil,
        reserved_quantity: 1,
        reservation_note: note,
      })
      .eq('id', productId)
      .neq('availability_status', 'sold')
      .neq('availability_status', 'archived')
      // in_stock (Razorpay after successful pay) OR already this order's hold
      .or(
        `availability_status.eq.in_stock,reservation_note.eq."${priorHold}",reservation_note.eq."${note}"`,
      )
      .select('id')
      .maybeSingle();

    if (error || !data) failedIds.push(productId);
    else reservedIds.push(productId);
  }

  if (reservedIds.length) revalidateProductSurfaces();
  return { reservedIds, failedIds };
}

/** Admin marks billing complete → piece shows as Sold on the website + ERP sale queue. */
export async function markProductsSoldForOrder(order: OrderInventorySource) {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);
  const items = orderLineItems(order);
  const productIds = collectOrderProductIds(order);

  for (const productId of productIds) {
    const { data: product } = await db
      .from('products')
      .select('id, sku, name, category, tag_number')
      .eq('id', productId)
      .single();

    if (!product) continue;

    const row = product as {
      id: string;
      sku?: string | null;
      name: string;
      category?: string | null;
      tag_number?: string | null;
    };

    await db
      .from('products')
      .update({
        in_stock: false,
        stock_quantity: 0,
        availability_status: 'sold',
        stock_status: 'out_of_stock',
        reserved_until: null,
        reserved_by_customer_id: null,
        reserved_quantity: 0,
        reservation_note: null,
      })
      .eq('id', productId)
      .then(null, () => undefined);

    const line = items.find((item) => item.product_id === productId);
    const tagNumber = line?.tag_number ?? row.tag_number;
    if (tagNumber) {
      await queueErpOutboundSale({
        tagNumber,
        orderId: order.id,
        productId: row.id,
        payload: {
          order_number: order.order_number,
          source: 'admin_mark_sold',
          mobile: order.guest_phone,
          customer_name: order.guest_name,
          email: order.guest_email,
          quantity: line?.quantity ?? 1,
        },
      }).catch(() => undefined);
    }

    await notifyLowStockProduct(
      {
        id: row.id,
        sku: row.sku ?? null,
        name: row.name,
        category: row.category ?? null,
        stock_quantity: 0,
      },
      'order_marked_sold',
    );
  }

  if (productIds.length) revalidateProductSurfaces();
}

/** Product IDs for one order line (main SKU + configured rudraksha beads). */
export function collectLineProductIds(item: OrderInventoryItem): string[] {
  const ids = new Set<string>();
  if (item.product_id) ids.add(item.product_id);
  for (const beadId of getRudrakshaProductIdsFromSnapshot(item.configuration_snapshot)) {
    ids.add(beadId);
  }
  return Array.from(ids);
}

/**
 * Restore pieces to in-stock after cancel / return / refund.
 * Matches payment-hold or paid-hold notes, and also restores if currently reserved/sold for these IDs.
 * Pass `productIds` to restore only those pieces (must belong to the order).
 */
export async function releaseProductsForOrder(
  order: OrderInventorySource,
  productIds?: string[],
): Promise<string[]> {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);
  const notes = holdNotesForOrder(order.order_number);
  const allowed = new Set(collectOrderProductIds(order));
  const targets = productIds?.length
    ? [...new Set(productIds)].filter((id) => allowed.has(id))
    : [...allowed];
  const restored: string[] = [];

  for (const productId of targets) {
    const { data: product } = await db
      .from('products')
      .select('id, availability_status, reservation_note')
      .eq('id', productId)
      .single();

    if (!product) continue;

    const note = String((product as { reservation_note?: string | null }).reservation_note ?? '');
    const status = String((product as { availability_status?: string | null }).availability_status ?? '');
    const tiedToOrder = notes.includes(note) || status === 'reserved' || status === 'sold';
    if (!tiedToOrder) continue;

    const { error } = await db
      .from('products')
      .update({
        in_stock: true,
        stock_quantity: 1,
        availability_status: 'in_stock',
        stock_status: 'in_stock',
        reserved_until: null,
        reserved_by_customer_id: null,
        reserved_by_admin_id: null,
        reserved_quantity: 0,
        reservation_note: null,
      })
      .eq('id', productId);
    if (!error) restored.push(productId);
  }

  if (restored.length) revalidateProductSurfaces();
  return restored;
}

export async function cancelOrderAndReleaseInventory(
  order: OrderInventorySource & { status?: string },
  reason?: string,
) {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);

  await db
    .from('orders')
    .update({
      status: 'cancelled',
      ...(reason ? { payment_failure_reason: reason } : {}),
    })
    .eq('id', order.id);

  await releaseProductsForOrder(order);
  await cancelRewardRedemption(order.id);
}

// ponytail: runnable self-check — `npx tsx -e "import { __orderAvailabilitySelfCheck } from './src/lib/inventory/order-availability.ts'; __orderAvailabilitySelfCheck()"`
export function __orderAvailabilitySelfCheck() {
  console.assert(paymentHoldNote('PVG-1') === 'Payment hold for PVG-1');
  console.assert(paidHoldNote('PVG-1') === 'Paid hold for PVG-1');
  const ids = collectOrderProductIds({
    id: 'o1',
    order_number: 'PVG-1',
    items: [
      { product_id: 'a', configuration_snapshot: null },
      { product_id: 'a' },
      { product_id: 'b' },
    ],
  });
  console.assert(ids.length === 2 && ids.includes('a') && ids.includes('b'), 'dedupe product ids');
  const lineIds = collectLineProductIds({ product_id: 'main' });
  console.assert(lineIds.length === 1 && lineIds[0] === 'main', 'line product id');
  console.log('order-availability self-check ok');
}
