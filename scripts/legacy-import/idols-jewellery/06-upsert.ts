/**
 * idols-jewellery/06-upsert.ts
 *
 * Promote staged idol/jewellery/mala products from
 * legacy_import.stg_idols_jewellery_products into public.products. These are
 * fixed-price finished goods (no configurator), so this uses a single generic
 * insert shape. Category assignments use the primary_category_id /
 * parent_category_id resolved by 03-transform. Idempotent via
 * ON CONFLICT (legacy_woo_id). Reuses the leftover media-map / html-rewrite /
 * dedicated-video conventions verbatim.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/idols-jewellery/06-upsert.ts                 (dry-run, rollback)
 *   npx tsx scripts/legacy-import/idols-jewellery/06-upsert.ts --write --write-prod
 */

import { randomUUID } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { parseRunMode } from '../lib/supabase.js';
import { isQuoteOnlyPriceMode, resolveLegacyAvailabilityStatus } from '../lib/transform/pricing.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const LEGACY_BASE = (process.env.LEGACY_MEDIA_BASE_URL ?? 'https://www.purevedicgems.com/wp-content/uploads/').replace(/\/+$/, '/');
const LEGACY_HOST_PATTERNS = [
  /https?:\/\/(?:www\.)?purevedicgems\.in\/wp-content\/uploads\/[^\s"'<>)]+/gi,
  /https?:\/\/(?:www\.)?purevedicgems\.com\/wp-content\/uploads\/[^\s"'<>)]+/gi,
];

type MediaMap = { byLegacyUrl: Map<string, string>; attachmentToUrl: Map<number, string> };

type StagedProduct = {
  legacy_woo_id: number;
  sku: string | null;
  name: string;
  slug: string;
  family: string;
  category: string | null;
  sub_category: string;
  product_type: string | null;
  price: number | null;
  compare_price: number | null;
  price_mode: string | null;
  energization_eligible: boolean | null;
  short_desc: string | null;
  clean_description: string | null;
  legacy_html_description: string | null;
  legacy_thumbnail_url: unknown;
  legacy_image_urls: unknown;
  video_url: string | null;
  stock_status: string | null;
  manual_reserve_enabled: boolean | null;
  reservation_note: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  canonical_url: string | null;
  seo_data: Record<string, unknown> | null;
  legacy_seo: Record<string, unknown> | null;
  legacy_sku: string | null;
  legacy_slug: string | null;
  legacy_permalink: string | null;
  legacy_status: string | null;
  legacy_created_at: string | Date | null;
  warnings: unknown;
  legacy_data: Record<string, unknown> | null;
  legacy_category_paths: string[] | null;
  primary_category_id: string | null;
  parent_category_id: string | null;
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

function alternateLegacyHost(value: string) {
  if (value.includes('purevedicgems.in/')) return value.replace('purevedicgems.in/', 'purevedicgems.com/');
  if (value.includes('purevedicgems.com/')) return value.replace('purevedicgems.com/', 'purevedicgems.in/');
  return null;
}

async function loadMediaMap(client: Client): Promise<MediaMap> {
  const rows = await client.query(
    `SELECT legacy_url, public_url FROM legacy_import.stg_media_url_map WHERE download_status='ok' AND public_url IS NOT NULL`,
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
       JOIN legacy_import.stg_media_url_map m ON m.legacy_url = $1 || pm.meta_value
      WHERE pm.meta_key = '_wp_attached_file' AND m.download_status='ok'`,
    [LEGACY_BASE],
  );
  const attachmentToUrl = new Map<number, string>();
  for (const row of attachments.rows) attachmentToUrl.set(Number(row.attachment_id), row.public_url);
  return { byLegacyUrl, attachmentToUrl };
}

function rewriteHtml(html: string | null, media: MediaMap): string | null {
  if (!html) return html;
  let output = html;
  for (const pattern of LEGACY_HOST_PATTERNS) output = output.replace(pattern, (matched) => media.byLegacyUrl.get(matched) ?? matched);
  return output;
}

function buildImagesArray(attachmentIds: unknown, primaryAttachId: unknown, media: MediaMap): { images: string[]; thumbnail_url: string | null } {
  const ids = Array.isArray(attachmentIds) ? attachmentIds.map((v) => Number(v)).filter((v) => Number.isFinite(v)) : [];
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

function stockStatus(value: string | null | undefined): 'in_stock' | 'out_of_stock' | 'on_backorder' {
  if (value === 'out_of_stock' || value === 'outofstock') return 'out_of_stock';
  if (value === 'on_backorder' || value === 'onbackorder') return 'on_backorder';
  return 'in_stock';
}

function availability(row: StagedProduct, normalisedStock: string) {
  return resolveLegacyAvailabilityStatus({
    priceMode: row.price_mode ?? 'fixed',
    inStock: normalisedStock === 'in_stock',
    stockStatus: normalisedStock,
  });
}

const DEDICATED_VIDEO_CTE = /* sql */ `
  with gallery as (
    select gm.post_id::bigint as product_id, trim(x)::bigint as attach_id, ord
    from legacy_import.stg_wp_postmeta gm,
      unnest(string_to_array(gm.meta_value, ',')) with ordinality as u(x, ord)
    where gm.meta_key = '_product_image_gallery'
      and gm.meta_value ~ '^[0-9,]+$'
  ),
  vlink as (
    select pm.post_id::bigint as attach_id, pm.meta_value as video_id
    from legacy_import.stg_wp_postmeta pm
    join legacy_import.stg_wp_postmeta vs
      on vs.post_id = pm.post_id and vs.meta_key = 'video_site' and vs.meta_value = 'youtube'
    where pm.meta_key = 'videolink_id'
      and pm.meta_value ~ '^[\\w-]{11}$'
  ),
  dedicated as (
    select g.product_id as legacy_woo_id,
      'https://www.youtube.com/embed/'
        || (array_agg(vl.video_id order by g.ord) filter (where vl.video_id is not null))[1]
        as video_url
    from gallery g
    join vlink vl on vl.attach_id = g.attach_id
    group by g.product_id
    having (array_agg(vl.video_id order by g.ord) filter (where vl.video_id is not null))[1] is not null
  )
`;

async function upsertProduct(client: Client, row: StagedProduct, media: MediaMap, batchId: string): Promise<void> {
  const { images, thumbnail_url } = buildImagesArray(row.legacy_image_urls, row.legacy_thumbnail_url, media);
  const warnings = Array.isArray(row.warnings) ? [...row.warnings] : [];
  if (images.length === 0) warnings.push('media: no uploaded images resolved');
  const normalisedStock = stockStatus(row.stock_status);
  const isOnDemand = isQuoteOnlyPriceMode(row.price_mode);
  const productType = row.product_type ?? 'idol';

  const upsert = await client.query(
    `INSERT INTO public.products (
       sku, name, slug, category, sub_category,
       price, compare_price, currency,
       short_desc, description, clean_description, legacy_html_description,
       images, thumbnail_url, video_url,
       in_stock, stock_status, stock_quantity, manual_reserve_enabled, reservation_note, availability_status,
       meta_title, meta_description, meta_keywords, canonical_url, seo_data, legacy_seo,
       product_type, price_mode, configurator_enabled, energization_eligible,
       legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
       import_batch_id, import_warnings, legacy_data
     ) VALUES (
       $1,$2,$3,$4,$5,
       $6,$7,'INR',
       $8,$9,$10,$11,
       $12::jsonb,$13,$14,
       $15,$16,$17,$18,$19,$20,
       $21,$22,$23,$24,$25::jsonb,$26::jsonb,
       $27,$28,$29,$30,
       $31,$32,$33,$34,$35,$36,
       $37,$38::jsonb,$39::jsonb
     )
     ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
       sku=EXCLUDED.sku, name=EXCLUDED.name, slug=EXCLUDED.slug, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category,
       price=EXCLUDED.price, compare_price=EXCLUDED.compare_price, currency=EXCLUDED.currency,
       short_desc=EXCLUDED.short_desc, description=EXCLUDED.description, clean_description=EXCLUDED.clean_description, legacy_html_description=EXCLUDED.legacy_html_description,
       images=EXCLUDED.images, thumbnail_url=EXCLUDED.thumbnail_url, video_url=EXCLUDED.video_url,
       in_stock=EXCLUDED.in_stock, stock_status=EXCLUDED.stock_status, stock_quantity=EXCLUDED.stock_quantity,
       manual_reserve_enabled=EXCLUDED.manual_reserve_enabled, reservation_note=EXCLUDED.reservation_note, availability_status=EXCLUDED.availability_status,
       meta_title=EXCLUDED.meta_title, meta_description=EXCLUDED.meta_description, meta_keywords=EXCLUDED.meta_keywords,
       canonical_url=EXCLUDED.canonical_url, seo_data=EXCLUDED.seo_data, legacy_seo=EXCLUDED.legacy_seo,
       product_type=EXCLUDED.product_type, price_mode=EXCLUDED.price_mode, configurator_enabled=EXCLUDED.configurator_enabled, energization_eligible=EXCLUDED.energization_eligible,
       legacy_sku=EXCLUDED.legacy_sku, legacy_slug=EXCLUDED.legacy_slug, legacy_permalink=EXCLUDED.legacy_permalink, legacy_status=EXCLUDED.legacy_status, legacy_created_at=EXCLUDED.legacy_created_at,
       import_batch_id=EXCLUDED.import_batch_id, import_warnings=EXCLUDED.import_warnings, legacy_data=EXCLUDED.legacy_data, updated_at=NOW()
     RETURNING id`,
    [
      row.sku ?? `PVG-LEG-${row.legacy_woo_id}`,
      row.name,
      row.slug,
      row.category,
      row.sub_category,
      row.price ?? 0,
      row.compare_price,
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
      row.manual_reserve_enabled ?? false,
      row.reservation_note,
      availability(row, normalisedStock),
      row.meta_title,
      row.meta_description,
      row.meta_keywords ?? [],
      row.canonical_url,
      JSON.stringify(row.seo_data ?? {}),
      JSON.stringify(row.legacy_seo ?? {}),
      productType,
      row.price_mode ?? 'fixed',
      false,
      row.energization_eligible ?? false,
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
  await writeAssignments(client, productId, row);
  await client.query(
    `INSERT INTO public.product_option_rules (
       product_id, certificate_enabled, energization_enabled,
       jewelry_design_enabled, metal_enabled, ring_size_enabled,
       allowed_setting_types, allowed_ring_size_systems
     ) VALUES ($1, FALSE, $2, FALSE, FALSE, FALSE, $3::text[], $4::text[])
     ON CONFLICT (product_id) DO UPDATE SET
       certificate_enabled=EXCLUDED.certificate_enabled, energization_enabled=EXCLUDED.energization_enabled,
       jewelry_design_enabled=EXCLUDED.jewelry_design_enabled, metal_enabled=EXCLUDED.metal_enabled, ring_size_enabled=EXCLUDED.ring_size_enabled,
       allowed_setting_types=EXCLUDED.allowed_setting_types, allowed_ring_size_systems=EXCLUDED.allowed_ring_size_systems, updated_at=NOW()`,
    [productId, row.energization_eligible ?? false, [], []],
  );
}

async function writeAssignments(client: Client, productId: string, row: StagedProduct): Promise<void> {
  const primaryId = row.primary_category_id;
  if (!primaryId) throw new Error(`missing primary_category_id for legacy_woo_id=${row.legacy_woo_id}`);
  await client.query(`DELETE FROM public.product_category_assignments WHERE product_id=$1`, [productId]);
  await client.query(
    `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
       VALUES ($1, $2, TRUE, 0, $3)`,
    [productId, primaryId, Array.isArray(row.legacy_category_paths) ? row.legacy_category_paths[0] ?? null : null],
  );
  if (row.parent_category_id && row.parent_category_id !== primaryId) {
    await client.query(
      `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
         VALUES ($1, $2, FALSE, 1, NULL)
         ON CONFLICT (product_id, category_id) DO NOTHING`,
      [productId, row.parent_category_id],
    );
  }
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

    await client.query(
      `INSERT INTO public.product_import_batches (id, source, filename, status, started_at)
       VALUES ($1, 'legacy-migration', 'idols-jewellery-phase-1', 'running', NOW())
       ON CONFLICT (id) DO UPDATE SET status='running', started_at=NOW()`,
      [batchId],
    );

    const staged = await client.query<StagedProduct>(`SELECT * FROM legacy_import.stg_idols_jewellery_products ORDER BY legacy_woo_id`);
    console.log(`Loading staging products... ${staged.rows.length} rows to promote\n`);

    let firstErrorPrinted = false;
    for (const row of staged.rows) {
      await client.query('SAVEPOINT row_sp');
      try {
        await upsertProduct(client, row, media, batchId);
        processedRows++;
        await client.query('RELEASE SAVEPOINT row_sp');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT row_sp').catch(() => {});
        failedRows++;
        const message = err instanceof Error ? err.message : String(err);
        const key = `product-error:${message.slice(0, 80)}`;
        warningCounter.set(key, (warningCounter.get(key) ?? 0) + 1);
        if (!firstErrorPrinted) {
          firstErrorPrinted = true;
          console.error(`\n  FIRST ERROR legacy_woo_id=${row.legacy_woo_id} type=${row.product_type} sub=${row.sub_category} sku=${row.sku} slug=${row.slug}`);
          console.error('  ' + (err instanceof Error ? err.stack ?? err.message : String(err)));
          console.error('');
        } else {
          console.error(`  ! legacy_woo_id=${row.legacy_woo_id}: ${message}`);
        }
      }
    }

    console.log('\nResolving dedicated video URLs...');
    const stgVid = await client.query(
      `${DEDICATED_VIDEO_CTE}
       update legacy_import.stg_idols_jewellery_products s
       set video_url = d.video_url
       from dedicated d
       where d.legacy_woo_id = s.legacy_woo_id and s.video_url is distinct from d.video_url`,
    );
    const pubVid = await client.query(
      `${DEDICATED_VIDEO_CTE}
       update public.products p
       set video_url = d.video_url
       from dedicated d
       join legacy_import.stg_idols_jewellery_products s on s.legacy_woo_id = d.legacy_woo_id
       where p.legacy_woo_id = d.legacy_woo_id and p.video_url is distinct from d.video_url`,
    );
    console.log(`  staging videos updated: ${stgVid.rowCount}, public videos updated: ${pubVid.rowCount}`);

    console.log('\nWriting redirects...');
    const redirectResult = await client.query(`
      WITH hosts(host) AS (
        VALUES ('https://www.purevedicgems.com'), ('https://www.purevedicgems.in')
      ), source_rows AS (
        SELECT p.id AS product_id, hosts.host || rc.legacy_path AS source_url
        FROM legacy_import.stg_idols_jewellery_redirect_candidates rc
        JOIN public.products p ON p.legacy_woo_id = rc.legacy_woo_id
        CROSS JOIN hosts
      )
      INSERT INTO public.product_redirect_sources (product_id, source_url, source_slug, http_status, source)
      SELECT DISTINCT ON (source_url) product_id, source_url, NULL, 301, 'woocommerce'
      FROM source_rows
      ORDER BY source_url, product_id
      ON CONFLICT (source_url) DO UPDATE SET
        product_id=EXCLUDED.product_id, http_status=EXCLUDED.http_status, source=EXCLUDED.source, is_active=TRUE`);
    const redirectInserted = redirectResult.rowCount ?? 0;
    console.log(`  ${redirectInserted} redirect rows written`);

    const status = failedRows > 0 ? 'completed_with_errors' : 'completed';
    await client.query(
      `UPDATE public.product_import_batches
          SET status=$2, total_rows=$3, processed_rows=$4, failed_rows=$5, summary=$6::jsonb, completed_at=NOW()
        WHERE id=$1`,
      [batchId, status, processedRows + failedRows, processedRows, failedRows, JSON.stringify({ phase: 'idols-jewellery-1', redirects_written: redirectInserted, warnings: Object.fromEntries(warningCounter) })],
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
      for (const [reason, count] of sorted) console.log(`  ${count}x ${reason}`);
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
