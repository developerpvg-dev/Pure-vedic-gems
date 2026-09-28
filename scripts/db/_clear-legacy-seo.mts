/**
 * Legacy WP/AI/admin-autofill SEO text sits in the "custom" columns and blocks the SEO sheet formulas.
 * Backs up, then nulls products.meta_title/meta_description (navaratna/upratna/rudraksha) and
 * shop_category_pages.seo_title/seo_description.
 *
 *   npx tsx scripts/db/_clear-legacy-seo.mts            # dry run: backup + report
 *   npx tsx scripts/db/_clear-legacy-seo.mts --write    # backup + clear
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { gemProductMeta, vedicNameFromSlug } from '../../src/lib/seo/storefront-meta';
import { formatProductDisplayName } from '../../src/lib/utils/product-display-name';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '..', '.env.local'), override: true, quiet: true });
const write = process.argv.includes('--write');
const GEM_CATEGORIES = ['navaratna', 'upratna', 'rudraksha'];

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const products = (
  await c.query(
    `select id, slug, category, sub_category, name, origin, carat_weight, bead_size_mm, treatment, certification, certificate_lab, meta_title, meta_description
       from products where category = any($1) and (meta_title is not null or meta_description is not null)`,
    [GEM_CATEGORIES],
  )
).rows;
const categories = (
  await c.query(`select slug, seo_title, seo_description from shop_category_pages where seo_title is not null or seo_description is not null`)
).rows;

const backupPath = resolve(here, `_backup-legacy-seo-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(
  backupPath,
  JSON.stringify(
    {
      products: products.map(({ id, slug, meta_title, meta_description }) => ({ id, slug, meta_title, meta_description })),
      shop_category_pages: categories,
    },
    null,
    1,
  ),
);
console.log(`backup: ${backupPath} (${products.length} products, ${categories.length} category pages)`);

const active = (
  await c.query(
    `select slug, sku, category, sub_category, name, origin, carat_weight, bead_size_mm, treatment, certification, certificate_lab
       from products where is_active and category = any($1)`,
    [GEM_CATEGORIES],
  )
).rows;
// Mirrors hasTitleSibling() on the product page.
const siblingKey = (p: (typeof active)[number]) => `${p.sub_category}|${p.carat_weight ?? p.name}`;
const groupSize = new Map<string, number>();
for (const p of active) groupSize.set(siblingKey(p), (groupSize.get(siblingKey(p)) ?? 0) + 1);
const titles = new Map<string, string[]>();
for (const p of active) {
  const { title } = gemProductMeta({
    name: formatProductDisplayName(p.name),
    origin: p.origin,
    carat: p.carat_weight == null ? null : Number(p.carat_weight),
    sizeMm: p.bead_size_mm == null ? null : Number(p.bead_size_mm),
    vedicName: vedicNameFromSlug(p.sub_category),
    category: p.category,
    treatment: p.treatment,
    certification: p.certification,
    certificateLab: p.certificate_lab,
    sku: p.sub_category && (groupSize.get(siblingKey(p)) ?? 0) > 1 ? p.sku : null,
  });
  titles.set(title, [...(titles.get(title) ?? []), p.slug]);
}
const dupes = [...titles].filter(([, slugs]) => slugs.length > 1);
console.log(`formula titles: ${active.length} active, ${titles.size} unique, ${dupes.length} duplicated`);
for (const [title, slugs] of dupes.slice(0, 25)) console.log(`  ${slugs.length}x ${title}  <- ${slugs.slice(0, 3).join(', ')}`);
console.log('samples:', [...titles.keys()].sort(() => Math.random() - 0.5).slice(0, 12));

const other = (
  await c.query(
    `select category, count(*) n, count(*) filter (where meta_title ~* '(₹|₨|per\\s*\\.?\\s*(ct|carat)|@|premium|luxury|elevate|discover|unlock|exquisite|radiant|captivating|[|:,–-]\\s*$|\\mat\\s*$)') junk
       from products where category <> all($1) and meta_title is not null group by 1`,
    [GEM_CATEGORIES],
  )
).rows;
console.log('non-gem meta_title junk counts:', other);

if (write) {
  await c.query('begin');
  const p = await c.query(
    `update products set meta_title = null, meta_description = null where category = any($1) and (meta_title is not null or meta_description is not null)`,
    [GEM_CATEGORIES],
  );
  const s = await c.query(`update shop_category_pages set seo_title = null, seo_description = null where seo_title is not null or seo_description is not null`);
  await c.query('commit');
  console.log(`cleared: ${p.rowCount} products, ${s.rowCount} category pages`);
}
await c.end();
