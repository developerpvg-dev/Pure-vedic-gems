/**
 * idols-jewellery/00-apply-schema.ts
 *
 * Apply supabase/idols_jewellery_phase1_staging.sql to the target Postgres.
 * Idempotent (CREATE TABLE IF NOT EXISTS). Because the idols/jewellery rows
 * live in the same legacy_import schema as the rest of the migration (on
 * production), this script supports the --write-prod override used by the
 * leftover pipeline rather than refusing production outright.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/idols-jewellery/00-apply-schema.ts            (dry-run)
 *   npx tsx scripts/legacy-import/idols-jewellery/00-apply-schema.ts --write --write-prod
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { parseRunMode } from '../lib/supabase.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((arg) => arg !== '--write-prod'));
  return { write, writeProd };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after review.`);
  }
  return dbHost;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  const sqlPath = resolve(repoRoot, 'supabase', 'idols_jewellery_phase1_staging.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`SQL:  ${sqlPath}\n`);

  if (!flags.write) {
    console.log('Dry-run only. Pass --write (and --write-prod for production) to apply.');
    return;
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    const { rows } = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname='legacy_import' AND tablename LIKE 'stg_idols_jewellery%' ORDER BY tablename`,
    );
    console.log('idols/jewellery staging tables:');
    for (const r of rows) console.log('  -', r.tablename);
  } finally {
    await client.end();
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
