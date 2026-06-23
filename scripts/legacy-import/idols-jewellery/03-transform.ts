/**
 * idols-jewellery/03-transform.ts
 *
 * Stage the legacy SPIRITUAL IDOLS + JEWELLERY products into
 * legacy_import.stg_idols_jewellery_products, classified by their legacy
 * product_cat TERM (not title). Locked mapping:
 *
 *   285 Shree Yantra        -> idol      / shree-yantra              (idol)
 *   222 Shivling            -> idol      / shivling                  (idol)
 *   220 Ganesha             -> idol      / ganesha                   (idol)
 *   275 Hanuman             -> idol      / hanuman                   (idol)
 *   276 Durga Devi          -> idol      / durga-devi                (idol)
 *   277 Shiv Ji             -> idol      / shiv-ji                   (idol)
 *   286 Bracelets           -> jewelry   / bracelets                 (jewelry)
 *   185 Diamond-Jewellery   -> jewelry   / diamond-jewellery         (jewelry)
 *   183 Ready (Astro-Gems)  -> jewelry   / astro-gems-stock          (jewelry)
 *   184 Malas               -> mala      / malas                     (mala, energized)
 *   278 Exclusive R. Malas  -> rudraksha / exclusive-rudraksha-malas (mala, energized)
 *   279 Ready R. Jewelry    -> rudraksha / ready-rudraksha-jewelry-stock (jewelry, energized)
 *
 * Reads from the already-loaded legacy_import.stg_wp_* mirror. Resolves the
 * product_categories ids live so the upsert needs no hard-coded UUIDs.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/idols-jewellery/03-transform.ts                 (dry-run)
 *   npx tsx scripts/legacy-import/idols-jewellery/03-transform.ts --write --write-prod
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

const SITE_BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pure-vedic-gems.vercel.app').replace(/\/+$/, '');

type Group = 'idols' | 'jewelry' | 'malas' | 'rudraksha';
type ProductType = 'idol' | 'jewelry' | 'mala';

interface TargetSpec {
  /** Value written to public.products.category (storefront listing filter). */
  category: string;
  /** Value written to public.products.sub_category (storefront listing filter). */
  subCategory: string;
  productType: ProductType;
  energization: boolean;
  /** Storefront group used for the canonical /shop/<group>/<slug> URL. */
  group: Group;
  /** product_categories.slug of the leaf to assign as PRIMARY. */
  leafCategorySlug: string;
  /** product_categories.slug of the group parent (null when leaf is top-level). */
  parentCategorySlug: string | null;
  /** Human label for SEO. */
  label: string;
  priority: number;
}

// Keyed by legacy product_cat term_id.
const TERM_MAP: Record<number, TargetSpec> = {
  285: { category: 'idol', subCategory: 'shree-yantra', productType: 'idol', energization: false, group: 'idols', leafCategorySlug: 'shree-yantra', parentCategorySlug: 'idol', label: 'Shree Yantra', priority: 10 },
  222: { category: 'idol', subCategory: 'shivling', productType: 'idol', energization: false, group: 'idols', leafCategorySlug: 'shivling', parentCategorySlug: 'idol', label: 'Shivling', priority: 10 },
  220: { category: 'idol', subCategory: 'ganesha', productType: 'idol', energization: false, group: 'idols', leafCategorySlug: 'ganesha', parentCategorySlug: 'idol', label: 'Ganesha', priority: 10 },
  275: { category: 'idol', subCategory: 'hanuman', productType: 'idol', energization: false, group: 'idols', leafCategorySlug: 'hanuman', parentCategorySlug: 'idol', label: 'Hanuman', priority: 10 },
  276: { category: 'idol', subCategory: 'durga-devi', productType: 'idol', energization: false, group: 'idols', leafCategorySlug: 'durga-devi', parentCategorySlug: 'idol', label: 'Durga Devi', priority: 10 },
  277: { category: 'idol', subCategory: 'shiv-ji', productType: 'idol', energization: false, group: 'idols', leafCategorySlug: 'shiv-ji', parentCategorySlug: 'idol', label: 'Shiv Ji', priority: 10 },
  286: { category: 'jewelry', subCategory: 'bracelets', productType: 'jewelry', energization: false, group: 'jewelry', leafCategorySlug: 'bracelets', parentCategorySlug: 'jewelry', label: 'Bracelets', priority: 10 },
  185: { category: 'jewelry', subCategory: 'diamond-jewellery', productType: 'jewelry', energization: false, group: 'jewelry', leafCategorySlug: 'diamond-jewellery', parentCategorySlug: 'jewelry', label: 'Diamond-Jewellery', priority: 10 },
  183: { category: 'jewelry', subCategory: 'astro-gems-stock', productType: 'jewelry', energization: false, group: 'jewelry', leafCategorySlug: 'astro-gems-stock', parentCategorySlug: 'jewelry', label: 'Ready (Astro-Gems) Stock', priority: 10 },
  184: { category: 'jewelry', subCategory: 'malas', productType: 'mala', energization: true, group: 'jewelry', leafCategorySlug: 'malas', parentCategorySlug: 'jewelry', label: 'Malas', priority: 5 },
  278: { category: 'jewelry', subCategory: 'exclusive-rudraksha-malas', productType: 'mala', energization: true, group: 'jewelry', leafCategorySlug: 'exclusive-rudraksha-malas', parentCategorySlug: 'jewelry', label: 'Exclusive Rudraksha Malas', priority: 20 },
  279: { category: 'jewelry', subCategory: 'ready-rudraksha-jewelry-stock', productType: 'jewelry', energization: true, group: 'jewelry', leafCategorySlug: 'ready-rudraksha-jewelry-stock', parentCategorySlug: 'jewelry', label: 'Ready (Rudraksha Jewelry) Stock', priority: 20 },
};

