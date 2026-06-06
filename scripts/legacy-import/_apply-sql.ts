import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..', '..');
  loadEnv({ path: resolve(repoRoot, '.env.local') });

  const file = process.argv[2];
  if (!file) throw new Error('Usage: tsx _apply-sql.ts <sql-file-relative-to-repo>');
  const writeProd = process.argv.includes('--write-prod');
  const sqlPath = resolve(repoRoot, file);
  const sql = readFileSync(sqlPath, 'utf8');

  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (!writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to apply schema to production host "${dbHost}". Add --write-prod after dry-run review.`);
  }
  console.log(`Applying ${file} to ${dbHost}${writeProd ? ' (prod override)' : ''}\n`);

  const c = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await c.connect();
  try {
    await c.query(sql);
    console.log('Applied OK.');
  } finally {
    await c.end();
  }
}
main().catch((e) => { console.error(e instanceof Error ? (e.stack ?? e.message) : e); process.exit(1); });
