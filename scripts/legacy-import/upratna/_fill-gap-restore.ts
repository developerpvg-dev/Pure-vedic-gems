/**
 * Upratna gap-fill + testing stock restore from latest Woo dump.
 *
 *   npx tsx scripts/legacy-import/upratna/_fill-gap-restore.ts --prod
 *   npx tsx scripts/legacy-import/upratna/_fill-gap-restore.ts --write --write-prod
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
import { ensureGemConfiguratorOptionRules } from '../lib/ensure-option-rules.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local'), override: true });

const DUMP = resolve(repoRoot, '..', 'latestsqldump', 'pugemved_indb(1).sql');
const SITE = 'https://www.purevedicgems.com';
/** Fetch-only source for Woo attachments; never persist — use ownMediaUrl on write. */
const UPLOADS = 'https://www.purevedicgems.in/wp-content/uploads/';

const ROOT_SLUGS = new Set(['upratan', 'upratna', 'uparatna', 'upratanas', 'upratnas']);

/** From upratna/03-transform CATEGORY_MAP (slug only). */
const CATEGORY_MAP: Record<string, string> = {
  upratan: 'upratna',
  upratna: 'upratna',
  amethyst: 'amethyst',
  aquamarine: 'aquamarine',
  'blue-topaz': 'blue-topaz',
  citrine: 'citrine',
  diopside: 'diopside',
  garnet: 'garnet',
  hakik: 'hakik',
  iolite: 'iolite',
  kyanite: 'kyanite',
  'lapis-lazuli': 'lapis-lazuli',
  malachite: 'malachite',
  'moon-stone': 'moonstone',
  moonstone: 'moonstone',
  opal: 'opal',
  peridot: 'peridot',
  'rose-quartz-2': 'rose-quartz',
  'rose-quartz': 'rose-quartz',
  sunstone: 'sunstone',
  tanzanite: 'tanzanite',
  'tiger-eye': 'tiger-eye',
  'turquoise-upratan': 'turquoise',
  turquoise: 'turquoise',
  'white-topaz': 'white-topaz',
  'white-coral': 'white-coral',
  zircon: 'zircon',
};

