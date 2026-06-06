/**
 * rudraksha/07-verify.ts
 *
 * DB-side verification gates for the Rudraksha legacy migration.
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
  console.log(`Verifying Rudraksha migration on ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const results: GateResult[] = [];

  try {
    const rowParity = await client.query(`
      SELECT
        (SELECT count(*)::int FROM legacy_import.stg_rudraksha_products) AS staged,
        (SELECT count(*)::int
           FROM public.products p
           JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id) AS promoted,
        (SELECT count(*)::int
           FROM legacy_import.stg_rudraksha_products s
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
        JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id
        GROUP BY p.legacy_woo_id
        HAVING count(*) > 1
      ) rows`);
    results.push({ name: 'G2 no duplicate legacy_woo_id', pass: duplicates.rows[0].n === 0, detail: `duplicates=${duplicates.rows[0].n}` });

    const categories = await client.query(`
      SELECT
        (SELECT count(DISTINCT category_slug)::int FROM legacy_import.stg_rudraksha_categories) AS staged,
        (SELECT count(*)::int FROM public.gem_categories g JOIN legacy_import.stg_rudraksha_categories c ON c.category_slug=g.slug WHERE g.type='rudraksha' AND g.is_active) AS gem,
        (SELECT count(*)::int FROM public.product_categories pc JOIN legacy_import.stg_rudraksha_categories c ON c.category_slug=pc.slug WHERE pc.is_active) AS catalog`);
    results.push({
      name: 'G3 staged categories exist in admin/catalog',
      pass: categories.rows[0].staged === categories.rows[0].gem && categories.rows[0].staged === categories.rows[0].catalog,
      detail: `staged=${categories.rows[0].staged} gem=${categories.rows[0].gem} catalog=${categories.rows[0].catalog}`,
    });

    const media = await client.query(`
      SELECT
        count(*) filter (where p.thumbnail_url is null)::int AS missing_thumbnail,
        count(*) filter (where jsonb_array_length(p.images)=0)::int AS missing_images,
        count(*) filter (where p.thumbnail_url not like '%/storage/v1/object/public/%')::int AS non_storage_thumbnail
      FROM public.products p
      JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G4 every product has migrated media',
      pass: media.rows[0].missing_thumbnail === 0 && media.rows[0].missing_images === 0 && media.rows[0].non_storage_thumbnail === 0,
      detail: `missing_thumbnail=${media.rows[0].missing_thumbnail} missing_images=${media.rows[0].missing_images} non_storage_thumbnail=${media.rows[0].non_storage_thumbnail}`,
    });

    const assignments = await client.query(`
      SELECT
        (SELECT count(*)::int FROM legacy_import.stg_rudraksha_products) AS total,
        (SELECT count(DISTINCT pca.product_id)::int
           FROM public.product_category_assignments pca
           JOIN public.products p ON p.id=pca.product_id
           JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id
          WHERE pca.is_primary) AS with_primary,
        (SELECT count(*)::int FROM (
          SELECT pca.product_id
          FROM public.product_category_assignments pca
          JOIN public.products p ON p.id=pca.product_id
          JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id
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
        count(*) filter (where p.energization_eligible is not true)::int AS product_not_eligible
      FROM public.products p
      JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id
      LEFT JOIN public.product_option_rules r ON r.product_id=p.id`);
    results.push({
      name: 'G6 option rules and energization enabled',
      pass: options.rows[0].missing_rules === 0 && options.rows[0].energization_disabled === 0 && options.rows[0].product_not_eligible === 0,
      detail: `missing_rules=${options.rows[0].missing_rules} energization_disabled=${options.rows[0].energization_disabled} product_not_eligible=${options.rows[0].product_not_eligible}`,
    });

    const seo = await client.query(`
      SELECT
        count(*) filter (where p.meta_title is null or p.meta_title='')::int AS missing_title,
        count(*) filter (where p.meta_description is null or p.meta_description='')::int AS missing_desc,
        count(*) filter (where p.canonical_url is null or p.canonical_url='')::int AS missing_canonical
      FROM public.products p
      JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G7 SEO fields populated',
      pass: seo.rows[0].missing_title === 0 && seo.rows[0].missing_desc === 0 && seo.rows[0].missing_canonical === 0,
      detail: `missing_title=${seo.rows[0].missing_title} missing_desc=${seo.rows[0].missing_desc} missing_canonical=${seo.rows[0].missing_canonical}`,
    });

    const redirects = await client.query(`
      WITH expected AS (
        SELECT DISTINCT host || rc.legacy_path AS source_url
        FROM legacy_import.stg_rudraksha_redirect_candidates rc
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
      JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id
      WHERE p.clean_description ~* '(www\.)?purevedicgems\.(in|com)/wp-content/uploads/'`);
    results.push({
      name: 'G9 no legacy upload URLs in descriptions',
      pass: legacyUrls.rows[0].n === 0,
      detail: `rows_with_legacy_urls=${legacyUrls.rows[0].n}`,
    });

    const pricing = await client.query(`
      SELECT
        count(*) filter (where p.price_mode <> s.price_mode)::int AS mode_mismatch,
        count(*) filter (where s.price_mode='on_demand' and p.availability_status <> 'on_demand')::int AS on_demand_status_mismatch,
        count(*) filter (where s.price_mode='fixed' and p.price <= 0)::int AS fixed_without_price,
        count(*) filter (where s.stock_status='out_of_stock' and p.stock_status <> 'out_of_stock')::int AS stock_mismatch
      FROM public.products p
      JOIN legacy_import.stg_rudraksha_products s ON s.legacy_woo_id=p.legacy_woo_id`);
    results.push({
      name: 'G10 price mode and stock mappings preserved',
      pass: pricing.rows[0].mode_mismatch === 0 && pricing.rows[0].on_demand_status_mismatch === 0 && pricing.rows[0].fixed_without_price === 0 && pricing.rows[0].stock_mismatch === 0,
      detail: `mode_mismatch=${pricing.rows[0].mode_mismatch} on_demand_status_mismatch=${pricing.rows[0].on_demand_status_mismatch} fixed_without_price=${pricing.rows[0].fixed_without_price} stock_mismatch=${pricing.rows[0].stock_mismatch}`,
    });

    let passed = 0;
    let failed = 0;
    for (const result of results) {
      console.log(`${result.pass ? '[PASS]' : '[FAIL]'} ${result.name}`);
      console.log(`       ${result.detail}`);
      if (result.pass) passed++;
      else failed++;
    }
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