import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

async function main() {
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL;
  const client = new Client({ connectionString: dbUrl!, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const gems = await client.query(`
      SELECT slug, name, type, sort_order, image_url
      FROM gem_categories WHERE type = 'rudraksha' ORDER BY sort_order, slug
    `);
    console.log(`gem_categories rudraksha (${gems.rowCount}):`);
    for (const row of gems.rows) console.log(`  ${row.slug} | ${row.name} | img=${row.image_url ? 'yes' : 'no'}`);

    const products = await client.query(`
      SELECT sub_category, count(*)::int AS n
      FROM products WHERE category = 'rudraksha' AND is_active
      GROUP BY sub_category ORDER BY sub_category
    `);
    console.log('\nProduct counts by sub_category:');
    for (const row of products.rows) console.log(`  ${row.sub_category}: ${row.n}`);

    const special = ['gauri-shankar','ganesh-rudraksha','nir-mukhi','garbh-gauri','sawar-rudraksha','savar-rudraksha','13-mukhi','14-mukhi','15-mukhi'];
    for (const slug of special) {
      const r = await client.query(`SELECT count(*)::int AS n FROM products WHERE is_active AND sub_category = $1`, [slug]);
      console.log(`  products[${slug}]: ${r.rows[0].n}`);
    }

    const pc = await client.query(`
      SELECT slug, name, family, parent_id IS NOT NULL AS has_parent
      FROM product_categories WHERE family = 'rudraksha' ORDER BY slug
    `);
    console.log(`\nproduct_categories rudraksha (${pc.rowCount}):`);
    for (const row of pc.rows) console.log(`  ${row.slug} | ${row.name}`);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
