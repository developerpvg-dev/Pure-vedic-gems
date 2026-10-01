/**
 * One-shot: add Emerald 7.11ct (₹40,165) to PVG-2026-00063; leave balance pending.
 *
 *   npx tsx scripts/db/_patch-order-00063-add-emerald.ts
 *   npx tsx scripts/db/_patch-order-00063-add-emerald.ts --write
 */
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { roundMoney } from '../../src/lib/orders/counter-payments';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const WRITE = process.argv.includes('--write');
const ORDER_NUMBER = 'PVG-2026-00063';
const PRODUCT_SLUG = 'emerald-7-11ct-5665per-ct-super-premium-natura-gemstone';
const MARKER = 'pvg00063-emerald-711';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: product, error: pErr } = await sb
    .from('products')
    .select(
      'id, name, sku, price, carat_weight, origin, images, category, tag_number, availability_status',
    )
    .eq('slug', PRODUCT_SLUG)
    .single();
  if (pErr || !product) throw new Error(pErr?.message ?? 'Product not found');

  const itemPrice = roundMoney(Number(product.price));
  const imageUrl = Array.isArray(product.images) && product.images[0] ? String(product.images[0]) : '';

  const { data: order, error } = await sb
    .from('orders')
    .select('*')
    .eq('order_number', ORDER_NUMBER)
    .single();
  if (error || !order) throw new Error(error?.message ?? 'Order not found');

  const items = Array.isArray(order.items) ? [...order.items] : [];
  const already = items.some(
    (i: { product_id?: string; configuration_snapshot?: { marker?: string } }) =>
      i.configuration_snapshot?.marker === MARKER || i.product_id === product.id,
  );
  if (already) {
    console.log('Emerald already on order — aborting.');
    return;
  }

  if (product.availability_status !== 'in_stock') {
    throw new Error(`Product not in_stock (status=${product.availability_status})`);
  }

  const newItem = {
    product_id: product.id,
    name: product.name,
    sku: product.sku,
    tag_number: product.tag_number,
    quantity: 1,
    unit_price: itemPrice,
    line_total: itemPrice,
    carat_weight: product.carat_weight,
    origin: product.origin,
    image_url: imageUrl,
    category: product.category,
    configuration_id: null,
    configuration_summary: null,
    configuration_snapshot: { marker: MARKER, source: 'admin_order_patch' },
  };

  const nextItems = [...items, newItem];
  const amountPaid = roundMoney(Number(order.amount_paid ?? 0));
  const nextSubtotal = roundMoney(Number(order.subtotal ?? 0) + itemPrice);
  const nextTotal = roundMoney(Number(order.total ?? 0) + itemPrice);
  const nextDue = roundMoney(Math.max(0, nextTotal - amountPaid));
  const paymentStatus = nextDue > 0.009 ? 'partial' : 'captured';

  // Balance pending → payment hold (not paid hold)
  const holdUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const reservationNote = `Payment hold for ${ORDER_NUMBER}`;

  console.log({
    dry_run: !WRITE,
    product: { id: product.id, name: product.name, sku: product.sku, price: itemPrice },
    items_before: items.length,
    items_after: nextItems.length,
    before: {
      subtotal: order.subtotal,
      total: order.total,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      payment_status: order.payment_status,
    },
    after: {
      subtotal: nextSubtotal,
      total: nextTotal,
      amount_paid: amountPaid,
      amount_due: nextDue,
      payment_status: paymentStatus,
    },
  });

  if (!WRITE) {
    console.log('Dry run only. Re-run with --write to apply.');
    return;
  }

  const { error: updErr } = await sb
    .from('orders')
    .update({
      items: nextItems,
      subtotal: nextSubtotal,
      total: nextTotal,
      amount_due: nextDue,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);
  if (updErr) throw new Error(`Order update failed: ${updErr.message}`);

  const { error: holdErr } = await sb
    .from('products')
    .update({
      availability_status: 'reserved',
      stock_status: 'out_of_stock',
      in_stock: false,
      reserved_until: holdUntil,
      reserved_quantity: 1,
      reservation_note: reservationNote,
      reserved_by_customer_id: order.customer_id ?? null,
    })
    .eq('id', product.id)
    .eq('availability_status', 'in_stock');
  if (holdErr) throw new Error(`Inventory hold failed: ${holdErr.message}`);

  const note = `Added Emerald 7.11ct ₹${itemPrice}. Total now ₹${nextTotal}; balance pending ₹${nextDue}.`;
  await sb.from('order_tracking_events').insert({
    order_id: order.id,
    status: order.status,
    event_time: new Date().toISOString(),
    note,
    is_customer_visible: true,
  });

  console.log('Updated', ORDER_NUMBER, `— Emerald ₹${itemPrice} added; due ₹${nextDue}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
