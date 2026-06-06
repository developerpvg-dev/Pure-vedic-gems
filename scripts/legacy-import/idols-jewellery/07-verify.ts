/**
 * idols-jewellery/07-verify.ts
 *
 * DB-side verification gates for the SPIRITUAL IDOLS + JEWELLERY migration.
 * Scoped to legacy_import.stg_idols_jewellery_products and the mapped legacy
 * product_cat leaf terms. All gates must pass for a zero-mismatch migration.
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

// Legacy product_cat leaf term ids that define the migration scope.
const MAPPED_TERM_IDS = [285, 222, 220, 275, 276, 277, 286, 185, 183, 184, 278, 279];

type GateResult = { name: string; pass: boolean; detail: string };

async function main() {
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  console.log(`Verifying idols/jewellery migration on ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const results: GateResult[] = [];

  try {
    const rowParity = await client.query(`
      SELECT
        (SELECT count(*)::int FROM legacy_import.stg_idols_jewellery_products) AS staged,
        (SELECT count(*)::int
           FROM public.products p
           JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id) AS promoted,
        (SELECT count(*)::int
           FROM legacy_import.stg_idols_jewellery_products s
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
        JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
        GROUP BY p.legacy_woo_id HAVING count(*) > 1
      ) rows`);
    results.push({ name: 'G2 no duplicate legacy_woo_id', pass: duplicates.rows[0].n === 0, detail: `duplicates=${duplicates.rows[0].n}` });

    const cats = await client.query(`
      SELECT
        count(*) filter (where s.primary_category_id is null)::int AS missing_primary,
        count(*) filter (where pc.id is null)::int AS primary_not_in_catalog,
        count(*) filter (where s.parent_category_id is not null and pp.id is null)::int AS parent_not_in_catalog
      FROM legacy_import.stg_idols_jewellery_products s
      LEFT JOIN public.product_categories pc ON pc.id=s.primary_category_id AND pc.is_active
      LEFT JOIN public.product_categories pp ON pp.id=s.parent_category_id AND pp.is_active`);
    results.push({
      name: 'G3 resolved categories exist in catalog',
      pass: cats.rows[0].missing_primary === 0 && cats.rows[0].primary_not_in_catalog === 0 && cats.rows[0].parent_not_in_catalog === 0,
      detail: JSON.stringify(cats.rows[0]),
    });

    const media = await client.query(`
      WITH expected_images AS (
        SELECT
          s.legacy_woo_id,
          count(DISTINCT m.public_url) FILTER (WHERE m.public_url IS NOT NULL)::int AS expected_public_images,
          count(*) FILTER (WHERE m.public_url IS NULL)::int AS missing_mapped_images
        FROM legacy_import.stg_idols_jewellery_products s
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
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
      JOIN expected_images e ON e.legacy_woo_id=s.legacy_woo_id`);
    results.push({
      name: 'G4 media migrated with image-count parity',
      pass: media.rows[0].missing_thumbnail === 0 && media.rows[0].missing_images === 0 && media.rows[0].image_count_mismatch === 0 && media.rows[0].missing_mapped_images === 0 && media.rows[0].non_storage_thumbnail === 0 && media.rows[0].non_storage_images === 0,
      detail: JSON.stringify(media.rows[0]),
    });

    const assignments = await client.query(`
      SELECT
        (SELECT count(*)::int FROM legacy_import.stg_idols_jewellery_products) AS total,
        (SELECT count(DISTINCT pca.product_id)::int
           FROM public.product_category_assignments pca
           JOIN public.products p ON p.id=pca.product_id
           JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
          WHERE pca.is_primary) AS with_primary,
        (SELECT count(*)::int FROM (
          SELECT pca.product_id
          FROM public.product_category_assignments pca
          JOIN public.products p ON p.id=pca.product_id
          JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
          WHERE pca.is_primary
          GROUP BY pca.product_id HAVING count(*) > 1
        ) rows) AS multi_primary,
        (SELECT count(*)::int
           FROM public.product_category_assignments pca
           JOIN public.products p ON p.id=pca.product_id
           JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
          WHERE pca.is_primary AND pca.category_id <> s.primary_category_id) AS wrong_primary`);
    results.push({
      name: 'G5 exactly one primary assignment (correct leaf)',
      pass: assignments.rows[0].total === assignments.rows[0].with_primary && assignments.rows[0].multi_primary === 0 && assignments.rows[0].wrong_primary === 0,
      detail: JSON.stringify(assignments.rows[0]),
    });

    const options = await client.query(`
      SELECT
        count(*) filter (where r.product_id is null)::int AS missing_rules,
        count(*) filter (where p.configurator_enabled is not false)::int AS configurator_enabled,
        count(*) filter (where r.jewelry_design_enabled is not false or r.metal_enabled is not false or r.ring_size_enabled is not false or r.certificate_enabled is not false)::int AS unexpected_options,
        count(*) filter (where r.energization_enabled is distinct from s.energization_eligible)::int AS energization_mismatch
      FROM public.products p
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
      LEFT JOIN public.product_option_rules r ON r.product_id=p.id`);
    results.push({
      name: 'G6 option rules (no configurator, energization matches)',
      pass: options.rows[0].missing_rules === 0 && options.rows[0].configurator_enabled === 0 && options.rows[0].unexpected_options === 0 && options.rows[0].energization_mismatch === 0,
      detail: JSON.stringify(options.rows[0]),
    });

    const seo = await client.query(`
      SELECT
        count(*) filter (where p.meta_title is null or p.meta_title='')::int AS missing_title,
        count(*) filter (where p.meta_description is null or p.meta_description='')::int AS missing_desc,
        count(*) filter (where p.canonical_url is null or p.canonical_url='')::int AS missing_canonical,
        count(*) filter (where p.product_type='idol' and p.canonical_url !~ '/shop/idols/')::int AS idol_bad_canonical,
        count(*) filter (where p.category='jewelry' and p.canonical_url !~ '/shop/jewelry/')::int AS jewelry_bad_canonical,
        count(*) filter (where p.category='mala' and p.canonical_url !~ '/shop/malas/')::int AS mala_bad_canonical,
        count(*) filter (where p.category='rudraksha' and p.canonical_url !~ '/shop/rudraksha/')::int AS rudraksha_bad_canonical
      FROM public.products p
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G7 SEO fields populated + canonical group correct',
      pass: Object.values(seo.rows[0]).every((value) => Number(value) === 0),
      detail: JSON.stringify(seo.rows[0]),
    });

    const redirects = await client.query(`
      WITH expected AS (
        SELECT DISTINCT host || rc.legacy_path AS source_url
        FROM legacy_import.stg_idols_jewellery_redirect_candidates rc
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
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
      WHERE p.clean_description ~* '(www\\.)?purevedicgems\\.(in|com)/wp-content/uploads/'`);
    results.push({ name: 'G9 no legacy upload URLs in descriptions', pass: legacyUrls.rows[0].n === 0, detail: `rows_with_legacy_urls=${legacyUrls.rows[0].n}` });

    const pricing = await client.query(`
      SELECT
        count(*) filter (where p.price_mode <> s.price_mode)::int AS mode_mismatch,
        count(*) filter (where s.price_mode in ('on_demand','quote_required') and p.availability_status <> 'on_demand')::int AS on_demand_status_mismatch,
        count(*) filter (where s.price_mode not in ('on_demand','quote_required') and coalesce(s.price,0) > 0 and p.price <= 0)::int AS priced_without_price,
        count(*) filter (where s.stock_status='out_of_stock' and p.stock_status <> 'out_of_stock')::int AS stock_mismatch
      FROM public.products p
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G10 price mode and stock mappings preserved',
      pass: Object.values(pricing.rows[0]).every((value) => Number(value) === 0),
      detail: JSON.stringify(pricing.rows[0]),
    });

    const fieldParity = await client.query(`
      SELECT
        count(*) filter (where p.sku is distinct from s.sku)::int AS sku_mismatch,
        count(*) filter (where p.name is distinct from s.name)::int AS name_mismatch,
        count(*) filter (where p.slug is distinct from s.slug)::int AS slug_mismatch,
        count(*) filter (where p.category is distinct from s.category)::int AS category_mismatch,
        count(*) filter (where p.sub_category is distinct from s.sub_category)::int AS sub_category_mismatch,
        count(*) filter (where p.product_type is distinct from s.product_type)::int AS type_mismatch,
        count(*) filter (where p.canonical_url is distinct from s.canonical_url)::int AS canonical_mismatch,
        count(*) filter (where p.meta_title is distinct from s.meta_title)::int AS meta_title_mismatch,
        count(*) filter (where p.price is distinct from coalesce(s.price,0))::int AS price_mismatch,
        count(*) filter (where p.video_url is distinct from s.video_url)::int AS video_mismatch
      FROM public.products p
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G11 key field parity',
      pass: Object.values(fieldParity.rows[0]).every((value) => Number(value) === 0),
      detail: JSON.stringify(fieldParity.rows[0]),
    });

    const scope = await client.query(`
      WITH mapped_tax AS (
        SELECT term_taxonomy_id FROM legacy_import.stg_wp_term_taxonomy
         WHERE taxonomy='product_cat' AND term_id = ANY($1::bigint[])
      ), legacy_pub AS (
        SELECT DISTINCT p.id
        FROM legacy_import.stg_wp_posts p
        JOIN legacy_import.stg_wp_term_relationships tr ON tr.object_id=p.id
        JOIN mapped_tax mt ON mt.term_taxonomy_id=tr.term_taxonomy_id
        WHERE p.post_type='product' AND p.post_status='publish'
      )
      SELECT
        (SELECT count(*)::int FROM legacy_pub) AS legacy_published,
        (SELECT count(*)::int FROM legacy_pub lp
          WHERE NOT EXISTS (SELECT 1 FROM public.products pr WHERE pr.legacy_woo_id=lp.id)) AS still_unmigrated`,
      [MAPPED_TERM_IDS]);
    results.push({
      name: 'G12 zero published idol/jewellery legacy products left unmigrated',
      pass: scope.rows[0].still_unmigrated === 0,
      detail: `legacy_published=${scope.rows[0].legacy_published} still_unmigrated=${scope.rows[0].still_unmigrated}`,
    });

    const visibility = await client.query(`
      SELECT count(*)::int AS not_listable
      FROM public.products p
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
      WHERE p.is_active IS NOT TRUE`);
    results.push({
      name: 'G13 all promoted products active (listable)',
      pass: visibility.rows[0].not_listable === 0,
      detail: `inactive=${visibility.rows[0].not_listable}`,
    });

    const breakdown = await client.query(`
      SELECT p.product_type, p.category, p.sub_category, count(*)::int AS n
      FROM public.products p
      JOIN legacy_import.stg_idols_jewellery_products s ON s.legacy_woo_id=p.legacy_woo_id
      GROUP BY p.product_type, p.category, p.sub_category
      ORDER BY p.category, p.sub_category`);

    let passed = 0;
    let failed = 0;
    for (const result of results) {
      console.log(`${result.pass ? '[PASS]' : '[FAIL]'} ${result.name}`);
      console.log(`       ${result.detail}`);
      if (result.pass) passed++;
      else failed++;
    }
    console.log('\nPer-category breakdown of promoted idol/jewellery products:');
    for (const row of breakdown.rows) console.log(`  ${String(row.product_type).padEnd(8)} ${row.category}/${row.sub_category}: ${row.n}`);
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
