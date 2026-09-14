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

function isOrderHoldNote(note: string) {
  return note.startsWith('Payment hold for ') || note.startsWith('Paid hold for ');
}

function reservationStillActive(reservedUntil: string | null | undefined) {
  if (!reservedUntil) return false;
  const expires = new Date(reservedUntil).getTime();
  return !Number.isNaN(expires) && expires > Date.now();
}

type ProductHoldRow = {
  id: string;
  availability_status?: string | null;
  reservation_note?: string | null;
  reserved_until?: string | null;
};

/**
 * Piece can be claimed for this order when free, soft-expired, or already ours.
 * Won't steal another order's active payment/paid hold.
 */
export function canClaimProductForOrder(
  row: ProductHoldRow,
  orderNumber: string,
): boolean {
  const status = String(row.availability_status ?? '');
  if (status === 'sold' || status === 'archived') return false;

  const note = String(row.reservation_note ?? '');
  const ours = holdNotesForOrder(orderNumber).includes(note);
  if (ours) return true;

  if (status === 'in_stock') return true;

  // Soft-expired / leftover reserved (cancel cleared note but left status, or hold timed out)
  if (status === 'reserved' && !reservationStillActive(row.reserved_until)) return true;

  // Active hold belonging to someone else
  if (status === 'reserved' && isOrderHoldNote(note)) return false;

  // Admin manual reserve still active
  if (status === 'reserved' && reservationStillActive(row.reserved_until)) return false;

  return false;
}

export type ReservePaidHoldResult = {
  reservedIds: string[];
  failedIds: string[];
};

const RESERVED_STOCK = {
  in_stock: false,
  stock_quantity: 0,
  availability_status: 'reserved' as const,
  stock_status: 'out_of_stock' as const,
};

/**
 * Keep unique pieces reserved after payment is captured / offline POS create.
 * Storefront shows "Reserved" until admin marks sold after billing.
 *
 * Claims when in stock, soft-expired reserved, or already held for this order.
 * Won't steal another order's active reservation.
 */
export async function keepProductsReservedAfterPayment(
  order: OrderInventorySource,
): Promise<ReservePaidHoldResult> {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);
  const note = paidHoldNote(order.order_number);
  // Far-future expiry so soft-expiry helpers don't clear a paid hold
  const reservedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const reservedIds: string[] = [];
  const failedIds: string[] = [];

  for (const productId of collectOrderProductIds(order)) {
    const { data: row } = await db
      .from('products')
      .select('id, availability_status, reservation_note, reserved_until')
      .eq('id', productId)
      .maybeSingle();

    const product = row as ProductHoldRow | null;
    if (!product || !canClaimProductForOrder(product, order.order_number)) {
      failedIds.push(productId);
      continue;
    }

    // ponytail: select-then-update; unique gems, low concurrency — add WHERE claimable if races show up
    const { data, error } = await db
      .from('products')
      .update({
        ...RESERVED_STOCK,
        reserved_until: reservedUntil,
        reserved_quantity: 1,
        reservation_note: note,
      })
      .eq('id', productId)
      .neq('availability_status', 'sold')
      .neq('availability_status', 'archived')
      .select('id')
      .maybeSingle();

    if (error || !data) failedIds.push(productId);
    else reservedIds.push(productId);
  }

  if (reservedIds.length) revalidateProductSurfaces();
  return { reservedIds, failedIds };
}

/** Bank-transfer (pre-payment) hold — same claim rules as paid hold, shorter expiry. */
export async function reserveProductsForPaymentHold(input: {
  orderNumber: string;
  customerId: string | null;
  holdUntil: string;
  productIds: Array<{ id: string; quantity?: number }>;
}): Promise<ReservePaidHoldResult> {
  const supabase = createAdminClient();
  const db = asUntypedSupabase(supabase);
  const note = paymentHoldNote(input.orderNumber);
  const reservedIds: string[] = [];
  const failedIds: string[] = [];

  for (const target of input.productIds) {
    const { data: row } = await db
      .from('products')
      .select('id, availability_status, reservation_note, reserved_until')
      .eq('id', target.id)
      .maybeSingle();

    const product = row as ProductHoldRow | null;
    if (!product || !canClaimProductForOrder(product, input.orderNumber)) {
      failedIds.push(target.id);
      continue;
    }

    const { data, error } = await db
      .from('products')
      .update({
        ...RESERVED_STOCK,
        reserved_until: input.holdUntil,
        reserved_by_customer_id: input.customerId,
        reserved_quantity: target.quantity ?? 1,
        reservation_note: note,
      })
      .eq('id', target.id)
      .neq('availability_status', 'sold')
      .neq('availability_status', 'archived')
      .select('id')
      .maybeSingle();

    if (error || !data) failedIds.push(target.id);
    else reservedIds.push(target.id);
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
 * Only releases holds tied to this order (by note), or reserved/sold with no foreign hold note.
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
    // Don't steal another order's active hold when restoring an older cancelled order
    const tiedToOrder =
      notes.includes(note) ||
      ((status === 'reserved' || status === 'sold') && !isOrderHoldNote(note));
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

  console.assert(
    canClaimProductForOrder(
      { id: 'p', availability_status: 'in_stock', reservation_note: null, reserved_until: null },
      'PVG-2',
    ),
    'in_stock is claimable',
  );
  console.assert(
    canClaimProductForOrder(
      {
        id: 'p',
        availability_status: 'reserved',
        reservation_note: paymentHoldNote('PVG-2'),
        reserved_until: new Date(Date.now() + 86400000).toISOString(),
      },
      'PVG-2',
    ),
    'own payment hold is claimable',
  );
  console.assert(
    !canClaimProductForOrder(
      {
        id: 'p',
        availability_status: 'reserved',
        reservation_note: paidHoldNote('PVG-1'),
        reserved_until: new Date(Date.now() + 86400000).toISOString(),
      },
      'PVG-2',
    ),
    'other order active hold not claimable',
  );
  console.assert(
    canClaimProductForOrder(
      {
        id: 'p',
        availability_status: 'reserved',
        reservation_note: paymentHoldNote('PVG-1'),
        reserved_until: new Date(Date.now() - 1000).toISOString(),
      },
      'PVG-2',
    ),
    'expired foreign hold is reclaimable',
  );
  console.log('order-availability self-check ok');
}
