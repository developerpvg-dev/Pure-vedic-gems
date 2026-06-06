/**
 * rudraksha/06-upsert.ts
 *
 * Promote staged Rudraksha products into public catalog tables after categories
 * and media have been prepared.
 */

import { randomUUID } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { parseRunMode } from '../lib/supabase.js';
import { RUDRAKSHA_RICH_GUIDES } from '../../../src/lib/constants/rudraksha-rich-content.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const LEGACY_BASE = (process.env.LEGACY_MEDIA_BASE_URL ?? 'https://www.purevedicgems.in/wp-content/uploads/').replace(/\/+$/, '/');
const LEGACY_HOST_PATTERNS = [
  /https?:\/\/(?:www\.)?purevedicgems\.in\/wp-content\/uploads\/[^\s"'<>)]+/gi,
  /https?:\/\/(?:www\.)?purevedicgems\.com\/wp-content\/uploads\/[^\s"'<>)]+/gi,
];

type MediaMap = {
  byLegacyUrl: Map<string, string>;
  attachmentToUrl: Map<number, string>;
};

type StagedProduct = {
  legacy_woo_id: number;
  sku: string | null;
  name: string;
  slug: string;
  category: string | null;
  sub_category: string;
  price: number | null;
  compare_price: number | null;
  price_mode: string | null;
  stock_status: string | null;
  mukhi_count: number | null;
  ruling_deity: string | null;
  short_desc: string | null;
  clean_description: string | null;
  legacy_html_description: string | null;
  legacy_thumbnail_url: unknown;
  legacy_image_urls: unknown;
  video_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  canonical_url: string | null;
  seo_data: Record<string, unknown> | null;
  legacy_seo: Record<string, unknown> | null;
  certificate_number: string | null;
  certificate_lab: string | null;
  certificate_status: string | null;
  xray_certificate_number: string | null;
  product_type: string | null;
  rudraksha_type: string | null;
  bead_size_mm: number | null;
  bead_weight: number | null;
  mantra: string | null;
  energization_eligible: boolean | null;
  legacy_sku: string | null;
  legacy_slug: string | null;
  legacy_permalink: string | null;
  legacy_status: string | null;
  legacy_created_at: string | Date | null;
  warnings: unknown;
  legacy_data: Record<string, unknown> | null;
  legacy_category_paths: string[] | null;
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

async function loadMediaMap(client: Client): Promise<MediaMap> {
  const rows = await client.query(
    `SELECT legacy_url, public_url
       FROM legacy_import.stg_media_url_map
      WHERE download_status = 'ok'
        AND public_url IS NOT NULL`,
  );
  const byLegacyUrl = new Map<string, string>();
  for (const row of rows.rows) {
    byLegacyUrl.set(row.legacy_url, row.public_url);
    const alternate = alternateLegacyHost(row.legacy_url);
    if (alternate) byLegacyUrl.set(alternate, row.public_url);
  }

  const attachments = await client.query(
    `SELECT pm.post_id::bigint AS attachment_id, m.public_url
       FROM legacy_import.stg_wp_postmeta pm
       JOIN legacy_import.stg_media_url_map m
         ON m.legacy_url = $1 || pm.meta_value
      WHERE pm.meta_key = '_wp_attached_file'
        AND m.download_status='ok'`,
    [LEGACY_BASE],
  );
  const attachmentToUrl = new Map<number, string>();
  for (const row of attachments.rows) attachmentToUrl.set(Number(row.attachment_id), row.public_url);
  return { byLegacyUrl, attachmentToUrl };
}

function alternateLegacyHost(value: string) {
  if (value.includes('purevedicgems.in/')) return value.replace('purevedicgems.in/', 'purevedicgems.com/');
  if (value.includes('purevedicgems.com/')) return value.replace('purevedicgems.com/', 'purevedicgems.in/');
  return null;
}

function rewriteHtml(html: string | null, media: MediaMap): string | null {
  if (!html) return html;
  let output = html;
  for (const pattern of LEGACY_HOST_PATTERNS) {
    output = output.replace(pattern, (matched) => media.byLegacyUrl.get(matched) ?? matched);
  }
  return output;
}

function buildImagesArray(
  attachmentIds: unknown,
  primaryAttachId: unknown,
  media: MediaMap,
): { images: string[]; thumbnail_url: string | null } {
  const ids = Array.isArray(attachmentIds)
    ? attachmentIds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];
  const primaryId = primaryAttachId !== null && primaryAttachId !== undefined ? Number(primaryAttachId) : null;
  const ordered: number[] = [];
  if (primaryId && Number.isFinite(primaryId) && !ids.includes(primaryId)) ordered.push(primaryId);
  for (const id of ids) if (!ordered.includes(id)) ordered.push(id);

  const images: string[] = [];
  for (const id of ordered) {
    const url = media.attachmentToUrl.get(id);
    if (url && !images.includes(url)) images.push(url);
  }
  const primaryUrl = primaryId ? media.attachmentToUrl.get(primaryId) : undefined;
  return { images, thumbnail_url: primaryUrl ?? images[0] ?? null };
}

function rudrakshaGuide(mukhiCount: number | null | undefined) {
  if (!mukhiCount) return null;
  return RUDRAKSHA_RICH_GUIDES.find((guide) => guide.mukhi === Number(mukhiCount)) ?? null;
}

function stockStatus(value: string | null | undefined): 'in_stock' | 'out_of_stock' | 'on_backorder' {
  if (value === 'out_of_stock' || value === 'outofstock') return 'out_of_stock';
  if (value === 'on_backorder' || value === 'onbackorder') return 'on_backorder';
  return 'in_stock';
}

function availability(row: StagedProduct, normalisedStock: string) {
  if (row.price_mode === 'on_demand' || row.price_mode === 'quote_required') return 'on_demand';
  return normalisedStock === 'in_stock' ? 'in_stock' : 'out_of_stock';
}

function certificateEnabled(row: StagedProduct) {
  return Boolean(
    row.certificate_status && row.certificate_status !== 'not_required'
    || row.certificate_number
    || row.xray_certificate_number,
  );
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  const batchId = process.env.IMPORT_BATCH_ID ?? randomUUID();
  console.log(`Mode:     ${flags.write ? 'WRITE (commit)' : 'DRY-RUN (rollback)'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host:     ${dbHost}`);
  console.log(`Batch ID: ${batchId}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  let processedRows = 0;
  let failedRows = 0;
  const warningCounter = new Map<string, number>();

  try {
    await client.query('BEGIN');

    console.log('Loading media url map...');
    const media = await loadMediaMap(client);
    console.log(`  ${media.byLegacyUrl.size} OK legacy URLs, ${media.attachmentToUrl.size} attachment ids mapped`);

    console.log('Loading category id map...');
    const categoryRows = await client.query(`SELECT id, slug FROM public.product_categories WHERE is_active`);
    const categoryBySlug = new Map<string, string>();
    for (const row of categoryRows.rows) categoryBySlug.set(row.slug, row.id);
    const parentId = categoryBySlug.get('rudraksha');
    if (!parentId) throw new Error('public.product_categories has no active "rudraksha" parent row. Run 04-categories first.');

    await client.query(
      `INSERT INTO public.product_import_batches (id, source, filename, status, started_at)
       VALUES ($1, 'legacy-migration', 'rudraksha-phase-1', 'running', NOW())
       ON CONFLICT (id) DO UPDATE SET status='running', started_at=NOW()`,
      [batchId],
    );

    const staged = await client.query<StagedProduct>(`SELECT * FROM legacy_import.stg_rudraksha_products ORDER BY legacy_woo_id`);
    console.log(`Loading staging products... ${staged.rows.length} rows to promote\n`);

    let firstErrorPrinted = false;
    for (const row of staged.rows) {
      await client.query('SAVEPOINT row_sp');
      try {
        const subCategoryId = categoryBySlug.get(row.sub_category);
        if (!subCategoryId) {
          failedRows++;
          const key = `missing-canonical-subcategory:${row.sub_category}`;
          warningCounter.set(key, (warningCounter.get(key) ?? 0) + 1);
          await client.query('RELEASE SAVEPOINT row_sp');
          continue;
        }

        const { images, thumbnail_url } = buildImagesArray(row.legacy_image_urls, row.legacy_thumbnail_url, media);
        const warnings = Array.isArray(row.warnings) ? [...row.warnings] : [];
        if (images.length === 0) warnings.push('media: no uploaded images resolved');
        const guide = rudrakshaGuide(row.mukhi_count);
        const normalisedStock = stockStatus(row.stock_status);
        const isOnDemand = row.price_mode === 'on_demand' || row.price_mode === 'quote_required';
        const productType = row.product_type ?? 'rudraksha';
        const upsert = await client.query(
          `INSERT INTO public.products (
            sku, name, slug, category, sub_category,
            price, compare_price, currency,
            mukhi_count, ruling_deity, deity, planet, chakra,
            short_desc, description, clean_description, legacy_html_description,
            images, thumbnail_url, video_url,
            in_stock, stock_status, stock_quantity, availability_status,
            meta_title, meta_description, meta_keywords, canonical_url, seo_data, legacy_seo,
            certificate_number, certificate_lab, certificate_status, certificate_display_enabled,
            xray_certificate_number, xray_certified,
            product_type, price_mode, configurator_enabled,
            rudraksha_type, bead_size_mm, bead_weight, mantra, energization_eligible,
            legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
            import_batch_id, import_warnings, legacy_data
          ) VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,'INR',
            $8,$9,$10,$11,$12,
            $13,$14,$15,$16,
            $17::jsonb,$18,$19,
            $20,$21,$22,$23,
            $24,$25,$26,$27,$28::jsonb,$29::jsonb,
            $30,$31,$32,$33,
            $34,$35,
            $36,$37,$38,
            $39,$40,$41,$42,$43,
            $44,$45,$46,$47,$48,$49,
            $50,$51::jsonb,$52::jsonb
          )
          ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
            sku=EXCLUDED.sku,
            name=EXCLUDED.name,
            slug=EXCLUDED.slug,
            category=EXCLUDED.category,
            sub_category=EXCLUDED.sub_category,
            price=EXCLUDED.price,
            compare_price=EXCLUDED.compare_price,
            currency=EXCLUDED.currency,
            mukhi_count=EXCLUDED.mukhi_count,
            ruling_deity=EXCLUDED.ruling_deity,
            deity=EXCLUDED.deity,
            planet=EXCLUDED.planet,
            chakra=EXCLUDED.chakra,
            short_desc=EXCLUDED.short_desc,
            description=EXCLUDED.description,
            clean_description=EXCLUDED.clean_description,
            legacy_html_description=EXCLUDED.legacy_html_description,
            images=EXCLUDED.images,
            thumbnail_url=EXCLUDED.thumbnail_url,
            video_url=EXCLUDED.video_url,
            in_stock=EXCLUDED.in_stock,
            stock_status=EXCLUDED.stock_status,
            stock_quantity=EXCLUDED.stock_quantity,
            availability_status=EXCLUDED.availability_status,
            meta_title=EXCLUDED.meta_title,
            meta_description=EXCLUDED.meta_description,
            meta_keywords=EXCLUDED.meta_keywords,
            canonical_url=EXCLUDED.canonical_url,
            seo_data=EXCLUDED.seo_data,
            legacy_seo=EXCLUDED.legacy_seo,
            certificate_number=EXCLUDED.certificate_number,
            certificate_lab=EXCLUDED.certificate_lab,
            certificate_status=EXCLUDED.certificate_status,
            certificate_display_enabled=EXCLUDED.certificate_display_enabled,
            xray_certificate_number=EXCLUDED.xray_certificate_number,
            xray_certified=EXCLUDED.xray_certified,
            product_type=EXCLUDED.product_type,
            price_mode=EXCLUDED.price_mode,
            configurator_enabled=EXCLUDED.configurator_enabled,
            rudraksha_type=EXCLUDED.rudraksha_type,
            bead_size_mm=EXCLUDED.bead_size_mm,
            bead_weight=EXCLUDED.bead_weight,
            mantra=EXCLUDED.mantra,
            energization_eligible=EXCLUDED.energization_eligible,
            legacy_sku=EXCLUDED.legacy_sku,
            legacy_slug=EXCLUDED.legacy_slug,
            legacy_permalink=EXCLUDED.legacy_permalink,
            legacy_status=EXCLUDED.legacy_status,
            legacy_created_at=EXCLUDED.legacy_created_at,
            import_batch_id=EXCLUDED.import_batch_id,
            import_warnings=EXCLUDED.import_warnings,
            legacy_data=EXCLUDED.legacy_data,
            updated_at=NOW()
          RETURNING id`,
          [
            row.sku ?? `RUDRAKSHA-${row.legacy_woo_id}`,
            row.name,
            row.slug,
            row.category ?? 'rudraksha',
            row.sub_category,
            row.price ?? 0,
            row.compare_price,
            row.mukhi_count,
            row.ruling_deity ?? guide?.deity ?? null,
            row.ruling_deity ?? guide?.deity ?? null,
            guide?.planet ?? null,
            guide?.chakra ?? null,
            row.short_desc,
            row.clean_description ? String(row.clean_description).slice(0, 50000) : null,
            rewriteHtml(row.clean_description, media),
            rewriteHtml(row.legacy_html_description, media),
            JSON.stringify(images),
            thumbnail_url,
            row.video_url ?? null,
            !isOnDemand && normalisedStock === 'in_stock',
            normalisedStock,
            !isOnDemand && normalisedStock === 'in_stock' ? 1 : 0,
            availability(row, normalisedStock),
            row.meta_title,
            row.meta_description,
            row.meta_keywords ?? [],
            row.canonical_url,
            JSON.stringify({ ...(row.seo_data ?? {}), rudraksha_mukhi: row.mukhi_count ?? null }),
            JSON.stringify(row.legacy_seo ?? {}),
            row.certificate_number ? String(row.certificate_number).slice(0, 120) : null,
            row.certificate_lab,
            row.certificate_status ?? 'not_required',
            certificateEnabled(row),
            row.xray_certificate_number,
            Boolean(row.xray_certificate_number),
            productType,
            row.price_mode ?? 'fixed',
            productType === 'jewelry',
            row.rudraksha_type,
            row.bead_size_mm,
            row.bead_weight,
            row.mantra ?? guide?.beejMantra ?? null,
            row.energization_eligible !== false,
            row.legacy_woo_id,
            row.legacy_sku,
            row.legacy_slug,
            row.legacy_permalink,
            row.legacy_status,
            row.legacy_created_at,
            batchId,
            JSON.stringify(warnings),
            JSON.stringify(row.legacy_data ?? {}),
          ],
        );
        const productId = upsert.rows[0].id as string;

        await client.query(`DELETE FROM public.product_category_assignments WHERE product_id=$1`, [productId]);
        await client.query(
          `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
             VALUES ($1, $2, TRUE, 0, $3)`,
          [productId, subCategoryId, Array.isArray(row.legacy_category_paths) ? row.legacy_category_paths[0] ?? null : null],
        );
        if (subCategoryId !== parentId) {
          await client.query(
            `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
               VALUES ($1, $2, FALSE, 1, NULL)
               ON CONFLICT (product_id, category_id) DO NOTHING`,
            [productId, parentId],
          );
        }

        const certificate = certificateEnabled(row);
        const jewelryDesign = productType === 'jewelry';
        await client.query(
          `INSERT INTO public.product_option_rules (
             product_id, certificate_enabled, energization_enabled,
             jewelry_design_enabled, metal_enabled, ring_size_enabled,
             allowed_setting_types, allowed_ring_size_systems
           ) VALUES ($1, $2, $3, $4, FALSE, FALSE, $5::text[], $6::text[])
           ON CONFLICT (product_id) DO UPDATE SET
             certificate_enabled=EXCLUDED.certificate_enabled,
             energization_enabled=EXCLUDED.energization_enabled,
             jewelry_design_enabled=EXCLUDED.jewelry_design_enabled,
             metal_enabled=EXCLUDED.metal_enabled,
             ring_size_enabled=EXCLUDED.ring_size_enabled,
             allowed_setting_types=EXCLUDED.allowed_setting_types,
             allowed_ring_size_systems=EXCLUDED.allowed_ring_size_systems,
             updated_at=NOW()`,
          [
            productId,
            certificate,
            row.energization_eligible !== false,
            jewelryDesign,
            jewelryDesign ? ['pendant', 'bracelet', 'mala'] : ['loose'],
            [],
          ],
        );

        processedRows++;
        if (processedRows % 100 === 0) console.log(`  upserted ${processedRows}/${staged.rows.length}`);
        await client.query('RELEASE SAVEPOINT row_sp');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT row_sp').catch(() => {});
        failedRows++;
        const message = err instanceof Error ? err.message : String(err);
        const key = `product-error:${message.slice(0, 80)}`;
        warningCounter.set(key, (warningCounter.get(key) ?? 0) + 1);
        if (!firstErrorPrinted) {
          firstErrorPrinted = true;
          console.error(`\n  FIRST ERROR legacy_woo_id=${row.legacy_woo_id} sub=${row.sub_category} sku=${row.sku} slug=${row.slug}`);
          console.error('  ' + (err instanceof Error ? err.stack ?? err.message : String(err)));
          console.error('');
        } else {
          console.error(`  ! legacy_woo_id=${row.legacy_woo_id}: ${message}`);
        }
      }
    }

    console.log('\nWriting redirects...');
    const redirectResult = await client.query(`
      WITH hosts(host) AS (
        VALUES ('https://www.purevedicgems.com'), ('https://www.purevedicgems.in')
      ), source_rows AS (
        SELECT p.id AS product_id, hosts.host || rc.legacy_path AS source_url
        FROM legacy_import.stg_rudraksha_redirect_candidates rc
        JOIN public.products p ON p.legacy_woo_id = rc.legacy_woo_id
        CROSS JOIN hosts
      )
      INSERT INTO public.product_redirect_sources (product_id, source_url, source_slug, http_status, source)
      SELECT DISTINCT ON (source_url) product_id, source_url, NULL, 301, 'woocommerce'
      FROM source_rows
      ORDER BY source_url, product_id
      ON CONFLICT (source_url) DO UPDATE SET
        product_id=EXCLUDED.product_id,
        http_status=EXCLUDED.http_status,
        source=EXCLUDED.source,
        is_active=TRUE`);
    const redirectInserted = redirectResult.rowCount ?? 0;
    console.log(`  ${redirectInserted} redirect rows written`);

    const status = failedRows > 0 ? 'completed_with_errors' : 'completed';
    await client.query(
      `UPDATE public.product_import_batches
          SET status=$2, total_rows=$3, processed_rows=$4, failed_rows=$5,
              summary=$6::jsonb, completed_at=NOW()
        WHERE id=$1`,
      [
        batchId,
        status,
        processedRows + failedRows,
        processedRows,
        failedRows,
        JSON.stringify({
          phase: 'rudraksha-1',
          redirects_written: redirectInserted,
          warnings: Object.fromEntries(warningCounter),
        }),
      ],
    );

    if (flags.write) {
      await client.query('COMMIT');
      console.log(`\nCOMMITTED. Promoted ${processedRows} products, ${redirectInserted} redirects, batch ${batchId}.`);
    } else {
      await client.query('ROLLBACK');
      console.log(`\nROLLED BACK. Would promote ${processedRows} products, ${redirectInserted} redirects.`);
      console.log('Re-run with --write to commit. Add --write-prod only after production review.');
    }

    if (failedRows > 0) {
      console.log(`\n${failedRows} rows failed. Top reasons:`);
      const sorted = [...warningCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      for (const [code, count] of sorted) console.log(`  ${count}\t${code}`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});