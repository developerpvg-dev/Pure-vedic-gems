/**
 * navratna/05-dryrun.ts
 *
 * Produces a Markdown + JSON report describing exactly what 06-upsert WOULD
 * write into public.products if run today. Read-only against public.* —
 * works whether or not the canonical schema is present in the target DB.
 *
 * Output:
 *   - scripts/legacy-import/_reports/navratna-dryrun-<label>.md
 *   - scripts/legacy-import/_reports/navratna-dryrun-<label>.json
 *   - legacy_import.stg_dryrun_reports row (when --write)
 *
 * Sections:
 *   - Counts per sub_category (vs CSV expected — informational)
 *   - Media coverage: pending / ok / failed / unmapped
 *   - Warnings rolled up by code
 *   - Redirects: total + per-source-label
 *   - Diff against public.products (if table exists): new / updated / skipped
 *   - Sample rows (first 3 per sub_category)
 *
 * Usage:
 *   npx tsx scripts/legacy-import/navratna/05-dryrun.ts                   # writes report files
 *   npx tsx scripts/legacy-import/navratna/05-dryrun.ts --write           # also inserts stg_dryrun_reports row
 *   npx tsx scripts/legacy-import/navratna/05-dryrun.ts --label foo-1     # custom label
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));
import { parseRunMode } from '../lib/supabase.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

interface Flags { write: boolean; label: string }

function parseFlags(argv: string[]): Flags {
  const { write } = parseRunMode(argv.filter((a) => !a.startsWith('--label') && a !== '--label'));
  const li = argv.indexOf('--label');
  const label = li >= 0 && argv[li + 1] ? argv[li + 1] : new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return { write, label };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  console.log(`Label: ${flags.label}`);
  console.log(`Host:  ${dbHost}`);
  console.log(`Mode:  ${flags.write ? 'WRITE (also inserts stg_dryrun_reports)' : 'REPORT-ONLY'}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // 1. Counts by sub_category
    const subRows = await client.query(`
      SELECT sub_category, COUNT(*)::int n
      FROM legacy_import.stg_navratna_products
      GROUP BY 1 ORDER BY 2 DESC, 1`);
    const subCounts = subRows.rows;
    const totalProducts = subCounts.reduce((acc, r) => acc + r.n, 0);

    // 2. Quality label distribution
    const qualityRows = await client.query(`
      SELECT COALESCE(quality_label, '(none)') ql, COUNT(*)::int n
      FROM legacy_import.stg_navratna_products
      GROUP BY 1 ORDER BY 2 DESC, 1`);

    // 3. Stock status
    const stockRows = await client.query(`
      SELECT stock_status, COUNT(*)::int n
      FROM legacy_import.stg_navratna_products
      GROUP BY 1 ORDER BY 2 DESC, 1`);

    // 4. Pricing sanity
    const priceStats = await client.query(`
      SELECT
        COUNT(*)::int total,
        COUNT(*) FILTER (WHERE price IS NULL OR price = 0)::int missing_price,
        MIN(price)::float min_price,
        MAX(price)::float max_price,
        AVG(price)::float avg_price,
        COUNT(*) FILTER (WHERE compare_price IS NOT NULL AND compare_price > price)::int with_discount
      FROM legacy_import.stg_navratna_products`);

    // 5. Media coverage
    const mediaStats = await client.query(`
      SELECT download_status, COUNT(*)::int n
      FROM legacy_import.stg_media_url_map
      GROUP BY 1 ORDER BY 1`);
    const mediaTotal = mediaStats.rows.reduce((acc: number, r: { n: number }) => acc + r.n, 0);

    // 5b. Per-product media coverage: at least one image mapped, thumbnail mapped
    const productMedia = await client.query(`
      WITH attach_urls AS (
        SELECT post_id AS attachment_id,
               $1 || meta_value AS legacy_url
        FROM legacy_import.stg_wp_postmeta
        WHERE meta_key='_wp_attached_file'
      ),
      product_images AS (
        SELECT p.legacy_woo_id,
               (jsonb_array_elements_text(p.legacy_image_urls))::bigint AS attachment_id
        FROM legacy_import.stg_navratna_products p
        WHERE jsonb_array_length(p.legacy_image_urls) > 0
      )
      SELECT
        COUNT(DISTINCT p.legacy_woo_id)::int total_products,
        COUNT(DISTINCT p.legacy_woo_id) FILTER (WHERE m.download_status='ok')::int products_with_ok_image,
        COUNT(DISTINCT p.legacy_woo_id) FILTER (WHERE m.download_status='failed')::int products_with_failed_image,
        COUNT(DISTINCT p.legacy_woo_id) FILTER (WHERE m.legacy_url IS NULL)::int products_with_unmapped_attachment
      FROM legacy_import.stg_navratna_products p
      LEFT JOIN product_images pi ON pi.legacy_woo_id = p.legacy_woo_id
      LEFT JOIN attach_urls a ON a.attachment_id = pi.attachment_id
      LEFT JOIN legacy_import.stg_media_url_map m ON m.legacy_url = a.legacy_url`,
      [process.env.LEGACY_MEDIA_BASE_URL ?? 'https://www.purevedicgems.in/wp-content/uploads/']);

    // 6. Warning rollup
    const warnRollup = await client.query(`
      SELECT warning ->> 'code' AS code, COUNT(*)::int n
      FROM legacy_import.stg_navratna_products,
           jsonb_array_elements(warnings) AS warning
      GROUP BY 1 ORDER BY 2 DESC, 1`);

    const productsWithAnyWarn = await client.query(`
      SELECT COUNT(*)::int n FROM legacy_import.stg_navratna_products
      WHERE jsonb_array_length(warnings) > 0`);

    // 7. Redirect counts
    const redirectTotal = await client.query(`
      SELECT COUNT(*)::int n FROM legacy_import.stg_redirect_candidates`);
    const redirectBySource = await client.query(`
      SELECT source_label, COUNT(*)::int n
      FROM legacy_import.stg_redirect_candidates
      GROUP BY 1 ORDER BY 2 DESC, 1`);

    // 8. SKU uniqueness check
    const dupSku = await client.query(`
      SELECT sku, COUNT(*)::int n
      FROM legacy_import.stg_navratna_products
      GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY 2 DESC LIMIT 20`);
    const dupSlug = await client.query(`
      SELECT slug, COUNT(*)::int n
      FROM legacy_import.stg_navratna_products
      GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY 2 DESC LIMIT 20`);

    // 9. Diff against public.products (if exists)
    let diff: { exists: boolean; new_count?: number; update_count?: number; missing_in_staging?: number } = { exists: false };
    const hasProducts = await client.query(`
      SELECT COUNT(*)::int n FROM information_schema.tables
      WHERE table_schema='public' AND table_name='products'`);
    if (hasProducts.rows[0].n > 0) {
      const hasLegacyCol = await client.query(`
        SELECT COUNT(*)::int n FROM information_schema.columns
        WHERE table_schema='public' AND table_name='products' AND column_name='legacy_woo_id'`);
      if (hasLegacyCol.rows[0].n > 0) {
        const d = await client.query(`
          WITH stg AS (SELECT legacy_woo_id FROM legacy_import.stg_navratna_products),
               prod AS (SELECT legacy_woo_id FROM public.products WHERE legacy_woo_id IS NOT NULL)
          SELECT
            (SELECT COUNT(*)::int FROM stg WHERE legacy_woo_id NOT IN (SELECT legacy_woo_id FROM prod)) AS new_count,
            (SELECT COUNT(*)::int FROM stg WHERE legacy_woo_id IN (SELECT legacy_woo_id FROM prod)) AS update_count,
            (SELECT COUNT(*)::int FROM prod WHERE legacy_woo_id NOT IN (SELECT legacy_woo_id FROM stg)) AS missing_in_staging`);
        diff = { exists: true, ...d.rows[0] };
      }
    }

    // 10. Samples per sub_category
    const samples: Record<string, unknown[]> = {};
    for (const { sub_category } of subCounts) {
      const s = await client.query(`
        SELECT legacy_woo_id, sku, name, slug, price, compare_price, carat_weight, quality_label, in_stock,
               jsonb_array_length(legacy_image_urls) AS image_count,
               jsonb_array_length(warnings) AS warning_count
        FROM legacy_import.stg_navratna_products
        WHERE sub_category=$1
        ORDER BY price DESC NULLS LAST
        LIMIT 3`, [sub_category]);
      samples[sub_category] = s.rows;
    }

    // Build summary object
    const summary = {
      label: flags.label,
      generated_at: new Date().toISOString(),
      host: dbHost,
      totals: {
        products: totalProducts,
        redirects: redirectTotal.rows[0].n,
        media_total: mediaTotal,
        products_with_any_warning: productsWithAnyWarn.rows[0].n,
      },
      by_sub_category: subCounts,
      by_quality_label: qualityRows.rows,
      by_stock_status: stockRows.rows,
      price_stats: priceStats.rows[0],
      media: {
        url_map_status: mediaStats.rows,
        per_product_coverage: productMedia.rows[0],
      },
      warnings_by_code: warnRollup.rows,
      redirects_by_source: redirectBySource.rows,
      duplicates: {
        sku: dupSku.rows,
        slug: dupSlug.rows,
      },
      vs_canonical: diff,
      samples,
    };

    // Build Markdown
    const md = buildMarkdown(summary);

    // Write artifacts
    const reportsDir = resolve(here, '..', '_reports');
    mkdirSync(reportsDir, { recursive: true });
    const mdPath = resolve(reportsDir, `navratna-dryrun-${flags.label}.md`);
    const jsonPath = resolve(reportsDir, `navratna-dryrun-${flags.label}.json`);
    writeFileSync(mdPath, md, 'utf8');
    writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`Wrote ${mdPath}`);
    console.log(`Wrote ${jsonPath}\n`);

    // Persist to stg_dryrun_reports
    if (flags.write) {
      await client.query(
        `INSERT INTO legacy_import.stg_dryrun_reports (batch_label, phase, summary, warnings, errors)
           VALUES ($1, 'navratna', $2::jsonb, $3::jsonb, $4::jsonb)`,
        [
          flags.label,
          JSON.stringify(summary),
          JSON.stringify(warnRollup.rows),
          JSON.stringify(dupSku.rows.concat(dupSlug.rows)),
        ],
      );
      console.log('Inserted into legacy_import.stg_dryrun_reports.');
    } else {
      console.log('REPORT-ONLY mode. Pass --write to also insert stg_dryrun_reports row.');
    }

    // Print headline numbers
    console.log('\n--- Headline ---');
    console.log(`Products to promote:  ${totalProducts}`);
    console.log(`Redirects:            ${redirectTotal.rows[0].n}`);
    console.log(`Media OK:             ${mediaStats.rows.find((r) => r.download_status === 'ok')?.n ?? 0} / ${mediaTotal}`);
    console.log(`Products with images: ${productMedia.rows[0].products_with_ok_image}/${productMedia.rows[0].total_products}`);
    if (diff.exists) {
      console.log(`vs public.products:   new=${diff.new_count}  update=${diff.update_count}  orphaned-in-prod=${diff.missing_in_staging}`);
    } else {
      console.log('vs public.products:   N/A (canonical schema not present in target)');
    }
  } finally {
    await client.end();
  }
}

function buildMarkdown(s: ReturnType<typeof JSON.parse> | Record<string, unknown>): string {
  const sum = s as {
    label: string; generated_at: string; host: string;
    totals: { products: number; redirects: number; media_total: number; products_with_any_warning: number };
    by_sub_category: { sub_category: string; n: number }[];
    by_quality_label: { ql: string; n: number }[];
    by_stock_status: { stock_status: string; n: number }[];
    price_stats: { total: number; missing_price: number; min_price: number; max_price: number; avg_price: number; with_discount: number };
    media: {
      url_map_status: { download_status: string; n: number }[];
      per_product_coverage: { total_products: number; products_with_ok_image: number; products_with_failed_image: number; products_with_unmapped_attachment: number };
    };
    warnings_by_code: { code: string; n: number }[];
    redirects_by_source: { source_label: string; n: number }[];
    duplicates: { sku: { sku: string; n: number }[]; slug: { slug: string; n: number }[] };
    vs_canonical: { exists: boolean; new_count?: number; update_count?: number; missing_in_staging?: number };
    samples: Record<string, Array<Record<string, unknown>>>;
  };

  const lines: string[] = [];
  lines.push(`# Navratna Phase 1 — Dry-Run Report \`${sum.label}\``);
  lines.push('');
  lines.push(`- Generated: ${sum.generated_at}`);
  lines.push(`- Target DB host: \`${sum.host}\``);
  lines.push('');
  lines.push('## Headline');
  lines.push(`- **Products to promote:** ${sum.totals.products}`);
  lines.push(`- **Redirect rows:** ${sum.totals.redirects}`);
  lines.push(`- **Media url map total:** ${sum.totals.media_total}`);
  lines.push(`- **Products with at least one warning:** ${sum.totals.products_with_any_warning}`);
  lines.push('');
  lines.push('## Distribution');
  lines.push('### By sub_category');
  lines.push('| Sub-category | Count |');
  lines.push('|---|---:|');
  for (const r of sum.by_sub_category) lines.push(`| ${r.sub_category} | ${r.n} |`);
  lines.push('');
  lines.push('### By quality_label');
  lines.push('| Quality | Count |');
  lines.push('|---|---:|');
  for (const r of sum.by_quality_label) lines.push(`| ${r.ql} | ${r.n} |`);
  lines.push('');
  lines.push('### By stock_status');
  lines.push('| Status | Count |');
  lines.push('|---|---:|');
  for (const r of sum.by_stock_status) lines.push(`| ${r.stock_status} | ${r.n} |`);
  lines.push('');
  lines.push('## Pricing');
  const p = sum.price_stats;
  lines.push(`- Total rows: ${p.total}`);
  lines.push(`- Missing or zero price: **${p.missing_price}**`);
  lines.push(`- Min / avg / max: ${fmt(p.min_price)} / ${fmt(p.avg_price)} / ${fmt(p.max_price)}`);
  lines.push(`- Rows with discount (compare_price > price): ${p.with_discount}`);
  lines.push('');
  lines.push('## Media');
  lines.push('### URL map status');
  lines.push('| Status | Count |');
  lines.push('|---|---:|');
  for (const r of sum.media.url_map_status) lines.push(`| ${r.download_status} | ${r.n} |`);
  const c = sum.media.per_product_coverage;
  lines.push('');
  lines.push('### Per-product coverage');
  lines.push(`- Products with at least one OK image: **${c.products_with_ok_image} / ${c.total_products}**`);
  lines.push(`- Products with at least one failed image: ${c.products_with_failed_image}`);
  lines.push(`- Products with an unmapped attachment id: ${c.products_with_unmapped_attachment}`);
  lines.push('');
  lines.push('## Warnings (rollup)');
  if (sum.warnings_by_code.length === 0) {
    lines.push('_None._');
  } else {
    lines.push('| Code | Count |');
    lines.push('|---|---:|');
    for (const r of sum.warnings_by_code) lines.push(`| ${r.code} | ${r.n} |`);
  }
  lines.push('');
  lines.push('## Redirects');
  lines.push('| Source label | Count |');
  lines.push('|---|---:|');
  for (const r of sum.redirects_by_source) lines.push(`| ${r.source_label} | ${r.n} |`);
  lines.push('');
  lines.push('## Duplicates (top 20)');
  lines.push('### Duplicate SKUs');
  if (sum.duplicates.sku.length === 0) lines.push('_None._');
  else { lines.push('| SKU | Count |'); lines.push('|---|---:|'); for (const r of sum.duplicates.sku) lines.push(`| ${r.sku} | ${r.n} |`); }
  lines.push('');
  lines.push('### Duplicate slugs');
  if (sum.duplicates.slug.length === 0) lines.push('_None._');
  else { lines.push('| Slug | Count |'); lines.push('|---|---:|'); for (const r of sum.duplicates.slug) lines.push(`| ${r.slug} | ${r.n} |`); }
  lines.push('');
  lines.push('## Diff vs `public.products`');
  if (!sum.vs_canonical.exists) {
    lines.push('_Canonical `public.products` table not present in target DB — skipping diff._');
  } else {
    lines.push(`- Rows to **insert** (legacy_woo_id new): **${sum.vs_canonical.new_count}**`);
    lines.push(`- Rows to **update** (legacy_woo_id exists): ${sum.vs_canonical.update_count}`);
    lines.push(`- Rows in production not in staging (orphaned/removed): ${sum.vs_canonical.missing_in_staging}`);
  }
  lines.push('');
  lines.push('## Samples (top 3 by price per sub_category)');
  for (const sub of Object.keys(sum.samples)) {
    lines.push(`### ${sub}`);
    lines.push('| legacy_id | SKU | Name | Price | ct | Quality | Images | Warnings |');
    lines.push('|---|---|---|---:|---:|---|---:|---:|');
    for (const row of sum.samples[sub]) {
      const r = row as Record<string, unknown>;
      lines.push(`| ${r.legacy_woo_id} | ${r.sku ?? ''} | ${String(r.name ?? '').replace(/\|/g, '\\|').slice(0, 80)} | ${fmt(r.price)} | ${fmt(r.carat_weight)} | ${r.quality_label ?? ''} | ${r.image_count} | ${r.warning_count} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
