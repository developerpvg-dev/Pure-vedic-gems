/**
 * rudraksha/04-categories.ts
 *
 * Promote staged legacy Rudraksha terms into the new site's admin/catalog
 * category tables before products are migrated.
 *
 * Separation of concerns:
 * - gem_categories (Rudraksha Beads admin section): per-mukhi + specialty bead categories only
 * - product_categories shop taxonomy: all categories for product assignment (no homepage flags for mukhi)
 * - product_categories with homepage_slot=rudraksha_feature: ONLY the 3 curated marketing carousel cards
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

/** Week12 homepage carousel cards — never overwrite their homepage metadata during migration. */
const CURATED_RUDRAKSHA_FEATURE_SLUGS = new Set([
  'rudraksha-mukhi-collection',
  'exclusive-rudraksha-malas',
  'rudraksha-jewelry',
]);

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

type ParentIds = {
  rudraksha: string;
  jewelry: string;
  mala: string;
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

function isRudrakshaBeadCategory(category: Pick<StagedCategory, 'category_slug' | 'family'>) {
  return category.family === 'rudraksha' && category.category_slug !== 'rudraksha';
}

function defaultCatalogPath(category: Pick<StagedCategory, 'category_slug' | 'family'>) {
  if (category.category_slug === 'rudraksha') return '/shop/rudraksha';
  if (category.family === 'jewelry') return `/shop/jewelry/${category.category_slug}`;
  if (category.family === 'mala') return `/shop/malas/${category.category_slug}`;
  return `/shop/rudraksha/${category.category_slug}`;
}

function homepageSlot(category: Pick<StagedCategory, 'category_slug' | 'family'>): string | null {
  if (CURATED_RUDRAKSHA_FEATURE_SLUGS.has(category.category_slug)) return 'rudraksha_feature';
  if (category.family === 'jewelry' || category.family === 'mala') return 'explore_jewelry';
  return null;
}

function showOnHomepage(category: Pick<StagedCategory, 'category_slug' | 'family' | 'product_count'>): boolean {
  if (CURATED_RUDRAKSHA_FEATURE_SLUGS.has(category.category_slug)) return true;
  if (category.family === 'jewelry' || category.family === 'mala') return category.product_count > 0;
  return false;
}

function legacyNames(category: StagedCategory) {
  return [category.legacy_name, category.legacy_slug, category.legacy_path]
    .filter((value): value is string => Boolean(value && String(value).trim()))
    .filter((value, index, all) => all.indexOf(value) === index);
}

function catalogParentId(category: StagedCategory, parents: ParentIds): string | null {
  if (category.category_slug === 'rudraksha') return null;
  if (category.family === 'jewelry') return parents.jewelry;
  if (category.family === 'mala') return parents.mala;
  return parents.rudraksha;
}

async function loadParentIds(client: Client): Promise<ParentIds> {
  const rows = await client.query(`SELECT slug, id FROM public.product_categories WHERE slug IN ('rudraksha', 'jewelry', 'mala')`);
  const bySlug = new Map(rows.rows.map((row) => [row.slug, row.id as string]));
  const rudraksha = bySlug.get('rudraksha');
  const jewelry = bySlug.get('jewelry');
  const mala = bySlug.get('mala');
  if (!rudraksha || !jewelry || !mala) {
    throw new Error('Missing rudraksha/jewelry/mala parent rows in product_categories. Run week2_product_model.sql first.');
  }
  return { rudraksha, jewelry, mala };
}

async function ensureCatalogParent(client: Client) {
  const result = await client.query(
    `INSERT INTO public.product_categories (
       slug, name, family, legacy_names, description, canonical_path,
       show_on_homepage, homepage_slot, sort_order, is_active
     ) VALUES (
       'rudraksha', 'Rudraksha Beads', 'rudraksha', ARRAY['Rudraksha', 'Rudrakshas'],
       'Sacred Rudraksha beads grouped by mukhi and specialty forms.', '/shop/rudraksha',
       FALSE, NULL, 30, TRUE
     )
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       family = EXCLUDED.family,
       canonical_path = COALESCE(public.product_categories.canonical_path, EXCLUDED.canonical_path),
       show_on_homepage = FALSE,
       homepage_slot = NULL,
       is_active = TRUE,
       updated_at = NOW()
     RETURNING id`,
  );
  return result.rows[0].id as string;
}

async function upsertGemCategory(client: Client, category: StagedCategory) {
  if (!isRudrakshaBeadCategory(category)) return;

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
      category.product_count <= 3,
      category.sort_order,
      category.is_active,
    ],
  );
}

