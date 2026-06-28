/**
 * Seed certification_labs from legacy catalog definitions.
 *
 * Run: npx tsx scripts/db/seed-certification-labs.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { LEGACY_CERTIFICATION_LABS } from '../../src/lib/utils/legacy-certificate-options';

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
    resolve(repoRoot, 'supabase', 'migration_certification_labs_seed_2026.sql'),
    'utf8'
  );

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    console.log(`Labs to upsert: ${LEGACY_CERTIFICATION_LABS.length}`);
    for (const lab of LEGACY_CERTIFICATION_LABS) {
      console.log(`  ${lab.legacy_slug} — ${lab.name} (+₹${lab.extra_charge})`);
    }

    if (!write) {
      console.log('\ndry-run — pass --write to apply migration + verify');
      return;
    }

    await client.query(migrationSql);

    const check = await client.query(
      `SELECT legacy_slug, name, extra_charge, turnaround_days, is_active, is_default
       FROM certification_labs
       ORDER BY sort_order ASC`
    );
    console.log(`\nApplied. ${check.rowCount} labs in database:`);
    for (const row of check.rows) {
      console.log(
        `  ${row.legacy_slug}\t${row.name}\t₹${row.extra_charge}\t${row.turnaround_days}d\tdefault=${row.is_default}`
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
