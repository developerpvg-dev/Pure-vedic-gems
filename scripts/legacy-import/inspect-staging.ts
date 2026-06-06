/**
 * One-off helper: inspect the legacy data to ground the transform.
 * Prints top postmeta keys, attribute taxonomies, term slugs, and a sample
 * product's full meta dump. Read-only.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '.env.local') });

const client = new Client({
  connectionString: process.env.LEGACY_IMPORT_DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  console.log('--- Top 60 postmeta keys for products ---');
  const r1 = await client.query(`
    SELECT pm.meta_key, COUNT(*)::int AS n
    FROM legacy_import.stg_wp_postmeta pm
    JOIN legacy_import.stg_wp_posts p ON p.id = pm.post_id
    WHERE p.post_type = 'product'
    GROUP BY pm.meta_key
    ORDER BY n DESC
    LIMIT 60;
  `);
  for (const r of r1.rows) console.log(`  ${String(r.n).padStart(6)}  ${r.meta_key}`);

  console.log('\n--- All product_cat term slugs in the Navratan subtree ---');
  const r2 = await client.query(`
    WITH RECURSIVE sub AS (
      SELECT tt.* FROM legacy_import.stg_wp_term_taxonomy tt
      JOIN legacy_import.stg_wp_terms t USING (term_id)
      WHERE t.slug IN ('navratan','navratna') AND tt.taxonomy='product_cat'
      UNION
      SELECT c.* FROM legacy_import.stg_wp_term_taxonomy c
      JOIN sub s ON c.parent = s.term_id WHERE c.taxonomy='product_cat'
    )
    SELECT t.slug, t.name, sub.count
    FROM sub JOIN legacy_import.stg_wp_terms t USING (term_id)
    ORDER BY sub.count DESC NULLS LAST;
  `);
  for (const r of r2.rows) console.log(`  ${String(r.count).padStart(4)}  ${r.slug.padEnd(30)} ${r.name}`);

  console.log('\n--- Attribute taxonomies (pa_*) used on Navratan products ---');
  const r3 = await client.query(`
    SELECT tt.taxonomy, COUNT(DISTINCT tr.object_id)::int AS products
    FROM legacy_import.stg_wp_term_taxonomy tt
    JOIN legacy_import.stg_wp_term_relationships tr USING (term_taxonomy_id)
    JOIN legacy_import.stg_wp_posts p ON p.id = tr.object_id
    WHERE p.post_type='product' AND tt.taxonomy LIKE 'pa\\_%'
    GROUP BY tt.taxonomy ORDER BY products DESC;
  `);
  for (const r of r3.rows) console.log(`  ${String(r.products).padStart(5)}  ${r.taxonomy}`);

  console.log('\n--- Sample: one Ruby product full meta ---');
  const r4 = await client.query(`
    SELECT p.id, p.post_title, p.post_name
    FROM legacy_import.stg_wp_posts p
    JOIN legacy_import.stg_wp_term_relationships tr ON tr.object_id = p.id
    JOIN legacy_import.stg_wp_term_taxonomy tt USING (term_taxonomy_id)
    JOIN legacy_import.stg_wp_terms t USING (term_id)
    WHERE p.post_type='product' AND t.slug='ruby'
    LIMIT 1;
  `);
  if (r4.rows.length) {
    const p = r4.rows[0];
    console.log(`  product: id=${p.id} "${p.post_title}" slug=${p.post_name}`);
    const r5 = await client.query(
      `SELECT meta_key, LEFT(COALESCE(meta_value,''),200) AS v FROM legacy_import.stg_wp_postmeta WHERE post_id=$1 ORDER BY meta_key`,
      [p.id],
    );
    for (const m of r5.rows) console.log(`    ${m.meta_key.padEnd(40)} ${m.v}`);
  }

  console.log('\n--- Distinct option values for each pa_* attr (truncated) ---');
  for (const tax of ['pa_certificate', 'pa_pooja-energization', 'pa_metal', 'pa_ring-pendant-bracelet', 'pa_ring-size', 'pa_ring-size-system']) {
    const r6 = await client.query(`
      SELECT DISTINCT t.slug, t.name
      FROM legacy_import.stg_wp_term_taxonomy tt
      JOIN legacy_import.stg_wp_terms t USING (term_id)
      WHERE tt.taxonomy = $1
      ORDER BY t.slug LIMIT 30;
    `, [tax]);
    console.log(`\n  [${tax}]`);
    for (const r of r6.rows) console.log(`    ${r.slug.padEnd(35)} ${r.name}`);
  }

  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
