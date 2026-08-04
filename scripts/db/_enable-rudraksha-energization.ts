/**
 * Force-enable configurator energization for every rudraksha product.
 *
 *   npx tsx scripts/db/_enable-rudraksha-energization.ts
 *   npx tsx scripts/db/_enable-rudraksha-energization.ts --write
 *   npx tsx scripts/db/_enable-rudraksha-energization.ts --write --write-prod
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { DEFAULT_GEMSTONE_ENERGIZATION_SLUGS } from '../../src/lib/utils/legacy-energization-options.js';

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
  if (!dbUrl) throw new Error('Missing DATABASE_URL or LEGACY_IMPORT_DATABASE_URL');

  const host = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'} host=${host}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const summarySql = `
      SELECT
        COUNT(*)::int AS total_rudraksha,
        COUNT(r.product_id)::int AS with_rules,
        COUNT(*) FILTER (WHERE r.energization_enabled IS TRUE)::int AS energ_on,
        COUNT(*) FILTER (WHERE r.energization_enabled IS NOT TRUE)::int AS energ_off,
        COUNT(*) FILTER (
          WHERE cardinality(COALESCE(r.allowed_energization_option_ids, '{}')) = 0
        )::int AS empty_allow,
        COUNT(*) FILTER (WHERE p.energization_eligible IS FALSE)::int AS eligible_false
      FROM products p
      LEFT JOIN product_option_rules r ON r.product_id = p.id
      WHERE lower(p.category) = 'rudraksha'
    `;
    const before = await client.query<{
      total_rudraksha: number;
      with_rules: number;
      energ_on: number;
      energ_off: number;
      empty_allow: number;
      eligible_false: number;
    }>(summarySql);
    console.log('Before:', before.rows[0]);

    const options = await client.query<{ id: string; legacy_slug: string | null }>(
      `SELECT id::text AS id, legacy_slug
         FROM energization_options
        WHERE is_active = true AND legacy_slug IS NOT NULL`,
    );
    const bySlug = new Map(options.rows.map((row) => [String(row.legacy_slug), row.id]));
    const energIds = DEFAULT_GEMSTONE_ENERGIZATION_SLUGS.map((slug) => bySlug.get(slug)).filter(
      (id): id is string => Boolean(id),
    );
    if (energIds.length === 0) {
      throw new Error('No default energization option IDs found. Seed energization_options first.');
    }
    console.log(`Default option IDs (${energIds.length}):`, energIds);

    if (!flags.write) {
      console.log('\nDRY-RUN: no writes. Re-run with --write (and --write-prod if prod).');
      return;
    }

    await client.query('BEGIN');

    const upsert = await client.query(
      `
      WITH target AS (
        SELECT p.id AS product_id
          FROM products p
         WHERE lower(p.category) = 'rudraksha'
      )
      INSERT INTO product_option_rules (
        product_id,
        energization_enabled,
        allowed_energization_option_ids,
        jewelry_design_enabled,
        metal_enabled,
        ring_size_enabled,
        allowed_setting_types
      )
      SELECT
        t.product_id,
        TRUE,
        $1::uuid[],
        TRUE,
        TRUE,
        FALSE,
        ARRAY['pendant']::text[]
      FROM target t
      ON CONFLICT (product_id) DO UPDATE SET
        energization_enabled = TRUE,
        allowed_energization_option_ids = EXCLUDED.allowed_energization_option_ids,
        updated_at = NOW()
      `,
      [energIds],
    );

    const eligible = await client.query(
      `
      UPDATE products
         SET energization_eligible = TRUE,
             updated_at = NOW()
       WHERE lower(category) = 'rudraksha'
         AND energization_eligible IS DISTINCT FROM TRUE
      `,
    );

    await client.query('COMMIT');

    console.log(`Upserted option rules rows: ${upsert.rowCount ?? 0}`);
    console.log(`Set energization_eligible=true: ${eligible.rowCount ?? 0}`);

    const after = await client.query(summarySql);
    console.log('After:', after.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
