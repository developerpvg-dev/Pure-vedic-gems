/**
 * Applies supabase/week32_erp_excel_sync.sql — stock_category + last_sync_mode.
 *
 * Run: npx tsx scripts/db/apply-erp-excel-migration.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

async function main() {
  const write = process.argv.includes('--write');
  const dbUrl = process.env.DATABASE_URL || process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing DATABASE_URL or LEGACY_IMPORT_DATABASE_URL');

  const sql = readFileSync(resolve(repoRoot, 'supabase', 'week32_erp_excel_sync.sql'), 'utf8');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log(write ? 'Applying migration…' : 'Dry-run only (pass --write to commit)');
  if (write) await client.query(sql);

  const after = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'erp_tag_stock' AND column_name = 'stock_category'
  `);
  console.log('stock_category column:', after.rows[0] ? 'present' : 'missing');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
