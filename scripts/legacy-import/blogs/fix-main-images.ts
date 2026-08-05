/**
 * Fix blog main images: set each post's `mainImage` to the authoritative
 * WordPress *featured image* (postmeta `_thumbnail_id`), using the full-size
 * original resolved from `_wp_attached_file` (falling back to the attachment
 * guid). This corrects both:
 *   - posts that ended up with NO image, and
 *   - posts whose first inline image was decorative / wrong.
 *
 * Idempotent. Reuses the shared image upload cache so re-runs are cheap.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/blogs/fix-main-images.ts --dry
 *   npx tsx scripts/legacy-import/blogs/fix-main-images.ts
 */
import path from 'node:path';
import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { createClient, type SanityClient } from '@sanity/client';
import { streamWpTable } from '../lib/wp-sql.js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const DRY = process.argv.includes('--dry');
const DUMP = path.resolve(
  process.env.LEGACY_BLOG_SQL_DUMP_PATH ||
    path.join('..', 'latestsqldump', 'purevedi_comnewlive(1).sql'),
);
const IMAGE_CACHE_FILE = path.resolve('scripts/legacy-import/blogs/.image-cache.json');
const UPLOADS_BASE = 'https://www.purevedicgems.com/wp-content/uploads/';

type ImageCache = Record<string, string>;
function loadImageCache(): ImageCache {
  try { return JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf8')); } catch { return {}; }
}
function saveImageCache(cache: ImageCache) {
  fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function uploadImage(client: SanityClient, url: string, cache: ImageCache): Promise<string | null> {
  if (cache[url]) return cache[url];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) {
        if (res.status >= 500 && attempt < 3) continue;
        console.warn(`    ⚠ image ${res.status}: ${url}`);
        return null;
      }
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      if (!contentType.startsWith('image/')) { console.warn(`    ⚠ not image (${contentType}): ${url}`); return null; }
      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = decodeURIComponent(url.split('/').pop() || 'image.jpg').split('?')[0];
      const asset = await client.assets.upload('image', buffer, { filename, contentType });
      cache[url] = asset._id;
      saveImageCache(cache);
      return asset._id;
    } catch (err) {
      if (attempt < 3) continue;
      console.warn(`    ⚠ image failed: ${url} — ${(err as Error).message}`);
      return null;
    }
  }
  return null;
}

function normalizeUrl(u: string): string {
  return u.replace(/^http:\/\//i, 'https://');
}

async function main() {
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN,
  });

  console.log(`\n=== Fix main images ${DRY ? '(DRY RUN)' : '(LIVE)'} ===`);

  // Published blog ids + titles.
  const blogs = new Map<string, string>();
  for await (const r of streamWpTable({
    filePath: DUMP, tableName: 'pvg_posts',
    filter: (row) => row.post_type === 'blog' && row.post_status === 'publish',
  })) blogs.set(r.ID as string, (r.post_title as string) ?? '');

  // _thumbnail_id + _wp_attached_file meta.
  const thumbId = new Map<string, string>();
  const attachedFile = new Map<string, string>();
  for await (const r of streamWpTable({
    filePath: DUMP, tableName: 'pvg_postmeta',
    filter: (row) => row.meta_key === '_thumbnail_id' || row.meta_key === '_wp_attached_file',
  })) {
    if (r.meta_key === '_thumbnail_id') {
      if (blogs.has(r.post_id as string)) thumbId.set(r.post_id as string, r.meta_value as string);
    } else {
      attachedFile.set(r.post_id as string, r.meta_value as string);
    }
  }
  // attachment guid fallback.
  const guid = new Map<string, string>();
  for await (const r of streamWpTable({
    filePath: DUMP, tableName: 'pvg_posts',
    filter: (row) => row.post_type === 'attachment',
  })) guid.set(r.ID as string, r.guid as string);

  function featuredUrl(postId: string): string | null {
    const att = thumbId.get(postId);
    if (!att) return null;
    const file = attachedFile.get(att);
    if (file && /\.(jpe?g|png|webp|gif)$/i.test(file)) return UPLOADS_BASE + file;
    const g = guid.get(att);
    return g ? normalizeUrl(g) : null;
  }

  const cache = loadImageCache();
  let updated = 0, skipped = 0, failed = 0;

  for (const [postId, title] of blogs) {
    const url = featuredUrl(postId);
    if (!url) { skipped++; continue; }

    if (DRY) {
      if (updated < 8) console.log(`  blog-${postId}  ${title.slice(0, 50)}  -> ${url}`);
      updated++;
      continue;
    }

    const assetId = await uploadImage(client, url, cache);
    if (!assetId) { failed++; continue; }

    await client
      .patch(`blog-${postId}`)
      .set({
        mainImage: {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
          alt: title || 'Pure Vedic Gems',
        },
      })
      .commit();
    updated++;
    if (updated % 25 === 0) console.log(`  …${updated} updated`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated : ${updated}`);
  console.log(`Skipped (no featured image): ${skipped}`);
  if (!DRY) console.log(`Failed  : ${failed}`);
  console.log(DRY ? '\nDRY RUN — nothing written.' : '\n✓ Main images fixed.');
}
main().catch((e) => { console.error(e); process.exit(1); });
