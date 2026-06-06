/**
 * leftover/03-transform.ts
 *
 * Stage the legacy products that earlier phases skipped because they were tagged
 * only with generic legacy buckets ("Exclusive Gems" / "Pitambari" / "NAVRATAN")
 * instead of a specific stone sub-category. Classification is by product title:
 *
 *   Opal     -> upratna  / opal       (gemstone, configurator, /shop/upratna/{slug})
 *   Pitambari-> navaratna/ pitambari  (gemstone, configurator, /shop/pitambari/{slug})
 *   Emerald  -> navaratna/ emerald    (gemstone, configurator, /shop/emerald/{slug})
 *   N Mukhi  -> rudraksha/ {n}-mukhi  (bead, energization, /shop/rudraksha/{slug})
 *
 * Conventions are replicated verbatim from the upratna / navratna / rudraksha
 * transforms so the migrated rows are indistinguishable from their siblings.
 *
 * Reads directly from the already-loaded legacy_import.stg_wp_* mirror and only
 * stages products that do NOT already exist in public.products (by legacy_woo_id).
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { parseRunMode } from '../lib/supabase.js';
import { cleanLegacyDescription, extractLegacyVideoUrl } from '../lib/transform/content.js';
import { normalisePricing } from '../lib/transform/pricing.js';
import { resolveIdentifiers } from '../lib/transform/identifiers.js';
import { buildSeo } from '../lib/transform/seo.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

type Family = 'gemstone' | 'rudraksha';

interface Classification {
  family: Family;
  category: 'upratna' | 'navaratna' | 'rudraksha';
  subCategory: string;
  label: string;
  planet: string | null;
  mukhiCount?: number;
  focusKeyword: string;
}

/** Classify a leftover product purely from its title. Order matters. */
function classify(title: string): Classification | null {
  const t = title.toLowerCase();

  const mukhi = /(\d+)\s*mukhi/i.exec(title);
  if (mukhi || /\brudraksha\b/i.test(t)) {
    const n = mukhi ? Number(mukhi[1]) : null;
    if (n && Number.isFinite(n)) {
      return {
        family: 'rudraksha',
        category: 'rudraksha',
        subCategory: `${n}-mukhi`,
        label: `${n} Mukhi Rudraksha`,
        planet: null,
        mukhiCount: n,
        focusKeyword: `${n} mukhi rudraksha`,
      };
    }
  }

  if (/\bpitambari\b/i.test(t)) {
    return { family: 'gemstone', category: 'navaratna', subCategory: 'pitambari', label: 'Pitambari (Bi-colour Sapphire)', planet: 'Jupiter', focusKeyword: 'pitambari' };
  }
  if (/\bopal\b/i.test(t)) {
    return { family: 'gemstone', category: 'upratna', subCategory: 'opal', label: 'Opal', planet: 'Venus', focusKeyword: 'opal' };
  }
  if (/\bemerald\b|\bpanna\b/i.test(t)) {
    return { family: 'gemstone', category: 'navaratna', subCategory: 'emerald', label: 'Emerald (Panna)', planet: 'Mercury', focusKeyword: 'emerald' };
  }
  return null;
}

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((arg) => arg !== '--write-prod'));
  return { write, writeProd };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

const SITE_BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pure-vedic-gems.vercel.app').replace(/\/+$/, '');

