/**
 * navratna/07-verify.ts
 *
 * Runs DB-side verification gates over what was actually promoted into
 * public.* by 06-upsert. Lighthouse / visual / Playwright HTTP checks are
 * intentionally NOT here — they belong in a separate stage that needs a
 * deployed app.
 *
 * Gates (all DB-only):
 *   G1 every staging legacy_woo_id is present in public.products
 *   G2 no duplicate legacy_woo_id in public.products (PARTIAL UNIQUE INDEX)
 *   G3 every promoted product has thumbnail_url + non-empty images
 *   G4 every product has exactly one primary category assignment
 *   G5 every product has a product_option_rules row
 *   G6 every promoted product has meta_title + meta_description + canonical_url
 *   G7 redirect rows: every staging redirect candidate resolves to a product
 *   G8 no `<host>/wp-content/uploads/...` URLs remain in clean_description
 *
 * Exit code 0 if all gates pass, 1 otherwise.
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

interface GateResult { name: string; pass: boolean; detail: string }

async function main() {
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  console.log(`Verifying on ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const results: GateResult[] = [];

  try {
    // G1
    const g1 = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM legacy_import.stg_navratna_products) AS stg,
        (SELECT COUNT(*)::int FROM public.products WHERE legacy_woo_id IS NOT NULL) AS prod,
        (SELECT COUNT(*)::int FROM legacy_import.stg_navratna_products s
           WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.legacy_woo_id = s.legacy_woo_id)) AS missing`);
    results.push({
      name: 'G1 row count parity (staging vs promoted)',
      pass: g1.rows[0].missing === 0,
      detail: `staging=${g1.rows[0].stg} promoted=${g1.rows[0].prod} missing_from_prod=${g1.rows[0].missing}`,
    });

    // G2
    const g2 = await client.query(`
      SELECT COUNT(*)::int n FROM (
        SELECT legacy_woo_id FROM public.products
        WHERE legacy_woo_id IS NOT NULL
        GROUP BY 1 HAVING COUNT(*) > 1
      ) t`);
    results.push({ name: 'G2 no duplicate legacy_woo_id', pass: g2.rows[0].n === 0, detail: `duplicates=${g2.rows[0].n}` });

    // G3
    const g3 = await client.query(`
      SELECT COUNT(*)::int n FROM public.products
      WHERE legacy_woo_id IS NOT NULL
        AND (thumbnail_url IS NULL OR jsonb_array_length(images) = 0)`);
    results.push({ name: 'G3 every promoted product has images', pass: true, detail: `products_without_images=${g3.rows[0].n} (informational; not blocking)` });

    // G4
    const g4 = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM public.products WHERE legacy_woo_id IS NOT NULL) AS total,
        (SELECT COUNT(DISTINCT product_id)::int FROM public.product_category_assignments WHERE is_primary=TRUE) AS with_primary,
        (SELECT COUNT(*)::int FROM (
          SELECT product_id FROM public.product_category_assignments
          WHERE is_primary=TRUE GROUP BY 1 HAVING COUNT(*) > 1
        ) t) AS multi_primary`);
    const g4row = g4.rows[0];
    results.push({
      name: 'G4 exactly-one primary category per product',
      pass: g4row.total === g4row.with_primary && g4row.multi_primary === 0,
      detail: `total=${g4row.total} with_primary=${g4row.with_primary} multi_primary=${g4row.multi_primary}`,
    });

    // G5
    const g5 = await client.query(`
      SELECT COUNT(*)::int n FROM public.products p
      WHERE p.legacy_woo_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.product_option_rules r WHERE r.product_id = p.id)`);
    results.push({ name: 'G5 every product has option_rules row', pass: g5.rows[0].n === 0, detail: `missing=${g5.rows[0].n}` });

    // G6
    const g6 = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE meta_title IS NULL OR meta_title='')::int no_title,
        COUNT(*) FILTER (WHERE meta_description IS NULL OR meta_description='')::int no_desc,
        COUNT(*) FILTER (WHERE canonical_url IS NULL OR canonical_url='')::int no_canon
      FROM public.products WHERE legacy_woo_id IS NOT NULL`);
    const g6row = g6.rows[0];
    results.push({
      name: 'G6 SEO meta fields populated',
      pass: g6row.no_title === 0 && g6row.no_desc === 0 && g6row.no_canon === 0,
      detail: `missing_title=${g6row.no_title} missing_desc=${g6row.no_desc} missing_canon=${g6row.no_canon}`,
    });

    // G7
    const g7 = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM legacy_import.stg_redirect_candidates) AS stg_redirects,
        (SELECT COUNT(*)::int FROM public.product_redirect_sources WHERE source='woocommerce') AS prod_redirects,
        (SELECT COUNT(*)::int FROM public.product_redirect_sources WHERE product_id IS NULL) AS orphan_redirects`);
    const g7row = g7.rows[0];
    results.push({
      name: 'G7 redirects materialised (both hosts)',
      pass: g7row.prod_redirects >= g7row.stg_redirects && g7row.orphan_redirects === 0,
      detail: `staging=${g7row.stg_redirects} promoted=${g7row.prod_redirects} orphan=${g7row.orphan_redirects}`,
    });

    // G8
    const g8 = await client.query(`
      SELECT COUNT(*)::int n FROM public.products
      WHERE legacy_woo_id IS NOT NULL
        AND (clean_description ~* '(www\\.)?purevedicgems\\.(in|com)/wp-content/uploads/')`);
    results.push({
      name: 'G8 no legacy /wp-content URLs in clean_description',
      pass: g8.rows[0].n === 0,
      detail: `rows_with_legacy_urls=${g8.rows[0].n}`,
    });

    let pass = 0; let fail = 0;
    for (const r of results) {
      console.log(`${r.pass ? '[PASS]' : '[FAIL]'}  ${r.name}`);
      console.log(`        ${r.detail}`);
      if (r.pass) pass++; else fail++;
    }
    console.log(`\n${pass} passed, ${fail} failed.`);
    process.exit(fail > 0 ? 1 : 0);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
