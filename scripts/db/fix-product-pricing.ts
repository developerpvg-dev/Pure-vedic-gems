/**
 * Backfill product pricing + availability to match legacy WooCommerce rules.
 *
 * Run: npx tsx scripts/db/fix-product-pricing.ts
 * Dry-run by default; pass --write to commit.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

async function main() {
  const write = process.argv.includes('--write');
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL');

  const sql = readFileSync(
    resolve(repoRoot, 'supabase', 'migration_fix_product_pricing_2026.sql'),
    'utf8',
  );

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const before = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE sub_category = 'ruby' AND is_active)::int AS ruby_active,
      COUNT(*) FILTER (WHERE sub_category = 'ruby' AND is_active AND price_mode IN ('on_demand','quote_required'))::int AS ruby_on_demand,
      COUNT(*) FILTER (WHERE is_active AND availability_status = 'on_demand')::int AS avail_on_demand,
      COUNT(*) FILTER (WHERE is_active AND price_mode IN ('on_demand','quote_required'))::int AS mode_on_demand
    FROM products
  `);

  console.log('Before:', before.rows[0]);
  console.log(write ? 'Applying fix…' : 'Dry-run preview only (pass --write to commit)');

  if (write) {
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  const after = write
    ? await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE sub_category = 'ruby' AND is_active)::int AS ruby_active,
          COUNT(*) FILTER (WHERE sub_category = 'ruby' AND is_active AND price_mode IN ('on_demand','quote_required'))::int AS ruby_on_demand,
          COUNT(*) FILTER (WHERE is_active AND availability_status = 'on_demand')::int AS avail_on_demand,
          COUNT(*) FILTER (WHERE is_active AND price_mode IN ('on_demand','quote_required'))::int AS mode_on_demand
        FROM products
      `)
    : before;

  console.log(write ? 'After:' : 'After (unchanged — dry run):', after.rows[0]);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
