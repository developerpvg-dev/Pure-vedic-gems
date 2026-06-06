/**
 * navratna/03-transform.ts
 *
 * Read stg_wp_* and produce one stg_navratna_products row per included
 * product, plus stg_redirect_candidates entries.
 *
 * Idempotent: TRUNCATEs stg_navratna_products + stg_redirect_candidates
 * inside one transaction before reinserting. Re-runs cleanly.
 *
 * Phase 1 Navratna products are non-variant loose gemstones — no taxonomy-
 * level options exist in the legacy data, so stg_navratna_option_rules is
 * left empty for now and will be populated by a later phase that handles
 * the new site's order-time customisation flow.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/navratna/03-transform.ts --dry-run   (default)
 *   npx tsx scripts/legacy-import/navratna/03-transform.ts --write
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
// node-pg returns BIGINT (OID 20) as strings by default. Force JS number
// because legacy WP IDs sit comfortably under 2^53.
pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));
import { parseRunMode } from '../lib/supabase.js';
import {
  classifyNavratna,
  legacyRedirectPaths,
  navratnaStorefrontPath,
  type LegacyTermRef,
  type NavratnaSubcategory,
} from '../lib/transform/categories.js';
import { cleanLegacyDescription, extractLegacyVideoUrl } from '../lib/transform/content.js';
import { normalisePricing } from '../lib/transform/pricing.js';
import { buildSeo } from '../lib/transform/seo.js';
import { resolveIdentifiers } from '../lib/transform/identifiers.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const BATCH_SIZE = 200;

async function main() {
  const mode = parseRunMode(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL in env.');

  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',').map((h) => h.trim()).filter(Boolean);
  if (mode.write && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}".`);
  }

  console.log(`Mode: ${mode.write ? 'WRITE' : 'DRY-RUN'}`);
  console.log(`Host: ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // ----- Load support tables (small; fits in memory) -----
    const terms = await client.query(`SELECT term_id, name, slug FROM legacy_import.stg_wp_terms`);
    const termBySlug = new Map<string, { term_id: number; name: string; slug: string }>();
    const termById = new Map<number, { term_id: number; name: string; slug: string }>();
    for (const r of terms.rows) {
      termBySlug.set(r.slug, r);
      termById.set(r.term_id, r);
    }

    const tt = await client.query(`
      SELECT term_taxonomy_id, term_id, parent FROM legacy_import.stg_wp_term_taxonomy
      WHERE taxonomy='product_cat'`);
    const ttById = new Map<number, { term_id: number; parent: number }>();
    const termIdByTtid = new Map<number, number>();
    for (const r of tt.rows) {
      ttById.set(r.term_taxonomy_id, { term_id: r.term_id, parent: r.parent });
      termIdByTtid.set(r.term_taxonomy_id, r.term_id);
    }

    // term_id -> ancestor path (e.g. "NAVRATAN > Yellow Sapphire")
    const pathByTermId = new Map<number, string>();
    for (const [termId] of termById) {
      const chain: string[] = [];
      let cur = termId;
      let guard = 0;
      while (cur && guard < 20) {
        const t = termById.get(cur);
        if (!t) break;
        chain.unshift(t.name);
        const ttRow = [...ttById.values()].find((x) => x.term_id === cur);
        cur = ttRow?.parent ?? 0;
        guard++;
      }
      pathByTermId.set(termId, chain.join(' > '));
    }

    // Product -> [term_id]
    const rels = await client.query(`
      SELECT tr.object_id, tr.term_taxonomy_id
      FROM legacy_import.stg_wp_term_relationships tr`);
    const termIdsByProduct = new Map<number, number[]>();
    for (const r of rels.rows) {
      const tid = termIdByTtid.get(r.term_taxonomy_id);
      if (tid === undefined) continue;
      const arr = termIdsByProduct.get(r.object_id) ?? [];
      arr.push(tid);
      termIdsByProduct.set(r.object_id, arr);
    }

    // ----- Load products (one query, modest size) -----
    const productsRes = await client.query(`
      SELECT id, post_title, post_name, post_content, post_excerpt, post_status,
             post_date_gmt, post_modified_gmt, raw
      FROM legacy_import.stg_wp_posts
      WHERE post_type='product'`);
    console.log(`Loaded ${productsRes.rows.length} product rows.\n`);

    // ----- Load postmeta (stream-style: group by post_id in JS) -----
    // 240k rows are fine to load. Group into Map<post_id, Map<key, value | string[]>>.
    const pmRes = await client.query(`
      SELECT post_id, meta_key, meta_value
      FROM legacy_import.stg_wp_postmeta
      WHERE post_id = ANY($1::bigint[])
    `, [productsRes.rows.map((r) => r.id)]);

    const metaByProduct = new Map<number, Record<string, string>>();
    const oldSlugsByProduct = new Map<number, string[]>();
    for (const r of pmRes.rows) {
      const pid = Number(r.post_id);
      const k = String(r.meta_key);
      const v = r.meta_value === null ? '' : String(r.meta_value);
      if (k === '_wp_old_slug') {
        const arr = oldSlugsByProduct.get(pid) ?? [];
        arr.push(v);
        oldSlugsByProduct.set(pid, arr);
        continue;
      }
      const m = metaByProduct.get(pid) ?? {};
      // Keep last write wins for repeated keys (rare for product meta).
      m[k] = v;
      metaByProduct.set(pid, m);
    }

    // ----- In-memory slug uniqueness predicate for this batch -----
    const claimedSlugs = new Map<string, number>(); // slug -> legacyWooId

    // ----- Iterate, classify, transform -----
    const included: TransformedRow[] = [];
    const excluded: ExcludedRow[] = [];
    const redirects: RedirectRow[] = [];

    for (const p of productsRes.rows) {
      const pid = Number(p.id);
      const meta = metaByProduct.get(pid) ?? {};
      const termIds = termIdsByProduct.get(pid) ?? [];
      const legacyTerms: LegacyTermRef[] = termIds
        .map((tid) => termById.get(tid))
        .filter((t): t is { term_id: number; name: string; slug: string } => Boolean(t))
        .map((t) => ({ slug: t.slug, name: t.name, path: pathByTermId.get(t.term_id) }));

      const cls = classifyNavratna({
        legacyTerms,
        productTitle: String(p.post_title ?? ''),
      });
      if (!cls.include) {
        excluded.push({
          legacy_woo_id: pid,
          title: p.post_title,
          slug: p.post_name,
          reason: cls.reason ?? 'unknown',
        });
        continue;
      }

      const warnings: string[] = [];

      const pricing = normalisePricing(meta);
      warnings.push(...pricing.warnings);

      const content = cleanLegacyDescription(String(p.post_content ?? ''));
      warnings.push(...content.warnings.map((w) => `content: ${w}`));
      const videoUrl = extractLegacyVideoUrl(String(p.post_content ?? ''));

      const ids = await resolveIdentifiers({
        legacyWooId: pid,
        legacySlug: String(p.post_name ?? ''),
        legacySku: meta._sku ?? null,
        isSlugTaken: async (s, exceptId) => {
          const owner = claimedSlugs.get(s);
          return owner !== undefined && owner !== exceptId;
        },
      });
      claimedSlugs.set(ids.slug, pid);
      warnings.push(...ids.warnings);

      const titleCaratWeight = parseCaratFromTitle(String(p.post_title ?? ''));
      const caratWeight = toPositiveNum(meta.weight_carat) ?? toPositiveNum(meta.additional_info_weight) ?? titleCaratWeight;
      const rattiWeight = toPositiveNum(meta.weight_ratti) ?? toPositiveNum(meta.additional_info_weight_in_caret)
        ?? (caratWeight === null ? null : roundNumber(caratWeight * 1.1, 2));
      const origin = nonEmpty(meta.additional_info_origin);
      const certificateLab = nonEmpty(meta.additional_info_certification_by);
      const certificateNumber = nonEmpty(meta.additional_info_certification_no);

      const canonicalPath = navratnaStorefrontPath(cls.subCategory!, ids.slug);

      const seo = buildSeo({
        title: String(p.post_title ?? ''),
        subCategoryLabel: cls.label ?? '',
        caratWeight,
        rattiWeight,
        originDisplay: origin,
        certificateLab,
        legacyMeta: meta,
        canonicalPath,
      });
      warnings.push(...seo.warnings.map((w) => `seo: ${w}`));

      // Build redirects: canonical legacy patterns + every _wp_old_slug.
      const subSlug = legacyTerms.find((t) =>
        ['ruby','pearl','red-coral','red-corel','emerald','yellow-sapphire','blue-sapphire',
         'hessonite','catseye','cats-eye','cat-eye','white-sapphire','diamond','exclusive-gems'].includes(t.slug),
      )?.slug ?? cls.subCategory!;
      const oldSlugs = oldSlugsByProduct.get(pid) ?? [];
      const allLegacySlugs = [String(p.post_name ?? ''), ...oldSlugs].filter(Boolean);
      for (const ls of allLegacySlugs) {
        for (const r of legacyRedirectPaths({ legacySubcatSlug: subSlug, legacyProductSlug: ls })) {
          redirects.push({
            legacy_woo_id: pid,
            legacy_path: r.legacyPath,
            new_path: canonicalPath,
            source_label: r.sourceLabel,
          });
        }
      }

      // Stock
      const stockStatus = meta._stock_status === 'instock' ? 'in_stock'
        : meta._stock_status === 'outofstock' ? 'out_of_stock'
        : meta._stock_status === 'onbackorder' ? 'on_backorder'
        : 'in_stock';

      const dims = {
        length_mm: toNum(meta.additional_info_length),
        width_mm: toNum(meta.additional_info_width),
        depth_mm: toNum(meta.additional_info_depth),
      };
      const hasDims = dims.length_mm !== null || dims.width_mm !== null || dims.depth_mm !== null;

      const galleryIds = normaliseGalleryIds(meta._product_image_gallery, meta._thumbnail_id);

      included.push({
        legacy_woo_id: pid,
        sku: ids.sku,
        legacy_sku: ids.legacySku,
        name: String(p.post_title ?? '').trim(),
        slug: ids.slug,
        legacy_slug: String(p.post_name ?? ''),
        legacy_permalink: `/product/${p.post_name}/`,
        legacy_status: String(p.post_status ?? ''),
        legacy_created_at: p.post_date_gmt,
        category: 'navaratna',
        sub_category: cls.subCategory!,
        product_type: 'gemstone',
        quality_label: cls.qualityLabel ?? nonEmpty(meta.quality)?.replace(/^[\s(]+|[\s)]+$/g, '') ?? null,
        recommendation_category_code: nonEmpty(meta.recommendation_category),
        price: pricing.price,
        compare_price: pricing.comparePrice,
        price_per_carat: pricing.pricePerCarat,
        price_mode: pricing.priceMode,
        carat_weight: caratWeight,
        ratti_weight: rattiWeight,
        shape: nonEmpty(meta.additional_info_shape),
        color_description: nonEmpty(meta.additional_info_color),
        clarity_description: nonEmpty(meta.additional_info_clarity),
        treatment_summary: nonEmpty(meta.additional_info_treatment),
        origin_country: origin,
        origin_region: null,
        origin_display: origin,
        dimensions_mm: hasDims ? dims : null,
        composition: nonEmpty(meta.additional_info_composition),
        certificate_number: certificateNumber,
        certificate_lab: certificateLab,
        certificate_status: certificateNumber ? 'available' : 'not_required',
        certificate_file_url: null,
        short_desc: nonEmpty(p.post_excerpt) ?? null,
        legacy_html_description: String(p.post_content ?? ''),
        clean_description: content.cleanHtml,
        legacy_thumbnail_url: meta._thumbnail_id || null,
        legacy_image_urls: galleryIds,
        images: [],
        thumbnail_url: null,
        video_url: videoUrl,
        in_stock: stockStatus === 'in_stock',
        stock_status: stockStatus,
        manual_reserve_enabled: meta.manually_reserve === '1' || meta.manually_reserve === 'yes',
        reservation_note: null,
        meta_title: seo.metaTitle,
        meta_description: seo.metaDescription,
        meta_keywords: seo.metaKeywords,
        canonical_url: seo.canonicalUrl,
        seo_data: {},
        legacy_seo: seo.legacySeo,
        legacy_data: { post_status: p.post_status, legacy_terms: legacyTerms, _content_warnings: content.shortcodesSeen },
        warnings,
      });
    }

    console.log(`Included: ${included.length}`);
    console.log(`Excluded: ${excluded.length}`);
    console.log(`Redirects to write: ${redirects.length}\n`);

    // Distribution
    const bySub = new Map<string, number>();
    for (const r of included) bySub.set(r.sub_category, (bySub.get(r.sub_category) ?? 0) + 1);
    console.log('By sub_category:');
    for (const [k, v] of [...bySub.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(18)} ${v}`);
    }

    const excludeReasons = new Map<string, number>();
    for (const r of excluded) excludeReasons.set(r.reason, (excludeReasons.get(r.reason) ?? 0) + 1);
    console.log('\nExclude reasons:');
    for (const [k, v] of [...excludeReasons.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(40)} ${v}`);
    }

    // Warning summary
    const productsWithWarnings = included.filter((r) => r.warnings.length > 0).length;
    console.log(`\nProducts with at least one warning: ${productsWithWarnings}/${included.length}`);

    if (!mode.write) {
      console.log('\nDry-run only. Pass --write to upsert.');
      return;
    }

    // ----- Write -----
    console.log('\nWriting to staging...');
    await client.query('BEGIN');
    try {
      await client.query('TRUNCATE legacy_import.stg_navratna_products CASCADE');
      await client.query('TRUNCATE legacy_import.stg_redirect_candidates');

      for (let i = 0; i < included.length; i += BATCH_SIZE) {
        const slice = included.slice(i, i + BATCH_SIZE);
        await insertProducts(client, slice);
      }
      for (let i = 0; i < redirects.length; i += BATCH_SIZE) {
        await insertRedirects(client, redirects.slice(i, i + BATCH_SIZE));
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }

    const { rows: nProducts } = await client.query(`SELECT COUNT(*)::int n FROM legacy_import.stg_navratna_products`);
    const { rows: nRedirects } = await client.query(`SELECT COUNT(*)::int n FROM legacy_import.stg_redirect_candidates`);
    console.log(`  stg_navratna_products:    ${nProducts[0].n}`);
    console.log(`  stg_redirect_candidates:  ${nRedirects[0].n}`);
    console.log('\nTransform complete.');
  } finally {
    await client.end();
  }
}

interface TransformedRow {
  legacy_woo_id: number;
  sku: string;
  legacy_sku: string | null;
  name: string;
  slug: string;
  legacy_slug: string;
  legacy_permalink: string;
  legacy_status: string;
  legacy_created_at: Date | string | null;
  category: 'navaratna';
  sub_category: NavratnaSubcategory;
  product_type: 'gemstone';
  quality_label: string | null;
  recommendation_category_code: string | null;
  price: number | null;
  compare_price: number | null;
  price_per_carat: number | null;
  price_mode: 'fixed' | 'per_carat' | 'on_demand';
  carat_weight: number | null;
  ratti_weight: number | null;
  shape: string | null;
  color_description: string | null;
  clarity_description: string | null;
  treatment_summary: string | null;
  origin_country: string | null;
  origin_region: string | null;
  origin_display: string | null;
  dimensions_mm: object | null;
  composition: string | null;
  certificate_number: string | null;
  certificate_lab: string | null;
  certificate_status: string;
  certificate_file_url: string | null;
  short_desc: string | null;
  legacy_html_description: string;
  clean_description: string;
  legacy_thumbnail_url: string | null;
  legacy_image_urls: string[];
  images: unknown[];
  thumbnail_url: string | null;
  video_url: string | null;
  in_stock: boolean;
  stock_status: string;
  manual_reserve_enabled: boolean;
  reservation_note: string | null;
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  canonical_url: string;
  seo_data: object;
  legacy_seo: object;
  legacy_data: object;
  warnings: string[];
}

interface ExcludedRow { legacy_woo_id: number; title: string; slug: string; reason: string }
interface RedirectRow {
  legacy_woo_id: number;
  legacy_path: string;
  new_path: string;
  source_label: string;
}

async function insertProducts(client: Client, batch: TransformedRow[]): Promise<void> {
  const cols = [
    'legacy_woo_id','sku','legacy_sku','name','slug','legacy_slug','legacy_permalink',
    'legacy_status','legacy_created_at','category','sub_category','product_type',
    'quality_label','recommendation_category_code','price','compare_price','price_per_carat','price_mode',
    'carat_weight','ratti_weight','shape','color_description','clarity_description','treatment_summary',
    'origin_country','origin_region','origin_display','dimensions_mm','composition',
    'certificate_number','certificate_lab','certificate_status','certificate_file_url',
    'short_desc','legacy_html_description','clean_description',
    'legacy_thumbnail_url','legacy_image_urls','images','thumbnail_url','video_url',
    'in_stock','stock_status','manual_reserve_enabled','reservation_note',
    'meta_title','meta_description','meta_keywords','canonical_url','seo_data','legacy_seo','legacy_data','warnings',
  ];
  const placeholders: string[] = [];
  const params: unknown[] = [];
  let p = 1;
  for (const r of batch) {
    const vals = [
      r.legacy_woo_id, r.sku, r.legacy_sku, r.name, r.slug, r.legacy_slug, r.legacy_permalink,
      r.legacy_status, r.legacy_created_at, r.category, r.sub_category, r.product_type,
      r.quality_label, r.recommendation_category_code, r.price, r.compare_price, r.price_per_carat, r.price_mode,
      r.carat_weight, r.ratti_weight, r.shape, r.color_description, r.clarity_description, r.treatment_summary,
      r.origin_country, r.origin_region, r.origin_display, r.dimensions_mm ? JSON.stringify(r.dimensions_mm) : null, r.composition,
      r.certificate_number, r.certificate_lab, r.certificate_status, r.certificate_file_url,
      r.short_desc, r.legacy_html_description, r.clean_description,
      r.legacy_thumbnail_url, JSON.stringify(r.legacy_image_urls), JSON.stringify(r.images), r.thumbnail_url, r.video_url,
      r.in_stock, r.stock_status, r.manual_reserve_enabled, r.reservation_note,
      r.meta_title, r.meta_description, r.meta_keywords, r.canonical_url,
      JSON.stringify(r.seo_data), JSON.stringify(r.legacy_seo), JSON.stringify(r.legacy_data), JSON.stringify(r.warnings),
    ];
    const ph = vals.map(() => `$${p++}`);
    placeholders.push(`(${ph.join(',')})`);
    params.push(...vals);
  }
  await client.query(
    `INSERT INTO legacy_import.stg_navratna_products (${cols.join(',')}) VALUES ${placeholders.join(',')}`,
    params,
  );
}

async function insertRedirects(client: Client, batch: RedirectRow[]): Promise<void> {
  // stg_redirect_candidates schema — see supabase/navratna_phase1_staging.sql.
  // We assume columns: legacy_woo_id, legacy_path, new_path, source_label.
  const placeholders: string[] = [];
  const params: unknown[] = [];
  let p = 1;
  for (const r of batch) {
    placeholders.push(`($${p++},$${p++},$${p++},$${p++})`);
    params.push(r.legacy_woo_id, r.legacy_path, r.new_path, r.source_label);
  }
  await client.query(
    `INSERT INTO legacy_import.stg_redirect_candidates
       (legacy_woo_id, legacy_path, new_path, source_label) VALUES ${placeholders.join(',')}
       ON CONFLICT DO NOTHING`,
    params,
  );
}

function toNum(v: string | null | undefined): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace(/[^\d.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
function toPositiveNum(v: string | null | undefined): number | null {
  const n = toNum(v);
  return n !== null && n > 0 ? n : null;
}
function nonEmpty(s: string | null | undefined): string | null {
  if (s === null || s === undefined) return null;
  const t = String(s).trim();
  return t === '' ? null : t;
}

function parseCaratFromTitle(title: string): number | null {
  const match = title.match(/(\d+(?:\.\d+)?)\s*ct\b/i);
  return match ? toNum(match[1]) : null;
}

function roundNumber(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normaliseGalleryIds(gallery: string | null | undefined, thumbnailId: string | null | undefined): string[] {
  const primary = nonEmpty(thumbnailId);
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of (gallery ?? '').split(',')) {
    const id = raw.trim();
    if (!id || id === primary || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
