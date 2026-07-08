/**
 * Applies supabase/week30_legacy_password_reset.sql — adds the
 * requires_password_reset flag used to gate migrated WordPress users.
 *
 * Run: npx tsx scripts/db/apply-legacy-password-reset-migration.ts --write
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

  const sql = readFileSync(
    resolve(repoRoot, 'supabase', 'week30_legacy_password_reset.sql'),
    'utf8',
  );

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const before = await client.query(`
    SELECT
      COUNT(*)::int AS total_profiles,
      COUNT(*) FILTER (WHERE column_exists)::int AS has_column
    FROM (
      SELECT 1,
        EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'customer_profiles' AND column_name = 'requires_password_reset'
        ) AS column_exists
    ) t
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

  const after = await client.query(`
    SELECT
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_profiles' AND column_name = 'requires_password_reset'
      ) AS has_column,
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_profiles' AND column_name = 'password_reset_at'
      ) AS has_reset_at_column
  `);
  console.log('After:', after.rows[0]);
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
