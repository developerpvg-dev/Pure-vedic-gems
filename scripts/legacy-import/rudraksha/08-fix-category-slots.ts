/**
 * rudraksha/08-fix-category-slots.ts
 *
 * One-time repair for migrated Rudraksha categories that were incorrectly
 * assigned homepage_slot=rudraksha_feature. Run after 04-categories fix.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/rudraksha/08-fix-category-slots.ts
 *   npx tsx scripts/legacy-import/rudraksha/08-fix-category-slots.ts --write
 *   npx tsx scripts/legacy-import/rudraksha/08-fix-category-slots.ts --write --write-prod
 *
 * Use LEGACY_IMPORT_DATABASE_URL_PRODUCTION or pass DATABASE_URL for the target.
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

const CURATED_FEATURE_SLUGS = [
  'rudraksha-mukhi-collection',
  'exclusive-rudraksha-malas',
  'rudraksha-jewelry',
] as const;

/** Slugs that belong in gem_categories Rudraksha Beads — not parent, jewelry, or mala. */
const GEM_EXCLUDE_SLUGS = new Set([
  'rudraksha',
  'ready-rudraksha-jewelry-stock',
  'rudraksha-pendents',
  'exclusive-rudraksha-malas',
]);

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
  const dbUrl =
    process.env.LEGACY_IMPORT_DATABASE_URL_PRODUCTION
    ?? process.env.DATABASE_URL
    ?? process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing database URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const before = await client.query(`
      SELECT slug, name, family, show_on_homepage, homepage_slot
        FROM product_categories
       WHERE homepage_slot = 'rudraksha_feature'
       ORDER BY sort_order`);
    console.log(`Before: ${before.rows.length} rows with rudraksha_feature slot`);
    console.table(before.rows);

    await client.query('BEGIN');

    const resetFeature = await client.query(
      `UPDATE public.product_categories
          SET show_on_homepage = FALSE,
              homepage_slot = NULL,
              homepage_subtitle = NULL,
              homepage_badge = NULL,
              updated_at = NOW()
        WHERE homepage_slot = 'rudraksha_feature'
          AND slug <> ALL($1::text[])
      RETURNING slug`,
      [CURATED_FEATURE_SLUGS],
    );
    console.log(`\nReset stray feature cards: ${resetFeature.rowCount}`);

    await client.query(
      `UPDATE public.product_categories
          SET show_on_homepage = FALSE,
              homepage_slot = NULL,
              homepage_subtitle = NULL,
              homepage_badge = NULL,
              updated_at = NOW()
        WHERE slug = 'rudraksha'`,
    );

    const jewelryParent = await client.query(`SELECT id FROM product_categories WHERE slug = 'jewelry'`);
    const malaParent = await client.query(`SELECT id FROM product_categories WHERE slug = 'mala'`);
    const rudrakshaParent = await client.query(`SELECT id FROM product_categories WHERE slug = 'rudraksha'`);

    if (jewelryParent.rows[0]?.id) {
      const jewelryFix = await client.query(
        `UPDATE public.product_categories
            SET parent_id = $1,
                family = 'jewelry',
                show_on_homepage = TRUE,
                homepage_slot = 'explore_jewelry',
                homepage_subtitle = COALESCE(homepage_subtitle, array_to_string(legacy_names[1:2], ' · ')),
                cta_label = COALESCE(cta_label, 'View Category'),
                updated_at = NOW()
          WHERE slug IN ('ready-rudraksha-jewelry-stock', 'rudraksha-pendents')
          RETURNING slug`,
        [jewelryParent.rows[0].id],
      );
      console.log(`Jewelry parent + explore slot: ${jewelryFix.rowCount} rows`);
    }

    if (malaParent.rows[0]?.id && rudrakshaParent.rows[0]?.id) {
      const malaFix = await client.query(
        `UPDATE public.product_categories
            SET parent_id = CASE WHEN slug = 'exclusive-rudraksha-malas' THEN $1 ELSE parent_id END,
                family = CASE WHEN slug = 'exclusive-rudraksha-malas' AND homepage_slot IS DISTINCT FROM 'rudraksha_feature' THEN 'mala' ELSE family END,
                updated_at = NOW()
          WHERE slug = 'exclusive-rudraksha-malas'
            AND homepage_slot IS DISTINCT FROM 'rudraksha_feature'`,
        [malaParent.rows[0].id],
      );
      console.log(`Mala taxonomy fix: ${malaFix.rowCount} rows`);
    }

    const gemDeactivate = await client.query(
      `UPDATE public.gem_categories
          SET is_active = FALSE, updated_at = NOW()
        WHERE type = 'rudraksha'
          AND slug = ANY($1::text[])
      RETURNING slug`,
      [[...GEM_EXCLUDE_SLUGS]],
    );
    console.log(`Deactivated non-bead gem_categories: ${gemDeactivate.rowCount}`);
    if (gemDeactivate.rows.length) console.table(gemDeactivate.rows);

    const testCleanup = await client.query(
      `UPDATE public.product_categories
          SET is_active = FALSE, show_on_homepage = FALSE, homepage_slot = NULL, updated_at = NOW()
        WHERE slug IN ('newwwwwww', 'neww-categ')
      RETURNING slug`,
    );
    if (testCleanup.rowCount) {
      console.log(`Deactivated test categories: ${testCleanup.rowCount}`);
      await client.query(
        `UPDATE public.gem_categories SET is_active = FALSE WHERE slug IN ('newwwwwww')`,
      );
    }

    await client.query(
      `UPDATE public.product_categories SET
         name = '1-15 Finest Quality Rudrakshas',
         homepage_subtitle = 'Complete Mukhi range',
         homepage_badge = 'Featured',
         cta_label = 'Shop All',
         show_on_homepage = TRUE,
         homepage_slot = 'rudraksha_feature',
         sort_order = 1,
         updated_at = NOW()
       WHERE slug = 'rudraksha-mukhi-collection'`,
    );
    await client.query(
      `UPDATE public.product_categories SET
         name = 'Exclusive Rudraksha Malas',
         homepage_subtitle = 'Energized malas',
         homepage_badge = 'Featured',
         cta_label = 'Shop Malas',
         show_on_homepage = TRUE,
         homepage_slot = 'rudraksha_feature',
         sort_order = 2,
         updated_at = NOW()
       WHERE slug = 'exclusive-rudraksha-malas'`,
    );
    await client.query(
      `UPDATE public.product_categories SET
         name = 'Customised Rudraksha Jewelleries',
         family = 'jewelry',
         homepage_subtitle = 'Custom settings',
         homepage_badge = 'Featured',
         cta_label = 'Shop Jewellery',
         show_on_homepage = TRUE,
         homepage_slot = 'rudraksha_feature',
         sort_order = 3,
         updated_at = NOW()
       WHERE slug = 'rudraksha-jewelry'`,
    );

    const after = await client.query(`
      SELECT slug, name, family, show_on_homepage, homepage_slot
        FROM product_categories
       WHERE homepage_slot = 'rudraksha_feature' OR (family IN ('rudraksha','jewelry','mala') AND show_on_homepage)
       ORDER BY homepage_slot NULLS LAST, sort_order`);
    console.log(`\nAfter: ${after.rows.length} homepage-visible catalog rows`);
    console.table(after.rows);

    const gemCount = await client.query(
      `SELECT count(*)::int AS n FROM gem_categories WHERE type='rudraksha' AND is_active`,
    );
    console.log(`\nActive gem_categories (Rudraksha Beads): ${gemCount.rows[0].n}`);

    if (flags.write) {
      await client.query('COMMIT');
      console.log('\nCOMMITTED category slot repair.');
    } else {
      await client.query('ROLLBACK');
      console.log('\nROLLED BACK. Re-run with --write to apply. Add --write-prod for production.');
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
