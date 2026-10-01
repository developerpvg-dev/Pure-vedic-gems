/**
 * PVG-2026-00054: jewellery = Pendant ₹4500 + Silver chain ₹2000 (= ₹6500).
 * Checkout only had Design-24 silver pendant making ₹2000.
 *
 *   npx tsx scripts/db/_patch-order-00054-pendant-chain.ts
 *   npx tsx scripts/db/_patch-order-00054-pendant-chain.ts --write
 */
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { applyMetalDeltaToOrderMoney } from '../../src/lib/orders/metal-weight-adjust';
import { roundMoney } from '../../src/lib/orders/counter-payments';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const WRITE = process.argv.includes('--write');
const ORDER_NUMBER = 'PVG-2026-00054';
const MARKER = 'pvg00054-pendant-chain-6500';
const PENDANT_MAKING = 4500;
const CHAIN_CHARGE = 2000;
const TARGET_JEWELRY = PENDANT_MAKING + CHAIN_CHARGE; // 6500

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
  if (!items.length) throw new Error('Order has no items');

  const item = { ...(items[0] as Record<string, unknown>) };
  const snap = {
    ...((item.configuration_snapshot as Record<string, unknown>) ?? {}),
  };
  if ((snap as { marker?: string }).marker === MARKER) {
    console.log('Already patched — aborting.');
    return;
  }

  const pricing = {
    ...((snap.pricing as Record<string, unknown>) ?? {}),
  };
  const selections = {
    ...((snap.selections as Record<string, unknown>) ?? {}),
  };

  const oldMaking = roundMoney(Number(pricing.making_charge ?? 0));
  const oldDiamond = roundMoney(Number(pricing.diamond_charge ?? 0));
  const oldJewelryCol = roundMoney(Number(order.jewelry_charges ?? 0));

  const makingDelta = PENDANT_MAKING - oldMaking;
  const diamondDelta = CHAIN_CHARGE - oldDiamond;
  const jewelryDelta = makingDelta + diamondDelta;
  // Fixed-sheet silver: no weight GST on this add.
  const totalDelta = jewelryDelta;

  const nextPricing = {
    ...pricing,
    making_charge: PENDANT_MAKING,
    diamond_charge: CHAIN_CHARGE,
    stone_addon_label: 'Silver chain',
    design_note: `Pendant ₹${PENDANT_MAKING} + Silver chain ₹${CHAIN_CHARGE}`,
    jewelry_pricing_mode: pricing.jewelry_pricing_mode ?? 'fixed',
    total: roundMoney(
      Number(pricing.gem_price ?? 0) +
        PENDANT_MAKING +
        CHAIN_CHARGE +
        Number(pricing.metal_price ?? 0) +
        Number(pricing.certification_fee ?? 0) +
        Number(pricing.energization_fee ?? 0) +
        Number(pricing.custom_design_fee ?? 0),
    ),
  };

  const nextSelections = {
    ...selections,
    chain_length: selections.chain_length || 'Silver chain (added)',
  };

  const nextSummary = String(item.configuration_summary ?? snap.summary ?? '')
    .replace(/\s*·\s*Silver chain.*$/i, '')
    .concat(' · Silver chain');

  const nextSnap = {
    ...snap,
    marker: MARKER,
    summary: nextSummary,
    selections: nextSelections,
    pricing: nextPricing,
  };

  const nextItem = {
    ...item,
    configuration_summary: nextSummary,
    configuration_snapshot: nextSnap,
  };
  const nextItems = [nextItem, ...items.slice(1)];

  const money = applyMetalDeltaToOrderMoney({
    metal_charges: Number(order.metal_charges ?? 0),
    jewelry_charges: oldJewelryCol,
    gst_amount: Number(order.gst_amount ?? 0),
    total: Number(order.total ?? 0),
    amount_paid: Number(order.amount_paid ?? 0),
    quantity: 1,
    metalDelta: 0,
    makingDelta: jewelryDelta,
    gstDelta: 0,
    totalDelta,
  });

  // Guard: jewelry column should land on 6500
  if (Math.abs(money.jewelry_charges - TARGET_JEWELRY) > 0.009) {
    throw new Error(
      `Expected jewelry_charges ${TARGET_JEWELRY}, got ${money.jewelry_charges} (old making ${oldMaking}, old jewelry col ${oldJewelryCol})`,
    );
  }

  console.log({
    dry_run: !WRITE,
    before: {
      jewelry_charges: order.jewelry_charges,
      making_charge: oldMaking,
      diamond_charge: oldDiamond,
      total: order.total,
      amount_paid: order.amount_paid,
      amount_due: order.amount_due,
      payment_status: order.payment_status,
    },
    after: {
      jewelry_charges: money.jewelry_charges,
      making_charge: PENDANT_MAKING,
      diamond_charge: CHAIN_CHARGE,
      total: money.total,
      amount_paid: order.amount_paid,
      amount_due: money.amount_due,
      payment_status: money.payment_status,
      pricing_total: nextPricing.total,
    },
  });

  if (!WRITE) {
    console.log('Dry run only. Re-run with --write to apply.');
    return;
  }

  const note = `Jewellery updated: Pendant ₹${PENDANT_MAKING} + Silver chain ₹${CHAIN_CHARGE} (total jewellery ₹${TARGET_JEWELRY}). Order total now ₹${money.total}; balance due ₹${money.amount_due}.`;

  const { error: updErr } = await sb
    .from('orders')
    .update({
      items: nextItems,
      jewelry_charges: money.jewelry_charges,
      total: money.total,
      amount_due: money.amount_due,
      payment_status: money.payment_status,
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

  console.log('Updated', ORDER_NUMBER, `— jewellery ₹${TARGET_JEWELRY}; due ₹${money.amount_due}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
