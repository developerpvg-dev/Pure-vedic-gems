/**
 * upratna/01-extract.ts
 *
 * Stream the legacy WP SQL dump and write JSONL files for the UPRATANAS
 * product category subtree. This keeps the raw source slice deterministic and
 * lets production staging be re-run idempotently.
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

const outDir = resolve(here, '..', '_raw', 'upratna');
mkdirSync(outDir, { recursive: true });

const ROOT_UPRATNA_SLUGS = new Set(['upratan', 'upratna', 'uparatna', 'upratanas', 'upratnas']);
const SKIP_POST_STATUSES = new Set(['trash', 'auto-draft']);

function openJsonl(filename: string) {
  const stream = createWriteStream(resolve(outDir, filename), { encoding: 'utf8' });
  let count = 0;
  return {
    write(obj: unknown) {
      stream.write(JSON.stringify(obj) + '\n');
      count++;
    },
    count: () => count,
    close: () => new Promise<void>((resolveClose, rejectClose) => {
      stream.end((err: Error | null | undefined) => (err ? rejectClose(err) : resolveClose()));
    }),
  };
}

async function main() {
  console.log(`Reading dump: ${dumpPath}`);
  console.log(`Writing to:   ${outDir}\n`);

  const terms: WpTerm[] = [];
  const termTax: WpTermTaxonomy[] = [];

  const termsWriter = openJsonl('terms.jsonl');
  for await (const row of streamWpTable({ filePath: dumpPath as string, tableName: 'wp_terms' })) {
    const term = toWpTerm(row);
    terms.push(term);
    termsWriter.write(term);
  }
  await termsWriter.close();
  console.log(`  wp_terms: ${terms.length}`);

  const taxWriter = openJsonl('term_taxonomy.jsonl');
  for await (const row of streamWpTable({
    filePath: dumpPath as string,
    tableName: 'wp_term_taxonomy',
    filter: (r) => r.taxonomy === 'product_cat',
  })) {
    const tax = toWpTermTaxonomy(row);
    termTax.push(tax);
    taxWriter.write(tax);
  }
  await taxWriter.close();
  console.log(`  wp_term_taxonomy (product_cat): ${termTax.length}`);

  const termById = new Map(terms.map((term) => [term.term_id, term]));
  const rootTax = termTax.find((tax) => {
    const term = termById.get(tax.term_id);
    return term ? ROOT_UPRATNA_SLUGS.has(term.slug.toLowerCase()) : false;
  });
  if (!rootTax) {
    throw new Error(`Could not find Upratna root product_cat (tried: ${[...ROOT_UPRATNA_SLUGS].join(', ')}).`);
  }
  const rootTerm = termById.get(rootTax.term_id)!;
  console.log(`  Upratna root: term_id=${rootTerm.term_id} ttid=${rootTax.term_taxonomy_id} slug="${rootTerm.slug}"`);

  const childrenByParent = new Map<number, WpTermTaxonomy[]>();
  for (const tax of termTax) {
    const children = childrenByParent.get(tax.parent) ?? [];
    children.push(tax);
    childrenByParent.set(tax.parent, children);
  }

  const subtreeTtids = new Set<number>();
  const subtreeTermIds = new Set<number>();
  const queue = [rootTax.term_id];
  while (queue.length > 0) {
    const termId = queue.shift()!;
    if (subtreeTermIds.has(termId)) continue;
    subtreeTermIds.add(termId);
    const tax = termTax.find((item) => item.term_id === termId);
    if (tax) subtreeTtids.add(tax.term_taxonomy_id);
    for (const child of childrenByParent.get(termId) ?? []) queue.push(child.term_id);
  }
  console.log(`  Upratna subtree: ${subtreeTermIds.size} terms`);

  const productIds = new Set<number>();
  const relationships: WpTermRelationship[] = [];
  const relWriter = openJsonl('term_relationships.jsonl');
  for await (const row of streamWpTable({
    filePath: dumpPath as string,
    tableName: 'wp_term_relationships',
    filter: (r) => subtreeTtids.has(Number(r.term_taxonomy_id ?? 0)),
  })) {
    const rel = toWpTermRelationship(row);
    relationships.push(rel);
    relWriter.write(rel);
    productIds.add(rel.object_id);
  }
  await relWriter.close();
  console.log(`  wp_term_relationships (subtree): ${relationships.length}, candidate object_ids=${productIds.size}`);

  const posts: WpPost[] = [];
  const postsWriter = openJsonl('posts.jsonl');
  for await (const row of streamWpTable({
    filePath: dumpPath as string,
    tableName: 'wp_posts',
    filter: (r) => {
      if (!productIds.has(Number(r.ID ?? 0))) return false;
      if (SKIP_POST_STATUSES.has(String(r.post_status ?? ''))) return false;
      const type = String(r.post_type ?? '');
      return type === 'product' || type === 'product_variation';
    },
  })) {
    const post = toWpPost(row);
    posts.push(post);
    postsWriter.write(post);
  }
  await postsWriter.close();
  const productPostIds = new Set(posts.filter((post) => post.post_type === 'product').map((post) => post.ID));
  console.log(`  wp_posts (products+variations): ${posts.length} (products only: ${productPostIds.size})`);

  const attachmentIds = new Set<number>();
  const wantedPostIds = new Set(posts.map((post) => post.ID));
  const postmetaWriter = openJsonl('postmeta.jsonl');
  let postmetaCount = 0;
  for await (const row of streamWpTable({
    filePath: dumpPath as string,
    tableName: 'wp_postmeta',
    filter: (r) => wantedPostIds.has(Number(r.post_id ?? 0)),
  })) {
    const meta = toWpPostMeta(row);
    postmetaWriter.write(meta);
    postmetaCount++;
    if (meta.meta_key === '_thumbnail_id' && meta.meta_value) {
      const id = Number(meta.meta_value);
      if (Number.isFinite(id) && id > 0) attachmentIds.add(id);
    }
    if (meta.meta_key === '_product_image_gallery' && meta.meta_value) {
      for (const part of String(meta.meta_value).split(',')) {
        const id = Number(part.trim());
        if (Number.isFinite(id) && id > 0) attachmentIds.add(id);
      }
    }
  }
  await postmetaWriter.close();
  console.log(`  wp_postmeta (products): ${postmetaCount}, referenced attachments=${attachmentIds.size}`);

  const attachmentWriter = openJsonl('attachments.jsonl');
  const allAttachmentIds = new Set<number>(attachmentIds);
  let attachmentCount = 0;
  for await (const row of streamWpTable({
    filePath: dumpPath as string,
    tableName: 'wp_posts',
    filter: (r) => {
      if (String(r.post_type ?? '') !== 'attachment') return false;
      const id = Number(r.ID ?? 0);
      const parent = Number(r.post_parent ?? 0);
      return attachmentIds.has(id) || productPostIds.has(parent);
    },
  })) {
    const post = toWpPost(row);
    attachmentWriter.write(post);
    allAttachmentIds.add(post.ID);
    attachmentCount++;
  }
  await attachmentWriter.close();
  console.log(`  wp_posts attachments: ${attachmentCount}`);

  const attachmentMetaWriter = openJsonl('attachment_meta.jsonl');
  let attachmentMetaCount = 0;
  for await (const row of streamWpTable({
    filePath: dumpPath as string,
    tableName: 'wp_postmeta',
    filter: (r) => allAttachmentIds.has(Number(r.post_id ?? 0)),
  })) {
    attachmentMetaWriter.write(toWpPostMeta(row));
    attachmentMetaCount++;
  }
  await attachmentMetaWriter.close();
  console.log(`  wp_postmeta (attachments): ${attachmentMetaCount}`);

  const summary = {
    dumpPath,
    extractedAt: new Date().toISOString(),
    upratna: {
      root_term_id: rootTerm.term_id,
      root_slug: rootTerm.slug,
      subtree_term_ids: [...subtreeTermIds].sort((a, b) => a - b),
    },
    counts: {
      terms: terms.length,
      term_taxonomy_product_cat: termTax.length,
      term_relationships_subtree: relationships.length,
      posts_products_or_variations: posts.length,
      products_only: productPostIds.size,
      postmeta_products: postmetaCount,
      attachments: attachmentCount,
      postmeta_attachments: attachmentMetaCount,
    },
  };
  const summaryWriter = openJsonl('_summary.json');
  summaryWriter.write(summary);
  await summaryWriter.close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
