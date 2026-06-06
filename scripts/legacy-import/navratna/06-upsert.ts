/**
 * navratna/06-upsert.ts
 *
 * Promote rows from `legacy_import.stg_navratna_products` into the canonical
 * `public.*` tables within the same Supabase project.
 *
 * Tables written (one transaction):
 *   - public.product_import_batches  (1 row; status running → completed/failed)
 *   - public.products                (UPSERT on legacy_woo_id)
 *   - public.product_category_assignments (replaced per product)
 *   - public.product_option_rules    (single row per product)
 *   - public.product_redirect_sources (upsert on source_url)
 *
 * Image / HTML URL rewrite:
 *   - Attachment IDs in stg_navratna_products.legacy_image_urls /
 *     legacy_thumbnail_url are joined against stg_wp_postmeta '_wp_attached_file'
 *     to get the legacy URL, then looked up in stg_media_url_map for the new
 *     Supabase Storage public_url. Only `ok` rows are included.
 *   - All `https://www.purevedicgems.{in,com}/wp-content/uploads/...` matches
 *     inside clean_description and legacy_html_description are regex-replaced
 *     via the same map.
 *
 * Safety:
 *   - Refuses to write to PROD_SUPABASE_HOSTS (db. prefix stripped).
 *   - Always runs inside BEGIN; --write commits, default rolls back.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/navratna/06-upsert.ts                   # transactional dry-run (rollback)
 *   npx tsx scripts/legacy-import/navratna/06-upsert.ts --write           # commit
 *   IMPORT_BATCH_ID=<uuid> npx tsx scripts/legacy-import/navratna/06-upsert.ts --write
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));
import { parseRunMode } from '../lib/supabase.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const LEGACY_BASE = (process.env.LEGACY_MEDIA_BASE_URL ?? 'https://www.purevedicgems.in/wp-content/uploads/').replace(/\/+$/, '/');
const LEGACY_HOST_PATTERNS = [
  /https?:\/\/(?:www\.)?purevedicgems\.in\/wp-content\/uploads\/[^\s"'<>)]+/gi,
  /https?:\/\/(?:www\.)?purevedicgems\.com\/wp-content\/uploads\/[^\s"'<>)]+/gi,
];

interface MediaMap {
  byLegacyUrl: Map<string, string>;
  attachmentToUrl: Map<number, string>;
}

async function loadMediaMap(client: Client): Promise<MediaMap> {
  const r = await client.query(
    `SELECT legacy_url, public_url FROM legacy_import.stg_media_url_map
     WHERE download_status = 'ok' AND public_url IS NOT NULL`,
  );
  const byLegacyUrl = new Map<string, string>();
  for (const row of r.rows) byLegacyUrl.set(row.legacy_url, row.public_url);

  const a = await client.query(
    `SELECT pm.post_id::bigint AS attachment_id, m.public_url
       FROM legacy_import.stg_wp_postmeta pm
       JOIN legacy_import.stg_media_url_map m
         ON m.legacy_url = $1 || pm.meta_value
      WHERE pm.meta_key = '_wp_attached_file' AND m.download_status='ok'`,
    [LEGACY_BASE],
  );
  const attachmentToUrl = new Map<number, string>();
  for (const row of a.rows) attachmentToUrl.set(Number(row.attachment_id), row.public_url);

  return { byLegacyUrl, attachmentToUrl };
}

function rewriteHtml(html: string | null, media: MediaMap): string | null {
  if (!html) return html;
  let out = html;
  for (const re of LEGACY_HOST_PATTERNS) {
    out = out.replace(re, (matched) => media.byLegacyUrl.get(matched) ?? matched);
  }
  return out;
}

function buildImagesArray(
  attachmentIds: unknown,
  primaryAttachId: unknown,
  media: MediaMap,
): { images: string[]; thumbnail_url: string | null } {
  const ids = Array.isArray(attachmentIds)
    ? attachmentIds.map((v) => Number(v)).filter((n) => Number.isFinite(n))
    : [];
  const primaryId = primaryAttachId !== null && primaryAttachId !== undefined ? Number(primaryAttachId) : null;
  const ordered: number[] = [];
  if (primaryId && Number.isFinite(primaryId) && !ids.includes(primaryId)) ordered.push(primaryId);
  for (const id of ids) if (!ordered.includes(id)) ordered.push(id);

  const images: string[] = [];
  for (const id of ordered) {
    const url = media.attachmentToUrl.get(id);
    if (url && !images.includes(url)) {
      images.push(url);
    }
  }
  const primaryUrl = primaryId ? media.attachmentToUrl.get(primaryId) : undefined;
  const thumbnail_url = primaryUrl ?? images[0] ?? null;
  return { images, thumbnail_url };
}

async function main() {
  const mode = parseRunMode(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (mode.write && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}".`);
  }
  const batchId = process.env.IMPORT_BATCH_ID ?? randomUUID();

  console.log(`Mode:     ${mode.write ? 'WRITE (commit)' : 'DRY-RUN (rollback)'}`);
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
    const catRows = await client.query(`SELECT id, slug FROM public.product_categories WHERE family='navaratna'`);
    const catBySlug = new Map<string, string>();
    for (const r of catRows.rows) catBySlug.set(r.slug, r.id);
    const parentId = catBySlug.get('navaratna');
    if (!parentId) throw new Error('public.product_categories has no "navaratna" parent row. Run navratna_phase1_canonical_min.sql first.');

    await client.query(
      `INSERT INTO public.product_import_batches (id, source, filename, status, started_at)
       VALUES ($1, 'legacy-migration', 'navratna-phase-1', 'running', NOW())
       ON CONFLICT (id) DO UPDATE SET status='running', started_at=NOW()`,
      [batchId],
    );

    console.log('Loading staging products...');
    const all = await client.query(`SELECT * FROM legacy_import.stg_navratna_products ORDER BY legacy_woo_id`);
    console.log(`  ${all.rows.length} rows to promote\n`);

    let firstErrorPrinted = false;
    for (const r of all.rows) {
      await client.query('SAVEPOINT row_sp');
      try {
        const { images, thumbnail_url } = buildImagesArray(r.legacy_image_urls, r.legacy_thumbnail_url, media);
        const cleanDesc = rewriteHtml(r.clean_description, media);
        const htmlDesc = rewriteHtml(r.legacy_html_description, media);

        const subId = catBySlug.get(r.sub_category);
        if (!subId) {
          failedRows++;
          const k = 'missing-canonical-subcategory:' + r.sub_category;
          warningCounter.set(k, (warningCounter.get(k) ?? 0) + 1);
          continue;
        }

        const up = await client.query(
          `INSERT INTO public.products (
            sku, name, slug, category, sub_category,
            price, price_per_carat, compare_price, currency,
            carat_weight, ratti_weight, shape,
            short_desc, description, clean_description, legacy_html_description,
            images, thumbnail_url, video_url,
            in_stock, stock_status, stock_quantity, manual_reserve_enabled, reservation_note,
            meta_title, meta_description, meta_keywords, canonical_url, seo_data, legacy_seo,
            quality_label, color_description, clarity_description, treatment_summary,
            origin_country, origin_region, origin_display, dimensions_mm, composition,
            recommendation_category_code,
            certificate_number, certificate_lab, certificate_status, certificate_file_url,
            product_type, price_mode, availability_status,
            configurator_enabled,
            legacy_woo_id, legacy_sku, legacy_slug, legacy_permalink, legacy_status, legacy_created_at,
            import_batch_id, import_warnings, legacy_data
          ) VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,$8,COALESCE($9,'INR'),
            $10,$11,$12,
            $13,$14,$15,$16,
            $17::jsonb,$18,$19,
            $20,$21,$22,$23,$24,
            $25,$26,$27,$28,$29::jsonb,$30::jsonb,
            $31,$32,$33,$34,
            $35,$36,$37,$38::jsonb,$39,
            $40,
            $41,$42,$43,$44,
            $45,$46,$47,
            $48,
            $49,$50,$51,$52,$53,$54,
            $55,$56::jsonb,$57::jsonb
          )
          ON CONFLICT (legacy_woo_id) WHERE legacy_woo_id IS NOT NULL DO UPDATE SET
            sku=EXCLUDED.sku, name=EXCLUDED.name, slug=EXCLUDED.slug,
            category=EXCLUDED.category, sub_category=EXCLUDED.sub_category,
            price=EXCLUDED.price, price_per_carat=EXCLUDED.price_per_carat,
            compare_price=EXCLUDED.compare_price, currency=EXCLUDED.currency,
            carat_weight=EXCLUDED.carat_weight, ratti_weight=EXCLUDED.ratti_weight,
            shape=EXCLUDED.shape,
            short_desc=EXCLUDED.short_desc, description=EXCLUDED.description,
            clean_description=EXCLUDED.clean_description, legacy_html_description=EXCLUDED.legacy_html_description,
            images=EXCLUDED.images, thumbnail_url=EXCLUDED.thumbnail_url, video_url=EXCLUDED.video_url,
            in_stock=EXCLUDED.in_stock, stock_status=EXCLUDED.stock_status, stock_quantity=EXCLUDED.stock_quantity,
            manual_reserve_enabled=EXCLUDED.manual_reserve_enabled, reservation_note=EXCLUDED.reservation_note,
            meta_title=EXCLUDED.meta_title, meta_description=EXCLUDED.meta_description,
            meta_keywords=EXCLUDED.meta_keywords, canonical_url=EXCLUDED.canonical_url,
            seo_data=EXCLUDED.seo_data, legacy_seo=EXCLUDED.legacy_seo,
            quality_label=EXCLUDED.quality_label,
            color_description=EXCLUDED.color_description, clarity_description=EXCLUDED.clarity_description,
            treatment_summary=EXCLUDED.treatment_summary,
            origin_country=EXCLUDED.origin_country, origin_region=EXCLUDED.origin_region,
            origin_display=EXCLUDED.origin_display, dimensions_mm=EXCLUDED.dimensions_mm,
            composition=EXCLUDED.composition,
            recommendation_category_code=EXCLUDED.recommendation_category_code,
            certificate_number=EXCLUDED.certificate_number, certificate_lab=EXCLUDED.certificate_lab,
            certificate_status=EXCLUDED.certificate_status, certificate_file_url=EXCLUDED.certificate_file_url,
            product_type=EXCLUDED.product_type, price_mode=EXCLUDED.price_mode,
            availability_status=EXCLUDED.availability_status,
            configurator_enabled=EXCLUDED.configurator_enabled,
            legacy_sku=EXCLUDED.legacy_sku, legacy_slug=EXCLUDED.legacy_slug,
            legacy_permalink=EXCLUDED.legacy_permalink, legacy_status=EXCLUDED.legacy_status,
            legacy_created_at=EXCLUDED.legacy_created_at,
            import_batch_id=EXCLUDED.import_batch_id,
            import_warnings=EXCLUDED.import_warnings, legacy_data=EXCLUDED.legacy_data,
            updated_at=NOW()
          RETURNING id`,
          [
            r.sku ?? `LEGACY-${r.legacy_woo_id}`,
            r.name,
            (r.slug ?? '').slice(0, 120),
            r.category ?? 'navaratna',
            r.sub_category,
            r.price ?? 0,
            r.price_per_carat,
            r.compare_price,
            'INR',
            r.carat_weight,
            r.ratti_weight,
            r.shape,
            r.short_desc,
            r.clean_description ? String(r.clean_description).slice(0, 50000) : null,
            cleanDesc,
            htmlDesc,
            JSON.stringify(images),
            thumbnail_url,
            r.video_url ?? null,
            r.in_stock,
            r.stock_status === 'out_of_stock' || r.stock_status === 'outofstock'
              ? 'out_of_stock'
              : r.stock_status === 'on_backorder' || r.stock_status === 'onbackorder'
              ? 'on_backorder'
              : 'in_stock',
            r.in_stock ? 1 : 0,
            r.manual_reserve_enabled,
            r.reservation_note,
            r.meta_title,
            r.meta_description,
            r.meta_keywords ?? [],
            r.canonical_url,
            JSON.stringify(r.seo_data ?? {}),
            JSON.stringify(r.legacy_seo ?? {}),
            r.quality_label ? String(r.quality_label).slice(0, 120) : null,
            r.color_description,
            r.clarity_description,
            r.treatment_summary ? String(r.treatment_summary).slice(0, 120) : null,
            r.origin_country,
            r.origin_region ? String(r.origin_region).slice(0, 120) : null,
            r.origin_display,
            JSON.stringify(r.dimensions_mm ?? null),
            r.composition,
            r.recommendation_category_code,
            r.certificate_number ? String(r.certificate_number).slice(0, 120) : null,
            r.certificate_lab,
            r.certificate_status ?? 'not_required',
            r.certificate_file_url,
            r.product_type ?? 'gemstone',
            r.price_mode ?? 'fixed',
            r.price_mode === 'on_demand' ? 'on_demand' : (r.in_stock ? 'in_stock' : 'out_of_stock'),
            true,
            r.legacy_woo_id,
            r.legacy_sku,
            r.legacy_slug,
            r.legacy_permalink,
            r.legacy_status,
            r.legacy_created_at,
            batchId,
            JSON.stringify(r.warnings ?? []),
            JSON.stringify(r.legacy_data ?? {}),
          ],
        );
        const productId: string = up.rows[0].id;

        await client.query(`DELETE FROM public.product_category_assignments WHERE product_id=$1`, [productId]);
        await client.query(
          `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
             VALUES ($1, $2, TRUE, 0, NULL)`,
          [productId, subId],
        );
        await client.query(
          `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
             VALUES ($1, $2, FALSE, 1, NULL)
             ON CONFLICT (product_id, category_id) DO NOTHING`,
          [productId, parentId],
        );

        await client.query(
          `INSERT INTO public.product_option_rules (
             product_id, certificate_enabled, energization_enabled,
             jewelry_design_enabled, metal_enabled, ring_size_enabled,
             allowed_setting_types, allowed_ring_size_systems
           ) VALUES ($1, $2, TRUE, TRUE, TRUE, TRUE, $3::text[], $4::text[])
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
            Boolean(r.certificate_status && r.certificate_status !== 'not_required'),
            ['ring', 'pendant', 'bracelet', 'loose'],
            ['india', 'us', 'uk_au', 'eu'],
          ],
        );

        processedRows++;
        if (processedRows % 250 === 0) console.log(`  upserted ${processedRows}/${all.rows.length}`);
        await client.query('RELEASE SAVEPOINT row_sp');
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT row_sp').catch(() => {});
        failedRows++;
        const msg = err instanceof Error ? err.message : String(err);
        const k = 'product-error: ' + msg.slice(0, 80);
        warningCounter.set(k, (warningCounter.get(k) ?? 0) + 1);
        if (!firstErrorPrinted) {
          firstErrorPrinted = true;
          console.error(`\n  FIRST ERROR  legacy_woo_id=${r.legacy_woo_id} sub=${r.sub_category} sku=${r.sku} slug=${r.slug}`);
          console.error('  ' + (err instanceof Error ? (err.stack ?? err.message) : String(err)));
          console.error('');
        } else {
          console.error(`  ! legacy_woo_id=${r.legacy_woo_id}: ${msg}`);
        }
      }
    }

    console.log('\nWriting redirects...');
    const redirects = await client.query(`
      SELECT rc.legacy_woo_id, rc.legacy_path, rc.new_path, rc.source_label
      FROM legacy_import.stg_redirect_candidates rc
      ORDER BY rc.legacy_woo_id, rc.legacy_path`);
    const idByLegacy = new Map<number, string>();
    const idLookup = await client.query(`SELECT id, legacy_woo_id FROM public.products WHERE legacy_woo_id IS NOT NULL`);
    for (const row of idLookup.rows) idByLegacy.set(Number(row.legacy_woo_id), row.id);

    let redirectInserted = 0;
    for (const rd of redirects.rows) {
      const pid = idByLegacy.get(Number(rd.legacy_woo_id));
      if (!pid) continue;
      for (const host of ['https://www.purevedicgems.com', 'https://www.purevedicgems.in']) {
        const sourceUrl = host + rd.legacy_path;
        await client.query(
          `INSERT INTO public.product_redirect_sources (product_id, source_url, source_slug, http_status, source)
             VALUES ($1, $2, NULL, 301, 'woocommerce')
             ON CONFLICT (source_url) DO UPDATE SET
               product_id=EXCLUDED.product_id,
               http_status=EXCLUDED.http_status,
               source=EXCLUDED.source,
               is_active=TRUE`,
          [pid, sourceUrl],
        );
        redirectInserted++;
      }
    }
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
          phase: 'navratna-1',
          redirects_written: redirectInserted,
          warnings: Object.fromEntries(warningCounter),
        }),
      ],
    );

    if (mode.write) {
      await client.query('COMMIT');
      console.log(`\nCOMMITTED. Promoted ${processedRows} products, ${redirectInserted} redirects, batch ${batchId}.`);
    } else {
      await client.query('ROLLBACK');
      console.log(`\nROLLED BACK. Would have promoted ${processedRows} products, ${redirectInserted} redirects.`);
      console.log('Re-run with --write to commit.');
    }
    if (failedRows > 0) {
      console.log(`\n${failedRows} rows failed. Top reasons:`);
      const sorted = [...warningCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      for (const [code, n] of sorted) console.log(`  ${n}\t${code}`);
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
