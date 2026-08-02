/**
 * Gap-fill + stock restore for Spiritual Idols + Vedic Jewellery
 * (homepage Explore by Category shelves).
 *
 *   npx tsx scripts/legacy-import/idols-jewellery/_fill-gap-restore.ts --prod
 *   npx tsx scripts/legacy-import/idols-jewellery/_fill-gap-restore.ts --write --write-prod
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';
import {
  normalisePricing,
  resolveLegacyAvailabilityStatus,
} from '../lib/transform/pricing.js';
import { ownMediaUrl } from '../lib/own-media-url.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local'), override: true });

const DUMP = resolve(repoRoot, '..', 'latestsqldump', 'pugemved_indb(1).sql');
const SITE = 'https://www.purevedicgems.com';
/** Fetch-only source for Woo attachments; never persist — use ownMediaUrl on write. */
const UPLOADS = 'https://www.purevedicgems.in/wp-content/uploads/';

type Spec = {
  category: string;
  sub: string;
  productType: 'idol' | 'jewelry' | 'mala';
  energization: boolean;
  /** /shop/<path>/… */
  shopPath: string;
};

/** Dump product_cat slug → live shelf. Matches existing live rows. */
const SLUG_MAP: Record<string, Spec> = {
  'shree-yantra': { category: 'idol', sub: 'shree-yantra', productType: 'idol', energization: false, shopPath: 'idols' },
  shivling: { category: 'idol', sub: 'shivling', productType: 'idol', energization: false, shopPath: 'idols' },
  ganesha: { category: 'idol', sub: 'ganesha', productType: 'idol', energization: false, shopPath: 'idols' },
  hanuman: { category: 'idol', sub: 'hanuman', productType: 'idol', energization: false, shopPath: 'idols' },
  'durga-devi': { category: 'idol', sub: 'durga-devi', productType: 'idol', energization: false, shopPath: 'idols' },
  'shiv-ji': { category: 'idol', sub: 'shiv-ji', productType: 'idol', energization: false, shopPath: 'idols' },
  bracelets: { category: 'jewelry', sub: 'bracelets', productType: 'jewelry', energization: false, shopPath: 'jewelry' },
  'diamond-jewellery': {
    category: 'jewelry',
    sub: 'diamond-jewellery',
    productType: 'jewelry',
    energization: false,
    shopPath: 'jewelry',
  },
  'ready-astro-gems-stock': {
    category: 'jewelry',
    sub: 'astro-gems-stock',
    productType: 'jewelry',
    energization: false,
    shopPath: 'jewelry',
  },
  malas: { category: 'jewelry', sub: 'malas', productType: 'mala', energization: true, shopPath: 'malas' },
  'exclusive-rudraksha-malas': {
    category: 'mala',
    sub: 'exclusive-rudraksha-malas',
    productType: 'mala',
    energization: true,
    shopPath: 'malas',
  },
  'ready-rudraksha-jewelry-stock': {
    category: 'jewelry',
    sub: 'ready-rudraksha-jewelry-stock',
    productType: 'jewelry',
    energization: true,
    shopPath: 'jewelry',
  },
};

