import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamWpTable } from '../legacy-import/lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const WOO = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');

async function main() {
  // post_type distribution (tabs etc.)
  const types = new Map<string, number>();
  const tabPosts: { id: string; title: string; status: string }[] = [];
  for await (const r of streamWpTable({ filePath: WOO, tableName: 'wp_posts' })) {
    const t = String(r.post_type ?? '');
    types.set(t, (types.get(t) ?? 0) + 1);
    if (t === 'wc_product_tab') {
      tabPosts.push({ id: String(r.ID), title: String(r.post_title ?? ''), status: String(r.post_status ?? '') });
    }
  }
  console.log('post_type counts (tab/form/deposit related):');
  for (const [t, n] of [...types.entries()].sort((a, b) => b[1] - a[1])) {
    if (/tab|form|deposit|product_tab|shop_/.test(t)) console.log(`  ${t.padEnd(28)} ${n}`);
  }
  console.log(`\nwc_product_tab posts: ${tabPosts.length}`);
  for (const p of tabPosts) console.log(`  #${p.id} [${p.status}] ${p.title}`);

  // deposits: scan orders postmeta for deposit keys
  const depositKeys = new Map<string, number>();
  const ordersWithDeposit = new Set<string>();
  for await (const r of streamWpTable({
    filePath: WOO,
    tableName: 'wp_postmeta',
    filter: (row) => String(row.meta_key ?? '').includes('deposit') || String(row.meta_key ?? '').includes('_wc_deposit'),
  })) {
    const k = String(r.meta_key ?? '');
    depositKeys.set(k, (depositKeys.get(k) ?? 0) + 1);
    ordersWithDeposit.add(String(r.post_id));
  }
  console.log(`\ndeposit postmeta keys (distinct posts touched: ${ordersWithDeposit.size}):`);
  for (const [k, n] of [...depositKeys.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(36)} ${n}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
