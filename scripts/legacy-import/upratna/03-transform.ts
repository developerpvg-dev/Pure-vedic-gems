/**
 * upratna/03-transform.ts
 *
 * Build category-first Upratna staging rows from legacy_import.stg_wp_*.
 * The script stages every legacy UPRATANAS category, then stages products into
 * canonical public product/category shapes for promotion.
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

const ROOT_UPRATNA_SLUGS = new Set(['upratan', 'upratna', 'uparatna', 'upratanas', 'upratnas']);

type TermRow = { term_id: number; name: string; slug: string };
type TaxonomyRow = { term_taxonomy_id: number; term_id: number; parent: number; count: number };
type LegacyTermRef = TermRow & { term_taxonomy_id: number; path: string; legacy_count: number };
type CategoryStage = {
  legacy_term_taxonomy_id: number;
  legacy_term_id: number;
  legacy_slug: string;
  legacy_name: string;
  legacy_path: string;
  category_slug: string;
  category_name: string;
  family: 'upratna';
  sort_order: number;
  legacy_count: number;
  product_count: number;
};

type CanonicalCategory = {
  slug: string;
  name: string;
  sortOrder: number;
  planet?: string | null;
  sanskritName?: string | null;
  color?: string | null;
};

const CATEGORY_MAP: Record<string, CanonicalCategory> = {
  upratan: { slug: 'upratna', name: 'Upratna Gemstones', sortOrder: 20 },
  upratna: { slug: 'upratna', name: 'Upratna Gemstones', sortOrder: 20 },
  amethyst: { slug: 'amethyst', name: 'Amethyst', sortOrder: 1, planet: 'Saturn', sanskritName: 'Katela / Jamunia', color: '#9333EA' },
  aquamarine: { slug: 'aquamarine', name: 'Aquamarine', sortOrder: 10, planet: 'Mercury', color: '#38BDF8' },
  'blue-topaz': { slug: 'blue-topaz', name: 'Blue Topaz', sortOrder: 11, planet: 'Jupiter', color: '#0EA5E9' },
  citrine: { slug: 'citrine', name: 'Citrine', sortOrder: 9, planet: 'Jupiter', sanskritName: 'Sunela', color: '#F59E0B' },
  diopside: { slug: 'diopside', name: 'Diopside', sortOrder: 16, planet: 'Mercury', color: '#15803D' },
  garnet: { slug: 'garnet', name: 'Garnet', sortOrder: 5, planet: 'Rahu', color: '#991B1B' },
  hakik: { slug: 'hakik', name: 'Hakik', sortOrder: 21, sanskritName: 'Agate', color: '#57534E' },
  iolite: { slug: 'iolite', name: 'Iolite', sortOrder: 14, planet: 'Saturn', sanskritName: 'Neeli', color: '#4338CA' },
  kyanite: { slug: 'kyanite', name: 'Kyanite', sortOrder: 19, planet: 'Saturn', color: '#2563EB' },
  'lapis-lazuli': { slug: 'lapis-lazuli', name: 'Lapis Lazuli', sortOrder: 8, sanskritName: 'Lajward', color: '#1D4ED8' },
  malachite: { slug: 'malachite', name: 'Malachite', sortOrder: 17, planet: 'Venus', color: '#16A34A' },
  'moon-stone': { slug: 'moonstone', name: 'Moonstone', sortOrder: 4, planet: 'Moon', sanskritName: 'Chandrakant', color: '#CBD5E1' },
  moonstone: { slug: 'moonstone', name: 'Moonstone', sortOrder: 4, planet: 'Moon', sanskritName: 'Chandrakant', color: '#CBD5E1' },
  opal: { slug: 'opal', name: 'Opal', sortOrder: 2, planet: 'Venus', color: '#FBBFB4' },
  peridot: { slug: 'peridot', name: 'Peridot', sortOrder: 6, planet: 'Mercury', sanskritName: 'Zabarjad', color: '#84CC16' },
  'rose-quartz-2': { slug: 'rose-quartz', name: 'Rose Quartz', sortOrder: 22, planet: 'Venus', color: '#F9A8D4' },
  'rose-quartz': { slug: 'rose-quartz', name: 'Rose Quartz', sortOrder: 22, planet: 'Venus', color: '#F9A8D4' },
  sunstone: { slug: 'sunstone', name: 'Sunstone', sortOrder: 20, planet: 'Sun', color: '#F97316' },
  tanzanite: { slug: 'tanzanite', name: 'Tanzanite', sortOrder: 7, planet: 'Saturn', color: '#4F46E5' },
  'tiger-eye': { slug: 'tiger-eye', name: 'Tiger Eye', sortOrder: 18, planet: 'Rahu', color: '#A16207' },
  'turquoise-upratan': { slug: 'turquoise', name: 'Turquoise', sortOrder: 3, planet: 'Jupiter', sanskritName: 'Firoza', color: '#14B8A6' },
  turquoise: { slug: 'turquoise', name: 'Turquoise', sortOrder: 3, planet: 'Jupiter', sanskritName: 'Firoza', color: '#14B8A6' },
  'white-topaz': { slug: 'white-topaz', name: 'White Topaz', sortOrder: 12, planet: 'Venus', color: '#E5E7EB' },
  'white-coral': { slug: 'white-coral', name: 'White Coral', sortOrder: 23, planet: 'Mars', color: '#F8FAFC' },
  zircon: { slug: 'zircon', name: 'Zircon', sortOrder: 13, planet: 'Venus', color: '#E0F2FE' },
};

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
    const terms = await client.query(`SELECT term_id, name, slug FROM legacy_import.stg_wp_terms`);
    const termById = new Map<number, TermRow>();
    for (const row of terms.rows) {
      termById.set(Number(row.term_id), { term_id: Number(row.term_id), name: row.name, slug: row.slug });
    }

    const taxonomy = await client.query(`
      SELECT term_taxonomy_id, term_id, parent, count
      FROM legacy_import.stg_wp_term_taxonomy
      WHERE taxonomy='product_cat'`);
    const taxByTermId = new Map<number, TaxonomyRow>();
    const termIdByTaxId = new Map<number, number>();
    for (const row of taxonomy.rows) {
      const item = {
        term_taxonomy_id: Number(row.term_taxonomy_id),
        term_id: Number(row.term_id),
        parent: Number(row.parent),
        count: Number(row.count ?? 0),
      };
      taxByTermId.set(item.term_id, item);
      termIdByTaxId.set(item.term_taxonomy_id, item.term_id);
    }

    const pathByTermId = new Map<number, string>();
    for (const [termId] of termById) {
      const chain: string[] = [];
      let current = termId;
      let guard = 0;
      while (current && guard < 20) {
        const term = termById.get(current);
        if (!term) break;
        chain.unshift(term.name);
        current = taxByTermId.get(current)?.parent ?? 0;
        guard++;
      }
      pathByTermId.set(termId, chain.join(' > '));
    }

    const rels = await client.query(`SELECT object_id, term_taxonomy_id FROM legacy_import.stg_wp_term_relationships`);
    const termIdsByProduct = new Map<number, number[]>();
    const productCountByTaxId = new Map<number, number>();
    for (const row of rels.rows) {
      const taxId = Number(row.term_taxonomy_id);
      const termId = termIdByTaxId.get(taxId);
      if (termId === undefined) continue;
      const productId = Number(row.object_id);
      const list = termIdsByProduct.get(productId) ?? [];
      list.push(termId);
      termIdsByProduct.set(productId, list);
      productCountByTaxId.set(taxId, (productCountByTaxId.get(taxId) ?? 0) + 1);
    }

    const rootTermIds = [...termById.values()]
      .filter((term) => ROOT_UPRATNA_SLUGS.has(term.slug.toLowerCase()))
      .map((term) => term.term_id);
    const subtreeTermIds = new Set<number>();
    const queue = [...rootTermIds];
    while (queue.length > 0) {
      const termId = queue.shift()!;
      if (subtreeTermIds.has(termId)) continue;
      subtreeTermIds.add(termId);
      for (const tax of taxByTermId.values()) if (tax.parent === termId) queue.push(tax.term_id);
    }

    const categoryStages: CategoryStage[] = [];
    for (const termId of subtreeTermIds) {
      const term = termById.get(termId);
      const tax = taxByTermId.get(termId);
      if (!term || !tax) continue;
      const canonical = canonicalCategory(term.slug, term.name);
      categoryStages.push({
        legacy_term_taxonomy_id: tax.term_taxonomy_id,
        legacy_term_id: term.term_id,
        legacy_slug: term.slug,
        legacy_name: term.name,
        legacy_path: pathByTermId.get(term.term_id) ?? term.name,
        category_slug: canonical.slug,
        category_name: canonical.name,
        family: 'upratna',
        sort_order: canonical.sortOrder,
        legacy_count: tax.count,
        product_count: productCountByTaxId.get(tax.term_taxonomy_id) ?? 0,
      });
    }
    categoryStages.sort((a, b) => a.sort_order - b.sort_order || a.category_slug.localeCompare(b.category_slug));
    const categoryByLegacySlug = new Map(categoryStages.map((category) => [category.legacy_slug, category]));

    const products = await client.query(`
      SELECT id, post_title, post_name, post_content, post_excerpt, post_status,
             post_date_gmt, post_modified_gmt, raw
      FROM legacy_import.stg_wp_posts
      WHERE post_type='product' AND post_status NOT IN ('trash','auto-draft')
      ORDER BY id`);
    const productIds = products.rows.map((row) => Number(row.id));

    const postmeta = await client.query(`
      SELECT post_id, meta_key, meta_value
      FROM legacy_import.stg_wp_postmeta
      WHERE post_id = ANY($1::bigint[])`, [productIds]);
    const metaByProduct = new Map<number, Record<string, string>>();
    const oldSlugsByProduct = new Map<number, string[]>();
    for (const row of postmeta.rows) {
      const productId = Number(row.post_id);
      const key = String(row.meta_key);
      const value = row.meta_value === null ? '' : String(row.meta_value);
      if (key === '_wp_old_slug') {
        const list = oldSlugsByProduct.get(productId) ?? [];
        list.push(value);
        oldSlugsByProduct.set(productId, list);
        continue;
      }
      const meta = metaByProduct.get(productId) ?? {};
      meta[key] = value;
      metaByProduct.set(productId, meta);
    }

    const stagedProducts: Record<string, unknown>[] = [];
    const redirects: Record<string, unknown>[] = [];
    const claimedSlugs = new Map<string, number>();

    for (const product of products.rows) {
      const productId = Number(product.id);
      const termRefs: LegacyTermRef[] = (termIdsByProduct.get(productId) ?? [])
        .map((termId) => {
          const term = termById.get(termId);
          const tax = taxByTermId.get(termId);
          if (!term || !tax) return null;
          return { ...term, term_taxonomy_id: tax.term_taxonomy_id, path: pathByTermId.get(termId) ?? term.name, legacy_count: tax.count };
        })
        .filter((term): term is LegacyTermRef => Boolean(term));
      const upratnaTerms = termRefs.filter((term) => categoryByLegacySlug.has(term.slug));
      if (upratnaTerms.length === 0) continue;

      const primary = choosePrimaryCategory(upratnaTerms, categoryByLegacySlug);
      if (!primary) continue;

      const meta = metaByProduct.get(productId) ?? {};
      const warnings: string[] = [];
      const pricing = normalisePricing(meta);
      warnings.push(...pricing.warnings);
      const content = cleanLegacyDescription(String(product.post_content ?? ''));
      warnings.push(...content.warnings.map((warning) => `content: ${warning}`));
      const videoUrl = extractLegacyVideoUrl(String(product.post_content ?? ''));
      const ids = await resolveIdentifiers({
        legacyWooId: productId,
        legacySlug: String(product.post_name ?? ''),
        legacySku: meta._sku ?? null,
        isSlugTaken: async (slug, exceptId) => {
          const owner = claimedSlugs.get(slug);
          return owner !== undefined && owner !== exceptId;
        },
      });
      claimedSlugs.set(ids.slug, productId);
      warnings.push(...ids.warnings);

      const caratWeight = positiveNumber(meta.weight_carat) ?? positiveNumber(meta.additional_info_weight) ?? parseCaratFromTitle(String(product.post_title ?? ''));
      const rattiWeight = positiveNumber(meta.weight_ratti) ?? positiveNumber(meta.additional_info_weight_in_caret)
        ?? (caratWeight === null ? null : round(caratWeight * 1.1, 2));
      const origin = nonEmpty(meta.additional_info_origin);
      const certificateLab = nonEmpty(meta.additional_info_certification_by);
      const certificateNumber = nonEmpty(meta.additional_info_certification_no);
      const canonicalPath = `/shop/upratna/${ids.slug}`;
      const canonical = canonicalCategory(primary.legacy_slug, primary.category_name);
      const seo = buildSeo({
        title: String(product.post_title ?? ''),
        subCategoryLabel: canonical.name,
        caratWeight,
        rattiWeight,
        originDisplay: origin,
        certificateLab,
        legacyMeta: meta,
        canonicalPath,
      });
      warnings.push(...seo.warnings.map((warning) => `seo: ${warning}`));

      const stockStatus = normaliseStockStatus(meta._stock_status);
      const dims = {
        length_mm: numberOrNull(meta.additional_info_length),
        width_mm: numberOrNull(meta.additional_info_width),
        depth_mm: numberOrNull(meta.additional_info_depth),
      };
      const hasDims = dims.length_mm !== null || dims.width_mm !== null || dims.depth_mm !== null;
      const galleryIds = normaliseGalleryIds(meta._product_image_gallery, meta._thumbnail_id);
      const legacyCategoryPaths = [...new Set(upratnaTerms.map((term) => term.path))];

      stagedProducts.push({
        legacy_woo_id: productId,
        sku: ids.sku,
        legacy_sku: ids.legacySku,
        name: String(product.post_title ?? '').trim(),
        slug: ids.slug,
        legacy_slug: String(product.post_name ?? ''),
        legacy_permalink: `/product/${product.post_name}/`,
        legacy_status: product.post_status,
        legacy_created_at: product.post_date_gmt,
        category: 'upratna',
        sub_category: primary.category_slug,
        product_type: 'gemstone',
        quality_label: nonEmpty(meta.quality)?.replace(/^[\s(]+|[\s)]+$/g, '') ?? null,
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
        short_desc: nonEmpty(product.post_excerpt),
        legacy_html_description: product.post_content,
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
        meta_title: seo.metaTitle,
        meta_description: seo.metaDescription,
        meta_keywords: seo.metaKeywords,
        canonical_url: seo.canonicalUrl,
        seo_data: {
          focus_keyword: canonical.name.toLowerCase(),
          canonical_path: canonicalPath,
          substitute_category: 'upratna',
          planet: canonical.planet ?? null,
        },
        legacy_seo: seo.legacySeo,
        legacy_category_paths: legacyCategoryPaths,
        legacy_data: { meta, raw: product.raw, legacy_terms: termRefs },
        warnings,
      });

      const legacySlugs = [String(product.post_name ?? ''), ...(oldSlugsByProduct.get(productId) ?? [])].filter(Boolean);
      for (const legacySlug of legacySlugs) {
        for (const redirect of legacyRedirectPaths(upratnaTerms, legacySlug, canonicalPath)) {
          redirects.push({ legacy_woo_id: productId, ...redirect });
        }
      }
    }

    console.log(`Upratna categories from legacy DB: ${categoryStages.length}`);
    console.log(`Upratna products to stage:       ${stagedProducts.length}`);
    console.log(`Redirect candidates:             ${redirects.length}\n`);
    console.table(rollup(stagedProducts, 'sub_category'));

    if (!flags.write) {
      console.log('\nDry-run only. Pass --write to stage rows. Add --write-prod only after review for production.');
      return;
    }

    await client.query('BEGIN');
    try {
      await client.query(`TRUNCATE legacy_import.stg_upratna_categories, legacy_import.stg_upratna_products, legacy_import.stg_upratna_redirect_candidates`);
      for (const category of categoryStages) await insertCategory(client, category);
      for (const product of stagedProducts) await insertProduct(client, product);
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

function canonicalCategory(legacySlug: string, legacyName: string): CanonicalCategory {
  const key = legacySlug.toLowerCase().trim();
  return CATEGORY_MAP[key] ?? {
    slug: slugify(key.replace(/-upratan$/, '').replace(/-upratna$/, '')),
    name: legacyName,
    sortOrder: 100,
  };
}

function choosePrimaryCategory(terms: LegacyTermRef[], categoryByLegacySlug: Map<string, CategoryStage>): CategoryStage | null {
  const candidates = terms
    .map((term) => categoryByLegacySlug.get(term.slug))
    .filter((category): category is CategoryStage => Boolean(category))
    .sort((a, b) => {
      const aParentPenalty = a.category_slug === 'upratna' ? 1 : 0;
      const bParentPenalty = b.category_slug === 'upratna' ? 1 : 0;
      if (aParentPenalty !== bParentPenalty) return aParentPenalty - bParentPenalty;
      const aDepth = a.legacy_path.split('>').length;
      const bDepth = b.legacy_path.split('>').length;
      if (aDepth !== bDepth) return bDepth - aDepth;
      return a.sort_order - b.sort_order;
    });
  return candidates[0] ?? null;
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

function legacyRedirectPaths(terms: LegacyTermRef[], legacyProductSlug: string, newPath: string) {
  const paths = new Map<string, { legacy_path: string; new_path: string; source_label: string }>();
  const add = (legacyPath: string, sourceLabel: string) => {
    paths.set(legacyPath, { legacy_path: legacyPath, new_path: newPath, source_label: sourceLabel });
  };
  add(`/product/${legacyProductSlug}/`, 'product_root');
  add(`/product/${legacyProductSlug}`, 'product_root');
  for (const term of terms) {
    for (const root of ['upratan', 'upratna', 'uparatna']) {
      add(`/shop/${root}/${term.slug}/${legacyProductSlug}/`, `shop_${root}`);
      add(`/shop/${root}/${term.slug}/${legacyProductSlug}`, `shop_${root}`);
      add(`/product-category/${root}/${term.slug}/${legacyProductSlug}/`, `product_category_${root}`);
    }
  }
  return [...paths.values()];
}

async function insertCategory(client: Client, category: CategoryStage) {
  await client.query(
    `INSERT INTO legacy_import.stg_upratna_categories (
       legacy_term_taxonomy_id, legacy_term_id, legacy_slug, legacy_name, legacy_path,
       category_slug, category_name, family, sort_order, legacy_count, product_count, source_data
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)`,
    [
      category.legacy_term_taxonomy_id,
      category.legacy_term_id,
      category.legacy_slug,
      category.legacy_name,
      category.legacy_path,
      category.category_slug,
      category.category_name,
      category.family,
      category.sort_order,
      category.legacy_count,
      category.product_count,
      JSON.stringify(category),
    ],
  );
}

async function insertProduct(client: Client, product: Record<string, unknown>) {
  const cols = [
    'legacy_woo_id','sku','legacy_sku','name','slug','legacy_slug','legacy_permalink','legacy_status','legacy_created_at',
    'category','sub_category','product_type','quality_label','recommendation_category_code',
    'price','compare_price','price_per_carat','price_mode','carat_weight','ratti_weight','shape',
    'color_description','clarity_description','treatment_summary','origin_country','origin_region','origin_display',
    'dimensions_mm','composition','certificate_number','certificate_lab','certificate_status','certificate_file_url',
    'short_desc','legacy_html_description','clean_description','legacy_thumbnail_url','legacy_image_urls','images','thumbnail_url','video_url',
    'in_stock','stock_status','stock_quantity','manual_reserve_enabled','reservation_note',
    'meta_title','meta_description','meta_keywords','canonical_url','seo_data','legacy_seo','legacy_category_paths','legacy_data','warnings',
  ];
  const vals = cols.map((column) => {
    const value = product[column];
    if (['dimensions_mm','legacy_image_urls','images','seo_data','legacy_seo','legacy_data','warnings'].includes(column)) return JSON.stringify(value ?? (column.endsWith('s') ? [] : {}));
    return value;
  });
  await client.query(
    `INSERT INTO legacy_import.stg_upratna_products (${cols.join(',')}) VALUES (${vals.map((_, index) => `$${index + 1}`).join(',')})`,
    vals,
  );
}

async function insertRedirects(client: Client, redirects: Record<string, unknown>[]) {
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
      `INSERT INTO legacy_import.stg_upratna_redirect_candidates (legacy_woo_id, legacy_path, new_path, source_label)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (legacy_woo_id, legacy_path) DO UPDATE SET new_path=EXCLUDED.new_path, source_label=EXCLUDED.source_label`,
      values,
    );
  }
}

function numberOrNull(value: string | null | undefined): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(String(value).replace(/[^\d.\-]/g, ''));
  return Number.isFinite(number) ? number : null;
}

function positiveNumber(value: string | null | undefined): number | null {
  const number = numberOrNull(value);
  return number !== null && number > 0 ? number : null;
}

function nonEmpty(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function parseCaratFromTitle(title: string): number | null {
  const match = title.match(/(\d+(?:\.\d+)?)\s*ct\b/i);
  return match ? numberOrNull(match[1]) : null;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rollup(rows: Record<string, unknown>[], key: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[key] ?? '(blank)');
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ [key]: value, count }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
