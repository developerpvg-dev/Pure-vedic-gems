/**
 * Rewrite Supabase public Storage URLs in Postgres → CDN (R2).
 *
 *   https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
 * → https://cdn.purevedicgems.com/{bucket}/{path}
 *
 * Usage:
 *   node scripts/rewrite-public-urls-to-cdn.mjs           # dry-run counts
 *   node scripts/rewrite-public-urls-to-cdn.mjs --write   # apply
 *
 * Env: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_CDN_URL
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const doWrite = process.argv.includes('--write');

function loadEnvFile(name) {
  const p = join(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const dbUrl = process.env.DATABASE_URL;
const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const cdn = (process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.purevedicgems.com').replace(/\/$/, '');

if (!dbUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}
if (!supabase) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

/** Only public media buckets on R2 — never rewrite custom-uploads / private. */
const PUBLIC_BUCKETS = [
  'products',
  'product-images',
  'certificates',
  'jewelry-designs',
  'reviews',
  'site-static',
];

/** Per-bucket replace pairs (avoids rewriting custom-uploads → CDN 404). */
const REPLACES = PUBLIC_BUCKETS.map((b) => ({
  from: `${supabase}/storage/v1/object/public/${b}/`,
  to: `${cdn}/${b}/`,
  bucket: b,
}));

/** text columns */
const TEXT_COLS = [
  ['products', 'thumbnail_url'],
  ['products', 'video_url'],
  ['products', 'certificate_url'],
  ['products', 'certificate_file_url'],
  ['products', 'og_image'],
  ['jewelry_designs', 'image_url'],
  ['jewelry_designs', 'video_url'],
  ['lab_certificates', 'certificate_url'],
  ['lab_certificates', 'thumbnail_url'],
  ['testimonials', 'proof_image_url'],
  ['recommendation_reports', 'chart_image_url'],
  ['orders', 'product_video_url'],
  ['orders', 'puja_video_url'],
  ['order_items', 'image_url_snapshot'],
  ['cart_items', 'image_url_snapshot'],
  ['homepage_categories', 'image_url'],
  ['homepage_categories', 'hover_image_url'],
  ['gem_categories', 'image_url'],
  ['gem_categories', 'hover_image_url'],
  ['product_categories', 'image_url'],
  ['shop_category_pages', 'image_url'],
  ['shop_category_pages', 'hover_image_url'],
  ['shop_category_pages', 'hero_image_url'],
  ['yagyas', 'image_url'],
  ['consultation_plans', 'image_url'],
  ['hero_slides', 'image_url'],
  ['hero_slides', 'desktop_image_url'],
  ['hero_slides', 'mobile_image_url'],
  ['experts', 'photo_url'],
  ['team_members', 'avatar_url'],
  // intentionally skip product_configurations.custom_design_url (custom-uploads, private)
];

/** json/jsonb columns that embed URLs as strings */
const JSON_COLS = [
  ['products', 'images'],
  ['orders', 'compliance_flags'],
  ['orders', 'items'],
  ['product_reviews', 'images'],
  ['category_reviews', 'images'],
  ['reviews', 'images'],
  ['cart_items', 'metadata'],
  ['consultation_plans', 'metadata'],
  ['in_app_notifications', 'metadata'],
  ['product_configurations', 'configuration_snapshot'],
  ['recommendation_reports', 'blocks'],
  ['admin_activity_log', 'details'],
];

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

console.log(`cdn=${cdn}`);
console.log(`buckets=${PUBLIC_BUCKETS.join(',')}`);
console.log(`mode=${doWrite ? 'WRITE' : 'dry-run'}`);

let total = 0;

for (const [table, col] of TEXT_COLS) {
  for (const { from, to, bucket } of REPLACES) {
    try {
      const countRes = await client.query(
        `SELECT count(*)::int AS n FROM ${table} WHERE ${col} IS NOT NULL AND ${col} LIKE $1`,
        [`${from}%`],
      );
      const n = countRes.rows[0]?.n ?? 0;
      if (n === 0) continue;
      total += n;
      console.log(`text ${table}.${col} [${bucket}]: ${n}`);
      if (doWrite) {
        await client.query(
          `UPDATE ${table} SET ${col} = replace(${col}, $1, $2) WHERE ${col} LIKE $3`,
          [from, to, `${from}%`],
        );
      }
    } catch (e) {
      if (/does not exist/i.test(String(e.message))) {
        console.log(`skip missing ${table}.${col}`);
        break;
      }
      throw e;
    }
  }
}

/** orders.items UPDATE re-validates payment_status; legacy rows fail the week3 check. */
const ORDERS_ITEMS_CONSTRAINT = 'orders_payment_status_week3_check';
let ordersItemsConstraintDef = null;
if (doWrite && JSON_COLS.some(([t, c]) => t === 'orders' && c === 'items')) {
  ordersItemsConstraintDef = (
    await client.query(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = $1`,
      [ORDERS_ITEMS_CONSTRAINT],
    )
  ).rows[0]?.def;
  if (ordersItemsConstraintDef) {
    await client.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS ${ORDERS_ITEMS_CONSTRAINT}`);
    console.log(`temporarily dropped ${ORDERS_ITEMS_CONSTRAINT}`);
  }
}

for (const [table, col] of JSON_COLS) {
  for (const { from, to, bucket } of REPLACES) {
    try {
      const countRes = await client.query(
        `SELECT count(*)::int AS n FROM ${table}
         WHERE ${col} IS NOT NULL AND ${col}::text LIKE $1`,
        [`%${from}%`],
      );
      const n = countRes.rows[0]?.n ?? 0;
      if (n === 0) continue;
      total += n;
      console.log(`json ${table}.${col} [${bucket}]: ${n} rows`);
      if (doWrite) {
        try {
          await client.query(
            `UPDATE ${table}
             SET ${col} = replace(${col}::text, $1, $2)::jsonb
             WHERE ${col}::text LIKE $3`,
            [from, to, `%${from}%`],
          );
        } catch {
          await client.query(
            `UPDATE ${table}
             SET ${col} = replace(${col}::text, $1, $2)::json
             WHERE ${col}::text LIKE $3`,
            [from, to, `%${from}%`],
          );
        }
      }
    } catch (e) {
      if (/does not exist/i.test(String(e.message))) {
        console.log(`skip missing ${table}.${col}`);
        break;
      }
      console.warn(`warn ${table}.${col}: ${e.message}`);
    }
  }
}

if (doWrite && ordersItemsConstraintDef) {
  await client.query(
    `ALTER TABLE orders ADD CONSTRAINT ${ORDERS_ITEMS_CONSTRAINT} ${ordersItemsConstraintDef}`,
  );
  console.log(`restored ${ORDERS_ITEMS_CONSTRAINT}`);
}

await client.end();
console.log(`\n${doWrite ? 'updated' : 'would update'} ~${total} column hits`);
if (!doWrite) console.log('Re-run with --write after copy-public-buckets-to-r2 succeeds.');
