/**
 * Move Pitambari from Upratna to Navaratna in live data.
 *
 * Run: npx tsx scripts/db/migrate-pitambari-navaratna.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

function resolveDbUrl() {
  return process.env.DATABASE_URL || process.env.LEGACY_IMPORT_DATABASE_URL;
}

async function main() {
  const write = process.argv.includes('--write');
  const dbUrl = resolveDbUrl();
  if (!dbUrl) throw new Error('Missing DATABASE_URL or LEGACY_IMPORT_DATABASE_URL');

  const sql = readFileSync(
    resolve(repoRoot, 'supabase', 'migration_pitambari_navaratna_2026.sql'),
    'utf8',
  );

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const before = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE sub_category = 'pitambari' AND is_active AND category = 'upratna')::int AS upratna_pitambari,
      COUNT(*) FILTER (WHERE sub_category = 'pitambari' AND is_active AND category = 'navaratna')::int AS navaratna_pitambari,
      COUNT(*) FILTER (WHERE sub_category = 'exclusive-gems' AND is_active AND name ILIKE '%pitambari%')::int AS exclusive_pitambari
    FROM products
  `);

  console.log('Before:', before.rows[0]);
  console.log(write ? 'Applying migration…' : 'Dry-run only (pass --write to commit)');

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
          COUNT(*) FILTER (WHERE sub_category = 'pitambari' AND is_active AND category = 'upratna')::int AS upratna_pitambari,
          COUNT(*) FILTER (WHERE sub_category = 'pitambari' AND is_active AND category = 'navaratna')::int AS navaratna_pitambari,
          COUNT(*) FILTER (WHERE sub_category = 'exclusive-gems' AND is_active AND name ILIKE '%pitambari%')::int AS exclusive_pitambari
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
