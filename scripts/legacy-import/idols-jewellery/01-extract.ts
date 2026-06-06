/**
 * idols-jewellery/01-extract.ts
 *
 * Stream the legacy WP SQL dump and write JSONL files for the SPIRITUAL IDOLS
 * (term 219) and JEWELLERY (term 182) subtrees. No DB writes happen here; this
 * is a local filesystem cache step mirroring navratna/01-extract.ts but with
 * TWO roots instead of one.
 *
 * Output: scripts/legacy-import/_raw/idols-jewellery/
 *   terms.jsonl, term_taxonomy.jsonl, term_relationships.jsonl,
 *   posts.jsonl, postmeta.jsonl, attachments.jsonl, attachment_meta.jsonl,
 *   _summary.json
 *
 * Re-running overwrites the output deterministically.
 */

import { createWriteStream, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import {
  streamWpTable,
  toWpPost,
  toWpPostMeta,
  toWpTerm,
  toWpTermTaxonomy,
  toWpTermRelationship,
  type WpPost,
  type WpTerm,
  type WpTermTaxonomy,
  type WpTermRelationship,
} from '../lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const dumpPath = process.env.LEGACY_SQL_DUMP_PATH;
if (!dumpPath) throw new Error('Missing LEGACY_SQL_DUMP_PATH in env.');

const outDir = resolve(here, '..', '_raw', 'idols-jewellery');
mkdirSync(outDir, { recursive: true });

// SPIRITUAL IDOLS (219) and JEWELLERY (182) root product_cat term ids.
const ROOT_TERM_IDS = new Set([219, 182]);
const SKIP_POST_STATUSES = new Set(['trash', 'auto-draft']);

function openJsonl(filename: string) {
  const path = resolve(outDir, filename);
  const stream = createWriteStream(path, { encoding: 'utf8' });
  let n = 0;
  return {
    write(obj: unknown) {
      stream.write(JSON.stringify(obj) + '\n');
      n++;
    },
    count: () => n,
    close: () =>
      new Promise<void>((res, rej) => {
        stream.end((err: Error | null | undefined) => (err ? rej(err) : res()));
      }),
  };
}

async function main() {
  const dump = dumpPath as string;
  console.log(`Reading dump: ${dump}`);
  console.log(`Writing to:   ${outDir}\n`);

  // ----- Pass 1: terms + term_taxonomy (small, load fully) -----
  const terms: WpTerm[] = [];
  const termTax: WpTermTaxonomy[] = [];

  const termsWriter = openJsonl('terms.jsonl');
  for await (const row of streamWpTable({ filePath: dump, tableName: 'wp_terms' })) {
    const t = toWpTerm(row);
    terms.push(t);
    termsWriter.write(t);
  }
  await termsWriter.close();
  console.log(`  wp_terms: ${terms.length}`);

  const ttWriter = openJsonl('term_taxonomy.jsonl');
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_term_taxonomy',
    filter: (r) => r.taxonomy === 'product_cat',
  })) {
    const t = toWpTermTaxonomy(row);
    termTax.push(t);
    ttWriter.write(t);
  }
  await ttWriter.close();
  console.log(`  wp_term_taxonomy (product_cat): ${termTax.length}`);

  // ----- Resolve both subtrees -----
  const termById = new Map(terms.map((t) => [t.term_id, t]));
  const childrenByParent = new Map<number, WpTermTaxonomy[]>();
  for (const tt of termTax) {
    const list = childrenByParent.get(tt.parent) ?? [];
    list.push(tt);
    childrenByParent.set(tt.parent, list);
  }

  const subtreeTtids = new Set<number>();
  const subtreeTermIds = new Set<number>();
  const queue: number[] = [...ROOT_TERM_IDS];
  while (queue.length) {
    const termId = queue.shift()!;
    if (subtreeTermIds.has(termId)) continue;
    subtreeTermIds.add(termId);
    const tt = termTax.find((x) => x.term_id === termId);
    if (tt) subtreeTtids.add(tt.term_taxonomy_id);
    for (const child of childrenByParent.get(termId) ?? []) queue.push(child.term_id);
  }
  console.log(`  Subtree terms: ${subtreeTermIds.size}`);
  for (const termId of ROOT_TERM_IDS) {
    const term = termById.get(termId);
    console.log(`    root term_id=${termId} slug="${term?.slug ?? '??'}" name="${term?.name ?? '??'}"`);
  }

  // ----- Pass 2: term_relationships for both subtrees -----
  const candidateIds = new Set<number>();
  const termRels: WpTermRelationship[] = [];
  const trWriter = openJsonl('term_relationships.jsonl');
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_term_relationships',
    filter: (r) => subtreeTtids.has(Number(r.term_taxonomy_id ?? 0)),
  })) {
    const t = toWpTermRelationship(row);
    termRels.push(t);
    trWriter.write(t);
    candidateIds.add(t.object_id);
  }
  await trWriter.close();
  console.log(`  wp_term_relationships (subtree): ${termRels.length}, candidate object_ids=${candidateIds.size}`);

  // ----- Pass 3: wp_posts (products + variations) -----
  const posts: WpPost[] = [];
  const postsWriter = openJsonl('posts.jsonl');
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_posts',
    filter: (r) => {
      if (!candidateIds.has(Number(r.ID ?? 0))) return false;
      if (SKIP_POST_STATUSES.has(String(r.post_status ?? ''))) return false;
      const type = String(r.post_type ?? '');
      return type === 'product' || type === 'product_variation';
    },
  })) {
    const p = toWpPost(row);
    posts.push(p);
    postsWriter.write(p);
  }
  await postsWriter.close();
  const productPostIds = new Set(posts.filter((p) => p.post_type === 'product').map((p) => p.ID));
  const publishedProductIds = new Set(
    posts.filter((p) => p.post_type === 'product' && p.post_status === 'publish').map((p) => p.ID),
  );
  console.log(
    `  wp_posts (products+variations): ${posts.length} (products: ${productPostIds.size}, published: ${publishedProductIds.size})`,
  );

  // ----- Pass 4: wp_postmeta for product posts (harvest attachment ids) -----
  const attachmentIds = new Set<number>();
  const wantPostIds = new Set(posts.map((p) => p.ID));
  const pmWriter = openJsonl('postmeta.jsonl');
  let pmCount = 0;
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_postmeta',
    filter: (r) => wantPostIds.has(Number(r.post_id ?? 0)),
  })) {
    const m = toWpPostMeta(row);
    pmWriter.write(m);
    pmCount++;
    if (m.meta_key === '_thumbnail_id' && m.meta_value) {
      const id = Number(m.meta_value);
      if (Number.isFinite(id) && id > 0) attachmentIds.add(id);
    } else if (m.meta_key === '_product_image_gallery' && m.meta_value) {
      for (const part of String(m.meta_value).split(',')) {
        const id = Number(part.trim());
        if (Number.isFinite(id) && id > 0) attachmentIds.add(id);
      }
    }
  }
  await pmWriter.close();
  console.log(`  wp_postmeta (products): ${pmCount}, referenced attachments=${attachmentIds.size}`);

  // ----- Pass 5: attachments (by referenced ID OR product post_parent) -----
  const attWriter = openJsonl('attachments.jsonl');
  let attCount = 0;
  const allAttachmentIds = new Set<number>(attachmentIds);
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_posts',
    filter: (r) => {
      if (String(r.post_type ?? '') !== 'attachment') return false;
      const id = Number(r.ID ?? 0);
      const parent = Number(r.post_parent ?? 0);
      return attachmentIds.has(id) || productPostIds.has(parent);
    },
  })) {
    const p = toWpPost(row);
    attWriter.write(p);
    allAttachmentIds.add(p.ID);
    attCount++;
  }
  await attWriter.close();
  console.log(`  wp_posts attachments: ${attCount}`);

  // ----- Pass 6: postmeta for attachments (_wp_attached_file etc.) -----
  const amWriter = openJsonl('attachment_meta.jsonl');
  let amCount = 0;
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'wp_postmeta',
    filter: (r) => allAttachmentIds.has(Number(r.post_id ?? 0)),
  })) {
    amWriter.write(toWpPostMeta(row));
    amCount++;
  }
  await amWriter.close();
  console.log(`  wp_postmeta (attachments): ${amCount}`);

  const summary = {
    dumpPath: dump,
    extractedAt: new Date().toISOString(),
    roots: [...ROOT_TERM_IDS].map((id) => ({ term_id: id, slug: termById.get(id)?.slug ?? null, name: termById.get(id)?.name ?? null })),
    subtree_term_ids: [...subtreeTermIds].sort((a, b) => a - b),
    counts: {
      terms: terms.length,
      term_taxonomy_product_cat: termTax.length,
      term_relationships_subtree: termRels.length,
      posts_products_or_variations: posts.length,
      products_only: productPostIds.size,
      products_published: publishedProductIds.size,
      postmeta_products: pmCount,
      attachments: attCount,
      postmeta_attachments: amCount,
    },
  };
  const sumWriter = openJsonl('_summary.json');
  sumWriter.write(summary);
  await sumWriter.close();

  console.log('\nExtract complete.');
  console.log(JSON.stringify(summary.counts, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
