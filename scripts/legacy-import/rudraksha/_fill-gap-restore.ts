/**
 * Rudraksha gap-fill + testing stock restore from latest Woo dump.
 *
 * Covers bead cats (1–16 mukhi + specials) and related Exclusive / jewelry /
 * mala cats that live under the Rudraksha tree on the old site.
 *
 *   npx tsx scripts/legacy-import/rudraksha/_fill-gap-restore.ts --prod
 *   npx tsx scripts/legacy-import/rudraksha/_fill-gap-restore.ts --write --write-prod
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

type Family = 'rudraksha' | 'jewelry' | 'mala';

type Classified = {
  sub: string;
  category: Family;
  mukhi: number | null;
  qualityLabel?: string;
};

/** Mirror rudraksha/03-transform canonicalCategory + family. */
function canonicalCategory(legacySlug: string, legacyName: string): { slug: string; family: Family } {
  let slug = legacySlug.toLowerCase().trim();
  const mukhi = slug.match(/^(\d+)-mukhi-rudrakshas?$/);
  if (mukhi) slug = `${mukhi[1]}-mukhi`;
  else if (slug === 'nir-mukhi-rudraksha') slug = 'nir-mukhi';
  else if (slug === 'ganesh-rudrakshas') slug = 'ganesh-rudraksha';
  else if (slug === 'gauri-shankar-rudrakshas') slug = 'gauri-shankar';
  else if (slug === 'rudrakshas') slug = 'rudraksha';

  let family: Family = 'rudraksha';
  if (slug.includes('mala') || slug === 'indrakshi-mala') family = 'mala';
  else if (slug.includes('jewelry') || slug.includes('pendent')) family = 'jewelry';
  return { slug, family };
}

function isRudrakshaTerm(slug: string, name: string, path: string): boolean {
  const value = `${slug} ${name} ${path}`.toLowerCase();
  if (value.includes('malachite')) return false;
  if (slug === 'ganesha' || path.toLowerCase().includes('spiritual idols')) return false;
  return /rudrak|mukhi|gauri|sawar|savar|trijuti|indrakshi/.test(value);
}

