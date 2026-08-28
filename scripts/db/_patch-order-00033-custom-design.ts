/**
 * One-shot: attach custom design ring details to PVG-2026-00033.
 *
 *   npx tsx scripts/db/_patch-order-00033-custom-design.ts
 *   npx tsx scripts/db/_patch-order-00033-custom-design.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  applyCustomDesignDeltaToOrderMoney,
  applyCustomDesignPriceToPricing,
} from '../../src/lib/orders/custom-design-price-adjust';

loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

const WRITE = process.argv.includes('--write');
const ORDER_NUMBER = 'PVG-2026-00033';
const METAL = 'panchdhatu_with_gold';
const RING_SIZE = 'indian:22';
const METAL_PRICE = 10000;
const IMAGE_PATH = resolve(process.cwd(), '..', 'image.png');
const BUCKET = 'custom-uploads';

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
  const item = { ...items[0] };

  if (item.configuration_snapshot?.selections?.custom_design_url) {
    console.log('Already has custom design URL — aborting to avoid double-charge.');
    console.log(JSON.stringify(item.configuration_snapshot.selections, null, 2));
    return;
  }

  const bytes = readFileSync(IMAGE_PATH);
  const path = `${Date.now()}-pvg00033-custom-ring.png`;
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

  const gemPrice = Math.round(Number(item.unit_price ?? item.line_total ?? 0));
  const phone =
    order.guest_phone ||
    order.shipping_address?.phone ||
    order.billing_address?.phone ||
    '';

  const displayName = String(item.name ?? 'Yellow Sapphire 3.08ct. (Luxury)');
  const summary = `${displayName} · Ring · Custom Design · Panchdhatu With Gold`;

  // Pending snapshot first (so price adjuster can fold money the same way as admin UI)
  const pendingSnapshot = {
    version: 1,
    product: {
      id: item.product_id,
      sku: item.sku ?? null,
      tag_number: item.tag_number ?? null,
      slug: 'yellow-sapphire-3-08ct-17975-per-ct-luxury-natural-gemstone',
      name: displayName,
      category: item.category ?? 'navaratna',
      sub_category: 'yellow-sapphire',
      image_url: item.image_url ?? null,
      carat_weight: item.carat_weight ?? 3.08,
      origin: item.origin ?? null,
    },
    selections: {
      setting_type: 'ring',
      is_rudraksha: false,
      design: null,
      custom_design_url: publicUrl,
      custom_design_brief: {
        description: 'Custom Design Ring — Panchdhatu with Gold, Indian Ring Size 22',
        contact_phone: phone,
        preferred_metal: 'Panchdhatu with Gold',
        additional_stones: '',
        additional_notes: 'Indian Ring Size: 22. Mounting fixed at ₹10000.',
      },
      rudraksha_combo_product_ids: [],
      metal: METAL,
      ring_size: RING_SIZE,
      chain_length: null,
      certification: null,
      certification_skipped: true,
      energization: null,
      energization_form: null,
    },
    pricing: {
      gem_price: gemPrice,
      making_charge: 0,
      diamond_charge: 0,
      metal_price: 0,
      metal_weight_grams: 0,
      gold_rate_per_gram: 0,
      labor_rate_percent: 0,
      jewelry_pricing_mode: null,
      certification_fee: 0,
      energization_fee: 0,
      custom_design_fee: 0,
      custom_design_pricing_pending: true,
      design_note: null,
      stone_addon_label: null,
      total: gemPrice,
    },
    delivery_eta: {
      label: '12-21 business days',
      max_days: 21,
      min_days: 12,
      components: [
        'Insured dispatch 3-5 days',
        'Jewellery production 7-12 days',
        'Custom design review 2-4 days',
      ],
    },
    summary,
  };

  const adjust = applyCustomDesignPriceToPricing(pendingSnapshot, {
    mode: 'fixed',
    metal: METAL,
    metal_price: METAL_PRICE,
    making_charge: 0,
  });

  const nextSnapshot = {
    ...pendingSnapshot,
    selections: adjust.nextSelections,
    pricing: adjust.nextPricing,
    summary,
  };

  const money = applyCustomDesignDeltaToOrderMoney({
    metal_charges: Number(order.metal_charges ?? 0),
    jewelry_charges: Number(order.jewelry_charges ?? 0),
    gst_amount: Number(order.gst_amount ?? 0),
    total: Number(order.total ?? 0),
    amount_paid: Number(order.amount_paid ?? 0),
    quantity: item.quantity ?? 1,
    metalDelta: adjust.metalDelta,
    makingDelta: adjust.makingDelta,
    diamondDelta: adjust.diamondDelta,
    customFeeDelta: adjust.customFeeDelta,
    gstDelta: adjust.gstDelta,
    totalDelta: adjust.totalDelta,
  });

  console.log({
    dry_run: !WRITE,
    publicUrl,
    metalDelta: adjust.metalDelta,
    totalDelta: adjust.totalDelta,
    before: {
      metal_charges: order.metal_charges,
      total: order.total,
      amount_due: order.amount_due,
      payment_status: order.payment_status,
    },
    after: money,
    summary,
    ring_size: RING_SIZE,
    metal: METAL,
  });

  if (!WRITE) {
    console.log('Dry run only. Re-run with --write to apply.');
    return;
  }

  const { data: cfg, error: cfgErr } = await sb
    .from('product_configurations')
    .insert({
      customer_id: order.customer_id ?? null,
      product_id: item.product_id,
      setting_type: 'ring',
      design_id: null,
      custom_design_url: publicUrl,
      custom_design_status: 'priced',
      metal: METAL,
      ring_size: RING_SIZE,
      gem_price: gemPrice,
      making_charge: 0,
      metal_price: METAL_PRICE,
      metal_weight_grams: null,
      gold_rate_per_gram: null,
      certification_fee: 0,
      energization_fee: 0,
      custom_design_fee: 0,
      total_price: adjust.nextPricing.total ?? gemPrice + METAL_PRICE,
      delivery_eta_min_days: 12,
      delivery_eta_max_days: 21,
      delivery_eta_label: '12-21 business days',
      configuration_snapshot: nextSnapshot,
      pricing_snapshot: adjust.nextPricing,
      status: 'draft',
      order_id: order.id,
    })
    .select('id')
    .single();
  if (cfgErr || !cfg) throw new Error(`Config insert failed: ${cfgErr?.message}`);

  items[0] = {
    ...item,
    configuration_id: cfg.id,
    configuration_summary: summary,
    configuration_snapshot: nextSnapshot,
    delivery_eta_label: '12-21 business days',
  };

  const note =
    `Custom design ring added: Panchdhatu with Gold (₹${METAL_PRICE}), Indian Ring Size 22. Mounting charged; balance due ₹${money.amount_due}.`;

  const { error: updErr } = await sb
    .from('orders')
    .update({
      items,
      metal_charges: money.metal_charges,
      jewelry_charges: money.jewelry_charges,
      gst_amount: money.gst_amount,
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

  console.log('Updated', ORDER_NUMBER, 'config_id=', cfg.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
