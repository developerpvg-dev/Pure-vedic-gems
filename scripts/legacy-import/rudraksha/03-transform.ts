/**
 * rudraksha/03-transform.ts
 *
 * Build category-first Rudraksha staging rows from legacy_import.stg_wp_*.
 * Categories are staged before products so 06-upsert can create admin/catalog
 * categories before assigning migrated products.
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

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

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
  family: string;
  sort_order: number;
  legacy_count: number;
  product_count: number;
};

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((arg) => arg !== '--write-prod'));
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

    const tax = await client.query(`
      SELECT term_taxonomy_id, term_id, parent, count
      FROM legacy_import.stg_wp_term_taxonomy
      WHERE taxonomy='product_cat'`);
    const taxByTermId = new Map<number, TaxonomyRow>();
    const termIdByTaxId = new Map<number, number>();
    for (const row of tax.rows) {
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

    const categoryStages: CategoryStage[] = [];
    for (const taxRow of taxByTermId.values()) {
      const term = termById.get(taxRow.term_id);
      if (!term) continue;
      const path = pathByTermId.get(taxRow.term_id) ?? term.name;
      if (!isRudrakshaTerm(term, path)) continue;
      const canonical = canonicalCategory(term.slug, term.name);
      categoryStages.push({
        legacy_term_taxonomy_id: taxRow.term_taxonomy_id,
        legacy_term_id: term.term_id,
        legacy_slug: term.slug,
        legacy_name: term.name,
        legacy_path: path,
        category_slug: canonical.slug,
        category_name: canonical.name,
        family: canonical.family,
        sort_order: canonical.sortOrder,
        legacy_count: taxRow.count,
        product_count: productCountByTaxId.get(taxRow.term_taxonomy_id) ?? 0,
      });
    }

    const categoryByLegacySlug = new Map(categoryStages.map((category) => [category.legacy_slug, category]));

    const products = await client.query(`
      SELECT id, post_title, post_name, post_content, post_excerpt, post_status,
             post_date_gmt, post_modified_gmt, raw
      FROM legacy_import.stg_wp_posts
      WHERE post_type='product' AND post_status NOT IN ('trash','auto-draft')
      ORDER BY id`);
    const productIds = products.rows.map((row) => Number(row.id));

    const pm = await client.query(`
      SELECT post_id, meta_key, meta_value
      FROM legacy_import.stg_wp_postmeta
      WHERE post_id = ANY($1::bigint[])`, [productIds]);
    const metaByProduct = new Map<number, Record<string, string>>();
    const oldSlugsByProduct = new Map<number, string[]>();
    for (const row of pm.rows) {
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
          const taxRow = taxByTermId.get(termId);
          if (!term || !taxRow) return null;
          return {
            ...term,
            term_taxonomy_id: taxRow.term_taxonomy_id,
            path: pathByTermId.get(termId) ?? term.name,
            legacy_count: taxRow.count,
          };
        })
        .filter((term): term is LegacyTermRef => Boolean(term));
      const rudrakshaTerms = termRefs.filter((term) => categoryByLegacySlug.has(term.slug));
      if (rudrakshaTerms.length === 0) continue;

      const primary = choosePrimaryCategory(rudrakshaTerms, categoryByLegacySlug);
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

      const stockStatus = normaliseStockStatus(meta._stock_status);
      const inStock = stockStatus === 'in_stock';
      const beadWeight = parseWeightGrams(meta.additional_info_weight) ?? parseWeightFromTitle(String(product.post_title ?? ''));
      const mukhiCount = parseMukhi(primary.category_slug) ?? parseMukhi(String(product.post_title ?? ''));
      const rudrakshaType = inferRudrakshaType(primary.category_slug, String(product.post_title ?? ''));
      const canonicalUrl = `/shop/rudraksha/${ids.slug}`;
      const legacyCategoryPaths = [...new Set(rudrakshaTerms.map((term) => term.path))];
      const galleryIds = normaliseGalleryIds(meta._product_image_gallery, meta._thumbnail_id);
      const certificateStatus = hasTruthy(meta.display_certificate_option) || hasTruthy(meta.certificate_name)
        ? 'available'
        : 'not_required';

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
        category: 'rudraksha',
        sub_category: primary.category_slug,
        product_type: primary.family === 'jewelry' ? 'jewelry' : 'rudraksha',
        rudraksha_type: rudrakshaType,
        mukhi_count: mukhiCount,
        bead_weight: beadWeight,
        bead_size_mm: positiveNumber(meta.additional_info_width) ?? positiveNumber(meta.additional_info_length),
        ruling_deity: null,
        mantra: null,
        price: pricing.price,
        compare_price: pricing.comparePrice,
        price_mode: pricing.priceMode === 'per_carat' ? 'fixed' : pricing.priceMode,
        certificate_number: nonEmpty(meta.certificate_number) ?? null,
        certificate_lab: nonEmpty(meta.certificate_lab) ?? null,
        certificate_status: certificateStatus,
        xray_certificate_number: nonEmpty(meta.xray_certificate_number) ?? null,
        short_desc: nonEmpty(product.post_excerpt) ?? null,
        legacy_html_description: product.post_content,
        clean_description: content.cleanHtml,
        legacy_thumbnail_url: nonEmpty(meta._thumbnail_id) ?? null,
        legacy_image_urls: galleryIds,
        images: [],
        thumbnail_url: null,
        video_url: videoUrl,
        in_stock: inStock,
        stock_status: stockStatus,
        stock_quantity: inStock ? 1 : 0,
        energization_eligible: true,
        meta_title: truncate(String(product.post_title ?? ''), 70),
        meta_description: truncate(stripHtml(String(product.post_excerpt || content.cleanHtml || product.post_title || '')), 160),
        meta_keywords: ['rudraksha', primary.category_name.toLowerCase()],
        canonical_url: canonicalUrl,
        seo_data: { focus_keyword: primary.category_name.toLowerCase(), canonical_path: canonicalUrl },
        legacy_seo: {},
        legacy_category_paths: legacyCategoryPaths,
        legacy_data: { meta, raw: product.raw, legacy_terms: termRefs },
        warnings,
      });

      const oldSlugs = [String(product.post_name ?? ''), ...(oldSlugsByProduct.get(productId) ?? [])].filter(Boolean);
      for (const legacySlug of oldSlugs) {
        for (const redirect of legacyRedirectPaths(rudrakshaTerms, legacySlug, canonicalUrl)) {
          redirects.push({ legacy_woo_id: productId, ...redirect });
        }
      }
    }

    console.log(`Rudraksha categories from legacy DB: ${categoryStages.length}`);
    console.log(`Rudraksha products to stage:       ${stagedProducts.length}`);
    console.log(`Redirect candidates:               ${redirects.length}\n`);
    console.table(rollup(stagedProducts, 'sub_category'));

    if (!flags.write) {
      console.log('\nDry-run only. Pass --write to stage rows. Add --write-prod only after review for production.');
      return;
    }

    await client.query('BEGIN');
    try {
      await client.query(`TRUNCATE legacy_import.stg_rudraksha_categories, legacy_import.stg_rudraksha_products, legacy_import.stg_rudraksha_redirect_candidates`);
      for (const category of categoryStages) await insertCategory(client, category);
      for (const product of stagedProducts) await insertProduct(client, product);
      for (const redirect of redirects) await insertRedirect(client, redirect);
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

function isRudrakshaTerm(term: TermRow, path: string): boolean {
  const value = `${term.slug} ${term.name} ${path}`.toLowerCase();
  if (value.includes('malachite')) return false;
  if (term.slug === 'ganesha' || path.toLowerCase().includes('spiritual idols')) return false;
  return /rudrak|mukhi|gauri|sawar|savar|trijuti|indrakshi/.test(value);
}

function canonicalCategory(legacySlug: string, legacyName: string) {
  let slug = legacySlug.toLowerCase().trim();
  const mukhi = slug.match(/^(\d+)-mukhi-rudrakshas?$/);
  if (mukhi) slug = `${mukhi[1]}-mukhi`;
  else if (slug === 'nir-mukhi-rudraksha') slug = 'nir-mukhi';
  else if (slug === 'ganesh-rudrakshas') slug = 'ganesh-rudraksha';
  else if (slug === 'gauri-shankar-rudrakshas') slug = 'gauri-shankar';
  else if (slug === 'rudrakshas') slug = 'rudraksha';
  if (/^\d+-mukhi$/.test(slug)) {
    const n = Number(slug.split('-')[0]);
    return { slug, name: `${n} Mukhi Rudraksha`, family: 'rudraksha', sortOrder: n };
  }
  const names: Record<string, string> = {
    rudraksha: 'Rudraksha Beads',
    'exclusive-rudraksha': 'Exclusive Rudraksha',
    'exclusive-rudraksha-malas': 'Exclusive Rudraksha Malas',
    'gauri-shankar': 'Gauri Shankar Rudraksha',
    'garbh-gauri': 'Garbh Gauri Rudraksha',
    'ganesh-rudraksha': 'Ganesh Rudraksha',
    'nir-mukhi': 'Nir Mukhi Rudraksha',
    'sawar-rudraksha': 'Sawar Rudraksha',
    'savar-rudraksha': 'Savar Rudraksha',
    'trijuti-rudraksha': 'Trijuti Rudraksha',
    'indrakshi-mala': 'Indrakshi Mala',
    'ready-rudraksha-jewelry-stock': 'Ready Rudraksha Jewelry',
    'rudraksha-pendents': 'Rudraksha Pendants',
  };
  const family = resolveFamily(slug);
  const sortOrder = slug === 'rudraksha' ? 30 : slug.includes('exclusive') ? 90 : family === 'jewelry' ? 400 : family === 'mala' ? 450 : 100;
  return { slug, name: names[slug] ?? legacyName, family, sortOrder };
}

function resolveFamily(slug: string): 'rudraksha' | 'jewelry' | 'mala' {
  if (slug.includes('mala') || slug === 'indrakshi-mala') return 'mala';
  if (slug.includes('jewelry') || slug.includes('pendent')) return 'jewelry';
  return 'rudraksha';
}

function choosePrimaryCategory(terms: LegacyTermRef[], categoryByLegacySlug: Map<string, CategoryStage>): CategoryStage | null {
  const candidates = terms
    .map((term) => categoryByLegacySlug.get(term.slug))
    .filter((category): category is CategoryStage => Boolean(category))
    .sort((a, b) => {
      const aParentPenalty = a.category_slug === 'rudraksha' ? 1 : 0;
      const bParentPenalty = b.category_slug === 'rudraksha' ? 1 : 0;
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

function parseWeightGrams(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = String(value).toLowerCase().match(/([0-9]+(?:\.[0-9]+)?)\s*(mg|g|gm|gram|grams)?/);
  if (!match) return null;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return match[2] === 'mg' ? round(raw / 1000, 3) : round(raw, 3);
}

function parseWeightFromTitle(title: string): number | null {
  const match = title.toLowerCase().match(/\(([0-9]+(?:\.[0-9]+)?)\s*(mg|g|gm)\)/);
  if (!match) return null;
  return parseWeightGrams(`${match[1]}${match[2]}`);
}

function parseMukhi(value: string): number | null {
  const match = value.toLowerCase().match(/(^|\b)([0-9]{1,2})\s*-?\s*mukhi\b/);
  if (!match) return null;
  const count = Number(match[2]);
  return Number.isInteger(count) && count > 0 ? count : null;
}

function inferRudrakshaType(categorySlug: string, title: string): string | null {
  const value = `${categorySlug} ${title}`.toLowerCase();
  if (value.includes('gauri-shankar')) return 'Gauri Shankar';
  if (value.includes('ganesh')) return 'Ganesh';
  if (value.includes('sawar') || value.includes('savar')) return 'Savar';
  if (value.includes('trijuti')) return 'Trijuti';
  if (value.includes('mala')) return 'Mala';
  return null;
}

function positiveNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const cleaned = String(value).replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function nonEmpty(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function hasTruthy(value: string | null | undefined): boolean {
  if (!value) return false;
  return !['0', 'no', 'false', 'none'].includes(value.toLowerCase().trim());
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max: number): string | null {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd();
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function legacyRedirectPaths(terms: LegacyTermRef[], legacyProductSlug: string, newPath: string) {
  const paths = new Map<string, { legacy_path: string; new_path: string; source_label: string }>();
  const add = (legacyPath: string, sourceLabel: string) => {
    paths.set(legacyPath, { legacy_path: legacyPath, new_path: newPath, source_label: sourceLabel });
  };
  add(`/product/${legacyProductSlug}/`, 'product_root');
  add(`/product/${legacyProductSlug}`, 'product_root');
  for (const term of terms) {
    add(`/shop/navratan/${term.slug}/${legacyProductSlug}/`, 'shop_navratan');
    add(`/shop/navratan/${term.slug}/${legacyProductSlug}`, 'shop_navratan');
    add(`/product-category/navratan/${term.slug}/${legacyProductSlug}/`, 'product_category_navratan');
  }
  return [...paths.values()];
}

function rollup(rows: Record<string, unknown>[], key: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[key] ?? '(blank)');
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ [key]: value, n }));
}

async function insertCategory(client: Client, category: CategoryStage) {
  await client.query(
    `INSERT INTO legacy_import.stg_rudraksha_categories (
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
  await client.query(
    `INSERT INTO legacy_import.stg_rudraksha_products (
      legacy_woo_id, sku, legacy_sku, name, slug, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
      category, sub_category, product_type, rudraksha_type, mukhi_count, bead_weight, bead_size_mm, ruling_deity, mantra,
      price, compare_price, price_mode, certificate_number, certificate_lab, certificate_status, xray_certificate_number,
      short_desc, legacy_html_description, clean_description, legacy_thumbnail_url, legacy_image_urls, images, thumbnail_url,
      video_url, in_stock, stock_status, stock_quantity, energization_eligible, meta_title, meta_description, meta_keywords,
      canonical_url, seo_data, legacy_seo, legacy_category_paths, legacy_data, warnings
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
      $26,$27,$28,$29,$30::jsonb,$31::jsonb,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42::jsonb,$43::jsonb,$44,$45::jsonb,$46::jsonb
    )`,
    [
      product.legacy_woo_id, product.sku, product.legacy_sku, product.name, product.slug, product.legacy_slug,
      product.legacy_permalink, product.legacy_status, product.legacy_created_at, product.category, product.sub_category,
      product.product_type, product.rudraksha_type, product.mukhi_count, product.bead_weight, product.bead_size_mm,
      product.ruling_deity, product.mantra, product.price, product.compare_price, product.price_mode, product.certificate_number,
      product.certificate_lab, product.certificate_status, product.xray_certificate_number, product.short_desc,
      product.legacy_html_description, product.clean_description, product.legacy_thumbnail_url,
      JSON.stringify(product.legacy_image_urls ?? []), JSON.stringify(product.images ?? []), product.thumbnail_url,
      product.video_url, product.in_stock, product.stock_status, product.stock_quantity, product.energization_eligible,
      product.meta_title, product.meta_description, product.meta_keywords, product.canonical_url,
      JSON.stringify(product.seo_data ?? {}), JSON.stringify(product.legacy_seo ?? {}), product.legacy_category_paths,
      JSON.stringify(product.legacy_data ?? {}), JSON.stringify(product.warnings ?? []),
    ],
  );
}

async function insertRedirect(client: Client, redirect: Record<string, unknown>) {
  await client.query(
    `INSERT INTO legacy_import.stg_rudraksha_redirect_candidates (legacy_woo_id, legacy_path, new_path, source_label)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (legacy_woo_id, legacy_path) DO UPDATE SET new_path=EXCLUDED.new_path, source_label=EXCLUDED.source_label`,
    [redirect.legacy_woo_id, redirect.legacy_path, redirect.new_path, redirect.source_label],
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});