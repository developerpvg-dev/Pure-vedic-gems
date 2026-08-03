/**
 * Gap-fill migration for the 38 published WooCommerce products that were not
 * captured by the domain importers. Reads them from the Woo dump, inherits
 * category / sub_category / product_type from an existing sibling of the same
 * gem type, parses carat + price-per-carat from the title, pulls pricing and
 * the primary image from the dump, and upserts into public.products with SEO
 * fields (meta_title, meta_description, canonical_url, og_image, seo_data).
 *
 * Idempotent: upserts on legacy_woo_id. Dry-run by default.
 *   tsx _migrate-missing-products.ts            # dry-run
 *   tsx _migrate-missing-products.ts --write --write-prod
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';
import { ownMediaUrl } from '../lib/own-media-url.js';
import { ensureGemConfiguratorOptionRules } from '../lib/ensure-option-rules.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const WOO_DUMP = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');
const SITE = 'https://www.purevedicgems.com';
/** Fetch-only source; never persist — use ownMediaUrl on write. */
const UPLOADS = `${SITE}/wp-content/uploads/`;

type WooProduct = {
  id: string;
  title: string;
  slug: string;
  createdAt: string | null;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stock: string;
  thumbId: string;
};

function parseFlags(argv: string[]) {
  return { write: argv.includes('--write'), writeProd: argv.includes('--write-prod') };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod after dry-run review.`);
  }
  return dbHost;
}

/** "Yellow Sapphire 3.52ct.@5141per. ct." -> "Yellow Sapphire" */
function gemTypePrefix(title: string) {
  const cut = title.search(/\d+(?:\.\d+)?\s*ct|\(|@|\d+(?:\.\d+)?\s*g\b/i);
  const base = (cut > 0 ? title.slice(0, cut) : title).replace(/\s+/g, ' ').trim();
  return base || title.trim();
}

function parseCarat(title: string): number | null {
  const m = title.match(/(\d+(?:\.\d+)?)\s*ct/i);
  return m ? Number(m[1]) : null;
}

function parsePricePerCarat(title: string): number | null {
  const m = title.match(/@\s*([\d,]+(?:\.\d+)?)\s*(?:per|\/)/i);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

function keywordCategory(title: string): { category: string; sub_category: string; product_type: string } {
  const t = title.toLowerCase();
  if (/jaap\s*mala/.test(t)) return { category: 'mala', sub_category: 'malas', product_type: 'mala' };
  if (/mala/.test(t)) return { category: 'rudraksha', sub_category: 'rudraksha-mala', product_type: 'rudraksha' };
  if (/mukhi/.test(t)) {
    const m = t.match(/(\d+)\s*mukhi/);
    return { category: 'rudraksha', sub_category: m ? `${m[1]}-mukhi` : 'rudraksha', product_type: 'rudraksha' };
  }
  if (/ganesha|lingam|shivling|murti|idol|statue/.test(t)) return { category: 'idol', sub_category: 'idols', product_type: 'idol' };
  if (/moon\s*stone|moonstone/.test(t)) return { category: 'upratna', sub_category: 'moonstone', product_type: 'gemstone' };
  return { category: 'navaratna', sub_category: 'astro-gems-stock', product_type: 'gemstone' };
}

function seoMeta(title: string, type: string, carat: number | null) {
  const caratStr = carat ? `${carat}ct ` : '';
  const metaTitle = `${type} ${caratStr}| Natural Certified`.replace(/\s+/g, ' ').trim().slice(0, 70);
  const metaDescription = `Buy ${title.replace(/\s+/g, ' ').trim()}. Astrologer-vetted natural Vedic gemstone with lab certification and secure shipping.`.slice(0, 160);
  return { metaTitle, metaDescription };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  // 1) All published Woo products
  const published = new Map<string, WooProduct>();
  for await (const row of streamWpTable({
    filePath: WOO_DUMP,
    tableName: 'wp_posts',
    filter: (r) => r.post_type === 'product' && r.post_status === 'publish',
  })) {
    const id = String(row.ID);
    published.set(id, {
      id,
      title: String(row.post_title ?? '').trim(),
      slug: String(row.post_name ?? '').trim(),
      createdAt: row.post_date_gmt || row.post_date || null,
      sku: '', price: '', regularPrice: '', salePrice: '', stock: '', thumbId: '',
    });
  }

  // 2) Meta
  const attachedFileById = new Map<string, string>();
  for await (const row of streamWpTable({
    filePath: WOO_DUMP,
    tableName: 'wp_postmeta',
    filter: (r: Record<string, SqlValue>) =>
      (published.has(String(r.post_id)) && ['_sku', '_price', '_regular_price', '_sale_price', '_stock_status', '_thumbnail_id'].includes(String(r.meta_key))) ||
      r.meta_key === '_wp_attached_file',
  })) {
    if (row.meta_key === '_wp_attached_file') {
      attachedFileById.set(String(row.post_id), String(row.meta_value ?? ''));
      continue;
    }
    const p = published.get(String(row.post_id));
    if (!p) continue;
    const v = String(row.meta_value ?? '');
    if (row.meta_key === '_sku') p.sku = v;
    else if (row.meta_key === '_price') p.price = v;
    else if (row.meta_key === '_regular_price') p.regularPrice = v;
    else if (row.meta_key === '_sale_price') p.salePrice = v;
    else if (row.meta_key === '_stock_status') p.stock = v;
    else if (row.meta_key === '_thumbnail_id') p.thumbId = v;
  }

  // 3) Determine the missing set and resolve sibling categories
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let upserted = 0;
  try {
    const { rows: existing } = await client.query<{ legacy_woo_id: string }>(
      `SELECT legacy_woo_id FROM products WHERE legacy_woo_id IS NOT NULL`,
    );
    const existingLegacy = new Set(existing.map((r) => Number(r.legacy_woo_id)));
    const { rows: slugRows } = await client.query<{ slug: string }>(`SELECT slug FROM products`);
    const usedSlugs = new Set(slugRows.map((r) => r.slug));

    const missing = [...published.values()].filter((p) => !existingLegacy.has(Number(p.id)));
    console.log(`Missing published products to migrate: ${missing.length}\n`);

    await client.query('BEGIN');
    for (const p of missing) {
      const prefix = gemTypePrefix(p.title);
      // Inherit from a sibling of the same gem type, else keyword fallback.
      const sib = await client.query<{ category: string; sub_category: string; product_type: string }>(
        `SELECT category, sub_category, product_type, count(*)::int n
         FROM products WHERE name ILIKE $1
         GROUP BY 1,2,3 ORDER BY n DESC LIMIT 1`,
        [`${prefix}%`],
      );
      const cls = sib.rows[0]
        ? { category: sib.rows[0].category, sub_category: sib.rows[0].sub_category, product_type: sib.rows[0].product_type }
        : keywordCategory(p.title);

      const carat = parseCarat(p.title);
      const ppc = parsePricePerCarat(p.title);
      const price = Number(p.price || p.regularPrice || 0) || 0;
      const comparePrice = p.salePrice && p.regularPrice && Number(p.salePrice) < Number(p.regularPrice)
        ? Number(p.regularPrice) : null;
      const inStock = p.stock !== 'outofstock';
      const stockStatus = inStock ? 'in_stock' : 'out_of_stock';
      // Products with no legacy price are migrated but kept hidden until an admin prices them.
      const isActive = price > 0;

      let slug = p.slug || `product-${p.id}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${p.id}`;
      usedSlugs.add(slug);

      const attachedFile = p.thumbId ? attachedFileById.get(p.thumbId) : '';
      const rawImage = attachedFile ? `${UPLOADS}${attachedFile}` : null;
      const imageUrl = flags.write && rawImage ? await ownMediaUrl(rawImage) : rawImage;
      const images = imageUrl ? [imageUrl] : [];

      const { metaTitle, metaDescription } = seoMeta(p.title, prefix, carat);
      const canonical = `${SITE}/shop/${cls.sub_category}/${slug}`;

      const result = await client.query(
        `INSERT INTO products (
            legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
            sku, name, slug, category, sub_category, product_type,
            price, compare_price, price_per_carat, carat_weight, currency,
            in_stock, stock_status, availability_status, stock_quantity,
            thumbnail_url, images, is_active,
            meta_title, meta_description, canonical_url, og_image, seo_data, legacy_data
         ) VALUES (
            $1,$2,$3,$4,$5,$6,
            $7,$8,$9,$10,$11,$12,
            $13,$14,$15,$16,'INR',
            $17,$18,$19,$20,
            $21,$22::jsonb,$23,
            $24,$25,$26,$27,$28::jsonb,$29::jsonb
         )
         ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            compare_price = EXCLUDED.compare_price,
            in_stock = EXCLUDED.in_stock,
            stock_status = EXCLUDED.stock_status,
            availability_status = EXCLUDED.availability_status,
            thumbnail_url = COALESCE(products.thumbnail_url, EXCLUDED.thumbnail_url),
            images = CASE WHEN products.images = '[]'::jsonb THEN EXCLUDED.images ELSE products.images END,
            meta_title = EXCLUDED.meta_title,
            meta_description = EXCLUDED.meta_description,
            canonical_url = EXCLUDED.canonical_url,
            updated_at = NOW()
         RETURNING id`,
        [
          Number(p.id), p.sku || null, p.slug || null, `/product/${p.slug}/`, 'publish',
          p.createdAt ? new Date(`${p.createdAt.replace(' ', 'T')}Z`).toISOString() : null,
          p.sku || `LEGACY-${p.id}`, p.title, slug, cls.category, cls.sub_category, cls.product_type,
          price, comparePrice, ppc, carat,
          inStock, stockStatus, stockStatus, inStock ? 1 : 0,
          imageUrl, JSON.stringify(images), isActive,
          metaTitle, metaDescription, canonical, imageUrl,
          JSON.stringify({ migratedBy: 'products-gap-fill', source: 'pugemved_indb.sql' }),
          JSON.stringify({ source: 'pugemved_indb.sql', legacy_woo_id: Number(p.id), stock: p.stock || null }),
        ],
      );
      if (result.rows.length) {
        const productId = result.rows[0].id as string;
        if (['navaratna', 'upratna', 'uparatna'].includes(cls.category)) {
          await ensureGemConfiguratorOptionRules(client, productId);
        }
        upserted++;
      }
      console.log(`  + #${p.id} ${cls.category}/${cls.sub_category} (${cls.product_type}) price=${price} stock=${stockStatus} :: ${slug}`);
    }

    console.log(`\nUpserted products: ${upserted}`);
    if (flags.write) {
      await client.query('COMMIT');
      console.log('COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('DRY-RUN: rolled back. Pass --write --write-prod to persist.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e instanceof Error ? (e.stack ?? e.message) : e); process.exit(1); });