function nonEmpty(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

function toPositiveNum(value: string | null | undefined): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function round(value: number, dp: number): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function parseCaratFromTitle(title: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*ct\b/i.exec(title);
  return m ? toPositiveNum(m[1]) : null;
}

function parseGramsFromTitle(title: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*g\b/i.exec(title.replace(/\(/g, ' ').replace(/\)/g, ' '));
  return m ? toPositiveNum(m[1]) : null;
}

function normaliseStockStatus(value: string | null | undefined): 'in_stock' | 'out_of_stock' | 'on_backorder' {
  if (value === 'outofstock' || value === 'out_of_stock') return 'out_of_stock';
  if (value === 'onbackorder' || value === 'on_backorder') return 'on_backorder';
  return 'in_stock';
}

function normaliseGalleryIds(gallery: string | null | undefined, thumbnail: string | null | undefined): number[] {
  const ids = String(gallery ?? '').split(',').map((part) => Number(part.trim())).filter((id) => Number.isFinite(id) && id > 0);
  const thumb = Number(thumbnail ?? 0);
  const ordered: number[] = [];
  if (Number.isFinite(thumb) && thumb > 0) ordered.push(thumb);
  for (const id of ids) if (!ordered.includes(id)) ordered.push(id);
  return ordered;
}

interface RedirectRow { legacy_woo_id: number; legacy_path: string; new_path: string; source_label: string }

/**
 * Build redirect candidates from the product's REAL legacy category hierarchy.
 * WooCommerce served products at /product/{slug}/ and at the hierarchical
 * /product-category/{ancestor-slug-path}/{slug}/ (and the /shop/ mirror).
 */
function buildRedirects(legacyWooId: number, legacySlugs: string[], slugChains: string[][], newPath: string): RedirectRow[] {
  const map = new Map<string, RedirectRow>();
  const add = (legacy_path: string, source_label: string) => {
    if (!map.has(legacy_path)) map.set(legacy_path, { legacy_woo_id: legacyWooId, legacy_path, new_path: newPath, source_label });
  };
  for (const slug of legacySlugs) {
    add(`/product/${slug}/`, 'product_root');
    add(`/product/${slug}`, 'product_root');
    for (const chain of slugChains) {
      const path = chain.join('/');
      add(`/product-category/${path}/${slug}/`, 'product_category');
      add(`/product-category/${path}/${slug}`, 'product_category');
      add(`/shop/${path}/${slug}/`, 'shop');
      add(`/shop/${path}/${slug}`, 'shop');
    }
  }
  return [...map.values()];
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // --- term hierarchy (slugs) for redirects ---
    const terms = await client.query(`SELECT term_id, slug FROM legacy_import.stg_wp_terms`);
    const slugByTermId = new Map<number, string>();
    for (const row of terms.rows) slugByTermId.set(Number(row.term_id), String(row.slug));

    const taxonomy = await client.query(
      `SELECT term_taxonomy_id, term_id, parent FROM legacy_import.stg_wp_term_taxonomy WHERE taxonomy='product_cat'`,
    );
    const parentByTermId = new Map<number, number>();
    const termIdByTaxId = new Map<number, number>();
    for (const row of taxonomy.rows) {
      parentByTermId.set(Number(row.term_id), Number(row.parent));
      termIdByTaxId.set(Number(row.term_taxonomy_id), Number(row.term_id));
    }
    const slugChainByTermId = new Map<number, string[]>();
    for (const [termId] of slugByTermId) {
      const chain: string[] = [];
      let current = termId;
      let guard = 0;
      while (current && guard < 20) {
        const slug = slugByTermId.get(current);
        if (!slug) break;
        chain.unshift(slug);
        current = parentByTermId.get(current) ?? 0;
        guard++;
      }
      slugChainByTermId.set(termId, chain);
    }

    // --- products NOT already in public.products ---
    const productsRes = await client.query(`
      SELECT p.id, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_status, p.post_date_gmt
      FROM legacy_import.stg_wp_posts p
      WHERE p.post_type='product'
        AND p.post_status='publish'
        AND NOT EXISTS (SELECT 1 FROM public.products pr WHERE pr.legacy_woo_id = p.id)
      ORDER BY p.id`);
    const productIds: number[] = productsRes.rows.map((r) => Number(r.id));
    console.log(`Leftover published products not yet migrated: ${productIds.length}`);
    if (productIds.length === 0) {
      console.log('Nothing to stage.');
      return;
    }

    // --- postmeta ---
    const metaRes = await client.query(
      `SELECT post_id, meta_key, meta_value FROM legacy_import.stg_wp_postmeta WHERE post_id = ANY($1::bigint[])`,
      [productIds],
    );
    const metaByProduct = new Map<number, Record<string, string>>();
    const oldSlugsByProduct = new Map<number, string[]>();
    for (const row of metaRes.rows) {
      const pid = Number(row.post_id);
      if (row.meta_key === '_wp_old_slug') {
        const list = oldSlugsByProduct.get(pid) ?? [];
        if (row.meta_value) list.push(String(row.meta_value));
        oldSlugsByProduct.set(pid, list);
        continue;
      }
      const map = metaByProduct.get(pid) ?? {};
      map[row.meta_key] = row.meta_value;
      metaByProduct.set(pid, map);
    }

    // --- product_cat term assignments ---
    const relRes = await client.query(
      `SELECT object_id, term_taxonomy_id FROM legacy_import.stg_wp_term_relationships WHERE object_id = ANY($1::bigint[])`,
      [productIds],
    );
    const termIdsByProduct = new Map<number, number[]>();
    for (const row of relRes.rows) {
      const termId = termIdByTaxId.get(Number(row.term_taxonomy_id));
      if (termId === undefined) continue;
      const pid = Number(row.object_id);
      const list = termIdsByProduct.get(pid) ?? [];
      list.push(termId);
      termIdsByProduct.set(pid, list);
    }

    // --- slug uniqueness: across this batch AND existing public.products ---
    const claimedSlugs = new Map<string, number>();
    const isSlugTaken = async (slug: string, exceptId: number): Promise<boolean> => {
      const owner = claimedSlugs.get(slug);
      if (owner !== undefined && owner !== exceptId) return true;
      const res = await client.query(
        `SELECT 1 FROM public.products WHERE slug=$1 AND (legacy_woo_id IS NULL OR legacy_woo_id <> $2) LIMIT 1`,
        [slug, exceptId],
      );
      return (res.rowCount ?? 0) > 0;
    };

    const staged: Record<string, unknown>[] = [];
    const redirects: RedirectRow[] = [];
    const skipped: Array<{ id: number; title: string }> = [];

    for (const p of productsRes.rows) {
      const pid = Number(p.id);
      const title = String(p.post_title ?? '').trim();
      const cls = classify(title);
      if (!cls) {
        skipped.push({ id: pid, title });
        continue;
      }

      const meta = metaByProduct.get(pid) ?? {};
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
        isSlugTaken,
      });
      claimedSlugs.set(ids.slug, pid);
      warnings.push(...ids.warnings);

      const stockStatus = normaliseStockStatus(meta._stock_status);
      const galleryIds = normaliseGalleryIds(meta._product_image_gallery, meta._thumbnail_id);
      const legacySlugs = [String(p.post_name ?? ''), ...(oldSlugsByProduct.get(pid) ?? [])].filter(Boolean);
      const slugChains = (termIdsByProduct.get(pid) ?? [])
        .map((tid) => slugChainByTermId.get(tid))
        .filter((chain): chain is string[] => Boolean(chain && chain.length > 0));
      const legacyCategoryPaths = [...new Set((termIdsByProduct.get(pid) ?? [])
        .map((tid) => (slugChainByTermId.get(tid) ?? []).join(' > '))
        .filter(Boolean))];

      const base: Record<string, unknown> = {
        legacy_woo_id: pid,
        sku: ids.sku,
        legacy_sku: ids.legacySku,
        name: title,
        slug: ids.slug,
        legacy_slug: String(p.post_name ?? ''),
        legacy_permalink: `/product/${p.post_name}/`,
        legacy_status: p.post_status,
        legacy_created_at: p.post_date_gmt,
        family: cls.family,
        category: cls.category,
        sub_category: cls.subCategory,
        price: pricing.price,
        compare_price: pricing.comparePrice,
        price_mode: pricing.priceMode,
        short_desc: nonEmpty(p.post_excerpt),
        legacy_html_description: p.post_content,
        clean_description: content.cleanHtml,
        legacy_thumbnail_url: nonEmpty(meta._thumbnail_id),
        legacy_image_urls: galleryIds,
        images: [],
        thumbnail_url: null,
        video_url: videoUrl,
        in_stock: stockStatus === 'in_stock',
        stock_status: stockStatus,
        stock_quantity: stockStatus === 'in_stock' ? 1 : 0,
        manual_reserve_enabled: meta.manually_reserve === '1' || meta.manually_reserve === 'yes',
        reservation_note: null,
        legacy_category_paths: legacyCategoryPaths,
        legacy_data: { meta, legacy_term_ids: termIdsByProduct.get(pid) ?? [] },
        warnings,
      };

      if (cls.family === 'gemstone') {
        const titleCarat = parseCaratFromTitle(title);
        const caratWeight = toPositiveNum(meta.weight_carat) ?? toPositiveNum(meta.additional_info_weight) ?? titleCarat;
        const rattiWeight = toPositiveNum(meta.weight_ratti) ?? toPositiveNum(meta.additional_info_weight_in_caret)
          ?? (caratWeight === null ? null : round(caratWeight * 1.1, 2));
        const origin = nonEmpty(meta.additional_info_origin);
        const certificateLab = nonEmpty(meta.additional_info_certification_by);
        const certificateNumber = nonEmpty(meta.additional_info_certification_no);
        const hasExclusive = (termIdsByProduct.get(pid) ?? []).some((tid) => slugByTermId.get(tid) === 'exclusive-gems');

        const canonicalPath = cls.category === 'upratna'
          ? `/shop/upratna/${ids.slug}`
          : `/shop/${cls.subCategory}/${ids.slug}`;

        const seo = buildSeo({
          title,
          subCategoryLabel: cls.label,
          caratWeight,
          rattiWeight,
          originDisplay: origin,
          certificateLab,
          legacyMeta: meta,
          canonicalPath,
        });
        warnings.push(...seo.warnings.map((w) => `seo: ${w}`));

        const dims = {
          length_mm: toPositiveNum(meta.additional_info_length),
          width_mm: toPositiveNum(meta.additional_info_width),
          depth_mm: toPositiveNum(meta.additional_info_depth),
        };
        const hasDims = dims.length_mm !== null || dims.width_mm !== null || dims.depth_mm !== null;

        // upratna keeps a populated seo_data; navratna stores {} (matches siblings).
        const seoData = cls.category === 'upratna'
          ? { focus_keyword: cls.focusKeyword, canonical_path: canonicalPath, substitute_category: 'upratna', planet: cls.planet }
          : {};

        staged.push({
          ...base,
          product_type: 'gemstone',
          quality_label: hasExclusive ? 'Exclusive' : (nonEmpty(meta.quality)?.replace(/^[\s(]+|[\s)]+$/g, '') ?? null),
          recommendation_category_code: nonEmpty(meta.recommendation_category),
          price_per_carat: pricing.pricePerCarat,
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
          energization_eligible: false,
          meta_title: seo.metaTitle,
          meta_description: seo.metaDescription,
          meta_keywords: seo.metaKeywords,
          canonical_url: seo.canonicalUrl,
          seo_data: seoData,
          legacy_seo: seo.legacySeo,
        });
        redirects.push(...buildRedirects(pid, legacySlugs, slugChains, canonicalPath));
      } else {
        // rudraksha bead
        const beadWeight = toPositiveNum(meta.additional_info_weight) ?? parseGramsFromTitle(title);
        const canonicalUrl = `/shop/rudraksha/${ids.slug}`;
        const metaTitle = title.length > 70 ? `${title.slice(0, 69).trimEnd()}…` : title;
        const descSource = nonEmpty(p.post_excerpt) ?? content.cleanHtml ?? title;
        const plainDesc = String(descSource).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const metaDescription = plainDesc.length > 160 ? `${plainDesc.slice(0, 159).trimEnd()}…` : plainDesc;

        staged.push({
          ...base,
          product_type: 'rudraksha',
          quality_label: null,
          recommendation_category_code: null,
          price_per_carat: null,
          carat_weight: null,
          ratti_weight: null,
          shape: null,
          color_description: null,
          clarity_description: null,
          treatment_summary: null,
          origin_country: null,
          origin_region: null,
          origin_display: null,
          dimensions_mm: null,
          composition: null,
          rudraksha_type: null,
          mukhi_count: cls.mukhiCount ?? null,
          bead_weight: beadWeight,
          bead_size_mm: toPositiveNum(meta.additional_info_width) ?? toPositiveNum(meta.additional_info_length),
          ruling_deity: null,
          mantra: null,
          xray_certificate_number: nonEmpty(meta.xray_certificate_number),
          certificate_number: nonEmpty(meta.certificate_number),
          certificate_lab: nonEmpty(meta.certificate_lab),
          certificate_status: 'not_required',
          certificate_file_url: null,
          energization_eligible: true,
          meta_title: metaTitle,
          meta_description: metaDescription,
          meta_keywords: ['rudraksha', cls.label.toLowerCase()],
          canonical_url: canonicalUrl,
          seo_data: { focus_keyword: cls.focusKeyword, canonical_path: canonicalUrl },
          legacy_seo: {},
        });
        redirects.push(...buildRedirects(pid, legacySlugs, slugChains, canonicalUrl));
      }
    }

    // --- report ---
    const byFamily = new Map<string, number>();
    for (const r of staged) {
      const key = `${r.category}/${r.sub_category}`;
      byFamily.set(key, (byFamily.get(key) ?? 0) + 1);
    }
    console.log(`Staged products: ${staged.length}`);
    console.log(`Redirect candidates: ${redirects.length}`);
    if (skipped.length) {
      console.log(`\nWARNING - ${skipped.length} products could not be classified by title:`);
      for (const s of skipped) console.log(`  ${s.id}\t${s.title}`);
    }
    console.table([...byFamily.entries()].map(([k, n]) => ({ category_sub: k, count: n })));

    if (!flags.write) {
      console.log('\nDry-run only. Pass --write to stage rows. Add --write-prod only after review for production.');
      return;
    }

    await client.query('BEGIN');
    try {
      await client.query(`TRUNCATE legacy_import.stg_leftover_products, legacy_import.stg_leftover_redirect_candidates`);
      for (const product of staged) await insertProduct(client, product);
      await insertRedirects(client, redirects);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    }
    console.log('\nTransform staging complete.');
  } finally {
    await client.end();
  }
}

