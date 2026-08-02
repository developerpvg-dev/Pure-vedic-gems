/**
 * Navratna gap-fill + testing stock restore from latest Woo dump.
 *
 * 1) Insert missing published Navratna products (legacy_woo_id upsert)
 * 2) Remap Exclusive Gems → gem subcategory when title determines it
 * 3) Restore reserved / sold / out_of_stock when dump still says instock
 *
 * Undetermined Exclusive (opal, rudraksha, etc.) are listed, not forced into Navratna.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/navratna/_fill-gap-restore.ts
 *   npx tsx scripts/legacy-import/navratna/_fill-gap-restore.ts --write --write-prod
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';
import {
  classifyNavratna,
  type LegacyTermRef,
  type NavratnaSubcategory,
} from '../lib/transform/categories.js';
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

const TARGET_SUBS = new Set<string>([
  'emerald',
  'yellow-sapphire',
  'blue-sapphire',
  'ruby',
  'cats-eye',
  'hessonite',
  'red-coral',
  'pearl',
  'white-sapphire',
  'pitambari',
  'exclusive-gems',
]);

type WooProduct = {
  id: string;
  title: string;
  slug: string;
  createdAt: string | null;
  meta: Record<string, string>;
  sub: NavratnaSubcategory;
  qualityLabel?: string;
  planet?: string;
};

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
    // Read-only: target production URL without committing.
    prod: argv.includes('--prod') || argv.includes('--write-prod'),
  };
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

function parseCarat(title: string, meta: Record<string, string>): number | null {
  const fromMeta = Number(meta.weight_carat || meta.additional_info_weight || '');
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
  const m = title.match(/(\d+(?:\.\d+)?)\s*ct/i);
  return m ? Number(m[1]) : null;
}

function parsePpcFromTitle(title: string): number | null {
  const m = title.match(/@\s*([\d,]+(?:\.\d+)?)\s*(?:per|\/)/i);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

async function loadDumpProducts(): Promise<{
  products: Map<string, WooProduct>;
  undeterminedExclusive: WooProduct[];
  attachedFileById: Map<string, string>;
}> {
  const terms = new Map<string, { name: string; slug: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_terms' })) {
    terms.set(String(r.term_id), { name: String(r.name || ''), slug: String(r.slug || '').toLowerCase() });
  }

  const taxById = new Map<string, { slug: string; name: string; taxonomy: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_taxonomy' })) {
    const t = terms.get(String(r.term_id));
    if (!t) continue;
    taxById.set(String(r.term_taxonomy_id), {
      slug: t.slug,
      name: t.name,
      taxonomy: String(r.taxonomy),
    });
  }

  const termsByProduct = new Map<string, LegacyTermRef[]>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_relationships' })) {
    const tax = taxById.get(String(r.term_taxonomy_id));
    if (!tax || tax.taxonomy !== 'product_cat') continue;
    const id = String(r.object_id);
    const list = termsByProduct.get(id) ?? [];
    list.push({ slug: tax.slug, name: tax.name });
    termsByProduct.set(id, list);
  }

  const products = new Map<string, WooProduct>();
  const undeterminedExclusive: WooProduct[] = [];

  for await (const r of streamWpTable({
    filePath: DUMP,
    tableName: 'wp_posts',
    filter: (row) => row.post_type === 'product' && row.post_status === 'publish',
  })) {
    const id = String(r.ID);
    const title = String(r.post_title || '').trim();
    const legacyTerms = termsByProduct.get(id) ?? [];
    const cls = classifyNavratna({ legacyTerms, productTitle: title });
    if (!cls.include || !cls.subCategory) continue;

    const onlyExclusive =
      legacyTerms.some((t) => t.slug === 'exclusive-gems') &&
      !legacyTerms.some((t) => TARGET_SUBS.has(t.slug) && t.slug !== 'exclusive-gems');

    if (cls.subCategory === 'exclusive-gems' && onlyExclusive) {
      // Keep for the undetermined list; do not gap-fill into exclusive shelf unless already target.
      undeterminedExclusive.push({
        id,
        title,
        slug: String(r.post_name || ''),
        createdAt: r.post_date_gmt || r.post_date || null,
        meta: {},
        sub: 'exclusive-gems',
        qualityLabel: 'Exclusive',
      });
      continue;
    }

    if (!TARGET_SUBS.has(cls.subCategory)) continue;

    products.set(id, {
      id,
      title,
      slug: String(r.post_name || ''),
      createdAt: r.post_date_gmt || r.post_date || null,
      meta: {},
      sub: cls.subCategory,
      qualityLabel: cls.qualityLabel,
      planet: cls.planet,
    });
  }

  const wantedIds = new Set([...products.keys(), ...undeterminedExclusive.map((p) => p.id)]);
  const META_KEYS = new Set([
    '_sku',
    '_price',
    '_regular_price',
    '_sale_price',
    '_stock_status',
    '_thumbnail_id',
    'price_carat',
    'weight_carat',
    'additional_info_weight',
  ]);

  const attachedFileById = new Map<string, string>();
  for await (const r of streamWpTable({
    filePath: DUMP,
    tableName: 'wp_postmeta',
    filter: (row: Record<string, SqlValue>) =>
      (wantedIds.has(String(row.post_id)) && META_KEYS.has(String(row.meta_key))) ||
      row.meta_key === '_wp_attached_file',
  })) {
    if (r.meta_key === '_wp_attached_file') {
      attachedFileById.set(String(r.post_id), String(r.meta_value ?? ''));
      continue;
    }
    const id = String(r.post_id);
    const p = products.get(id) ?? undeterminedExclusive.find((u) => u.id === id);
    if (!p) continue;
    p.meta[String(r.meta_key)] = String(r.meta_value ?? '');
  }

  return { products, undeterminedExclusive, attachedFileById };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = flags.prod
    ? (process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL)
    : (process.env.LEGACY_IMPORT_DATABASE_URL || process.env.DATABASE_URL);
  if (!dbUrl) throw new Error('Missing database URL');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.prod ? ' (prod target)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${DUMP}\n`);

  const { products, undeterminedExclusive, attachedFileById } = await loadDumpProducts();
  console.log(`Dump classified target products: ${products.size}`);
  console.log(`Undetermined exclusive (listed only): ${undeterminedExclusive.length}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const remappedLog: Array<Record<string, string>> = [];
  const insertedLog: Array<Record<string, string>> = [];
  const restoredLog: Array<Record<string, string>> = [];

  try {
    await client.query('BEGIN');

    const { rows: existing } = await client.query<{
      id: string;
      legacy_woo_id: number | null;
      sku: string | null;
      name: string;
      sub_category: string | null;
      availability_status: string | null;
      stock_status: string | null;
      in_stock: boolean | null;
      price_mode: string | null;
      quality_label: string | null;
      is_active: boolean;
      reservation_note: string | null;
    }>(`
      SELECT id, legacy_woo_id, sku, name, sub_category, availability_status, stock_status,
             in_stock, price_mode, quality_label, is_active, reservation_note
      FROM products
      WHERE category = 'navaratna' OR sub_category = ANY($1)
    `, [[...TARGET_SUBS]]);

    const byLegacy = new Map<string, (typeof existing)[0]>();
    const bySku = new Map<string, (typeof existing)[0]>();
    for (const row of existing) {
      if (row.legacy_woo_id != null) byLegacy.set(String(row.legacy_woo_id), row);
      if (row.sku) bySku.set(row.sku.trim().toLowerCase(), row);
    }

    const { rows: slugRows } = await client.query<{ slug: string }>(`SELECT slug FROM products`);
    const usedSlugs = new Set(slugRows.map((r) => r.slug));

    // --- 1) Insert missing ---
    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (hit) continue;

      const pricing = normalisePricing({
        ...woo.meta,
        price_carat: woo.meta.price_carat || String(parsePpcFromTitle(woo.title) ?? '') || undefined,
        weight_carat: woo.meta.weight_carat || String(parseCarat(woo.title, woo.meta) ?? '') || undefined,
      });
      // Title often has @rate when meta price_carat missing
      if (!pricing.pricePerCarat) {
        const ppc = parsePpcFromTitle(woo.title);
        const carat = parseCarat(woo.title, woo.meta);
        if (ppc && carat) {
          Object.assign(pricing, normalisePricing({
            ...woo.meta,
            price_carat: String(ppc),
            weight_carat: String(carat),
          }));
        }
      }

      const dumpInStock = woo.meta._stock_status !== 'outofstock';
      const availability = resolveLegacyAvailabilityStatus({
        priceMode: pricing.priceMode,
        inStock: dumpInStock,
        stockStatus: dumpInStock ? 'in_stock' : 'out_of_stock',
      });
      const carat = parseCarat(woo.title, woo.meta);
      const price = pricing.price ?? 0;
      const isActive = true; // show on-demand exclusives too

      let slug = woo.slug || `product-${woo.id}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${woo.id}`;
      usedSlugs.add(slug);

      const thumbId = woo.meta._thumbnail_id;
      const attachedFile = thumbId ? attachedFileById.get(thumbId) : '';
      const rawImage = attachedFile ? `${UPLOADS}${attachedFile}` : null;
      // ponytail: only ingest on write; dry-run keeps WP URL for logs and rolls back
      const imageUrl = flags.write && rawImage ? await ownMediaUrl(rawImage) : rawImage;
      const images = imageUrl ? [imageUrl] : [];
      const canonical = `${SITE}/shop/${woo.sub}/${slug}`;
      const metaTitle = `${woo.title}`.slice(0, 70);
      const metaDescription = `Buy ${woo.title}. Natural certified Vedic gemstone from PureVedicGems.`.slice(0, 160);

      await client.query(
        `INSERT INTO products (
            legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
            sku, name, slug, category, sub_category, product_type, planet, quality_label,
            price, compare_price, price_per_carat, carat_weight, price_mode, currency,
            in_stock, stock_status, availability_status, stock_quantity, sold_individually,
            thumbnail_url, images, is_active,
            meta_title, meta_description, canonical_url, og_image, seo_data, legacy_data
         ) VALUES (
            $1,$2,$3,$4,'publish',$5,
            $6,$7,$8,'navaratna',$9,'gemstone',$10,$11,
            $12,$13,$14,$15,$16,'INR',
            $17,$18,$19,$20,true,
            $21,$22::jsonb,$23,
            $24,$25,$26,$27,$28::jsonb,$29::jsonb
         )
         ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
            name = EXCLUDED.name,
            sub_category = EXCLUDED.sub_category,
            quality_label = COALESCE(EXCLUDED.quality_label, products.quality_label),
            price = EXCLUDED.price,
            price_per_carat = COALESCE(EXCLUDED.price_per_carat, products.price_per_carat),
            price_mode = EXCLUDED.price_mode,
            carat_weight = COALESCE(EXCLUDED.carat_weight, products.carat_weight),
            in_stock = EXCLUDED.in_stock,
            stock_status = EXCLUDED.stock_status,
            availability_status = EXCLUDED.availability_status,
            thumbnail_url = COALESCE(products.thumbnail_url, EXCLUDED.thumbnail_url),
            images = CASE WHEN products.images = '[]'::jsonb THEN EXCLUDED.images ELSE products.images END,
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
          woo.sub,
          woo.planet ?? null,
          woo.qualityLabel ?? null,
          price,
          pricing.comparePrice,
          pricing.pricePerCarat,
          carat,
          pricing.priceMode,
          availability === 'in_stock',
          availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
          availability,
          availability === 'in_stock' ? 1 : 0,
          imageUrl,
          JSON.stringify(images),
          isActive,
          metaTitle,
          metaDescription,
          canonical,
          imageUrl,
          JSON.stringify({ migratedBy: 'navratna-gap-fill-2026-08', source: 'latestsqldump/pugemved_indb(1).sql' }),
          JSON.stringify({ source: 'latestsqldump', legacy_woo_id: Number(woo.id), stock: woo.meta._stock_status || null }),
        ],
      );
      insertedLog.push({
        legacy_woo_id: woo.id,
        sku: woo.meta._sku || '',
        sub_category: woo.sub,
        price_mode: pricing.priceMode,
        title: woo.title,
      });
    }

    // --- 2) Remap existing exclusive-gems → gem subcategory when dump classifies them ---
    for (const woo of products.values()) {
      if (!woo.qualityLabel && woo.sub === 'exclusive-gems') continue;
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit) continue;
      if (hit.sub_category === woo.sub && (hit.quality_label === 'Exclusive' || !woo.qualityLabel)) continue;
      if (woo.sub === 'exclusive-gems') continue; // only remap OUT of exclusive into gem cats
      if (hit.sub_category !== 'exclusive-gems' && hit.sub_category === woo.sub) continue;

      // Remap when live is exclusive-gems; woo.sub is already a gem shelf (exclusive skipped above)
      if (hit.sub_category === 'exclusive-gems') {
        await client.query(
          `UPDATE products SET
             sub_category = $2,
             quality_label = COALESCE(quality_label, 'Exclusive'),
             planet = COALESCE(planet, $3),
             canonical_url = $4,
             updated_at = NOW()
           WHERE id = $1`,
          [
            hit.id,
            woo.sub,
            woo.planet ?? null,
            `${SITE}/shop/${woo.sub}/${hit.id}`, // slug kept; path updated loosely via storefront
          ],
        );
        // Fix canonical with real slug
        await client.query(
          `UPDATE products SET canonical_url = $2 || '/' || slug WHERE id = $1`,
          [hit.id, `${SITE}/shop/${woo.sub}`],
        );
        remappedLog.push({
          id: hit.id,
          sku: hit.sku || woo.meta._sku || '',
          from: hit.sub_category || '',
          to: woo.sub,
          title: hit.name,
        });
      }
    }

    // Also remap live exclusive-gems that match dump products we classified into gem cats
    // (covers products already present whose dump classification now maps via title)
    for (const row of existing) {
      if (row.sub_category !== 'exclusive-gems' || !row.is_active) continue;
      const woo =
        (row.legacy_woo_id != null ? products.get(String(row.legacy_woo_id)) : undefined) ||
        (row.sku ? [...products.values()].find((p) => p.meta._sku?.trim().toLowerCase() === row.sku!.trim().toLowerCase()) : undefined);
      if (!woo || woo.sub === 'exclusive-gems') continue;
      if (remappedLog.some((r) => r.id === row.id)) continue;

      await client.query(
        `UPDATE products SET
           sub_category = $2,
           quality_label = COALESCE(quality_label, 'Exclusive'),
           planet = COALESCE(planet, $3),
           canonical_url = $4 || '/' || slug,
           updated_at = NOW()
         WHERE id = $1`,
        [row.id, woo.sub, woo.planet ?? null, `${SITE}/shop/${woo.sub}`],
      );
      remappedLog.push({
        id: row.id,
        sku: row.sku || '',
        from: 'exclusive-gems',
        to: woo.sub,
        title: row.name,
      });
    }

    // --- 3) Restore stock from testing hold / OOS when dump says instock ---
    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit || !hit.is_active) continue;

      const dumpInStock = woo.meta._stock_status !== 'outofstock';
      if (!dumpInStock) continue;

      const status = hit.availability_status || '';
      const needsRestore =
        status === 'reserved' ||
        status === 'sold' ||
        status === 'out_of_stock' ||
        (hit.in_stock === false && status !== 'on_demand' && hit.price_mode !== 'on_demand' && hit.price_mode !== 'quote_required');

      if (!needsRestore) continue;
      // Never flip true on-demand quote SKUs to buyable in_stock
      if (hit.price_mode === 'on_demand' || hit.price_mode === 'quote_required' || status === 'on_demand') continue;

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

    const undeterminedOut = undeterminedExclusive.map((p) => ({
      legacy_woo_id: p.id,
      sku: p.meta._sku || '',
      title: p.title,
      slug: p.slug,
      stock: p.meta._stock_status || '',
    }));
    const reportPath = resolve(here, '_gap-fill-report.json');
    writeFileSync(
      reportPath,
      JSON.stringify(
        {
          inserted: insertedLog,
          remappedExclusive: remappedLog,
          restoredStock: restoredLog,
          undeterminedExclusive: undeterminedOut,
        },
        null,
        2,
      ),
    );

    console.log(`\nInserted missing: ${insertedLog.length}`);
    for (const r of insertedLog.slice(0, 20)) {
      console.log(`  + ${r.sub_category.padEnd(16)} sku=${(r.sku || '-').padEnd(12)} ${r.title.slice(0, 50)}`);
    }
    if (insertedLog.length > 20) console.log(`  … ${insertedLog.length - 20} more`);

    console.log(`\nRemapped Exclusive → gem cat: ${remappedLog.length}`);
    const remapByTo = new Map<string, number>();
    for (const r of remappedLog) remapByTo.set(r.to, (remapByTo.get(r.to) ?? 0) + 1);
    for (const [k, v] of [...remapByTo.entries()].sort()) console.log(`  ${String(v).padStart(4)} → ${k}`);

    console.log(`\nRestored stock: ${restoredLog.length}`);
    for (const r of restoredLog) {
      console.log(`  ${r.was.padEnd(12)} sku=${(r.sku || '-').padEnd(12)} ${r.sub_category}  ${r.title.slice(0, 40)}  [${(r.note || '').slice(0, 35)}]`);
    }

    console.log(`\nUndetermined Exclusive (NOT migrated into Navratna): ${undeterminedOut.length}`);
    for (const u of undeterminedOut.slice(0, 30)) {
      console.log(`  sku=${(u.sku || '-').padEnd(12)} id=${u.legacy_woo_id}  ${u.title.slice(0, 60)}`);
    }
    if (undeterminedOut.length > 30) console.log(`  … ${undeterminedOut.length - 30} more`);
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
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