function parseMukhi(slugOrTitle: string): number | null {
  const m = slugOrTitle.toLowerCase().match(/(^|\b)([0-9]{1,2})\s*-?\s*mukhi\b/);
  return m ? Number(m[2]) : null;
}

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
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production. Add --write-prod after dry-run.`);
  }
  return dbHost;
}

type WooProduct = {
  id: string;
  title: string;
  slug: string;
  createdAt: string | null;
  meta: Record<string, string>;
  cls: Classified;
};

function classifyProduct(
  title: string,
  legacyTerms: { slug: string; name: string; path: string }[],
): Classified | null {
  const rudrakTerms = legacyTerms.filter((t) => isRudrakshaTerm(t.slug, t.name, t.path));
  if (!rudrakTerms.length) return null;

  const mapped = rudrakTerms
    .map((t) => {
      const { slug, family } = canonicalCategory(t.slug, t.name);
      const depth = t.path.split('>').length;
      const parentPenalty = slug === 'rudraksha' ? 1 : 0;
      return { slug, family, depth, parentPenalty, legacySlug: t.slug };
    })
    .sort((a, b) => {
      if (a.parentPenalty !== b.parentPenalty) return a.parentPenalty - b.parentPenalty;
      if (a.depth !== b.depth) return b.depth - a.depth;
      return a.slug.localeCompare(b.slug);
    });

  const primary = mapped[0];
  if (!primary || primary.slug === 'rudraksha') {
    // Title fallback for parent-only assignment
    const mukhi = parseMukhi(title);
    if (mukhi) {
      return {
        sub: `${mukhi}-mukhi`,
        category: 'rudraksha',
        mukhi,
        qualityLabel: mapped.some((m) => m.slug === 'exclusive-rudraksha') ? 'Exclusive' : undefined,
      };
    }
    if (/gauri\s*shankar/i.test(title)) return { sub: 'gauri-shankar', category: 'rudraksha', mukhi: null };
    if (/ganesh/i.test(title)) return { sub: 'ganesh-rudraksha', category: 'rudraksha', mukhi: null };
    if (/garbh\s*gauri/i.test(title)) return { sub: 'garbh-gauri', category: 'rudraksha', mukhi: null };
    if (/sawar|savar/i.test(title)) return { sub: 'sawar-rudraksha', category: 'rudraksha', mukhi: null };
    if (/nir\s*mukhi/i.test(title)) return { sub: 'nir-mukhi', category: 'rudraksha', mukhi: null };
    return null;
  }

  const exclusive = mapped.some((m) => m.slug === 'exclusive-rudraksha' || m.slug === 'exclusive-rudraksha-malas');
  // If exclusive-rudraksha is primary but title has mukhi, put on mukhi shelf with Exclusive label
  if (primary.slug === 'exclusive-rudraksha') {
    const mukhi = parseMukhi(title);
    if (mukhi) {
      return { sub: `${mukhi}-mukhi`, category: 'rudraksha', mukhi, qualityLabel: 'Exclusive' };
    }
    if (/gauri\s*shankar/i.test(title)) {
      return { sub: 'gauri-shankar', category: 'rudraksha', mukhi: null, qualityLabel: 'Exclusive' };
    }
    if (/ganesh/i.test(title)) {
      return { sub: 'ganesh-rudraksha', category: 'rudraksha', mukhi: null, qualityLabel: 'Exclusive' };
    }
    if (/garbh\s*gauri/i.test(title)) {
      return { sub: 'garbh-gauri', category: 'rudraksha', mukhi: null, qualityLabel: 'Exclusive' };
    }
    if (/sawar|savar/i.test(title)) {
      return { sub: 'sawar-rudraksha', category: 'rudraksha', mukhi: null, qualityLabel: 'Exclusive' };
    }
    if (/nir\s*mukhi/i.test(title)) {
      return { sub: 'nir-mukhi', category: 'rudraksha', mukhi: null, qualityLabel: 'Exclusive' };
    }
    return { sub: 'exclusive-rudraksha', category: 'rudraksha', mukhi: null, qualityLabel: 'Exclusive' };
  }

  return {
    sub: primary.slug,
    category: primary.family,
    mukhi: parseMukhi(primary.slug) ?? parseMukhi(title),
    qualityLabel: exclusive ? 'Exclusive' : undefined,
  };
}

async function loadDump(): Promise<{ products: Map<string, WooProduct>; attachedFileById: Map<string, string> }> {
  const terms = new Map<string, { name: string; slug: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_terms' })) {
    terms.set(String(r.term_id), { name: String(r.name || ''), slug: String(r.slug || '').toLowerCase() });
  }

  type Tax = { slug: string; name: string; taxonomy: string; parent: string; termId: string };
  const taxById = new Map<string, Tax>();
  const taxByTermId = new Map<string, Tax & { taxId: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_taxonomy' })) {
    const t = terms.get(String(r.term_id));
    if (!t) continue;
    const row = {
      taxId: String(r.term_taxonomy_id),
      slug: t.slug,
      name: t.name,
      taxonomy: String(r.taxonomy),
      parent: String(r.parent || '0'),
      termId: String(r.term_id),
    };
    taxById.set(row.taxId, row);
    if (r.taxonomy === 'product_cat') taxByTermId.set(row.termId, row);
  }

  function pathOf(termId: string): string {
    const parts: string[] = [];
    let cur = termId;
    const seen = new Set<string>();
    while (cur && cur !== '0' && !seen.has(cur)) {
      seen.add(cur);
      const tax = taxByTermId.get(cur);
      if (!tax) break;
      parts.unshift(tax.name);
      cur = tax.parent;
    }
    return parts.join(' > ');
  }

  const termsByProduct = new Map<string, { slug: string; name: string; path: string }[]>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_relationships' })) {
    const tax = taxById.get(String(r.term_taxonomy_id));
    if (!tax || tax.taxonomy !== 'product_cat') continue;
    const id = String(r.object_id);
    const list = termsByProduct.get(id) ?? [];
    list.push({ slug: tax.slug, name: tax.name, path: pathOf(tax.termId) });
    termsByProduct.set(id, list);
  }

  const products = new Map<string, WooProduct>();
  for await (const r of streamWpTable({
    filePath: DUMP,
    tableName: 'wp_posts',
    filter: (row) => row.post_type === 'product' && row.post_status === 'publish',
  })) {
    const id = String(r.ID);
    const title = String(r.post_title || '').trim();
    const cls = classifyProduct(title, termsByProduct.get(id) ?? []);
    if (!cls) continue;
    products.set(id, {
      id,
      title,
      slug: String(r.post_name || ''),
      createdAt: r.post_date_gmt || r.post_date || null,
      meta: {},
      cls,
    });
  }

  const META_KEYS = new Set([
    '_sku', '_price', '_regular_price', '_sale_price', '_stock_status', '_thumbnail_id',
    'price_carat', 'weight_carat', 'additional_info_weight', '_weight',
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
    ? (process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL)
    : (process.env.LEGACY_IMPORT_DATABASE_URL || process.env.DATABASE_URL);
  if (!dbUrl) throw new Error('Missing database URL');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.prod ? ' (prod)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${DUMP}\n`);

  const { products, attachedFileById } = await loadDump();
  const bySub = new Map<string, number>();
  for (const p of products.values()) bySub.set(p.cls.sub, (bySub.get(p.cls.sub) ?? 0) + 1);
  console.log(`Dump classified Rudraksha-related: ${products.size}`);
  for (const [k, v] of [...bySub.entries()].sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const insertedLog: Array<Record<string, string>> = [];
  const remappedLog: Array<Record<string, string>> = [];
  const restoredLog: Array<Record<string, string>> = [];

  try {
    await client.query('BEGIN');

    const targetSubs = [...new Set([...products.values()].map((p) => p.cls.sub))];
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
      quality_label: string | null;
      is_active: boolean;
      reservation_note: string | null;
    }>(`
      SELECT id, legacy_woo_id, sku, name, category, sub_category, availability_status, stock_status,
             in_stock, price_mode, quality_label, is_active, reservation_note
      FROM products
      WHERE category IN ('rudraksha','jewelry','mala')
         OR sub_category = ANY($1)
         OR sub_category ILIKE '%mukhi%'
         OR sub_category ILIKE '%rudrak%'
    `, [targetSubs]);

    const byLegacy = new Map<string, (typeof existing)[0]>();
    const bySku = new Map<string, (typeof existing)[0]>();
    for (const row of existing) {
      if (row.legacy_woo_id != null) byLegacy.set(String(row.legacy_woo_id), row);
      if (row.sku) bySku.set(row.sku.trim().toLowerCase(), row);
    }

    const { rows: slugRows } = await client.query<{ slug: string }>(`SELECT slug FROM products`);
    const usedSlugs = new Set(slugRows.map((r) => r.slug));

    // 1) Insert missing
    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (hit) continue;

      const pricing = normalisePricing(woo.meta);
      const dumpIn = woo.meta._stock_status !== 'outofstock';
      const availability = resolveLegacyAvailabilityStatus({
        priceMode: pricing.priceMode,
        inStock: dumpIn,
        stockStatus: dumpIn ? 'in_stock' : 'out_of_stock',
      });

      let slug = woo.slug || `rudraksha-${woo.id}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${woo.id}`;
      usedSlugs.add(slug);

      const thumbId = woo.meta._thumbnail_id;
      const attached = thumbId ? attachedFileById.get(thumbId) : '';
      const rawImage = attached ? `${UPLOADS}${attached}` : null;
      const imageUrl = flags.write && rawImage ? await ownMediaUrl(rawImage) : rawImage;
      const weight = Number(woo.meta._weight || '') || null;

      await client.query(
        `INSERT INTO products (
           legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
           sku, name, slug, category, sub_category, product_type, mukhi_count, quality_label,
           price, compare_price, price_mode, currency, bead_weight,
           in_stock, stock_status, availability_status, stock_quantity, sold_individually,
           thumbnail_url, images, is_active,
           meta_title, meta_description, canonical_url, og_image, seo_data, legacy_data
         ) VALUES (
           $1,$2,$3,$4,'publish',$5,
           $6,$7,$8,$9,$10,'rudraksha',$11,$12,
           $13,$14,$15,'INR',$16,
           $17,$18,$19,$20,true,
           $21,$22::jsonb,true,
           $23,$24,$25,$21,$26::jsonb,$27::jsonb
         )
         ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           sub_category = EXCLUDED.sub_category,
           quality_label = COALESCE(EXCLUDED.quality_label, products.quality_label),
           mukhi_count = COALESCE(EXCLUDED.mukhi_count, products.mukhi_count),
           price = EXCLUDED.price,
           price_mode = EXCLUDED.price_mode,
           in_stock = EXCLUDED.in_stock,
           stock_status = EXCLUDED.stock_status,
           availability_status = EXCLUDED.availability_status,
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
          woo.cls.category,
          woo.cls.sub,
          woo.cls.mukhi,
          woo.cls.qualityLabel ?? null,
          pricing.price ?? 0,
          pricing.comparePrice,
          pricing.priceMode,
          weight,
          availability === 'in_stock',
          availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
          availability,
          availability === 'in_stock' ? 1 : 0,
          imageUrl,
          JSON.stringify(imageUrl ? [imageUrl] : []),
          woo.title.slice(0, 70),
          `Buy ${woo.title}. Authentic Rudraksha from PureVedicGems.`.slice(0, 160),
          `${SITE}/shop/${woo.cls.sub}/${slug}`,
          JSON.stringify({ migratedBy: 'rudraksha-gap-fill-2026-08', source: 'latestsqldump/pugemved_indb(1).sql' }),
          JSON.stringify({ source: 'latestsqldump', legacy_woo_id: Number(woo.id), stock: woo.meta._stock_status || null }),
        ],
      );
      insertedLog.push({
        legacy_woo_id: woo.id,
        sku: woo.meta._sku || '',
        sub_category: woo.cls.sub,
        category: woo.cls.category,
        title: woo.title,
      });
    }

    // 2) Remap existing if wrong shelf (e.g. still exclusive-only when mukhi known)
    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit || !hit.is_active) continue;
      const needsRemap =
        hit.sub_category !== woo.cls.sub ||
        hit.category !== woo.cls.category ||
        (woo.cls.qualityLabel && (hit.quality_label || '').toLowerCase() !== 'exclusive');
      if (!needsRemap) continue;
      // Don't remap away from a more specific live shelf into parent rudraksha
      if (woo.cls.sub === 'rudraksha' && hit.sub_category && hit.sub_category !== 'rudraksha') continue;

      await client.query(
        `UPDATE products SET
           category = $2,
           sub_category = $3,
           mukhi_count = COALESCE($4, mukhi_count),
           quality_label = COALESCE($5, quality_label),
           canonical_url = $6 || '/' || slug,
           updated_at = NOW()
         WHERE id = $1`,
        [
          hit.id,
          woo.cls.category,
          woo.cls.sub,
          woo.cls.mukhi,
          woo.cls.qualityLabel ?? null,
          `${SITE}/shop/${woo.cls.sub}`,
        ],
      );
      remappedLog.push({
        id: hit.id,
        sku: hit.sku || woo.meta._sku || '',
        from: `${hit.category}/${hit.sub_category}`,
        to: `${woo.cls.category}/${woo.cls.sub}`,
        title: hit.name,
      });
    }

    // 3) Restore reserved/sold/oos when dump says instock
    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit || !hit.is_active) continue;
      if (woo.meta._stock_status === 'outofstock') continue;

      const status = hit.availability_status || '';
      const needsRestore =
        status === 'reserved' ||
        status === 'sold' ||
        status === 'out_of_stock' ||
        (hit.in_stock === false && status !== 'on_demand' && hit.price_mode !== 'on_demand' && hit.price_mode !== 'quote_required');
      if (!needsRestore) continue;
      if (hit.price_mode === 'on_demand' || hit.price_mode === 'quote_required' || status === 'on_demand') continue;

      await client.query(
        `UPDATE products SET
           in_stock = true,
           stock_quantity = GREATEST(COALESCE(stock_quantity, 0), 1),
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
      JSON.stringify({ inserted: insertedLog, remapped: remappedLog, restoredStock: restoredLog }, null, 2),
    );

    console.log(`\nInserted missing: ${insertedLog.length}`);
    const insBy = new Map<string, number>();
    for (const r of insertedLog) insBy.set(r.sub_category, (insBy.get(r.sub_category) ?? 0) + 1);
    for (const [k, v] of [...insBy.entries()].sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);
    for (const r of insertedLog.slice(0, 15)) {
      console.log(`  + ${r.sub_category.padEnd(28)} sku=${(r.sku || '-').padEnd(12)} ${r.title.slice(0, 45)}`);
    }
    if (insertedLog.length > 15) console.log(`  … ${insertedLog.length - 15} more`);

    console.log(`\nRemapped: ${remappedLog.length}`);
    for (const r of remappedLog.slice(0, 15)) {
      console.log(`  ${r.from} → ${r.to}  sku=${r.sku}  ${r.title.slice(0, 40)}`);
    }
    if (remappedLog.length > 15) console.log(`  … ${remappedLog.length - 15} more`);

    console.log(`\nRestored stock: ${restoredLog.length}`);
    for (const r of restoredLog) {
      console.log(`  ${r.was.padEnd(12)} sku=${(r.sku || '-').padEnd(12)} ${r.sub_category}  ${r.title.slice(0, 40)}  [${(r.note || '').slice(0, 30)}]`);
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
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
