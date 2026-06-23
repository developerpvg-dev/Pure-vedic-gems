import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const dbUrl = process.env.DATABASE_URL ?? process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION;
if (!dbUrl) throw new Error('Missing DATABASE_URL');

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  const gems = await client.query(
    `SELECT slug, name FROM gem_categories WHERE type='rudraksha' AND is_active ORDER BY sort_order`,
  );
  const features = await client.query(
    `SELECT slug, name, family, show_on_homepage, homepage_slot, homepage_subtitle
       FROM product_categories
      WHERE homepage_slot='rudraksha_feature'
         OR (family IN ('rudraksha','jewelry','mala') AND show_on_homepage=true)
      ORDER BY sort_order`,
  );
  const catalog = await client.query(
    `SELECT slug, name, family, (parent_id IS NOT NULL) AS has_parent, show_on_homepage, homepage_slot
       FROM product_categories
      WHERE family IN ('rudraksha','jewelry','mala')
        AND slug NOT IN ('rudraksha','jewelry','mala')
      ORDER BY family, sort_order`,
  );

  console.log(`Host: ${new URL(dbUrl).hostname}`);
  console.log(`GEM categories (rudraksha beads): ${gems.rows.length}`);
  console.table(gems.rows);
  console.log(`Homepage/feature catalog rows: ${features.rows.length}`);
  console.table(features.rows);
  console.log(`All rudraksha-related catalog children: ${catalog.rows.length}`);
  console.table(catalog.rows);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
