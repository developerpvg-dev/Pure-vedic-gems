/**
 * idols-jewellery/10-fix-misplaced-astro-gems-gemstones.ts
 *
 * Reclassify loose Pink Sapphire gemstones (legacy Woo IDs 46829, 46836, 46839).
 *
 * Legacy site (purevedicgems.in): WooCommerce category = "Uncategorized" only —
 * never Ruby, never Ready (Astro-Gems) Stock (term 183).
 *
 * Correct new placement: navaratna / white-sapphire (sapphire corundum family, Venus),
 * product_type = gemstone, quality_label = Exclusive.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/idols-jewellery/10-fix-misplaced-astro-gems-gemstones.ts --write --write-prod
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import { parseRunMode } from '../lib/supabase.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const PINK_SAPPHIRE_LEGACY_IDS = [46829, 46836, 46839];

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((arg) => arg !== '--write-prod'));
  return { write, writeProd };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.DATABASE_URL ?? process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing DATABASE_URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const before = await client.query(
      `SELECT legacy_woo_id, name, category, sub_category, product_type, quality_label
         FROM public.products
        WHERE legacy_woo_id = ANY($1::bigint[])
        ORDER BY legacy_woo_id`,
      [PINK_SAPPHIRE_LEGACY_IDS],
    );
    console.log('Before:');
    console.table(before.rows);

    const whiteSapphireCat = await client.query(
      `SELECT id FROM public.product_categories WHERE slug = 'white-sapphire' AND family = 'navaratna' LIMIT 1`,
    );
    const navaratnaParent = await client.query(
      `SELECT id FROM public.product_categories WHERE slug = 'navaratna' LIMIT 1`,
    );
    const whiteSapphireCategoryId = whiteSapphireCat.rows[0]?.id as string | undefined;
    const navaratnaParentId = navaratnaParent.rows[0]?.id as string | undefined;
    if (!whiteSapphireCategoryId || !navaratnaParentId) {
      throw new Error('Missing navaratna/white-sapphire rows in product_categories.');
    }

    await client.query('BEGIN');

    const moved = await client.query(
      `UPDATE public.products
          SET category = 'navaratna',
              sub_category = 'white-sapphire',
              product_type = 'gemstone',
              quality_label = 'Exclusive',
              planet = 'Venus',
              updated_at = NOW()
        WHERE legacy_woo_id = ANY($1::bigint[])
        RETURNING legacy_woo_id, name, slug`,
      [PINK_SAPPHIRE_LEGACY_IDS],
    );
    console.log(`\nReclassified ${moved.rowCount} pink sapphire products to navaratna/white-sapphire:`);
    console.table(moved.rows);

    for (const row of moved.rows) {
      const productIdRes = await client.query(
        `SELECT id FROM public.products WHERE legacy_woo_id = $1`,
        [row.legacy_woo_id],
      );
      const productId = productIdRes.rows[0]?.id as string | undefined;
      if (!productId) continue;

      await client.query(
        `DELETE FROM public.product_category_assignments
          WHERE product_id = $1 AND is_primary = TRUE`,
        [productId],
      );
      await client.query(
        `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
         VALUES ($1, $2, TRUE, 0, 'Uncategorized > Pink Sapphire')
         ON CONFLICT (product_id, category_id) DO UPDATE SET is_primary = TRUE`,
        [productId, whiteSapphireCategoryId],
      );
      await client.query(
        `INSERT INTO public.product_category_assignments (product_id, category_id, is_primary, sort_order, legacy_path)
         VALUES ($1, $2, FALSE, 1, NULL)
         ON CONFLICT (product_id, category_id) DO NOTHING`,
        [productId, navaratnaParentId],
      );
    }

    const afterStock = await client.query(
      `SELECT count(*)::int AS n
         FROM public.products
        WHERE sub_category = 'astro-gems-stock'
          AND category = 'jewelry'
          AND is_active = TRUE
          AND in_stock = TRUE`,
    );
    console.log(`\nIn-stock jewelry astro-gems-stock after fix: ${afterStock.rows[0].n}`);

    if (flags.write) {
      await client.query('COMMIT');
      console.log('\nCOMMITTED pink sapphire relocation.');
    } else {
      await client.query('ROLLBACK');
      console.log('\nROLLED BACK. Re-run with --write --write-prod to apply.');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