const TITLE_FALLBACK: Array<[RegExp, string]> = [
  [/\bmoon\s*stone\b|\bmoonstone\b|\bchandrakant\b/i, 'moonstone'],
  [/\bturquoise\b|\bfiroza\b/i, 'turquoise'],
  [/\bamethyst\b|\bkatela\b|\bjamunia\b/i, 'amethyst'],
  [/\baquamarine\b|\bberuj\b/i, 'aquamarine'],
  [/\bblue\s*topaz\b/i, 'blue-topaz'],
  [/\bwhite\s*topaz\b/i, 'white-topaz'],
  [/\bcitrine\b|\bsunela\b/i, 'citrine'],
  [/\bdiopside\b/i, 'diopside'],
  [/\bgarnet\b|\btamra\b/i, 'garnet'],
  [/\bhakik\b|\bagate\b/i, 'hakik'],
  [/\biolite\b|\bneeli\b/i, 'iolite'],
  [/\bkyanite\b/i, 'kyanite'],
  [/\blapis\b/i, 'lapis-lazuli'],
  [/\bmalachite\b/i, 'malachite'],
  [/\bopal\b|\bdoodhiya\b/i, 'opal'],
  [/\bperidot\b|\bzabarjad\b/i, 'peridot'],
  [/\brose\s*quartz\b/i, 'rose-quartz'],
  [/\bsunstone\b/i, 'sunstone'],
  [/\btanzanite\b/i, 'tanzanite'],
  [/\btiger'?s?\s*eye\b/i, 'tiger-eye'],
  [/\bwhite\s*coral\b/i, 'white-coral'],
  [/\bzircon\b/i, 'zircon'],
];

function canonical(legacySlug: string): string {
  const key = legacySlug.toLowerCase().trim();
  return CATEGORY_MAP[key] ?? key.replace(/-upratan$/, '').replace(/-upratna$/, '');
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

type WooProduct = {
  id: string;
  title: string;
  slug: string;
  createdAt: string | null;
  meta: Record<string, string>;
  sub: string;
  qualityLabel?: string;
};

async function loadDump(): Promise<{
  products: Map<string, WooProduct>;
  attachedFileById: Map<string, string>;
}> {
  const terms = new Map<string, { name: string; slug: string }>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_terms' })) {
    terms.set(String(r.term_id), { name: String(r.name || ''), slug: String(r.slug || '').toLowerCase() });
  }

  type Tax = { slug: string; name: string; taxonomy: string; parent: string; termId: string };
  const taxById = new Map<string, Tax>();
  const taxByTermId = new Map<string, Tax>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_taxonomy' })) {
    const t = terms.get(String(r.term_id));
    if (!t) continue;
    const row = {
      slug: t.slug,
      name: t.name,
      taxonomy: String(r.taxonomy),
      parent: String(r.parent || '0'),
      termId: String(r.term_id),
    };
    taxById.set(String(r.term_taxonomy_id), row);
    if (r.taxonomy === 'product_cat') taxByTermId.set(row.termId, row);
  }

  function underUpratna(termId: string): boolean {
    let cur = termId;
    const seen = new Set<string>();
    while (cur && cur !== '0' && !seen.has(cur)) {
      seen.add(cur);
      const tax = taxByTermId.get(cur);
      if (!tax) break;
      if (ROOT_SLUGS.has(tax.slug)) return true;
      cur = tax.parent;
    }
    return false;
  }

  const termsByProduct = new Map<string, { slug: string; name: string; under: boolean }[]>();
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'wp_term_relationships' })) {
    const tax = taxById.get(String(r.term_taxonomy_id));
    if (!tax || tax.taxonomy !== 'product_cat') continue;
    const id = String(r.object_id);
    const list = termsByProduct.get(id) ?? [];
    list.push({ slug: tax.slug, name: tax.name, under: underUpratna(tax.termId) || Boolean(CATEGORY_MAP[tax.slug]) });
    termsByProduct.set(id, list);
  }

  // Also pick exclusive-gems opals etc. that map to upratna via title — optional via exclusive term
  const products = new Map<string, WooProduct>();
  for await (const r of streamWpTable({
    filePath: DUMP,
    tableName: 'wp_posts',
    filter: (row) => row.post_type === 'product' && row.post_status === 'publish',
  })) {
    const id = String(r.ID);
    const title = String(r.post_title || '').trim();
    const legacyTerms = termsByProduct.get(id) ?? [];
    const upratnaTerms = legacyTerms.filter((t) => t.under && !ROOT_SLUGS.has(t.slug));
    const hasExclusive = legacyTerms.some((t) => t.slug === 'exclusive-gems');

    let sub: string | null = null;
    if (upratnaTerms.length) {
      const mapped = upratnaTerms
        .map((t) => ({ slug: canonical(t.slug), depth: 1 }))
        .filter((t) => t.slug !== 'upratna')
        .sort((a, b) => a.slug.localeCompare(b.slug));
      sub = mapped[0]?.slug ?? null;
    }
    if (!sub && hasExclusive) {
      for (const [re, s] of TITLE_FALLBACK) {
        if (re.test(title) && CATEGORY_MAP[s] !== 'upratna' && Object.values(CATEGORY_MAP).includes(s)) {
          sub = s;
          break;
        }
      }
    }
    if (!sub) {
      // title fallback only if product has any upratna root term
      if (legacyTerms.some((t) => ROOT_SLUGS.has(t.slug) || t.under)) {
        for (const [re, s] of TITLE_FALLBACK) {
          if (re.test(title)) {
            sub = s;
            break;
          }
        }
      }
    }
    if (!sub || sub === 'upratna') continue;

    products.set(id, {
      id,
      title,
      slug: String(r.post_name || ''),
      createdAt: r.post_date_gmt || r.post_date || null,
      meta: {},
      sub,
      qualityLabel: hasExclusive ? 'Exclusive' : undefined,
    });
  }

  const META_KEYS = new Set([
    '_sku', '_price', '_regular_price', '_sale_price', '_stock_status', '_thumbnail_id',
    'price_carat', 'weight_carat', 'additional_info_weight',
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
  for (const p of products.values()) bySub.set(p.sub, (bySub.get(p.sub) ?? 0) + 1);
  console.log(`Dump classified Upratna products: ${products.size}`);
  for (const [k, v] of [...bySub.entries()].sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const insertedLog: Array<Record<string, string>> = [];
  const remappedLog: Array<Record<string, string>> = [];
  const restoredLog: Array<Record<string, string>> = [];

  try {
    await client.query('BEGIN');

    const targetSubs = [...new Set([...products.values()].map((p) => p.sub))];
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
      WHERE category = 'upratna' OR sub_category = ANY($1)
    `, [targetSubs]);

    const byLegacy = new Map<string, (typeof existing)[0]>();
    const bySku = new Map<string, (typeof existing)[0]>();
    for (const row of existing) {
      if (row.legacy_woo_id != null) byLegacy.set(String(row.legacy_woo_id), row);
      if (row.sku) bySku.set(row.sku.trim().toLowerCase(), row);
    }

    const { rows: slugRows } = await client.query<{ slug: string }>(`SELECT slug FROM products`);
    const usedSlugs = new Set(slugRows.map((r) => r.slug));

    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (hit) continue;

      const pricingMeta = {
        ...woo.meta,
        price_carat: woo.meta.price_carat || String(parsePpcFromTitle(woo.title) ?? '') || undefined,
        weight_carat: woo.meta.weight_carat || String(parseCarat(woo.title, woo.meta) ?? '') || undefined,
      };
      let pricing = normalisePricing(pricingMeta);
      if (!pricing.pricePerCarat) {
        const ppc = parsePpcFromTitle(woo.title);
        const carat = parseCarat(woo.title, woo.meta);
        if (ppc && carat) {
          pricing = normalisePricing({ ...woo.meta, price_carat: String(ppc), weight_carat: String(carat) });
        }
      }

      const dumpIn = woo.meta._stock_status !== 'outofstock';
      const availability = resolveLegacyAvailabilityStatus({
        priceMode: pricing.priceMode,
        inStock: dumpIn,
        stockStatus: dumpIn ? 'in_stock' : 'out_of_stock',
      });

      let slug = woo.slug || `upratna-${woo.id}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${woo.id}`;
      usedSlugs.add(slug);

      const thumbId = woo.meta._thumbnail_id;
      const attached = thumbId ? attachedFileById.get(thumbId) : '';
      const rawImage = attached ? `${UPLOADS}${attached}` : null;
      const imageUrl = flags.write && rawImage ? await ownMediaUrl(rawImage) : rawImage;
      const carat = parseCarat(woo.title, woo.meta);

      const insert = await client.query<{ id: string }>(
        `INSERT INTO products (
           legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
           sku, name, slug, category, sub_category, product_type, quality_label,
           price, compare_price, price_per_carat, carat_weight, price_mode, currency,
           in_stock, stock_status, availability_status, stock_quantity, sold_individually,
           thumbnail_url, images, is_active, configurator_enabled,
           meta_title, meta_description, canonical_url, og_image, seo_data, legacy_data
         ) VALUES (
           $1,$2,$3,$4,'publish',$5,
           $6,$7,$8,'upratna',$9,'gemstone',$10,
           $11,$12,$13,$14,$15,'INR',
           $16,$17,$18,$19,true,
           $20,$21::jsonb,true,true,
           $22,$23,$24,$20,$25::jsonb,$26::jsonb
         )
         ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
           name = EXCLUDED.name,
           category = 'upratna',
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
           is_active = true,
           configurator_enabled = TRUE,
           updated_at = NOW()
         RETURNING id`,
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
          woo.qualityLabel ?? null,
          pricing.price ?? 0,
          pricing.comparePrice,
          pricing.pricePerCarat,
          carat,
          pricing.priceMode,
          availability === 'in_stock',
          availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
          availability,
          availability === 'in_stock' ? 1 : 0,
          imageUrl,
          JSON.stringify(imageUrl ? [imageUrl] : []),
          woo.title.slice(0, 70),
          `Buy ${woo.title}. Natural certified Upratna gemstone from PureVedicGems.`.slice(0, 160),
          `${SITE}/shop/${woo.sub}/${slug}`,
          JSON.stringify({ migratedBy: 'upratna-gap-fill-2026-08', source: 'latestsqldump/pugemved_indb(1).sql' }),
          JSON.stringify({ source: 'latestsqldump', legacy_woo_id: Number(woo.id), stock: woo.meta._stock_status || null }),
        ],
      );
      const productId = insert.rows[0]?.id;
      if (productId) await ensureGemConfiguratorOptionRules(client, productId);
      insertedLog.push({
        legacy_woo_id: woo.id,
        sku: woo.meta._sku || '',
        sub_category: woo.sub,
        title: woo.title,
      });
    }

    for (const woo of products.values()) {
      const hit = byLegacy.get(woo.id) || (woo.meta._sku ? bySku.get(woo.meta._sku.trim().toLowerCase()) : undefined);
      if (!hit || !hit.is_active) continue;
      const needsRemap =
        hit.category !== 'upratna' ||
        hit.sub_category !== woo.sub ||
        (woo.qualityLabel && (hit.quality_label || '').toLowerCase() !== 'exclusive');
      if (!needsRemap) continue;

      await client.query(
        `UPDATE products SET
           category = 'upratna',
           sub_category = $2,
           quality_label = COALESCE($3, quality_label),
           canonical_url = $4 || '/' || slug,
           updated_at = NOW()
         WHERE id = $1`,
        [hit.id, woo.sub, woo.qualityLabel ?? null, `${SITE}/shop/${woo.sub}`],
      );
      remappedLog.push({
        id: hit.id,
        sku: hit.sku || woo.meta._sku || '',
        from: `${hit.category}/${hit.sub_category}`,
        to: `upratna/${woo.sub}`,
        title: hit.name,
      });
    }

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
      JSON.stringify({ inserted: insertedLog, remapped: remappedLog, restoredStock: restoredLog }, null, 2),
    );

    console.log(`\nInserted missing: ${insertedLog.length}`);
    const insBy = new Map<string, number>();
    for (const r of insertedLog) insBy.set(r.sub_category, (insBy.get(r.sub_category) ?? 0) + 1);
    for (const [k, v] of [...insBy.entries()].sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);
    for (const r of insertedLog.slice(0, 12)) {
      console.log(`  + ${r.sub_category.padEnd(16)} sku=${(r.sku || '-').padEnd(12)} ${r.title.slice(0, 45)}`);
    }
    if (insertedLog.length > 12) console.log(`  … ${insertedLog.length - 12} more`);

    console.log(`\nRemapped: ${remappedLog.length}`);
    for (const r of remappedLog.slice(0, 12)) {
      console.log(`  ${r.from} → ${r.to}  sku=${r.sku}  ${r.title.slice(0, 40)}`);
    }
    if (remappedLog.length > 12) console.log(`  … ${remappedLog.length - 12} more`);

    console.log(`\nRestored stock: ${restoredLog.length}`);
    for (const r of restoredLog) {
      console.log(`  ${r.was.padEnd(12)} sku=${(r.sku || '-').padEnd(12)} ${r.sub_category}  ${r.title.slice(0, 40)}`);
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
