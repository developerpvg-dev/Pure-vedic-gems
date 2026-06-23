/**
 * idols-jewellery/09-fix-vedic-jewellery.ts
 *
 * Repair Vedic Jewellery categories + product assignments to match the legacy
 * WooCommerce JEWELLERY subtree (term_id 182) exactly:
 *
 *   Bracelets
 *   Exclusive Rudraksha Malas
 *   Ready (Rudraksha Jewelry) Stock
 *   Diamond-Jewellery
 *   Malas
 *   Ready (Astro-Gems) Stock
 *
 * Root cause: migrated products kept category='rudraksha' or category='mala'
 * while storefront pages under /shop/jewelry/* filter category='jewelry'.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/idols-jewellery/09-fix-vedic-jewellery.ts
 *   npx tsx scripts/legacy-import/idols-jewellery/09-fix-vedic-jewellery.ts --write
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

/** Legacy JEWELLERY children in display order (old site sidebar). */
const JEWELRY_NAV = [
  { slug: 'bracelets', name: 'Bracelets', sort_order: 1 },
  { slug: 'exclusive-rudraksha-malas', name: 'Exclusive Rudraksha Malas', sort_order: 2 },
  { slug: 'ready-rudraksha-jewelry-stock', name: 'Ready (Rudraksha Jewelry) Stock', sort_order: 3 },
  { slug: 'diamond-jewellery', name: 'Diamond-Jewellery', sort_order: 4 },
  { slug: 'malas', name: 'Malas', sort_order: 5 },
  { slug: 'astro-gems-stock', name: 'Ready (Astro-Gems) Stock', sort_order: 6 },
] as const;

/** Product sub_category slugs that must list under category=jewelry. */
const JEWELRY_PRODUCT_SUBCATEGORIES = JEWELRY_NAV.map((item) => item.slug);

/** Slugs that should NOT appear in the Vedic Jewellery nav (not on old JEWELLERY menu). */
const HIDE_FROM_JEWELRY_NAV = ['rudraksha-jewelry', 'rudraksha-pendents', 'neww-categ'];

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
    const jewelryParent = await client.query(`SELECT id FROM public.product_categories WHERE slug = 'jewelry' LIMIT 1`);
    const jewelryParentId = jewelryParent.rows[0]?.id as string | undefined;
    if (!jewelryParentId) throw new Error('Missing jewelry parent row in product_categories.');

    const beforeProducts = await client.query(`
      SELECT category, sub_category, COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE is_active AND in_stock)::int AS visible
      FROM public.products
      WHERE sub_category = ANY($1::text[])
      GROUP BY category, sub_category
      ORDER BY sub_category, category`,
      [JEWELRY_PRODUCT_SUBCATEGORIES],
    );
    console.log('Before — products in legacy jewellery subcategories:');
    console.table(beforeProducts.rows);

    await client.query('BEGIN');

    for (const item of JEWELRY_NAV) {
      const upsert = await client.query(
        `INSERT INTO public.product_categories (
           slug, name, family, parent_id, legacy_names, description, canonical_path,
           show_on_homepage, homepage_slot, sort_order, is_active
         ) VALUES (
           $1::text, $2::text, 'jewelry', $3::uuid, ARRAY[$2::text, $1::text],
           $4::text, $5::text, TRUE, 'explore_jewelry', $6::int, TRUE
         )
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           family = 'jewelry',
           parent_id = EXCLUDED.parent_id,
           legacy_names = EXCLUDED.legacy_names,
           canonical_path = EXCLUDED.canonical_path,
           show_on_homepage = TRUE,
           homepage_slot = COALESCE(public.product_categories.homepage_slot, 'explore_jewelry'),
           sort_order = EXCLUDED.sort_order,
           is_active = TRUE,
           updated_at = NOW()
         RETURNING slug`,
        [
          item.slug,
          item.name,
          jewelryParentId,
          `Shop ${item.name} from PureVedicGems.`,
          `/shop/jewelry/${item.slug}`,
          item.sort_order,
        ],
      );
      console.log(`Upserted jewelry category: ${upsert.rows[0]?.slug}`);
    }

    const hideNav = await client.query(
      `UPDATE public.product_categories
          SET parent_id = NULL,
              show_on_homepage = FALSE,
              homepage_slot = CASE WHEN slug = 'rudraksha-jewelry' THEN homepage_slot ELSE NULL END,
              updated_at = NOW()
        WHERE slug = ANY($1::text[])
        RETURNING slug`,
      [HIDE_FROM_JEWELRY_NAV],
    );
    if (hideNav.rowCount) {
      console.log(`Removed from Vedic Jewellery nav: ${hideNav.rows.map((r) => r.slug).join(', ')}`);
    }

    const productFix = await client.query(
      `UPDATE public.products
          SET category = 'jewelry',
              product_type = CASE
                WHEN sub_category IN ('exclusive-rudraksha-malas', 'malas') THEN 'mala'
                WHEN product_type = 'gemstone' THEN 'gemstone'
                ELSE COALESCE(NULLIF(product_type, ''), 'jewelry')
              END,
              updated_at = NOW()
        WHERE sub_category = ANY($1::text[])
          AND category IS DISTINCT FROM 'jewelry'
          AND product_type IS DISTINCT FROM 'gemstone'
      RETURNING sub_category`,
      [JEWELRY_PRODUCT_SUBCATEGORIES],
    );
    const fixedBySub = new Map<string, number>();
    for (const row of productFix.rows) {
      const key = String(row.sub_category);
      fixedBySub.set(key, (fixedBySub.get(key) ?? 0) + 1);
    }
    console.log(`\nReclassified products to category=jewelry: ${productFix.rowCount}`);
    if (fixedBySub.size) console.table([...fixedBySub.entries()].map(([sub_category, count]) => ({ sub_category, count })));

    const assignmentFix = await client.query(
      `UPDATE public.product_category_assignments pca
          SET category_id = pc.id
         FROM public.products p
         JOIN public.product_categories pc ON pc.slug = p.sub_category AND pc.family = 'jewelry'
        WHERE pca.product_id = p.id
          AND pca.is_primary = TRUE
          AND p.category = 'jewelry'
          AND p.sub_category = ANY($1::text[])
          AND pca.category_id IS DISTINCT FROM pc.id
      RETURNING p.sub_category`,
      [JEWELRY_PRODUCT_SUBCATEGORIES],
    );
    console.log(`Synced primary category assignments: ${assignmentFix.rowCount}`);

    const afterProducts = await client.query(`
      SELECT pc.slug, pc.name,
        COUNT(p.id) FILTER (WHERE p.is_active)::int AS active_total,
        COUNT(p.id) FILTER (WHERE p.is_active AND p.in_stock)::int AS visible_in_stock
      FROM public.product_categories pc
      LEFT JOIN public.products p
        ON p.category = 'jewelry' AND p.sub_category = pc.slug AND p.is_active
      WHERE pc.family = 'jewelry' AND pc.parent_id IS NOT NULL AND pc.is_active
      GROUP BY pc.slug, pc.name, pc.sort_order
      ORDER BY pc.sort_order, pc.name`);

    console.log('\nAfter — Vedic Jewellery subcategories:');
    console.table(afterProducts.rows);

    if (flags.write) {
      await client.query('COMMIT');
      console.log('\nCOMMITTED Vedic Jewellery repair.');
    } else {
      await client.query('ROLLBACK');
      console.log('\nROLLED BACK. Re-run with --write to apply.');
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
