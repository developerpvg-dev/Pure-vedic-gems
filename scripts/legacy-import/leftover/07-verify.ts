/**
 * leftover/07-verify.ts
 *
 * DB-side verification gates for the leftover (un-migrated-published) migration.
 * Family-aware: gemstone (upratna/navaratna) and rudraksha rows have different
 * canonical/option-rule conventions. Media gate compares DISTINCT public_url
 * counts against a shared bucket (no storage-prefix filter).
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

type GateResult = { name: string; pass: boolean; detail: string };

async function main() {
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  console.log(`Verifying leftover migration on ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const results: GateResult[] = [];

  try {
    const rowParity = await client.query(`
      SELECT
        (SELECT count(*)::int FROM legacy_import.stg_leftover_products) AS staged,
        (SELECT count(*)::int
           FROM public.products p
           JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id) AS promoted,
        (SELECT count(*)::int
           FROM legacy_import.stg_leftover_products s
          WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.legacy_woo_id=s.legacy_woo_id)) AS missing`);
    results.push({
      name: 'G1 row count parity',
      pass: rowParity.rows[0].missing === 0 && rowParity.rows[0].staged === rowParity.rows[0].promoted,
      detail: `staged=${rowParity.rows[0].staged} promoted=${rowParity.rows[0].promoted} missing=${rowParity.rows[0].missing}`,
    });

    const duplicates = await client.query(`
      SELECT count(*)::int AS n FROM (
        SELECT p.legacy_woo_id
        FROM public.products p
        JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
        GROUP BY p.legacy_woo_id
        HAVING count(*) > 1
      ) rows`);
    results.push({ name: 'G2 no duplicate legacy_woo_id', pass: duplicates.rows[0].n === 0, detail: `duplicates=${duplicates.rows[0].n}` });

    const categories = await client.query(`
      SELECT
        (SELECT count(DISTINCT sub_category)::int FROM legacy_import.stg_leftover_products) AS staged,
        (SELECT count(DISTINCT s.sub_category)::int
           FROM legacy_import.stg_leftover_products s
           JOIN public.product_categories pc ON pc.slug=s.sub_category AND pc.is_active) AS catalog`);
    results.push({
      name: 'G3 staged sub-categories exist in catalog',
      pass: categories.rows[0].staged === categories.rows[0].catalog,
      detail: `staged=${categories.rows[0].staged} catalog=${categories.rows[0].catalog}`,
    });

    const media = await client.query(`
      WITH expected_images AS (
        SELECT
          s.legacy_woo_id,
          count(DISTINCT m.public_url) FILTER (WHERE m.public_url IS NOT NULL)::int AS expected_public_images,
          count(*) FILTER (WHERE m.public_url IS NULL)::int AS missing_mapped_images
        FROM legacy_import.stg_leftover_products s
        LEFT JOIN LATERAL jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(s.legacy_image_urls)='array' THEN s.legacy_image_urls ELSE '[]'::jsonb END
        ) images(attachment_id) ON TRUE
        LEFT JOIN legacy_import.stg_media_url_map m
          ON m.legacy_attachment_id = images.attachment_id::bigint
         AND m.download_status='ok'
        GROUP BY s.legacy_woo_id
      )
      SELECT
        count(*) filter (where p.thumbnail_url is null)::int AS missing_thumbnail,
        count(*) filter (where jsonb_array_length(p.images)=0)::int AS missing_images,
        count(*) filter (where jsonb_array_length(p.images) <> e.expected_public_images)::int AS image_count_mismatch,
        count(*) filter (where e.missing_mapped_images > 0)::int AS missing_mapped_images,
        count(*) filter (where p.thumbnail_url not like '%/storage/v1/object/public/%')::int AS non_storage_thumbnail,
        count(*) filter (where exists (select 1 from jsonb_array_elements_text(p.images) img where img not like '%/storage/v1/object/public/%'))::int AS non_storage_images
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
      JOIN expected_images e ON e.legacy_woo_id=s.legacy_woo_id`);
    results.push({
      name: 'G4 media migrated with image-count parity',
      pass: media.rows[0].missing_thumbnail === 0 && media.rows[0].missing_images === 0 && media.rows[0].image_count_mismatch === 0 && media.rows[0].missing_mapped_images === 0 && media.rows[0].non_storage_thumbnail === 0 && media.rows[0].non_storage_images === 0,
      detail: `missing_thumbnail=${media.rows[0].missing_thumbnail} missing_images=${media.rows[0].missing_images} image_count_mismatch=${media.rows[0].image_count_mismatch} missing_mapped_images=${media.rows[0].missing_mapped_images} non_storage_thumbnail=${media.rows[0].non_storage_thumbnail} non_storage_images=${media.rows[0].non_storage_images}`,
    });

    const assignments = await client.query(`
      SELECT
        (SELECT count(*)::int FROM legacy_import.stg_leftover_products) AS total,
        (SELECT count(DISTINCT pca.product_id)::int
           FROM public.product_category_assignments pca
           JOIN public.products p ON p.id=pca.product_id
           JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
          WHERE pca.is_primary) AS with_primary,
        (SELECT count(*)::int FROM (
          SELECT pca.product_id
          FROM public.product_category_assignments pca
          JOIN public.products p ON p.id=pca.product_id
          JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
          WHERE pca.is_primary
          GROUP BY pca.product_id HAVING count(*) > 1
        ) rows) AS multi_primary`);
    results.push({
      name: 'G5 exactly one primary category assignment',
      pass: assignments.rows[0].total === assignments.rows[0].with_primary && assignments.rows[0].multi_primary === 0,
      detail: `total=${assignments.rows[0].total} with_primary=${assignments.rows[0].with_primary} multi_primary=${assignments.rows[0].multi_primary}`,
    });

    const options = await client.query(`
      SELECT
        count(*) filter (where r.product_id is null)::int AS missing_rules,
        count(*) filter (where r.energization_enabled is not true)::int AS energization_disabled,
        -- gemstone: configurator + jewelry_design TRUE; rudraksha: both FALSE
        count(*) filter (where s.family='gemstone' and (p.configurator_enabled is not true or r.jewelry_design_enabled is not true or r.metal_enabled is not true or r.ring_size_enabled is not true))::int AS gemstone_rules_wrong,
        count(*) filter (where s.family='rudraksha' and (p.configurator_enabled is not false or r.jewelry_design_enabled is not false or r.metal_enabled is not false or r.ring_size_enabled is not false))::int AS rudraksha_rules_wrong,
        count(*) filter (where s.family='rudraksha' and r.allowed_setting_types <> ARRAY['loose']::text[])::int AS rudraksha_setting_wrong,
        count(*) filter (where s.family='gemstone' and r.allowed_setting_types <> ARRAY['ring','pendant','bracelet','loose']::text[])::int AS gemstone_setting_wrong
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
      LEFT JOIN public.product_option_rules r ON r.product_id=p.id`);
    results.push({
      name: 'G6 option rules per family',
      pass: options.rows[0].missing_rules === 0 && options.rows[0].energization_disabled === 0 && options.rows[0].gemstone_rules_wrong === 0 && options.rows[0].rudraksha_rules_wrong === 0 && options.rows[0].rudraksha_setting_wrong === 0 && options.rows[0].gemstone_setting_wrong === 0,
      detail: JSON.stringify(options.rows[0]),
    });

    const seo = await client.query(`
      SELECT
        count(*) filter (where p.meta_title is null or p.meta_title='')::int AS missing_title,
        count(*) filter (where p.meta_description is null or p.meta_description='')::int AS missing_desc,
        count(*) filter (where p.canonical_url is null or p.canonical_url='')::int AS missing_canonical,
        count(*) filter (where s.family='rudraksha' and p.canonical_url !~ '/shop/rudraksha/')::int AS rudraksha_bad_canonical,
        count(*) filter (where s.family='gemstone' and p.canonical_url !~ '/shop/')::int AS gemstone_bad_canonical
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G7 SEO fields populated',
      pass: seo.rows[0].missing_title === 0 && seo.rows[0].missing_desc === 0 && seo.rows[0].missing_canonical === 0 && seo.rows[0].rudraksha_bad_canonical === 0 && seo.rows[0].gemstone_bad_canonical === 0,
      detail: JSON.stringify(seo.rows[0]),
    });

    const redirects = await client.query(`
      WITH expected AS (
        SELECT DISTINCT host || rc.legacy_path AS source_url
        FROM legacy_import.stg_leftover_redirect_candidates rc
        CROSS JOIN (VALUES ('https://www.purevedicgems.com'), ('https://www.purevedicgems.in')) hosts(host)
      )
      SELECT
        (SELECT count(*)::int FROM expected) AS expected,
        (SELECT count(*)::int FROM public.product_redirect_sources prs JOIN expected e ON e.source_url=prs.source_url WHERE prs.is_active) AS materialised,
        (SELECT count(*)::int FROM public.product_redirect_sources prs JOIN expected e ON e.source_url=prs.source_url WHERE prs.product_id IS NULL) AS orphan`);
    results.push({
      name: 'G8 redirects materialised',
      pass: redirects.rows[0].expected === redirects.rows[0].materialised && redirects.rows[0].orphan === 0,
      detail: `expected=${redirects.rows[0].expected} materialised=${redirects.rows[0].materialised} orphan=${redirects.rows[0].orphan}`,
    });

    const legacyUrls = await client.query(`
      SELECT count(*)::int AS n
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
      WHERE p.clean_description ~* '(www\\.)?purevedicgems\\.(in|com)/wp-content/uploads/'`);
    results.push({ name: 'G9 no legacy upload URLs in descriptions', pass: legacyUrls.rows[0].n === 0, detail: `rows_with_legacy_urls=${legacyUrls.rows[0].n}` });

    const pricing = await client.query(`
      SELECT
        count(*) filter (where p.price_mode <> s.price_mode)::int AS mode_mismatch,
        count(*) filter (where s.price_mode in ('on_demand','quote_required') and p.availability_status <> 'on_demand')::int AS on_demand_status_mismatch,
        count(*) filter (where s.price_mode not in ('on_demand','quote_required') and coalesce(s.price,0) > 0 and p.price <= 0)::int AS priced_without_price,
        count(*) filter (where s.stock_status='out_of_stock' and p.stock_status <> 'out_of_stock')::int AS stock_mismatch
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G10 price mode and stock mappings preserved',
      pass: pricing.rows[0].mode_mismatch === 0 && pricing.rows[0].on_demand_status_mismatch === 0 && pricing.rows[0].priced_without_price === 0 && pricing.rows[0].stock_mismatch === 0,
      detail: JSON.stringify(pricing.rows[0]),
    });

    const fieldParity = await client.query(`
      SELECT
        count(*) filter (where p.sku is distinct from s.sku)::int AS sku_mismatch,
        count(*) filter (where p.name is distinct from s.name)::int AS name_mismatch,
        count(*) filter (where p.slug is distinct from s.slug)::int AS slug_mismatch,
        count(*) filter (where p.category is distinct from s.category)::int AS category_mismatch,
        count(*) filter (where p.sub_category is distinct from s.sub_category)::int AS sub_category_mismatch,
        count(*) filter (where p.canonical_url is distinct from s.canonical_url)::int AS canonical_mismatch,
        count(*) filter (where p.meta_title is distinct from s.meta_title)::int AS meta_title_mismatch,
        count(*) filter (where p.carat_weight is distinct from s.carat_weight)::int AS carat_mismatch,
        count(*) filter (where p.ratti_weight is distinct from s.ratti_weight)::int AS ratti_mismatch,
        count(*) filter (where p.bead_weight is distinct from round(s.bead_weight, 2))::int AS bead_mismatch,
        count(*) filter (where p.mukhi_count is distinct from s.mukhi_count)::int AS mukhi_mismatch,
        count(*) filter (where p.price is distinct from coalesce(s.price,0))::int AS price_mismatch,
        count(*) filter (where p.video_url is distinct from s.video_url)::int AS video_mismatch
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    const parityValues = Object.values(fieldParity.rows[0]).map((value) => Number(value));
    results.push({
      name: 'G11 key field parity',
      pass: parityValues.every((value) => value === 0),
      detail: JSON.stringify(fieldParity.rows[0]),
    });

    const totals = await client.query(`
      SELECT
        (SELECT count(*)::int FROM public.products WHERE legacy_woo_id IS NOT NULL) AS migrated_total,
        (SELECT count(*)::int FROM legacy_import.stg_wp_posts WHERE post_type='product' AND post_status='publish') AS legacy_published,
        (SELECT count(*)::int FROM legacy_import.stg_wp_posts wp
           WHERE wp.post_type='product' AND wp.post_status='publish'
             AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.legacy_woo_id=wp.id)) AS still_unmigrated`);
    results.push({
      name: 'G12 zero published legacy products left unmigrated',
      pass: totals.rows[0].still_unmigrated === 0,
      detail: `migrated_total=${totals.rows[0].migrated_total} legacy_published=${totals.rows[0].legacy_published} still_unmigrated=${totals.rows[0].still_unmigrated}`,
    });

    const breakdown = await client.query(`
      SELECT s.family, p.category, p.sub_category, count(*)::int AS n
      FROM public.products p
      JOIN legacy_import.stg_leftover_products s ON s.legacy_woo_id=p.legacy_woo_id
      GROUP BY s.family, p.category, p.sub_category
      ORDER BY p.category, p.sub_category`);

    let passed = 0;
    let failed = 0;
    for (const result of results) {
      console.log(`${result.pass ? '[PASS]' : '[FAIL]'} ${result.name}`);
      console.log(`       ${result.detail}`);
      if (result.pass) passed++;
      else failed++;
    }
    console.log('\nPer-category breakdown of promoted leftover products:');
    for (const row of breakdown.rows) console.log(`  ${row.family.padEnd(10)} ${row.category}/${row.sub_category}: ${row.n}`);
    console.log(`\n${passed} passed, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
