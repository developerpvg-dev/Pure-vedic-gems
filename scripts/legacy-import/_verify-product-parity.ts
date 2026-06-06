import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable, type SqlValue } from './lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const wooDump = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');

type ProductInfo = { id: string; title: string; slug: string; sku: string; stock: string; price: string; type: string };

async function main() {
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');

  // 1) Source products by status
  const statusCounts: Record<string, number> = {};
  const published = new Map<string, ProductInfo>();
  for await (const row of streamWpTable({
    filePath: wooDump,
    tableName: 'wp_posts',
    filter: (r: Record<string, SqlValue>) => r.post_type === 'product',
  })) {
    const status = String(row.post_status ?? '');
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    if (status === 'publish') {
      const id = String(row.ID);
      published.set(id, {
        id,
        title: String(row.post_title ?? '').trim(),
        slug: String(row.post_name ?? '').trim(),
        sku: '',
        stock: '',
        price: '',
        type: '',
      });
    }
  }

  // 2) Meta for published products
  for await (const row of streamWpTable({
    filePath: wooDump,
    tableName: 'wp_postmeta',
    filter: (r: Record<string, SqlValue>) =>
      published.has(String(r.post_id)) && ['_sku', '_stock_status', '_price'].includes(String(r.meta_key)),
  })) {
    const p = published.get(String(row.post_id));
    if (!p) continue;
    if (row.meta_key === '_sku') p.sku = String(row.meta_value ?? '');
    else if (row.meta_key === '_stock_status') p.stock = String(row.meta_value ?? '');
    else if (row.meta_key === '_price') p.price = String(row.meta_value ?? '');
  }

  // 3) Production state
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const prodLegacy = new Map<number, { slug: string; is_active: boolean }>();
  const prodSlugs = new Map<string, number>();
  try {
    const { rows } = await client.query<{ legacy_woo_id: string | number; slug: string; is_active: boolean }>(
      `SELECT legacy_woo_id, slug, is_active FROM products WHERE legacy_woo_id IS NOT NULL`,
    );
    for (const r of rows) {
      prodLegacy.set(Number(r.legacy_woo_id), { slug: r.slug, is_active: r.is_active });
      if (r.slug) prodSlugs.set(r.slug, Number(r.legacy_woo_id));
    }
  } finally {
    await client.end();
  }

  const missing = [...published.values()].filter((p) => !prodLegacy.has(Number(p.id)));

  console.log('Woo product status counts:', statusCounts);
  console.log(`Source published products: ${published.size}`);
  console.log(`Production products with legacy_woo_id: ${prodLegacy.size}`);
  console.log(`Missing published products (in source, not in prod): ${missing.length}\n`);

  // classify
  let dupSlug = 0, noPrice = 0, outOfStock = 0;
  for (const p of missing) {
    const slugClash = prodSlugs.has(p.slug) ? `DUP-SLUG→woo#${prodSlugs.get(p.slug)}` : '';
    if (slugClash) dupSlug++;
    if (!p.price) noPrice++;
    if (p.stock && p.stock !== 'instock') outOfStock++;
    console.log(
      `#${p.id} | ${p.slug || '(no-slug)'} | sku=${p.sku || '-'} | price=${p.price || '-'} | stock=${p.stock || '-'} ${slugClash}`,
    );
    console.log(`     ${p.title}`);
  }
  console.log(`\nSummary of ${missing.length} missing: dup-slug=${dupSlug}, no-price=${noPrice}, not-instock=${outOfStock}`);
}

main().catch((e) => { console.error(e instanceof Error ? (e.stack ?? e.message) : e); process.exit(1); });
