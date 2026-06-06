/**
 * Apply supabase/navratna_phase1_staging.sql to the staging Postgres.
 *
 * Connects directly via the LEGACY_IMPORT_DATABASE_URL (Supabase direct conn).
 * Refuses to run if the host matches any entry in PROD_SUPABASE_HOSTS.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/apply-staging-schema.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
if (!dbUrl) {
  throw new Error('Missing LEGACY_IMPORT_DATABASE_URL in env.');
}

const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);
const dbHost = new URL(dbUrl).hostname.toLowerCase();
// `db.<ref>.supabase.co` should not match the API host `<ref>.supabase.co`,
// but normalise both sides defensively.
const normalisedDbHost = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
if (prodHosts.some((p) => normalisedDbHost === p.toLowerCase())) {
  throw new Error(
    `Refusing to apply schema against production host "${dbHost}". ` +
      'Point LEGACY_IMPORT_DATABASE_URL at the staging project.',
  );
}

const sqlPath = resolve(repoRoot, 'supabase', 'navratna_phase1_staging.sql');
const sql = readFileSync(sqlPath, 'utf8');

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log(`Connected to ${dbHost}. Applying ${sqlPath} ...`);
  await client.query(sql);
  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'legacy_import' ORDER BY tablename;`,
  );
  console.log('legacy_import schema tables:');
  for (const r of rows) console.log('  -', r.tablename);
  await client.end();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
