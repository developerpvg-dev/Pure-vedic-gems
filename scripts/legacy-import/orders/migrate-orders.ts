/**
 * orders/migrate-orders.ts
 *
 * Migrate legacy WooCommerce orders (wp_posts post_type='shop_order') plus their
 * line items into public.orders as read-only order history.
 *
 * Linking: orders are attached to a migrated customer by billing email -> auth
 * user. Orders whose email has no auth user are stored with guest_* fields.
 *
 * Idempotency:
 *   - Adds orders.legacy_woo_id (BIGINT, unique) and upserts on it.
 *   - Relaxes the order-number trigger so an explicit order_number ('WC-<id>')
 *     is preserved for imports while live checkout keeps auto-numbering.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/orders/migrate-orders.ts                       (dry-run)
 *   npx tsx scripts/legacy-import/orders/migrate-orders.ts --write --write-prod
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { parseRunMode } from '../lib/supabase.js';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const ORDER_META_KEYS = new Set([
  '_order_total', '_order_tax', '_order_shipping', '_cart_discount', '_order_currency',
  '_billing_first_name', '_billing_last_name', '_billing_email', '_billing_phone',
  '_billing_address_1', '_billing_address_2', '_billing_city', '_billing_state',
  '_billing_postcode', '_billing_country',
  '_shipping_first_name', '_shipping_last_name', '_shipping_address_1', '_shipping_address_2',
  '_shipping_city', '_shipping_state', '_shipping_postcode', '_shipping_country',
  '_customer_user', '_payment_method', '_payment_method_title', '_order_number',
  '_date_paid', '_date_completed', '_order_key',
]);

const ITEMMETA_KEYS = new Set(['_product_id', '_variation_id', '_qty', '_line_subtotal', '_line_total', '_line_tax']);

const STATUS_MAP: Record<string, { status: string; payment: string }> = {
  'wc-completed': { status: 'delivered', payment: 'captured' },
  'wc-processing': { status: 'processing', payment: 'captured' },
  'wc-on-hold': { status: 'payment_review', payment: 'pending' },
  'wc-pending': { status: 'pending_payment', payment: 'pending' },
  'wc-cancelled': { status: 'cancelled', payment: 'cancelled' },
  'wc-refunded': { status: 'refunded', payment: 'refunded' },
  'wc-failed': { status: 'cancelled', payment: 'failed' },
};

type LegacyOrder = {
  id: number;
  status: string;
  createdAt: string | null;
  meta: Record<string, string>;
  items: LegacyItem[];
};

type LegacyItem = {
  itemId: number;
  name: string;
  meta: Record<string, string>;
};

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((a) => a !== '--write-prod'));
  return { write, writeProd };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

function num(value: string | undefined): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toIso(value: string | null | undefined): string | null {
  if (!value || value === '0000-00-00 00:00:00') return null;
  const d = new Date(value.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  const dump = process.env.LEGACY_SQL_DUMP_PATH;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  if (!dump) throw new Error('Missing LEGACY_SQL_DUMP_PATH.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${dump}\n`);

  // Pass A: order posts.
  const orders = new Map<number, LegacyOrder>();
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_posts',
    filter: (r) => r.post_type === 'shop_order',
  })) {
    const id = Number(row.ID);
    if (!id) continue;
    orders.set(id, {
      id,
      status: String(row.post_status ?? ''),
      createdAt: row.post_date_gmt ?? row.post_date ?? null,
      meta: {},
      items: [],
    });
  }
  console.log(`Orders: ${orders.size}`);

  // Pass B: order-level meta.
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_postmeta',
    filter: (r: Record<string, SqlValue>) => orders.has(Number(r.post_id)) && ORDER_META_KEYS.has(String(r.meta_key)),
  })) {
    const o = orders.get(Number(row.post_id));
    if (o && row.meta_key != null) o.meta[row.meta_key] = row.meta_value ?? '';
  }

  // Pass C: line items.
  const itemToOrder = new Map<number, number>();
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_woocommerce_order_items',
    filter: (r) => r.order_item_type === 'line_item' && orders.has(Number(r.order_id)),
  })) {
    const itemId = Number(row.order_item_id);
    const orderId = Number(row.order_id);
    const o = orders.get(orderId);
    if (!o || !itemId) continue;
    o.items.push({ itemId, name: row.order_item_name ?? '', meta: {} });
    itemToOrder.set(itemId, orderId);
  }
  const itemCount = [...orders.values()].reduce((s, o) => s + o.items.length, 0);
  console.log(`Line items: ${itemCount}`);

  // Pass D: item meta.
  const itemIndex = new Map<number, LegacyItem>();
  for (const o of orders.values()) for (const it of o.items) itemIndex.set(it.itemId, it);
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_woocommerce_order_itemmeta',
    filter: (r: Record<string, SqlValue>) => itemToOrder.has(Number(r.order_item_id)) && ITEMMETA_KEYS.has(String(r.meta_key)),
  })) {
    const it = itemIndex.get(Number(row.order_item_id));
    if (it && row.meta_key != null) it.meta[row.meta_key] = row.meta_value ?? '';
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Product map (legacy_woo_id -> our product).
  const prodRes = await client.query<{ legacy_woo_id: number; id: string; sku: string | null; thumbnail_url: string | null; category: string | null }>(
    `SELECT legacy_woo_id, id, sku, thumbnail_url, category FROM products WHERE legacy_woo_id IS NOT NULL`,
  );
  const productByLegacy = new Map<number, { id: string; sku: string | null; thumbnail_url: string | null; category: string | null }>();
  for (const r of prodRes.rows) productByLegacy.set(Number(r.legacy_woo_id), r);
  console.log(`Products with legacy_woo_id: ${productByLegacy.size}`);

  // Auth user map (email -> id) for customer linking.
  const authRes = await client.query<{ id: string; email: string }>(`SELECT id, lower(email) AS email FROM auth.users WHERE email IS NOT NULL`);
  const authIdByEmail = new Map<string, string>();
  for (const r of authRes.rows) authIdByEmail.set(r.email, r.id);
  console.log(`Auth users available for linking: ${authIdByEmail.size}\n`);

  let linked = 0;
  let guest = 0;
  let upserted = 0;

  try {
    await client.query('BEGIN');

    if (flags.write) {
      // Schema guards: idempotency column + preserve explicit order numbers.
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS legacy_woo_id BIGINT`);
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS legacy_data JSONB`);
      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_legacy_woo_id ON orders(legacy_woo_id) WHERE legacy_woo_id IS NOT NULL`);
      await client.query(`
        CREATE OR REPLACE FUNCTION generate_order_number()
        RETURNS TRIGGER AS $$
        DECLARE next_num INTEGER;
        BEGIN
          IF NEW.order_number IS NOT NULL AND NEW.order_number <> '' THEN
            RETURN NEW;
          END IF;
          SELECT COALESCE(MAX(CAST(SPLIT_PART(order_number, '-', 3) AS INTEGER)), 0) + 1
          INTO next_num FROM orders
          WHERE order_number LIKE 'PVG-' || TO_CHAR(NOW(), 'YYYY') || '-%';
          NEW.order_number = 'PVG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 5, '0');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
    }

    for (const o of orders.values()) {
      const m = o.meta;
      const email = (m._billing_email ?? '').trim().toLowerCase();
      const customerId = email && authIdByEmail.has(email) ? authIdByEmail.get(email)! : null;
      if (customerId) linked++; else guest++;

      const billingName = `${m._billing_first_name ?? ''} ${m._billing_last_name ?? ''}`.trim() || null;

      const items = o.items.map((it) => {
        const legacyProductId = Number(it.meta._product_id || 0);
        const matched = productByLegacy.get(legacyProductId);
        const qty = num(it.meta._qty) || 1;
        const lineTotal = num(it.meta._line_total) || num(it.meta._line_subtotal);
        return {
          product_id: matched?.id ?? null,
          legacy_product_id: legacyProductId || null,
          name: it.name,
          sku: matched?.sku ?? null,
          quantity: qty,
          unit_price: qty ? Math.round((lineTotal / qty) * 100) / 100 : lineTotal,
          line_total: lineTotal,
          image_url: matched?.thumbnail_url ?? '',
          category: matched?.category ?? null,
        };
      });

      const subtotal = items.reduce((s, i) => s + i.line_total, 0);
      const total = num(m._order_total) || subtotal;
      const map = STATUS_MAP[o.status] ?? { status: 'placed', payment: 'pending' };

      const shippingAddress = {
        line1: (m._shipping_address_1 || m._billing_address_1 || '').trim(),
        line2: (m._shipping_address_2 || m._billing_address_2 || '').trim() || undefined,
        city: (m._shipping_city || m._billing_city || '').trim(),
        state: (m._shipping_state || m._billing_state || '').trim(),
        pincode: (m._shipping_postcode || m._billing_postcode || '').trim(),
        country: (m._shipping_country || m._billing_country || 'IN').trim(),
      };

      const legacyData = {
        legacy_woo_id: o.id,
        legacy_order_number: m._order_number || null,
        legacy_status: o.status,
        legacy_currency: m._order_currency || 'INR',
        legacy_order_key: m._order_key || null,
        date_paid: toIso(m._date_paid ? new Date(Number(m._date_paid) * 1000).toISOString().replace('T', ' ').slice(0, 19) : null),
        date_completed: m._date_completed ? new Date(Number(m._date_completed) * 1000).toISOString() : null,
        source: 'woocommerce_legacy',
      };

      const params = [
        `WC-${o.id}`,
        o.id,
        customerId,
        customerId ? null : email || null,
        customerId ? null : (m._billing_phone || null),
        customerId ? null : billingName,
        JSON.stringify(items),
        subtotal,
        num(m._order_shipping),
        num(m._cart_discount),
        num(m._order_tax),
        total,
        JSON.stringify(shippingAddress),
        m._payment_method_title || m._payment_method || null,
        map.payment,
        map.status,
        toIso(o.createdAt) ?? new Date().toISOString(),
        JSON.stringify(legacyData),
      ];

      if (!flags.write) { upserted++; continue; }

      await client.query(
        `INSERT INTO orders (
            order_number, legacy_woo_id, customer_id, guest_email, guest_phone, guest_name,
            items, subtotal, shipping_cost, discount, gst_amount, total,
            shipping_address, payment_method, payment_status, status, created_at, legacy_data
         ) VALUES (
            $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18::jsonb
         )
         ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            guest_email = EXCLUDED.guest_email,
            guest_phone = EXCLUDED.guest_phone,
            guest_name = EXCLUDED.guest_name,
            items = EXCLUDED.items,
            subtotal = EXCLUDED.subtotal,
            shipping_cost = EXCLUDED.shipping_cost,
            discount = EXCLUDED.discount,
            gst_amount = EXCLUDED.gst_amount,
            total = EXCLUDED.total,
            shipping_address = EXCLUDED.shipping_address,
            payment_method = EXCLUDED.payment_method,
            payment_status = EXCLUDED.payment_status,
            status = EXCLUDED.status,
            legacy_data = EXCLUDED.legacy_data,
            updated_at = NOW()`,
        params,
      );
      upserted++;
    }

    console.log(`\nLinked to customers: ${linked}  |  Guest orders: ${guest}`);
    console.log(`Orders ${flags.write ? 'upserted' : 'prepared'}: ${upserted}`);

    if (flags.write) {
      await client.query('COMMIT');
      console.log('COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('DRY-RUN: rolled back. Pass --write --write-prod to persist.');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
