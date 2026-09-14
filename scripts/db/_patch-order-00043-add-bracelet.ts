/**
 * One-shot: add Bracelet ₹2500 (design photo) to PVG-2026-00043.
 *
 *   npx tsx scripts/db/_patch-order-00043-add-bracelet.ts
 *   npx tsx scripts/db/_patch-order-00043-add-bracelet.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { roundMoney } from '../../src/lib/orders/counter-payments';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const WRITE = process.argv.includes('--write');
const ORDER_NUMBER = 'PVG-2026-00043';
const ITEM_NAME = 'Bracelet';
const ITEM_PRICE = 2500;
const IMAGE_PATH = resolve(process.cwd(), '..', 'image.png');
const BUCKET = 'custom-uploads';
const MARKER = 'pvg00043-bracelet';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');

  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: order, error } = await sb
    .from('orders')
    .select('*')
    .eq('order_number', ORDER_NUMBER)
    .single();
  if (error || !order) throw new Error(error?.message ?? 'Order not found');

  const items = Array.isArray(order.items) ? [...order.items] : [];
  const already = items.some(
    (i: { name?: string; sku?: string; unit_price?: number; configuration_snapshot?: { marker?: string } }) =>
      i.configuration_snapshot?.marker === MARKER ||
      (i.name === ITEM_NAME && i.sku === 'MANUAL-DESIGN' && Number(i.unit_price) === ITEM_PRICE),
  );
  if (already) {
    console.log('Bracelet already on order — aborting.');
    return;
  }

  const bytes = readFileSync(IMAGE_PATH);
  const path = `${Date.now()}-${MARKER}.png`;
  console.log('Uploading', IMAGE_PATH, '→', path);

  if (WRITE) {
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/png',
      upsert: false,
    });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  }

  const {
    data: { publicUrl },
  } = sb.storage.from(BUCKET).getPublicUrl(path);

  const manual = {
    description: 'Double-strand Rudraksha bracelet with silver clasp (customer design photo)',
    item_price: ITEM_PRICE,
    metal_price: 0,
    labour_charge: 0,
    other_charge: 0,
  };

  const newItem = {
    product_id: null,
    name: ITEM_NAME,
    sku: 'MANUAL-DESIGN',
    tag_number: null,
    quantity: 1,
    unit_price: ITEM_PRICE,
    line_total: ITEM_PRICE,
    carat_weight: null,
    origin: null,
    image_url: publicUrl,
    category: 'manual_design',
    configuration_id: null,
    configuration_summary: `Manual design: ${manual.description}`,
    configuration_snapshot: {
      source: 'offline_manual_design',
      marker: MARKER,
      manual_design: manual,
    },
  };

  const nextItems = [...items, newItem];
  const amountPaid = roundMoney(Number(order.amount_paid ?? 0));
  const nextSubtotal = roundMoney(Number(order.subtotal ?? 0) + ITEM_PRICE);
  const nextTotal = roundMoney(Number(order.total ?? 0) + ITEM_PRICE);
  const nextDue = roundMoney(Math.max(0, nextTotal - amountPaid));
  const paymentStatus = nextDue > 0.009 ? 'partial' : 'captured';

  console.log({
    dry_run: !WRITE,
    publicUrl,
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

  const note = `Added Bracelet ₹${ITEM_PRICE} (design photo). Total now ₹${nextTotal}; due ₹${nextDue}.`;

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

  await sb.from('order_tracking_events').insert({
    order_id: order.id,
    status: order.status,
    event_time: new Date().toISOString(),
    note,
    is_customer_visible: true,
  });

  console.log('Updated', ORDER_NUMBER, '— Bracelet ₹2500 added.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
