/**
 * rudraksha/04-categories.ts
 *
 * Promote staged legacy Rudraksha terms into the new site's admin/catalog
 * category tables before products are migrated.
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

type StagedCategory = {
  legacy_term_taxonomy_id: number;
  legacy_term_id: number;
  legacy_slug: string;
  legacy_name: string;
  legacy_path: string | null;
  category_slug: string;
  category_name: string;
  family: string;
  sort_order: number;
  legacy_count: number;
  product_count: number;
  is_active: boolean;
  source_data: Record<string, unknown>;
};

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

function defaultCatalogPath(category: Pick<StagedCategory, 'category_slug' | 'family'>) {
  if (category.category_slug === 'rudraksha') return '/shop/rudraksha';
  if (category.family === 'jewelry') return `/shop/jewelry/${category.category_slug}`;
  if (category.family === 'mala') return `/shop/mala/${category.category_slug}`;
  return `/shop/rudraksha/${category.category_slug}`;
}

function homepageSlot(category: Pick<StagedCategory, 'family'>) {
  if (category.family === 'jewelry' || category.family === 'mala') return 'explore_jewelry';
  return 'rudraksha_feature';
}

function legacyNames(category: StagedCategory) {
  return [category.legacy_name, category.legacy_slug, category.legacy_path]
    .filter((value): value is string => Boolean(value && String(value).trim()))
    .filter((value, index, all) => all.indexOf(value) === index);
}

async function ensureCatalogParent(client: Client) {
  const result = await client.query(
    `INSERT INTO public.product_categories (
       slug, name, family, legacy_names, description, canonical_path,
       show_on_homepage, homepage_slot, homepage_subtitle, homepage_badge,
       cta_label, sort_order, is_active
     ) VALUES (
       'rudraksha', 'Rudraksha Beads', 'rudraksha', ARRAY['Rudraksha', 'Rudrakshas'],
       'Sacred Rudraksha beads grouped by mukhi and specialty forms.', '/shop/rudraksha',
       TRUE, 'rudraksha_feature', 'Sacred beads by mukhi', 'Featured',
       'Shop Rudraksha', 30, TRUE
     )
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       family = EXCLUDED.family,
       canonical_path = COALESCE(public.product_categories.canonical_path, EXCLUDED.canonical_path),
       show_on_homepage = TRUE,
       homepage_slot = COALESCE(public.product_categories.homepage_slot, EXCLUDED.homepage_slot),
       homepage_subtitle = COALESCE(public.product_categories.homepage_subtitle, EXCLUDED.homepage_subtitle),
       homepage_badge = COALESCE(public.product_categories.homepage_badge, EXCLUDED.homepage_badge),
       cta_label = COALESCE(public.product_categories.cta_label, EXCLUDED.cta_label),
       is_active = TRUE,
       updated_at = NOW()
     RETURNING id`,
  );
  return result.rows[0].id as string;
}

async function upsertGemCategory(client: Client, category: StagedCategory) {
  await client.query(
    `INSERT INTO public.gem_categories (
       name, slug, type, sanskrit_name, planet, color, description,
       display_locations, is_rare, featured_on_homepage, sort_order, is_active
     ) VALUES ($1,$2,'rudraksha',NULL,NULL,NULL,$3,$4,$5,TRUE,$6,$7)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       type = 'rudraksha',
       description = COALESCE(public.gem_categories.description, EXCLUDED.description),
       display_locations = COALESCE(public.gem_categories.display_locations, EXCLUDED.display_locations),
       is_rare = public.gem_categories.is_rare OR EXCLUDED.is_rare,
       featured_on_homepage = TRUE,
       sort_order = EXCLUDED.sort_order,
       is_active = TRUE,
       updated_at = NOW()`,
    [
      category.category_name,
      category.category_slug,
      category.legacy_path ? `Legacy category: ${category.legacy_path}` : null,
      category.legacy_path ?? 'Rudraksha',
      category.product_count <= 3 && category.category_slug !== 'rudraksha',
      category.sort_order,
      category.is_active,
    ],
  );
}

async function upsertCatalogCategory(client: Client, category: StagedCategory, parentId: string | null) {
  const isParent = category.category_slug === 'rudraksha';
  await client.query(
    `INSERT INTO public.product_categories (
       slug, name, family, parent_id, legacy_names, description, canonical_path,
       homepage_subtitle, homepage_badge, show_on_homepage, homepage_slot,
       cta_label, sort_order, is_active
     ) VALUES ($1,$2,$3,$4,$5::text[],$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       family = EXCLUDED.family,
       parent_id = EXCLUDED.parent_id,
       legacy_names = (
         SELECT ARRAY(SELECT DISTINCT value FROM unnest(public.product_categories.legacy_names || EXCLUDED.legacy_names) AS value WHERE value IS NOT NULL AND value <> '')
       ),
       description = COALESCE(public.product_categories.description, EXCLUDED.description),
       canonical_path = COALESCE(public.product_categories.canonical_path, EXCLUDED.canonical_path),
       homepage_subtitle = COALESCE(public.product_categories.homepage_subtitle, EXCLUDED.homepage_subtitle),
       homepage_badge = COALESCE(public.product_categories.homepage_badge, EXCLUDED.homepage_badge),
       show_on_homepage = public.product_categories.show_on_homepage OR EXCLUDED.show_on_homepage,
       homepage_slot = COALESCE(public.product_categories.homepage_slot, EXCLUDED.homepage_slot),
       cta_label = COALESCE(public.product_categories.cta_label, EXCLUDED.cta_label),
       sort_order = EXCLUDED.sort_order,
       is_active = TRUE,
       updated_at = NOW()`,
    [
      category.category_slug,
      category.category_name,
      category.family,
      isParent ? null : parentId,
      legacyNames(category),
      category.legacy_path ? `Imported from legacy category path: ${category.legacy_path}` : null,
      defaultCatalogPath(category),
      category.product_count > 0 ? `${category.product_count} legacy products migrated` : null,
      category.product_count > 0 ? 'Legacy' : null,
      category.product_count > 0,
      homepageSlot(category),
      category.category_slug === 'rudraksha' ? 'Shop Rudraksha' : 'View Category',
      category.sort_order,
      category.is_active,
    ],
  );
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const staged = await client.query<StagedCategory>(`
      SELECT *
      FROM legacy_import.stg_rudraksha_categories
      ORDER BY sort_order, category_slug, legacy_term_taxonomy_id`);
    if (staged.rows.length === 0) throw new Error('No rows found in legacy_import.stg_rudraksha_categories. Run 03-transform first.');

    const existing = await client.query(`
      SELECT source, slug, name FROM (
        SELECT 'gem' AS source, slug, name FROM public.gem_categories WHERE type='rudraksha'
        UNION ALL
        SELECT 'catalog' AS source, slug, name FROM public.product_categories WHERE family IN ('rudraksha','jewelry','mala')
      ) rows
      WHERE slug = ANY($1::text[])
      ORDER BY source, slug`, [staged.rows.map((row) => row.category_slug)]);

    const existingGem = new Set(existing.rows.filter((row) => row.source === 'gem').map((row) => row.slug));
    const existingCatalog = new Set(existing.rows.filter((row) => row.source === 'catalog').map((row) => row.slug));
    const summary = staged.rows.map((row) => ({
      slug: row.category_slug,
      name: row.category_name,
      family: row.family,
      products: row.product_count,
      gem: existingGem.has(row.category_slug) ? 'update' : 'create',
      catalog: existingCatalog.has(row.category_slug) ? 'update' : 'create',
    }));
    console.table(summary);

    await client.query('BEGIN');
    const parentId = await ensureCatalogParent(client);
    for (const category of staged.rows) {
      await upsertGemCategory(client, category);
      await upsertCatalogCategory(client, category, parentId);
    }

    const verify = await client.query(`
      WITH staged AS (SELECT DISTINCT category_slug FROM legacy_import.stg_rudraksha_categories)
      SELECT
        (SELECT count(*)::int FROM public.gem_categories g JOIN staged s ON s.category_slug=g.slug WHERE g.type='rudraksha' AND g.is_active) AS gem_categories,
        (SELECT count(*)::int FROM public.product_categories c JOIN staged s ON s.category_slug=c.slug WHERE c.is_active) AS catalog_categories`);
    console.table(verify.rows);

    if (flags.write) {
      await client.query('COMMIT');
      console.log(`\nCOMMITTED. Upserted ${staged.rows.length} staged Rudraksha categories into admin/catalog tables.`);
    } else {
      await client.query('ROLLBACK');
      console.log(`\nROLLED BACK. Would upsert ${staged.rows.length} staged Rudraksha categories.`);
      console.log('Re-run with --write to commit. Add --write-prod only after review for production.');
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