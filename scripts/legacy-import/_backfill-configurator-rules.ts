/**
 * Backfill product_option_rules for gems/rudraksha missing allow-lists
 * (gap-fill inserts omitted them → configurator hid Certification / Energization).
 *
 *   npx tsx scripts/legacy-import/_backfill-configurator-rules.ts --prod
 *   npx tsx scripts/legacy-import/_backfill-configurator-rules.ts --write --write-prod
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import {
  ensureGemConfiguratorOptionRules,
  ensureRudrakshaConfiguratorOptionRules,
} from './lib/ensure-option-rules.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local'), override: true });

function parseFlags(argv: string[]) {
  return {
    write: argv.includes('--write'),
    writeProd: argv.includes('--write-prod'),
    prod: argv.includes('--prod') || argv.includes('--write-prod'),
  };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error('Refusing to --write against production. Add --write-prod.');
  }
  return dbHost;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = flags.prod
    ? process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
    : process.env.LEGACY_IMPORT_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL');
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'} host=${assertSafeTarget(dbUrl, flags.write, flags.writeProd)}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const gems = await client.query<{ id: string; name: string; category: string }>(
    `SELECT p.id, p.name, p.category
       FROM products p
       LEFT JOIN product_option_rules r ON r.product_id = p.id
      WHERE lower(p.category) IN ('navaratna', 'upratna', 'uparatna')
        AND p.is_active = true
        AND (
          r.product_id IS NULL
          OR cardinality(COALESCE(r.allowed_certification_lab_ids, '{}')) = 0
          OR cardinality(COALESCE(r.allowed_energization_option_ids, '{}')) = 0
        )
      ORDER BY p.category, p.name`,
  );

  const rudraksha = await client.query<{ id: string; name: string; category: string }>(
    `SELECT p.id, p.name, p.category
       FROM products p
       LEFT JOIN product_option_rules r ON r.product_id = p.id
      WHERE lower(p.category) = 'rudraksha'
        AND p.is_active = true
        AND (
          r.product_id IS NULL
          OR (
            COALESCE(r.certificate_enabled, TRUE) = TRUE
            AND cardinality(COALESCE(r.allowed_certification_lab_ids, '{}')) = 0
          )
        )
      ORDER BY p.name`,
  );

  console.log(`Gems needing backfill: ${gems.rows.length}`);
  console.log(`Rudraksha needing backfill: ${rudraksha.rows.length}`);
  for (const row of [...gems.rows.slice(0, 5), ...rudraksha.rows.slice(0, 5)]) {
    console.log(`  ${row.category} | ${row.name.slice(0, 60)}`);
  }

  if (!flags.write) {
    console.log('DRY-RUN: no writes. Re-run with --write --write-prod.');
    await client.end();
    return;
  }

  let ok = 0;
  for (const row of gems.rows) {
    await ensureGemConfiguratorOptionRules(client, row.id);
    ok += 1;
    if (ok % 50 === 0) console.log(`  gems ${ok}/${gems.rows.length}`);
  }
  let rudOk = 0;
  for (const row of rudraksha.rows) {
    await ensureRudrakshaConfiguratorOptionRules(client, row.id);
    rudOk += 1;
    if (rudOk % 50 === 0) console.log(`  rudraksha ${rudOk}/${rudraksha.rows.length}`);
  }
  console.log(`Backfilled gems=${ok} rudraksha=${rudOk}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