type WooProduct = {
  id: string;
  title: string;
  slug: string;
  createdAt: string | null;
  meta: Record<string, string>;
  spec: Spec;
};

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
    prod: argv.includes('--prod') || argv.includes('--write-prod'),
  };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production. Add --write-prod after dry-run.`);
  }
  return dbHost;
}

function pickSpec(slugs: string[]): Spec | null {
  // Prefer more specific mapped leaves over parent jewellery/idols roots
  const hits = slugs.map((s) => SLUG_MAP[s]).filter(Boolean) as Spec[];
  if (!hits.length) return null;
  // exclusive malas beat plain malas when both tagged
  const exclusive = hits.find((h) => h.sub === 'exclusive-rudraksha-malas');
  if (exclusive) return exclusive;
  return hits[0];
}

async function loadDump(): Promise<{
  products: Map<string, WooProduct>;
  attachedFileById: Map<string, string>;
}> {
  const terms = new Map<string, { name: string; slug: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_terms' })) {
    terms.set(String(r.term_id), {
      name: String(r.name || ''),
      slug: String(r.slug || '').toLowerCase(),
    });
  }

  const taxById = new Map<string, { slug: string; taxonomy: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_taxonomy' })) {
    const t = terms.get(String(r.term_id));
    if (!t) continue;
    taxById.set(String(r.term_taxonomy_id), {
      slug: t.slug,
      taxonomy: String(r.taxonomy),
    });
  }

  const slugsByProduct = new Map<string, string[]>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_relationships' })) {
    const tax = taxById.get(String(r.term_taxonomy_id));
    if (!tax || tax.taxonomy !== 'product_cat') continue;
    const id = String(r.object_id);
    const list = slugsByProduct.get(id) ?? [];
    list.push(tax.slug);
    slugsByProduct.set(id, list);
  }

  const products = new Map<string, WooProduct>();
  for await (const r of streamWpTable({
    filePath: DUMP,
    tableName: 'wp_posts',
    filter: (row) => row.post_type === 'product' && row.post_status === 'publish',
  })) {
    const id = String(r.ID);
    const spec = pickSpec(slugsByProduct.get(id) ?? []);
    if (!spec) continue;
    products.set(id, {
      id,
      title: String(r.post_title || '').trim(),
      slug: String(r.post_name || ''),
      createdAt: (r.post_date_gmt || r.post_date || null) as string | null,
      meta: {},
      spec,
    });
  }

  const META_KEYS = new Set([
    '_sku',
    '_price',
    '_regular_price',
    '_sale_price',
    '_stock_status',
    '_thumbnail_id',
  ]);
  const attachedFileById = new Map<string, string>();
  for await (const r of streamWpTable({
    filePath: DUMP,
    tableName: 'wp_postmeta',
    filter: (row: Record<string, SqlValue>) =>
      (products.has(String(row.post_id)) && META_KEYS.has(String(row.meta_key))) ||
      row.meta_key === '_wp_attached_file',
  })) {
    if (r.meta_key === '_wp_attached_file') {
      attachedFileById.set(String(r.post_id), String(r.meta_value ?? ''));
      continue;
    }
    const p = products.get(String(r.post_id));
    if (!p) continue;
    p.meta[String(r.meta_key)] = String(r.meta_value ?? '');
  }

  return { products, attachedFileById };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = flags.prod
    ? process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
    : process.env.LEGACY_IMPORT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.prod ? ' (prod)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${DUMP}\n`);

  const { products, attachedFileById } = await loadDump();
  const bySub = new Map<string, number>();
  for (const p of products.values()) bySub.set(p.spec.sub, (bySub.get(p.spec.sub) ?? 0) + 1);
  console.log(`Dump classified idols/jewellery: ${products.size}`);
  for (const [k, v] of [...bySub.entries()].sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const insertedLog: Array<Record<string, string>> = [];
  const remappedLog: Array<Record<string, string>> = [];
  const restoredLog: Array<Record<string, string>> = [];

  try {
    await client.query('BEGIN');

    const targetSubs = [...new Set([...products.values()].map((p) => p.spec.sub))];
    const { rows: existing } = await client.query<{
      id: string;
      legacy_woo_id: number | null;
      sku: string | null;
      name: string;
      category: string | null;
      sub_category: string | null;
      availability_status: string | null;
      stock_status: string | null;
      in_stock: boolean | null;
      price_mode: string | null;
      is_active: boolean;
      reservation_note: string | null;
    }>(
      `
      SELECT id, legacy_woo_id, sku, name, category, sub_category, availability_status, stock_status,
             in_stock, price_mode, is_active, reservation_note
      FROM products
      WHERE category IN ('idol','jewelry','jewellery','mala')
         OR sub_category = ANY($1)
    `,
      [targetSubs],
    );

    const byLegacy = new Map<string, (typeof existing)[0]>();
    const bySku = new Map<string, (typeof existing)[0]>();
    for (const row of existing) {
      if (row.legacy_woo_id != null) byLegacy.set(String(row.legacy_woo_id), row);
      if (row.sku) bySku.set(row.sku.trim().toLowerCase(), row);
    }

    const { rows: slugRows } = await client.query<{ slug: string }>(`SELECT slug FROM products`);
    const usedSlugs = new Set(slugRows.map((r) => r.slug));

    for (const woo of products.values()) {
      const hit =
        byLegacy.get(woo.id) ||
        (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (hit) continue;

      const pricing = normalisePricing(woo.meta);
      const dumpIn = woo.meta._stock_status !== 'outofstock';
      const availability = resolveLegacyAvailabilityStatus({
        priceMode: pricing.priceMode,
        inStock: dumpIn,
        stockStatus: dumpIn ? 'in_stock' : 'out_of_stock',
      });

      let slug = woo.slug || `${woo.spec.sub}-${woo.id}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${woo.id}`;
      usedSlugs.add(slug);

      const thumbId = woo.meta._thumbnail_id;
      const attached = thumbId ? attachedFileById.get(thumbId) : '';
      const rawImage = attached ? `${UPLOADS}${attached}` : null;
      const imageUrl = flags.write && rawImage ? await ownMediaUrl(rawImage) : rawImage;

      await client.query(
        `INSERT INTO products (
           legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
           sku, name, slug, category, sub_category, product_type,
           price, compare_price, price_mode, currency,
           in_stock, stock_status, availability_status, stock_quantity, sold_individually,
           energization_eligible, thumbnail_url, images, is_active,
           meta_title, meta_description, canonical_url, og_image, seo_data, legacy_data
         ) VALUES (
           $1,$2,$3,$4,'publish',$5,
           $6,$7,$8,$9,$10,$11,
           $12,$13,$14,'INR',
           $15,$16,$17,$18,true,
           $19,$20,$21::jsonb,true,
           $22,$23,$24,$20,$25::jsonb,$26::jsonb
         )
         ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           sub_category = EXCLUDED.sub_category,
           product_type = EXCLUDED.product_type,
           price = EXCLUDED.price,
           price_mode = EXCLUDED.price_mode,
           in_stock = EXCLUDED.in_stock,
           stock_status = EXCLUDED.stock_status,
           availability_status = EXCLUDED.availability_status,
           energization_eligible = EXCLUDED.energization_eligible,
           thumbnail_url = COALESCE(products.thumbnail_url, EXCLUDED.thumbnail_url),
           images = CASE WHEN products.images = '[]'::jsonb THEN EXCLUDED.images ELSE products.images END,
           is_active = true,
           updated_at = NOW()`,
        [
          Number(woo.id),
          woo.meta._sku || null,
          woo.slug || null,
          `/product/${woo.slug}/`,
          woo.createdAt ? new Date(`${woo.createdAt.replace(' ', 'T')}Z`).toISOString() : null,
          woo.meta._sku || `LEGACY-${woo.id}`,
          woo.title,
          slug,
          woo.spec.category,
          woo.spec.sub,
          woo.spec.productType,
          pricing.price ?? 0,
          pricing.comparePrice,
          pricing.priceMode,
          availability === 'in_stock',
          availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
          availability,
          availability === 'in_stock' ? 1 : 0,
          woo.spec.energization,
          imageUrl,
          JSON.stringify(imageUrl ? [imageUrl] : []),
          woo.title.slice(0, 70),
          `Buy ${woo.title}. From PureVedicGems.`.slice(0, 160),
          `${SITE}/shop/${woo.spec.shopPath}/${slug}`,
          JSON.stringify({
            migratedBy: 'idols-jewellery-gap-fill-2026-08',
            source: 'latestsqldump/pugemved_indb(1).sql',
          }),
          JSON.stringify({
            source: 'latestsqldump',
            legacy_woo_id: Number(woo.id),
            stock: woo.meta._stock_status || null,
          }),
        ],
      );
      insertedLog.push({
        legacy_woo_id: woo.id,
        sku: woo.meta._sku || '',
        sub_category: woo.spec.sub,
        category: woo.spec.category,
        title: woo.title,
      });
    }

    for (const woo of products.values()) {
      const hit =
        byLegacy.get(woo.id) ||
        (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit || !hit.is_active) continue;
      const needsRemap =
        hit.sub_category !== woo.spec.sub || hit.category !== woo.spec.category;
      if (!needsRemap) continue;

      await client.query(
        `UPDATE products SET
           category = $2,
           sub_category = $3,
           product_type = $4,
           energization_eligible = $5,
           canonical_url = $6 || '/' || slug,
           updated_at = NOW()
         WHERE id = $1`,
        [
          hit.id,
          woo.spec.category,
          woo.spec.sub,
          woo.spec.productType,
          woo.spec.energization,
          `${SITE}/shop/${woo.spec.shopPath}`,
        ],
      );
      remappedLog.push({
        id: hit.id,
        sku: hit.sku || woo.meta._sku || '',
        from: `${hit.category}/${hit.sub_category}`,
        to: `${woo.spec.category}/${woo.spec.sub}`,
        title: hit.name,
      });
    }

    for (const woo of products.values()) {
      const hit =
        byLegacy.get(woo.id) ||
        (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit || !hit.is_active) continue;
      if (woo.meta._stock_status === 'outofstock') continue;

      const status = hit.availability_status || '';
      const needsRestore =
        status === 'reserved' ||
        status === 'sold' ||
        status === 'out_of_stock' ||
        (hit.in_stock === false &&
          status !== 'on_demand' &&
          hit.price_mode !== 'on_demand' &&
          hit.price_mode !== 'quote_required');
      if (!needsRestore) continue;
      if (
        hit.price_mode === 'on_demand' ||
        hit.price_mode === 'quote_required' ||
        status === 'on_demand'
      )
        continue;

      await client.query(
        `UPDATE products SET
           in_stock = true,
           stock_quantity = 1,
           availability_status = 'in_stock',
           stock_status = 'in_stock',
           reserved_until = NULL,
           reserved_by_customer_id = NULL,
           reserved_by_admin_id = NULL,
           reserved_quantity = 0,
           reservation_note = NULL,
           updated_at = NOW()
         WHERE id = $1`,
        [hit.id],
      );
      restoredLog.push({
        id: hit.id,
        sku: hit.sku || woo.meta._sku || '',
        was: status,
        sub_category: hit.sub_category || '',
        note: hit.reservation_note || '',
        title: hit.name,
      });
    }

    const reportPath = resolve(here, '_gap-fill-report.json');
    writeFileSync(
      reportPath,
      JSON.stringify(
        { inserted: insertedLog, remapped: remappedLog, restoredStock: restoredLog },
        null,
        2,
      ),
    );

    console.log(`\nInserted missing: ${insertedLog.length}`);
    const insBy = new Map<string, number>();
    for (const r of insertedLog) insBy.set(r.sub_category, (insBy.get(r.sub_category) ?? 0) + 1);
    for (const [k, v] of [...insBy.entries()].sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);
    for (const r of insertedLog.slice(0, 12)) {
      console.log(
        `  + ${r.sub_category.padEnd(28)} sku=${(r.sku || '-').padEnd(12)} ${r.title.slice(0, 45)}`,
      );
    }
    if (insertedLog.length > 12) console.log(`  … ${insertedLog.length - 12} more`);

    console.log(`\nRemapped: ${remappedLog.length}`);
    for (const r of remappedLog.slice(0, 12)) {
      console.log(`  ${r.from} → ${r.to}  sku=${r.sku}  ${r.title.slice(0, 40)}`);
    }
    if (remappedLog.length > 12) console.log(`  … ${remappedLog.length - 12} more`);

    console.log(`\nRestored stock: ${restoredLog.length}`);
    for (const r of restoredLog) {
      console.log(
        `  ${r.was.padEnd(12)} sku=${(r.sku || '-').padEnd(12)} ${r.sub_category}  ${r.title.slice(0, 40)}`,
      );
    }

    console.log(`\nReport: ${reportPath}`);

    if (flags.write) {
      await client.query('COMMIT');
      console.log('\nCOMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('\nDRY-RUN: rolled back. Re-run with --write --write-prod to persist.');
    }
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
