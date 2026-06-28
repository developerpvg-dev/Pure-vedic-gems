/**
 * Apply legacy category display order captured from purevedicgems.in listings.
 *
 * Run: npx tsx scripts/db/seed-legacy-display-order.ts --write
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

function resolveDbUrl() {
  return process.env.DATABASE_URL || process.env.LEGACY_IMPORT_DATABASE_URL;
}

type OrderRow = { legacy_woo_id: number; display_order: number; title?: string };

function discoverOrderFiles(): Array<{ sub_category: string; file: string }> {
  return readdirSync(here)
    .filter((name) => /^legacy-.+-display-order\.json$/.test(name))
    .map((file) => ({
      sub_category: file.replace(/^legacy-/, '').replace(/-display-order\.json$/, ''),
      file,
    }))
    .sort((a, b) => a.sub_category.localeCompare(b.sub_category));
}

async function main() {
  const write = process.argv.includes('--write');
  const dbUrl = resolveDbUrl();
  if (!dbUrl) throw new Error('Missing DATABASE_URL or LEGACY_IMPORT_DATABASE_URL');

  const orderFiles = discoverOrderFiles();
  if (orderFiles.length === 0) {
    throw new Error('No legacy-*-display-order.json files found in scripts/db/');
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const spec of orderFiles) {
      const rows = JSON.parse(
        readFileSync(resolve(here, spec.file), 'utf8'),
      ) as OrderRow[];

      console.log(`\n${spec.sub_category}: ${rows.length} legacy positions`);

      if (!write) {
        console.log('  dry-run — pass --write to apply');
        console.log('  first 3:', rows.slice(0, 3));
        continue;
      }

      await client.query('BEGIN');
      try {
        for (const row of rows) {
          await client.query(
            `UPDATE public.products
             SET display_order = $1, updated_at = NOW()
             WHERE legacy_woo_id = $2
               AND sub_category = $3`,
            [row.display_order, row.legacy_woo_id, spec.sub_category],
          );
        }

        const maxOrder = rows.reduce((max, row) => Math.max(max, row.display_order), -1);
        const legacyIds = rows.map((r) => r.legacy_woo_id);
        const tail = await client.query(
          `WITH tail AS (
             SELECT id, ROW_NUMBER() OVER (ORDER BY legacy_woo_id ASC NULLS LAST, name ASC) - 1 AS rn
             FROM public.products
             WHERE sub_category = $2
               AND is_active = true
               AND (legacy_woo_id IS NULL OR NOT (legacy_woo_id = ANY($3::bigint[])))
           )
           UPDATE public.products p
           SET display_order = $1 + tail.rn,
               updated_at = NOW()
           FROM tail
           WHERE p.id = tail.id
           RETURNING p.id`,
          [maxOrder + 1, spec.sub_category, legacyIds],
        );

        await client.query('COMMIT');
        console.log(`  updated ${rows.length} legacy rows, ${tail.rowCount ?? 0} tail rows`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    if (write) {
      for (const spec of orderFiles.slice(0, 3)) {
        const check = await client.query(
          `SELECT name, display_order, legacy_woo_id, in_stock
           FROM products
           WHERE sub_category = $1 AND is_active = true
           ORDER BY in_stock DESC, display_order ASC, legacy_woo_id ASC
           LIMIT 5`,
          [spec.sub_category],
        );
        console.log(`\n${spec.sub_category} first 5 after seed:`);
        for (const row of check.rows) {
          console.log(`  ${row.in_stock ? 'stock' : 'sold'}\t${row.display_order}\t#${row.legacy_woo_id}\t${row.name}`);
        }
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
