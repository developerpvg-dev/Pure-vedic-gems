/**
 * upratna/04-categories.ts
 *
 * Promote staged legacy Upratna terms into the new admin/catalog category
 * tables before products are migrated.
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

const CATEGORY_META: Record<string, { planet?: string | null; sanskrit?: string | null; color?: string | null }> = {
  amethyst: { planet: 'Saturn', sanskrit: 'Katela / Jamunia', color: '#9333EA' },
  aquamarine: { planet: 'Mercury', color: '#38BDF8' },
  'blue-topaz': { planet: 'Jupiter', color: '#0EA5E9' },
  citrine: { planet: 'Jupiter', sanskrit: 'Sunela', color: '#F59E0B' },
  diopside: { planet: 'Mercury', color: '#15803D' },
  garnet: { planet: 'Rahu', color: '#991B1B' },
  hakik: { sanskrit: 'Agate', color: '#57534E' },
  iolite: { planet: 'Saturn', sanskrit: 'Neeli', color: '#4338CA' },
  kyanite: { planet: 'Saturn', color: '#2563EB' },
  'lapis-lazuli': { sanskrit: 'Lajward', color: '#1D4ED8' },
  malachite: { planet: 'Venus', color: '#16A34A' },
  moonstone: { planet: 'Moon', sanskrit: 'Chandrakant', color: '#CBD5E1' },
  opal: { planet: 'Venus', color: '#FBBFB4' },
  peridot: { planet: 'Mercury', sanskrit: 'Zabarjad', color: '#84CC16' },
  'rose-quartz': { planet: 'Venus', color: '#F9A8D4' },
  sunstone: { planet: 'Sun', color: '#F97316' },
  tanzanite: { planet: 'Saturn', color: '#4F46E5' },
  'tiger-eye': { planet: 'Rahu', color: '#A16207' },
  turquoise: { planet: 'Jupiter', sanskrit: 'Firoza', color: '#14B8A6' },
  'white-coral': { planet: 'Mars', color: '#F8FAFC' },
  'white-topaz': { planet: 'Venus', color: '#E5E7EB' },
  zircon: { planet: 'Venus', color: '#E0F2FE' },
};

function parseFlags(argv: string[]) {
  const writeProd = argv.includes('--write-prod');
  const { write } = parseRunMode(argv.filter((arg) => arg !== '--write-prod'));
  return { write, writeProd };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

function defaultCatalogPath(category: Pick<StagedCategory, 'category_slug'>) {
  return category.category_slug === 'upratna' ? '/shop/upratna' : `/shop/upratna/${category.category_slug}`;
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
       'upratna', 'Upratna Gemstones', 'upratna', ARRAY['UPRATANAS', 'Upratna', 'Uparatna'],
       'Semi-precious astrological gemstones and Vedic substitutes grouped by legacy category.', '/shop/upratna',
       TRUE, 'upratna_feature', 'Semi-precious astrological gems', 'Featured',
       'Shop Upratna', 20, TRUE
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
  const meta = CATEGORY_META[category.category_slug] ?? {};
  await client.query(
    `INSERT INTO public.gem_categories (
       name, slug, type, sanskrit_name, planet, color, description,
       display_locations, is_rare, featured_on_homepage, sort_order, is_active
     ) VALUES ($1,$2,'upratna',$3,$4,$5,$6,$7,$8,TRUE,$9,$10)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       type = 'upratna',
       sanskrit_name = COALESCE(public.gem_categories.sanskrit_name, EXCLUDED.sanskrit_name),
       planet = COALESCE(public.gem_categories.planet, EXCLUDED.planet),
       color = COALESCE(public.gem_categories.color, EXCLUDED.color),
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
      meta.sanskrit ?? null,
      meta.planet ?? null,
      meta.color ?? null,
      category.legacy_path ? `Imported from legacy category path: ${category.legacy_path}` : null,
      category.legacy_path ?? 'Upratna',
      category.product_count <= 3 && category.category_slug !== 'upratna',
      category.sort_order,
      category.is_active,
    ],
  );
}

async function upsertCatalogCategory(client: Client, category: StagedCategory, parentId: string | null) {
  const isParent = category.category_slug === 'upratna';
  await client.query(
    `INSERT INTO public.product_categories (
       slug, name, family, parent_id, legacy_names, description, canonical_path,
       homepage_subtitle, homepage_badge, show_on_homepage, homepage_slot,
       cta_label, sort_order, is_active
     ) VALUES ($1,$2,'upratna',$3,$4::text[],$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name,
       family = 'upratna',
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
      isParent ? null : parentId,
      legacyNames(category),
      category.legacy_path ? `Imported from legacy category path: ${category.legacy_path}` : null,
      defaultCatalogPath(category),
      category.product_count > 0 ? `${category.product_count} legacy products migrated` : null,
      category.product_count > 0 ? 'Legacy' : null,
      category.product_count > 0 || isParent,
      'upratna_feature',
      isParent ? 'Shop Upratna' : 'View Category',
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
      FROM legacy_import.stg_upratna_categories
      ORDER BY sort_order, category_slug, legacy_term_taxonomy_id`);
    if (staged.rows.length === 0) throw new Error('No rows found in legacy_import.stg_upratna_categories. Run 03-transform first.');

    const existing = await client.query(`
      SELECT source, slug, name FROM (
        SELECT 'gem' AS source, slug, name FROM public.gem_categories WHERE type='upratna'
        UNION ALL
        SELECT 'catalog' AS source, slug, name FROM public.product_categories WHERE family='upratna'
      ) rows
      WHERE slug = ANY($1::text[])
      ORDER BY source, slug`, [staged.rows.map((row) => row.category_slug)]);
    const existingGem = new Set(existing.rows.filter((row) => row.source === 'gem').map((row) => row.slug));
    const existingCatalog = new Set(existing.rows.filter((row) => row.source === 'catalog').map((row) => row.slug));
    console.table(staged.rows.map((row) => ({
      slug: row.category_slug,
      name: row.category_name,
      products: row.product_count,
      gem: existingGem.has(row.category_slug) ? 'update' : 'create',
      catalog: existingCatalog.has(row.category_slug) ? 'update' : 'create',
    })));

    await client.query('BEGIN');
    const parentId = await ensureCatalogParent(client);
    for (const category of staged.rows) {
      await upsertGemCategory(client, category);
      await upsertCatalogCategory(client, category, parentId);
    }

    const verify = await client.query(`
      WITH staged AS (SELECT DISTINCT category_slug FROM legacy_import.stg_upratna_categories)
      SELECT
        (SELECT count(*)::int FROM public.gem_categories g JOIN staged s ON s.category_slug=g.slug WHERE g.type='upratna' AND g.is_active) AS gem_categories,
        (SELECT count(*)::int FROM public.product_categories c JOIN staged s ON s.category_slug=c.slug WHERE c.is_active) AS catalog_categories`);
    console.table(verify.rows);

    if (flags.write) {
      await client.query('COMMIT');
      console.log(`\nCOMMITTED. Upserted ${staged.rows.length} staged Upratna categories into admin/catalog tables.`);
    } else {
      await client.query('ROLLBACK');
      console.log(`\nROLLED BACK. Would upsert ${staged.rows.length} staged Upratna categories.`);
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
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