function groupCanonicalBase(group: Group): string {
  switch (group) {
    case 'idols': return '/shop/idols';
    case 'jewelry': return '/shop/jewelry';
    case 'malas': return '/shop/malas';
    case 'rudraksha': return '/shop/rudraksha';
  }
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
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after review.`);
  }
  return dbHost;
}

function nonEmpty(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
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

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

interface RedirectRow { legacy_woo_id: number; legacy_path: string; new_path: string; source_label: string }

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
    // --- resolve product_categories ids for every leaf + parent slug we use ---
    const neededSlugs = new Set<string>();
    for (const spec of Object.values(TERM_MAP)) {
      neededSlugs.add(spec.leafCategorySlug);
      if (spec.parentCategorySlug) neededSlugs.add(spec.parentCategorySlug);
    }
    const catRes = await client.query(
      `SELECT id, slug, family, parent_id FROM public.product_categories WHERE is_active AND slug = ANY($1::text[])`,
      [[...neededSlugs]],
    );
    const catBySlug = new Map<string, { id: string; family: string; parent_id: string | null }>();
    for (const row of catRes.rows) {
      // Prefer a row that actually has the family we expect; first wins otherwise.
      if (!catBySlug.has(row.slug)) catBySlug.set(row.slug, { id: row.id, family: row.family, parent_id: row.parent_id });
    }
    const missingCats = [...neededSlugs].filter((slug) => !catBySlug.has(slug));
    if (missingCats.length) {
      throw new Error(`Missing product_categories rows for slugs: ${missingCats.join(', ')}. Create them in the admin panel first.`);
    }

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

    // --- published products in the idol/jewellery subtree (term-mapped) ---
    const mappedTermIds = Object.keys(TERM_MAP).map(Number);
    const mappedTaxIds: number[] = [];
    for (const [taxId, termId] of termIdByTaxId) if (TERM_MAP[termId]) mappedTaxIds.push(taxId);

    const productsRes = await client.query(`
      SELECT DISTINCT p.id, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_status, p.post_date_gmt
        FROM legacy_import.stg_wp_posts p
        JOIN legacy_import.stg_wp_term_relationships tr ON tr.object_id = p.id
       WHERE p.post_type='product'
         AND p.post_status='publish'
         AND tr.term_taxonomy_id = ANY($1::bigint[])
       ORDER BY p.id`,
      [mappedTaxIds],
    );
    const productIds: number[] = productsRes.rows.map((r) => Number(r.id));
    console.log(`Published idol/jewellery products (term-mapped): ${productIds.length}`);
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

    // --- term assignments per product ---
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

    // --- slug uniqueness across this batch AND existing public.products ---
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
    const multiMapped: Array<{ id: number; title: string; chosen: string; all: string }> = [];

    for (const p of productsRes.rows) {
      const pid = Number(p.id);
      const title = String(p.post_title ?? '').trim();

      // Choose the most specific mapped term (highest priority).
      const candidateTerms = (termIdsByProduct.get(pid) ?? []).filter((tid) => TERM_MAP[tid]);
      if (candidateTerms.length === 0) {
        skipped.push({ id: pid, title });
        continue;
      }
      const sortedTerms = [...new Set(candidateTerms)].sort((a, b) => TERM_MAP[b].priority - TERM_MAP[a].priority);
      const termId = sortedTerms[0];
      const spec = TERM_MAP[termId];
      if (sortedTerms.length > 1) {
        const distinct = new Set(sortedTerms.map((t) => `${TERM_MAP[t].category}/${TERM_MAP[t].subCategory}`));
        if (distinct.size > 1) {
          multiMapped.push({ id: pid, title, chosen: `${spec.category}/${spec.subCategory}`, all: [...distinct].join(', ') });
        }
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

      const canonicalPath = `${groupCanonicalBase(spec.group)}/${ids.slug}`;
      const canonicalUrl = `${SITE_BASE}${canonicalPath}`;

      // SEO: prefer legacy Yoast when present, otherwise derive from content.
      const yoastTitle = nonEmpty(meta._yoast_wpseo_title);
      const yoastDesc = nonEmpty(meta._yoast_wpseo_metadesc);
      const yoastFocus = nonEmpty(meta._yoast_wpseo_focuskw);
      const descSource = nonEmpty(p.post_excerpt) ?? (content.cleanHtml ? plainText(content.cleanHtml) : null) ?? title;
      const metaTitle = truncate(yoastTitle ?? `${title} | PureVedicGems`, 70);
      const metaDescription = truncate(yoastDesc ?? plainText(descSource), 160);
      const focusKeyword = (yoastFocus ?? spec.label).toLowerCase();
      const legacySeo: Record<string, unknown> = {};
      if (yoastTitle) legacySeo.yoast_title = yoastTitle;
      if (yoastDesc) legacySeo.yoast_metadesc = yoastDesc;
      if (yoastFocus) legacySeo.yoast_focuskw = yoastFocus;

      const primaryCat = catBySlug.get(spec.leafCategorySlug)!;
      const parentCat = spec.parentCategorySlug ? catBySlug.get(spec.parentCategorySlug)! : null;

      const priceMode = pricing.price === null || pricing.price <= 0 ? 'on_demand' : 'fixed';

      staged.push({
        legacy_woo_id: pid,
        sku: ids.sku,
        legacy_sku: ids.legacySku,
        name: title,
        slug: ids.slug,
        legacy_slug: String(p.post_name ?? ''),
        legacy_permalink: `/product/${p.post_name}/`,
        legacy_status: p.post_status,
        legacy_created_at: p.post_date_gmt,
        family: spec.category === 'rudraksha' ? 'rudraksha' : spec.productType, // upsert branch key
        category: spec.category,
        sub_category: spec.subCategory,
        product_type: spec.productType,
        quality_label: null,
        recommendation_category_code: null,
        price: pricing.price,
        compare_price: pricing.comparePrice,
        price_per_carat: null,
        price_mode: priceMode,
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
        mukhi_count: null,
        bead_weight: null,
        bead_size_mm: null,
        ruling_deity: null,
        mantra: null,
        xray_certificate_number: null,
        energization_eligible: spec.energization,
        certificate_number: null,
        certificate_lab: null,
        certificate_status: 'not_required',
        certificate_file_url: null,
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
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: [spec.label.toLowerCase(), spec.group === 'idols' ? 'spiritual idol' : spec.group === 'malas' ? 'mala' : 'vedic jewellery'],
        canonical_url: canonicalUrl,
        seo_data: { focus_keyword: focusKeyword, canonical_path: canonicalPath, storefront_group: spec.group },
        legacy_seo: legacySeo,
        legacy_category_paths: legacyCategoryPaths,
        legacy_data: { meta, legacy_term_ids: termIdsByProduct.get(pid) ?? [], chosen_term_id: termId },
        warnings,
        primary_category_id: primaryCat.id,
        parent_category_id: parentCat ? parentCat.id : null,
      });
      redirects.push(...buildRedirects(pid, legacySlugs, slugChains, canonicalPath));
    }

    // --- report ---
    const byTarget = new Map<string, number>();
    for (const r of staged) {
      const key = `${r.product_type}: ${r.category}/${r.sub_category}`;
      byTarget.set(key, (byTarget.get(key) ?? 0) + 1);
    }
    console.log(`Staged products: ${staged.length}`);
    console.log(`Redirect candidates: ${redirects.length}`);
    console.table([...byTarget.entries()].map(([k, n]) => ({ target: k, count: n })).sort((a, b) => (a.target < b.target ? -1 : 1)));
    if (multiMapped.length) {
      console.log(`\nNOTE - ${multiMapped.length} products tagged to multiple mapped targets (chose highest priority):`);
      for (const m of multiMapped) console.log(`  ${m.id}\t${m.title}\t-> ${m.chosen}  (all: ${m.all})`);
    }
    if (skipped.length) {
      console.log(`\nWARNING - ${skipped.length} products had no mapped term and were skipped:`);
      for (const s of skipped) console.log(`  ${s.id}\t${s.title}`);
    }

    if (!flags.write) {
      console.log('\nDry-run only. Pass --write (and --write-prod for production) to stage rows.');
      return;
    }

    await client.query('BEGIN');
    try {
      await client.query(`TRUNCATE legacy_import.stg_idols_jewellery_products, legacy_import.stg_idols_jewellery_redirect_candidates`);
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
  'primary_category_id', 'parent_category_id',
];
const JSON_COLUMNS = new Set(['dimensions_mm', 'legacy_image_urls', 'images', 'seo_data', 'legacy_seo', 'legacy_data', 'warnings']);

async function insertProduct(client: Client, product: Record<string, unknown>) {
  const vals = PRODUCT_COLUMNS.map((column) => {
    const value = product[column];
    if (JSON_COLUMNS.has(column)) return JSON.stringify(value ?? (column === 'dimensions_mm' ? null : column.endsWith('s') ? [] : {}));
    return value ?? null;
  });
  await client.query(
    `INSERT INTO legacy_import.stg_idols_jewellery_products (${PRODUCT_COLUMNS.join(',')}) VALUES (${vals.map((_, i) => `$${i + 1}`).join(',')})`,
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
      `INSERT INTO legacy_import.stg_idols_jewellery_redirect_candidates (legacy_woo_id, legacy_path, new_path, source_label)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (legacy_woo_id, legacy_path) DO UPDATE SET new_path=EXCLUDED.new_path, source_label=EXCLUDED.source_label`,
      values,
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