const PRODUCT_COLUMNS = [
  'legacy_woo_id', 'sku', 'legacy_sku', 'name', 'slug', 'legacy_slug', 'legacy_permalink', 'legacy_status', 'legacy_created_at',
  'family', 'category', 'sub_category', 'product_type', 'quality_label', 'recommendation_category_code',
  'price', 'compare_price', 'price_per_carat', 'price_mode', 'carat_weight', 'ratti_weight', 'shape',
  'color_description', 'clarity_description', 'treatment_summary', 'origin_country', 'origin_region', 'origin_display',
  'dimensions_mm', 'composition',
  'rudraksha_type', 'mukhi_count', 'bead_weight', 'bead_size_mm', 'ruling_deity', 'mantra', 'xray_certificate_number', 'energization_eligible',
  'certificate_number', 'certificate_lab', 'certificate_status', 'certificate_file_url',
  'short_desc', 'legacy_html_description', 'clean_description', 'legacy_thumbnail_url', 'legacy_image_urls', 'images', 'thumbnail_url', 'video_url',
  'in_stock', 'stock_status', 'stock_quantity', 'manual_reserve_enabled', 'reservation_note',
  'meta_title', 'meta_description', 'meta_keywords', 'canonical_url', 'seo_data', 'legacy_seo', 'legacy_category_paths', 'legacy_data', 'warnings',
];
const JSON_COLUMNS = new Set(['dimensions_mm', 'legacy_image_urls', 'images', 'seo_data', 'legacy_seo', 'legacy_data', 'warnings']);

