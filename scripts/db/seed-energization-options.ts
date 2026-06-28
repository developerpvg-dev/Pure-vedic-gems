/**
 * Run: npx tsx scripts/db/seed-energization-options.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { LEGACY_ENERGIZATION_OPTIONS } from '../../src/lib/utils/legacy-energization-options';

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

  const migrationSql = readFileSync(
    resolve(repoRoot, 'supabase', 'migration_energization_options_seed_2026.sql'),
    'utf8'
  );

  console.log(`Legacy energization options: ${LEGACY_ENERGIZATION_OPTIONS.length}`);
  for (const option of LEGACY_ENERGIZATION_OPTIONS) {
    console.log(`  ${option.legacy_slug} — ${option.name} (₹${option.price})`);
  }

  if (!write) {
    console.log('\ndry-run — pass --write to apply');
    return;
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(migrationSql);
    const check = await client.query(
      `SELECT legacy_slug, name, price, is_active, sort_order
       FROM energization_options
       ORDER BY sort_order ASC`
    );
    console.log(`\nApplied. ${check.rowCount} rows:`);
    for (const row of check.rows) {
      console.log(`  ${row.is_active ? 'on' : 'off'}\t${row.legacy_slug ?? '—'}\t${row.name}\t₹${row.price}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
