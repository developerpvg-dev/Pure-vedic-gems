/**
 * Migrate per-product energization allow-lists from WooCommerce export CSV.
 *
 * Run: npx tsx scripts/db/seed-product-energization-rules.ts --write
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { resolveProductEnergizationRules } from '../../src/lib/utils/resolve-product-energization-rules';
import { loadWooProductCsv, resolveWooParentValue } from './lib/load-woo-csv';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const workspaceRoot = resolve(repoRoot, '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const DEFAULT_CSV = resolve(workspaceRoot, 'wc-product-export-20-3-2026-1774007389267.csv');

function resolveDbUrl() {
  return process.env.DATABASE_URL || process.env.LEGACY_IMPORT_DATABASE_URL;
}

function csvPathFromArgs() {
  const flagIndex = process.argv.indexOf('--csv');
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) {
    return resolve(process.argv[flagIndex + 1]);
  }
  return DEFAULT_CSV;
}

type DbProduct = {
  id: string;
  legacy_woo_id: number | null;
  category: string | null;
  product_type: string | null;
  configurator_enabled: boolean | null;
  energization_eligible: boolean | null;
};

async function main() {
  const write = process.argv.includes('--write');
  const csvPath = csvPathFromArgs();
  const dbUrl = resolveDbUrl();
  if (!dbUrl) throw new Error('Missing DATABASE_URL or LEGACY_IMPORT_DATABASE_URL');

  const wooById = loadWooProductCsv(csvPath);
  console.log(`Loaded ${wooById.size} Woo rows from ${csvPath}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const optionsResult = await client.query(
      `SELECT id, legacy_slug FROM energization_options WHERE legacy_slug IS NOT NULL AND is_active = true`
    );
    const optionsByLegacySlug = new Map<string, string>();
    for (const row of optionsResult.rows) {
      optionsByLegacySlug.set(String(row.legacy_slug), String(row.id));
    }
    if (optionsByLegacySlug.size === 0) {
      throw new Error('No legacy energization options found. Run seed-energization-options.ts --write first.');
    }

    const productsResult = await client.query<DbProduct>(
      `SELECT id, legacy_woo_id, category, product_type, configurator_enabled, energization_eligible
       FROM products
       ORDER BY legacy_woo_id ASC NULLS LAST`
    );

    let enabled = 0;
    let disabled = 0;
    let withExplicitOptions = 0;

    if (write) await client.query('BEGIN');

    for (const product of productsResult.rows) {
      const wooRow = product.legacy_woo_id ? wooById.get(Number(product.legacy_woo_id)) : undefined;
      const energizationRaw = resolveWooParentValue(wooRow, wooById, 'energization_values');

      const resolved = resolveProductEnergizationRules(
        {
          category: product.category,
          product_type: product.product_type,
          configurator_enabled: product.configurator_enabled,
          energization_eligible: product.energization_eligible,
        },
        energizationRaw,
        optionsByLegacySlug
      );

      if (resolved.energization_enabled) enabled += 1;
      else disabled += 1;
      if (resolved.allowed_energization_option_ids.length > 0) withExplicitOptions += 1;

      if (!write) continue;

      await client.query(
        `INSERT INTO product_option_rules (
           product_id,
           energization_enabled,
           allowed_energization_option_ids,
           legacy_energization_options,
           updated_at
         ) VALUES ($1, $2, $3::uuid[], $4::jsonb, NOW())
         ON CONFLICT (product_id) DO UPDATE SET
           energization_enabled = EXCLUDED.energization_enabled,
           allowed_energization_option_ids = EXCLUDED.allowed_energization_option_ids,
           legacy_energization_options = EXCLUDED.legacy_energization_options,
           updated_at = NOW()`,
        [
          product.id,
          resolved.energization_enabled,
          resolved.allowed_energization_option_ids,
          JSON.stringify(resolved.legacy_energization_options),
        ]
      );
    }

    if (write) await client.query('COMMIT');

    console.log(`\nProducts processed: ${productsResult.rowCount}`);
    console.log(`  energization_enabled: ${enabled}`);
    console.log(`  energization_disabled: ${disabled}`);
    console.log(`  with allowed options: ${withExplicitOptions}`);

    if (!write) {
      console.log('\ndry-run — pass --write to upsert energization rules for all products');
    } else {
      const verify = await client.query(
        `SELECT
           COUNT(*) FILTER (WHERE energization_enabled) AS enabled_count,
           COUNT(*) FILTER (WHERE NOT energization_enabled) AS disabled_count,
           COUNT(*) FILTER (WHERE cardinality(allowed_energization_option_ids) > 0) AS with_options
         FROM product_option_rules`
      );
      console.log('\nDB verify:', verify.rows[0]);
    }
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