async function insertProduct(client: Client, product: Record<string, unknown>) {
  const vals = PRODUCT_COLUMNS.map((column) => {
    const value = product[column];
    if (JSON_COLUMNS.has(column)) return JSON.stringify(value ?? (column === 'dimensions_mm' ? null : column.endsWith('s') ? [] : {}));
    return value ?? null;
  });
  await client.query(
    `INSERT INTO legacy_import.stg_leftover_products (${PRODUCT_COLUMNS.join(',')}) VALUES (${vals.map((_, i) => `$${i + 1}`).join(',')})`,
    vals,
  );
}

async function insertRedirects(client: Client, redirects: RedirectRow[]) {
  const batchSize = 5000;
  for (let start = 0; start < redirects.length; start += batchSize) {
    const batch = redirects.slice(start, start + batchSize);
    const values: unknown[] = [];
    const placeholders = batch.map((redirect, rowIndex) => {
      const offset = rowIndex * 4;
      values.push(redirect.legacy_woo_id, redirect.legacy_path, redirect.new_path, redirect.source_label);
      return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4})`;
    });
    await client.query(
      `INSERT INTO legacy_import.stg_leftover_redirect_candidates (legacy_woo_id, legacy_path, new_path, source_label)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (legacy_woo_id, legacy_path) DO UPDATE SET new_path=EXCLUDED.new_path, source_label=EXCLUDED.source_label`,
      values,
    );
  }
}

void SITE_BASE;

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