async function upsertCatalogCategory(client: Client, category: StagedCategory, parents: ParentIds) {
  const isCuratedFeature = CURATED_RUDRAKSHA_FEATURE_SLUGS.has(category.category_slug);
  const parentId = catalogParentId(category, parents);
  const slot = homepageSlot(category);
  const onHomepage = showOnHomepage(category);

  if (isCuratedFeature) {
    await client.query(
      `INSERT INTO public.product_categories (
         slug, name, family, parent_id, legacy_names, description, canonical_path,
         sort_order, is_active
       ) VALUES ($1,$2,$3,$4,$5::text[],$6,$7,$8,$9)
       ON CONFLICT (slug) DO UPDATE SET
         legacy_names = (
           SELECT ARRAY(SELECT DISTINCT value FROM unnest(public.product_categories.legacy_names || EXCLUDED.legacy_names) AS value WHERE value IS NOT NULL AND value <> '')
         ),
         description = COALESCE(public.product_categories.description, EXCLUDED.description),
         canonical_path = COALESCE(public.product_categories.canonical_path, EXCLUDED.canonical_path),
         sort_order = EXCLUDED.sort_order,
         is_active = TRUE,
         updated_at = NOW()`,
      [
        category.category_slug,
        category.category_name,
        category.family,
        parentId,
        legacyNames(category),
        category.legacy_path ? `Imported from legacy category path: ${category.legacy_path}` : null,
        defaultCatalogPath(category),
        category.sort_order,
        category.is_active,
      ],
    );
    return;
  }

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
       homepage_subtitle = CASE
         WHEN EXCLUDED.homepage_slot IS NULL THEN NULL
         ELSE COALESCE(public.product_categories.homepage_subtitle, EXCLUDED.homepage_subtitle)
       END,
       homepage_badge = CASE
         WHEN EXCLUDED.homepage_slot IS NULL THEN NULL
         ELSE COALESCE(public.product_categories.homepage_badge, EXCLUDED.homepage_badge)
       END,
       show_on_homepage = CASE
         WHEN EXCLUDED.homepage_slot IS NULL THEN FALSE
         ELSE public.product_categories.show_on_homepage OR EXCLUDED.show_on_homepage
       END,
       homepage_slot = CASE
         WHEN EXCLUDED.homepage_slot IS NULL THEN NULL
         ELSE COALESCE(public.product_categories.homepage_slot, EXCLUDED.homepage_slot)
       END,
       cta_label = COALESCE(public.product_categories.cta_label, EXCLUDED.cta_label),
       sort_order = EXCLUDED.sort_order,
       is_active = TRUE,
       updated_at = NOW()`,
    [
      category.category_slug,
      category.category_name,
      category.family,
      parentId,
      legacyNames(category),
      category.legacy_path ? `Imported from legacy category path: ${category.legacy_path}` : null,
      defaultCatalogPath(category),
      onHomepage && slot === 'explore_jewelry'
        ? arrayToString(legacyNames(category).slice(0, 2), ' · ')
        : null,
      null,
      onHomepage,
      slot,
      category.category_slug === 'rudraksha' ? 'Shop Rudraksha' : 'View Category',
      category.sort_order,
      category.is_active,
    ],
  );
}

function arrayToString(values: string[], separator: string) {
  const text = values.filter(Boolean).join(separator);
  return text || null;
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
      gem: isRudrakshaBeadCategory(row) ? (existingGem.has(row.category_slug) ? 'update' : 'create') : 'skip',
      catalog: existingCatalog.has(row.category_slug) ? 'update' : 'create',
      homepage: homepageSlot(row) ?? '(shop only)',
    }));
    console.table(summary);

    await client.query('BEGIN');
    await ensureCatalogParent(client);
    const parents = await loadParentIds(client);

    for (const category of staged.rows) {
      await upsertGemCategory(client, category);
      await upsertCatalogCategory(client, category, parents);
    }

    const verify = await client.query(`
      WITH staged AS (SELECT DISTINCT category_slug, family FROM legacy_import.stg_rudraksha_categories)
      SELECT
        (SELECT count(*)::int FROM staged s JOIN public.gem_categories g ON g.slug=s.category_slug WHERE g.type='rudraksha' AND g.is_active AND s.family='rudraksha' AND s.category_slug <> 'rudraksha') AS gem_bead_categories,
        (SELECT count(*)::int FROM public.product_categories c JOIN staged s ON s.category_slug=c.slug WHERE c.is_active) AS catalog_categories,
        (SELECT count(*)::int FROM public.product_categories WHERE homepage_slot='rudraksha_feature' AND show_on_homepage AND slug NOT IN ('rudraksha-mukhi-collection','exclusive-rudraksha-malas','rudraksha-jewelry')) AS stray_feature_cards`);
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
