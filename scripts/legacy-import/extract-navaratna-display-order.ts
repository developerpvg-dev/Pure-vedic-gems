/**
 * Extract legacy Navaratna category product order from pugemved_indb.sql.
 * Ruby uses the scraped listing (legacy-ruby-display-order.json) when present.
 *
 * Run: npx tsx scripts/legacy-import/extract-navaratna-display-order.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamWpTable } from './lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const dbDir = resolve(here, '..', 'db');
const wooDump = resolve(here, '..', '..', '..', 'pugemved_indb', 'pugemved_indb.sql');

/** Legacy Woo product_cat term_taxonomy_id → canonical sub_category slug. */
const NAVRATNA_TERM_MAP: Record<number, string> = {
  11: 'emerald',
  12: 'yellow-sapphire',
  13: 'blue-sapphire',
  14: 'ruby',
  15: 'diamond',
  16: 'cats-eye',
  17: 'hessonite',
  18: 'red-coral',
  19: 'pearl',
  20: 'white-sapphire',
  164: 'exclusive-gems',
  165: 'pitambari',
};

type ProductMeta = { title: string; menu_order: number; date: string };

async function loadProducts() {
  const products = new Map<string, ProductMeta>();
  for await (const row of streamWpTable({
    filePath: wooDump,
    tableName: 'wp_posts',
    filter: (r) => r.post_type === 'product' && r.post_status === 'publish',
  })) {
    products.set(String(row.ID), {
      title: String(row.post_title ?? '').trim(),
      menu_order: Number(row.menu_order ?? 0),
      date: String(row.post_date_gmt ?? row.post_date ?? ''),
    });
  }
  return products;
}

async function loadCategoryMembers(termTaxonomyId: number) {
  const ids: string[] = [];
  for await (const row of streamWpTable({
    filePath: wooDump,
    tableName: 'wp_term_relationships',
    filter: (r) => Number(r.term_taxonomy_id) === termTaxonomyId,
  })) {
    ids.push(String(row.object_id));
  }
  return ids;
}

function sortByWooCatalogOrder(ids: string[], products: Map<string, ProductMeta>) {
  return ids
    .filter((id) => products.has(id))
    .sort((a, b) => {
      const pa = products.get(a)!;
      const pb = products.get(b)!;
      if (pa.menu_order !== pb.menu_order) return pa.menu_order - pb.menu_order;
      return pa.date.localeCompare(pb.date) || Number(a) - Number(b);
    });
}

function writeOrderFile(subCategory: string, orderedIds: string[], products: Map<string, ProductMeta>) {
  const rows = orderedIds.map((id, index) => ({
    legacy_woo_id: Number(id),
    display_order: index,
    title: products.get(id)?.title ?? '',
  }));
  const outPath = resolve(dbDir, `legacy-${subCategory}-display-order.json`);
  writeFileSync(outPath, JSON.stringify(rows, null, 2));
  return { outPath, count: rows.length };
}

async function main() {
  const products = await loadProducts();
  const summary: Array<{ sub_category: string; count: number; source: string; first?: string }> = [];

  for (const [termTaxonomyId, subCategory] of Object.entries(NAVRATNA_TERM_MAP)) {
    const ttid = Number(termTaxonomyId);
    const scrapePath = resolve(dbDir, `legacy-${subCategory}-display-order.json`);

    if (subCategory === 'ruby' && existsSync(scrapePath)) {
      const existing = JSON.parse(readFileSync(scrapePath, 'utf8')) as Array<{ legacy_woo_id: number }>;
      summary.push({
        sub_category: subCategory,
        count: existing.length,
        source: 'scrape (kept existing)',
        first: existing[0] ? products.get(String(existing[0].legacy_woo_id))?.title : undefined,
      });
      continue;
    }

    const memberIds = await loadCategoryMembers(ttid);
    const ordered = sortByWooCatalogOrder(memberIds, products);
    const { count } = writeOrderFile(subCategory, ordered, products);
    summary.push({
      sub_category: subCategory,
      count,
      source: 'woo menu_order',
      first: ordered[0] ? products.get(ordered[0])?.title : undefined,
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
