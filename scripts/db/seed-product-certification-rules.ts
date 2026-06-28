/**
 * Migrate per-product certification allow-lists from WooCommerce export CSV.
 *
 * Run: npx tsx scripts/db/seed-product-certification-rules.ts --write
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { resolveProductCertificationRules } from '../../src/lib/utils/resolve-product-certification-rules';
import { parseCsvContent } from './lib/parse-csv-line';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const workspaceRoot = resolve(repoRoot, '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const DEFAULT_CSV = resolve(workspaceRoot, 'wc-product-export-20-3-2026-1774007389267.csv');

function resolveDbUrl() {
  return process.env.DATABASE_URL || process.env.LEGACY_IMPORT_DATABASE_URL;
}

type WooRow = {
  legacy_woo_id: number;
  type: string;
  parent_id: number | null;
  certificate_values: string | null;
  display_certificate_option: string | null;
};

type DbProduct = {
  id: string;
  legacy_woo_id: number | null;
  category: string | null;
  product_type: string | null;
  configurator_enabled: boolean | null;
  certificate_number: string | null;
  certificate_lab: string | null;
  certification: string | null;
};

function csvPathFromArgs() {
  const flagIndex = process.argv.indexOf('--csv');
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) {
    return resolve(process.argv[flagIndex + 1]);
  }
  return DEFAULT_CSV;
}

function normalizeCsvHeader(value: string): string {
  return value.replace(/^\uFEFF/, '').trim();
}

function loadWooCsv(path: string): Map<number, WooRow> {
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const records = parseCsvContent(raw);
  if (records.length < 2) return new Map();

  const header = records[0].map(normalizeCsvHeader);
  const indexOf = (name: string) => header.indexOf(name);
  const attrNameIndexes = [1, 2, 3, 4, 5, 6, 7].map((n) => indexOf(`Attribute ${n} name`));
  const attrValueIndexes = [1, 2, 3, 4, 5, 6, 7].map((n) => indexOf(`Attribute ${n} value(s)`));

  const byId = new Map<number, WooRow>();

  for (let lineIndex = 1; lineIndex < records.length; lineIndex += 1) {
    const cols = records[lineIndex];
    const legacy_woo_id = Number(cols[indexOf('ID')]);
    if (!Number.isFinite(legacy_woo_id)) continue;

    let certificate_values: string | null = null;
    for (let attr = 0; attr < attrNameIndexes.length; attr += 1) {
      const nameIdx = attrNameIndexes[attr];
      const valueIdx = attrValueIndexes[attr];
      if (nameIdx < 0 || valueIdx < 0) continue;
      const attrName = (cols[nameIdx] ?? '').trim().toLowerCase();
      if (attrName === 'certificate' || attrName === 'pa_certificate') {
        certificate_values = cols[valueIdx] ?? null;
        break;
      }
    }

    const parentRaw = cols[indexOf('Parent')]?.trim();
    const parent_id = parentRaw ? Number(parentRaw) : null;

    byId.set(legacy_woo_id, {
      legacy_woo_id,
      type: (cols[indexOf('Type')] ?? '').trim().toLowerCase(),
      parent_id: Number.isFinite(parent_id) ? parent_id : null,
      certificate_values,
      display_certificate_option: cols[indexOf('Meta: display_certificate_option')]?.trim() || null,
    });
  }

  return byId;
}

function resolveWooCertificateValues(row: WooRow | undefined, wooById: Map<number, WooRow>): string | null {
  if (!row) return null;
  if (row.certificate_values) return row.certificate_values;

  if (row.parent_id) {
    const parent = wooById.get(row.parent_id);
    if (parent?.certificate_values) return parent.certificate_values;
  }

  return null;
}

async function main() {
  const write = process.argv.includes('--write');
  const csvPath = csvPathFromArgs();
  const dbUrl = resolveDbUrl();
  if (!dbUrl) throw new Error('Missing DATABASE_URL or LEGACY_IMPORT_DATABASE_URL');

  const wooById = loadWooCsv(csvPath);
  console.log(`Loaded ${wooById.size} Woo rows from ${csvPath}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const labsResult = await client.query(
      `SELECT id, legacy_slug FROM certification_labs WHERE legacy_slug IS NOT NULL`
    );
    const labsByLegacySlug = new Map<string, string>();
    for (const row of labsResult.rows) {
      labsByLegacySlug.set(String(row.legacy_slug), String(row.id));
    }
    if (labsByLegacySlug.size === 0) {
      throw new Error('No certification labs found. Run seed-certification-labs.ts --write first.');
    }

    const productsResult = await client.query<DbProduct>(
      `SELECT id, legacy_woo_id, category, product_type, configurator_enabled,
              certificate_number, certificate_lab, certification
       FROM products
       ORDER BY legacy_woo_id ASC NULLS LAST`
    );

    let enabled = 0;
    let disabled = 0;
    let withExplicitLabs = 0;
    let missingWoo = 0;

    const samples: string[] = [];

    if (write) await client.query('BEGIN');

    for (const product of productsResult.rows) {
      const wooRow = product.legacy_woo_id ? wooById.get(Number(product.legacy_woo_id)) : undefined;
      if (!wooRow && product.legacy_woo_id) missingWoo += 1;

      const certificateRaw = resolveWooCertificateValues(wooRow, wooById);
      const resolved = resolveProductCertificationRules(
        {
          category: product.category,
          product_type: product.product_type,
          configurator_enabled: product.configurator_enabled,
          certificate_number: product.certificate_number,
          certificate_lab: product.certificate_lab,
          certification: product.certification,
          display_certificate_option: wooRow?.display_certificate_option ?? null,
        },
        certificateRaw,
        labsByLegacySlug
      );

      if (resolved.certificate_enabled) enabled += 1;
      else disabled += 1;
      if (resolved.allowed_certification_lab_ids.length > 0) withExplicitLabs += 1;

      if (samples.length < 5 && resolved.allowed_certification_lab_ids.length > 0) {
        samples.push(
          `  #${product.legacy_woo_id ?? 'new'} enabled=${resolved.certificate_enabled} labs=${resolved.allowed_certification_lab_ids.length}`
        );
      }

      if (!write) continue;

      await client.query(
        `INSERT INTO product_option_rules (
           product_id,
           certificate_enabled,
           allowed_certification_lab_ids,
           legacy_certificate_options,
           updated_at
         ) VALUES ($1, $2, $3::uuid[], $4::jsonb, NOW())
         ON CONFLICT (product_id) DO UPDATE SET
           certificate_enabled = EXCLUDED.certificate_enabled,
           allowed_certification_lab_ids = EXCLUDED.allowed_certification_lab_ids,
           legacy_certificate_options = EXCLUDED.legacy_certificate_options,
           updated_at = NOW()`,
        [
          product.id,
          resolved.certificate_enabled,
          resolved.allowed_certification_lab_ids,
          JSON.stringify(resolved.legacy_certificate_options),
        ]
      );
    }

    if (write) await client.query('COMMIT');

    console.log(`\nProducts processed: ${productsResult.rowCount}`);
    console.log(`  certificate_enabled: ${enabled}`);
    console.log(`  certificate_disabled: ${disabled}`);
    console.log(`  with allowed labs: ${withExplicitLabs}`);
    console.log(`  legacy_woo_id missing in CSV: ${missingWoo}`);
    if (samples.length) {
      console.log('\nSample rows:');
      for (const line of samples) console.log(line);
    }

    if (!write) {
      console.log('\ndry-run — pass --write to upsert product_option_rules for all products');
    } else {
      const verify = await client.query(
        `SELECT
           COUNT(*) FILTER (WHERE certificate_enabled) AS enabled_count,
           COUNT(*) FILTER (WHERE NOT certificate_enabled) AS disabled_count,
           COUNT(*) FILTER (WHERE cardinality(allowed_certification_lab_ids) > 0) AS with_labs
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
