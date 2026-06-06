/**
 * coupons/migrate-coupons.ts
 *
 * Migrate WooCommerce coupons (wp_posts post_type='shop_coupon') from the
 * legacy dump into public.coupons. Coupon configuration lives in wp_postmeta.
 *
 * Idempotent: upsert on coupons.code (UNIQUE). Legacy id + WooCommerce-only
 * settings are preserved in coupons.metadata.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/coupons/migrate-coupons.ts                       (dry-run)
 *   npx tsx scripts/legacy-import/coupons/migrate-coupons.ts --write --write-prod
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

const COUPON_META_KEYS = new Set([
  'discount_type',
  'coupon_amount',
  'date_expires',
  'expiry_date',
  'usage_limit',
  'usage_limit_per_user',
  'limit_usage_to_x_items',
  'minimum_amount',
  'maximum_amount',
  'free_shipping',
  'individual_use',
  'exclude_sale_items',
  'product_ids',
  'exclude_product_ids',
  'product_categories',
  'exclude_product_categories',
  'usage_count',
]);

type LegacyCoupon = {
  id: number;
  code: string;
  description: string | null;
  createdAt: string | null;
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

function num(value: string | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intList(value: string | undefined): number[] {
  if (!value) return [];
  return value.split(',').map((v) => Number(v.trim())).filter((n) => Number.isFinite(n) && n > 0);
}

function expiryToIso(meta: Record<string, string>): string | null {
  const ts = num(meta.date_expires);
  if (ts && ts > 0) return new Date(ts * 1000).toISOString();
  if (meta.expiry_date) {
    const d = new Date(meta.expiry_date);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
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

  // Pass 1: collect published coupon posts.
  const coupons = new Map<number, LegacyCoupon>();
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_posts',
    filter: (r) => r.post_type === 'shop_coupon' && r.post_status === 'publish',
  })) {
    const id = Number(row.ID);
    const code = (row.post_title ?? '').trim();
    if (!id || !code) continue;
    coupons.set(id, {
      id,
      code,
      description: row.post_excerpt && row.post_excerpt.trim() ? row.post_excerpt.trim() : null,
      createdAt: row.post_date_gmt ?? row.post_date ?? null,
      meta: {},
    });
  }
  console.log(`Published coupons: ${coupons.size}`);

  // Pass 2: collect coupon meta.
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_postmeta',
    filter: (r: Record<string, SqlValue>) => coupons.has(Number(r.post_id)) && COUPON_META_KEYS.has(String(r.meta_key)),
  })) {
    const coupon = coupons.get(Number(row.post_id));
    if (coupon && row.meta_key != null) coupon.meta[row.meta_key] = row.meta_value ?? '';
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let upserted = 0;
  try {
    await client.query('BEGIN');
    for (const coupon of coupons.values()) {
      const m = coupon.meta;
      const wcType = (m.discount_type ?? 'fixed_cart').trim();
      const discountType = wcType === 'percent' ? 'percent' : 'fixed';
      const discountValue = num(m.coupon_amount) ?? 0;
      const metadata = {
        legacy_woo_id: coupon.id,
        legacy_discount_type: wcType,
        free_shipping: m.free_shipping === 'yes',
        individual_use: m.individual_use === 'yes',
        exclude_sale_items: m.exclude_sale_items === 'yes',
        maximum_spend: num(m.maximum_amount),
        limit_usage_to_x_items: num(m.limit_usage_to_x_items),
        legacy_product_ids: intList(m.product_ids),
        legacy_exclude_product_ids: intList(m.exclude_product_ids),
      };

      const res = await client.query(
        `INSERT INTO public.coupons (
            code, discount_type, discount_value, min_order_amount,
            usage_limit, usage_limit_per_customer, used_count,
            valid_from, valid_until, is_active, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10::jsonb)
         ON CONFLICT (code) DO UPDATE SET
            discount_type = EXCLUDED.discount_type,
            discount_value = EXCLUDED.discount_value,
            min_order_amount = EXCLUDED.min_order_amount,
            usage_limit = EXCLUDED.usage_limit,
            usage_limit_per_customer = EXCLUDED.usage_limit_per_customer,
            used_count = EXCLUDED.used_count,
            valid_until = EXCLUDED.valid_until,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
         RETURNING code`,
        [
          coupon.code.toUpperCase(),
          discountType,
          discountValue,
          num(m.minimum_amount) ?? 0,
          num(m.usage_limit),
          num(m.usage_limit_per_user),
          num(m.usage_count) ?? 0,
          coupon.createdAt ? new Date(coupon.createdAt.replace(' ', 'T') + 'Z').toISOString() : new Date().toISOString(),
          expiryToIso(m),
          JSON.stringify(metadata),
        ],
      );
      if (res.rows.length) upserted++;
    }

    console.log(`\nUpserted coupons: ${upserted}`);
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
