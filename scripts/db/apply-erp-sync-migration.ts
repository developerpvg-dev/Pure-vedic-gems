/**
 * Applies supabase/week31_erp_sync.sql — ERP tag stock cache + outbound queue.
 *
 * Run: npx tsx scripts/db/apply-erp-sync-migration.ts --write
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

  const sql = readFileSync(resolve(repoRoot, 'supabase', 'week31_erp_sync.sql'), 'utf8');

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log(write ? 'Applying migration…' : 'Dry-run only (pass --write to commit)');
  if (write) {
    // The SQL file manages its own BEGIN/COMMIT.
    await client.query(sql);
  }

  const after = await client.query(`
    SELECT
      to_regclass('public.erp_tag_stock') IS NOT NULL AS has_tag_stock,
      to_regclass('public.erp_sync_state') IS NOT NULL AS has_sync_state,
      to_regclass('public.erp_outbound_queue') IS NOT NULL AS has_outbound_queue
  `);
  console.log('After:', after.rows[0]);
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
