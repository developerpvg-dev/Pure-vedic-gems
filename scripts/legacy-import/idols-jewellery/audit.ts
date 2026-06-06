/**
 * idols-jewellery/audit.ts
 *
 * Read-only audit of the legacy SQL dump for the SPIRITUAL IDOLS (219) and
 * JEWELLERY (182) category subtrees. Prints published product counts per
 * category, status breakdown, and a data sample (price / sku / image meta).
 *
 * Run: npx tsx scripts/legacy-import/idols-jewellery/audit.ts
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { streamWpTable } from '../lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const dump = process.env.LEGACY_SQL_DUMP_PATH;
if (!dump) throw new Error('Missing LEGACY_SQL_DUMP_PATH');

const ROOTS = new Set([219, 182]); // SPIRITUAL IDOLS, JEWELLERY

async function main() {
  console.log(`Dump: ${dump}\n`);

  // Pass 1: term_taxonomy (product_cat) to resolve subtree
  type TT = { term_taxonomy_id: number; term_id: number; parent: number };
  const tts: TT[] = [];
  const termName = new Map<number, string>();
  for await (const r of streamWpTable({ filePath: dump!, tableName: 'wp_term_taxonomy', filter: (x) => x.taxonomy === 'product_cat' })) {
    tts.push({ term_taxonomy_id: Number(r.term_taxonomy_id), term_id: Number(r.term_id), parent: Number(r.parent) });
  }
  for await (const r of streamWpTable({ filePath: dump!, tableName: 'wp_terms' })) {
    termName.set(Number(r.term_id), String(r.name));
  }

  // resolve subtree term_taxonomy_ids
  const childrenByParent = new Map<number, TT[]>();
  for (const tt of tts) {
    const list = childrenByParent.get(tt.parent) ?? [];
    list.push(tt);
    childrenByParent.set(tt.parent, list);
  }
  const subtreeTtids = new Map<number, number>(); // ttid -> term_id
  const queue = [...ROOTS];
  const seen = new Set<number>();
  while (queue.length) {
    const termId = queue.shift()!;
    if (seen.has(termId)) continue;
    seen.add(termId);
    const tt = tts.find((x) => x.term_id === termId);
    if (tt) subtreeTtids.set(tt.term_taxonomy_id, termId);
    for (const ch of childrenByParent.get(termId) ?? []) queue.push(ch.term_id);
  }
  console.log(`Subtree terms: ${seen.size}, ttids: ${subtreeTtids.size}`);

  // Pass 2: term_relationships -> object ids per ttid
  const objToTtids = new Map<number, number[]>();
  for await (const r of streamWpTable({ filePath: dump!, tableName: 'wp_term_relationships', filter: (x) => subtreeTtids.has(Number(x.term_taxonomy_id)) })) {
    const obj = Number(r.object_id);
    const list = objToTtids.get(obj) ?? [];
    list.push(Number(r.term_taxonomy_id));
    objToTtids.set(obj, list);
  }
  console.log(`Candidate object_ids in subtree: ${objToTtids.size}`);

  // Pass 3: wp_posts for those object ids
  const ids = new Set(objToTtids.keys());
  const statusCount = new Map<string, number>();
  const perCatPublished = new Map<number, number>();
  const samples: Array<{ id: number; title: string; status: string; type: string }> = [];
  const publishedProductIds: number[] = [];
  for await (const r of streamWpTable({ filePath: dump!, tableName: 'wp_posts', filter: (x) => ids.has(Number(x.ID)) })) {
    const type = String(r.post_type);
    const status = String(r.post_status);
    if (type !== 'product') continue;
    statusCount.set(status, (statusCount.get(status) ?? 0) + 1);
    if (status === 'publish') {
      publishedProductIds.push(Number(r.ID));
      for (const ttid of objToTtids.get(Number(r.ID)) ?? []) {
        const termId = subtreeTtids.get(ttid)!;
        perCatPublished.set(termId, (perCatPublished.get(termId) ?? 0) + 1);
      }
      if (samples.length < 20) samples.push({ id: Number(r.ID), title: String(r.post_title), status, type });
    }
  }

  console.log('\nProduct post_status breakdown (subtree):');
  console.table([...statusCount.entries()].map(([k, v]) => ({ status: k, n: v })));

  console.log('\nPublished products per category term:');
  console.table([...perCatPublished.entries()].map(([termId, n]) => ({ termId, name: termName.get(termId), n })).sort((a, b) => (a.name! < b.name! ? -1 : 1)));

  console.log(`\nTotal distinct published products in subtree: ${publishedProductIds.length}`);
  console.log('\nSample published products:');
  console.table(samples);

  // Pass 4: sample postmeta for first few published ids (price/sku/thumbnail)
  const sampleIds = new Set(publishedProductIds.slice(0, 5));
  const metaByPost = new Map<number, Record<string, string>>();
  const wantKeys = new Set(['_price', '_regular_price', '_sale_price', '_sku', '_thumbnail_id', '_product_image_gallery', '_stock_status', 'weight_carat', 'price_carat']);
  for await (const r of streamWpTable({ filePath: dump!, tableName: 'wp_postmeta', filter: (x) => sampleIds.has(Number(x.post_id)) && wantKeys.has(String(x.meta_key)) })) {
    const pid = Number(r.post_id);
    const m = metaByPost.get(pid) ?? {};
    m[String(r.meta_key)] = String(r.meta_value);
    metaByPost.set(pid, m);
  }
  console.log('\nSample postmeta for first 5 published products:');
  for (const [pid, m] of metaByPost) console.log(pid, JSON.stringify(m));
}

main().catch((e) => { console.error(e); process.exit(1); });
