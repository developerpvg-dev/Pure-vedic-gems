/**
 * Legacy blog migration: WordPress (.com SQL dump) → Sanity.
 *
 * Migrates all 398 published `blog` posts into Sanity `blogPost` documents,
 * seeds the 4 blog categories + 1 author, converts HTML body to Portable Text,
 * and uploads images to the Sanity asset pipeline.
 *
 * Idempotent: deterministic `_id`s (blog-<legacyId>) via createOrReplace.
 * Image uploads are cached on disk so re-runs skip already-uploaded binaries.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/blogs/migrate-blogs.ts --dry      (no writes)
 *   npx tsx scripts/legacy-import/blogs/migrate-blogs.ts            (live)
 *   npx tsx scripts/legacy-import/blogs/migrate-blogs.ts --limit 5  (first N posts)
 */
import path from 'node:path';
import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { createClient, type SanityClient } from '@sanity/client';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';
import {
  htmlToPortableText,
  isImageBlock,
  type PtNode,
  type PtImageBlock,
} from './html-to-portable-text.js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const DRY = process.argv.includes('--dry');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const DUMP = path.resolve('..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const IMAGE_CACHE_FILE = path.resolve(
  'scripts/legacy-import/blogs/.image-cache.json',
);

// ── Category mapping ────────────────────────────────────────────────────
// Old WP category name → Sanity category. "ALL BLOGS" is a virtual /blog
// link, NOT a stored category. Posts may carry several categories; we pick a
// single primary by this priority (most specific → most general).
const CATEGORY_DEFS = [
  { id: 'blog-cat-navratnas', title: 'Navratnas', slug: 'navratnas', description: 'Articles on the nine sacred Vedic gemstones (Navratnas) and their astrological significance.' },
  { id: 'blog-cat-our-products', title: 'Our Products', slug: 'our-products', description: 'Insights into our certified gemstones, rudraksha, and handcrafted jewellery.' },
  { id: 'blog-cat-spirituality', title: 'Spirituality', slug: 'spirituality', description: 'Vedic wisdom, rituals, and the spiritual heritage behind our gems.' },
  { id: 'blog-cat-astrology', title: 'Astrology', slug: 'astrology', description: 'Vedic astrology, planetary remedies, and gem prescription guidance.' },
] as const;

// Old category name → Sanity category id, in priority order.
const OLD_CAT_TO_ID: Record<string, string> = {
  Navratnas: 'blog-cat-navratnas',
  Products: 'blog-cat-our-products',
  Spirituality: 'blog-cat-spirituality',
  Astrology: 'blog-cat-astrology',
};
const CATEGORY_PRIORITY = ['blog-cat-navratnas', 'blog-cat-our-products', 'blog-cat-spirituality', 'blog-cat-astrology'];

const AUTHOR = {
  id: 'author-pvg-editorial',
  name: 'Pure Vedic Gems',
  slug: 'pure-vedic-gems',
  title: 'Editorial Team',
  bio: 'Four generations of Vedic gemstone expertise, sharing authentic knowledge on gems, rudraksha, astrology, and spirituality since 1937.',
};

// ── Helpers ─────────────────────────────────────────────────────────────
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96) || 'post';
}

function toIso(wpDate: string | null): string {
  // wpDate like "2021-03-17 11:58:00" (GMT). Fallback to epoch start if bad.
  if (!wpDate || wpDate.startsWith('0000')) return new Date('2014-01-01').toISOString();
  const iso = wpDate.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date('2014-01-01').toISOString() : d.toISOString();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveExcerpt(rawExcerpt: string, content: string): string {
  const base = (rawExcerpt && rawExcerpt.trim()) || stripHtml(content);
  if (base.length <= 220) return base;
  const cut = base.slice(0, 217);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 120 ? cut.slice(0, lastSpace) : cut).trim() + '…';
}

// ── Image cache (URL → Sanity asset _id) ────────────────────────────────
type ImageCache = Record<string, string>;
function loadImageCache(): ImageCache {
  try {
    return JSON.parse(fs.readFileSync(IMAGE_CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}
function saveImageCache(cache: ImageCache) {
  fs.writeFileSync(IMAGE_CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function uploadImage(
  client: SanityClient,
  url: string,
  cache: ImageCache,
): Promise<string | null> {
  if (cache[url]) return cache[url];
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) {
      console.warn(`    ⚠ image ${res.status}: ${url}`);
      return null;
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      console.warn(`    ⚠ not an image (${contentType}): ${url}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = decodeURIComponent(url.split('/').pop() || 'image.jpg').split('?')[0];
    const asset = await client.assets.upload('image', buffer, { filename, contentType });
    cache[url] = asset._id;
    saveImageCache(cache);
    return asset._id;
  } catch (err) {
    console.warn(`    ⚠ image failed: ${url} — ${(err as Error).message}`);
    return null;
  }
}

// ── Build category assignment map from the dump ─────────────────────────
async function buildCategoryMap(): Promise<Map<string, string>> {
  const terms = new Map<string, string>(); // term_id → name
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'pvg_terms' })) {
    terms.set(r.term_id as string, r.name as string);
  }
  const catByTaxId = new Map<string, string>(); // term_taxonomy_id → Sanity cat id
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'pvg_term_taxonomy' })) {
    if (r.taxonomy !== 'category') continue;
    const name = terms.get(r.term_id as string);
    if (name && OLD_CAT_TO_ID[name]) catByTaxId.set(r.term_taxonomy_id as string, OLD_CAT_TO_ID[name]);
  }
  const postCats = new Map<string, Set<string>>(); // post_id → Sanity cat ids
  for await (const r of streamWpTable({ filePath: DUMP, tableName: 'pvg_term_relationships' })) {
    const catId = catByTaxId.get(r.term_taxonomy_id as string);
    if (!catId) continue;
    const objId = r.object_id as string;
    const set = postCats.get(objId) ?? new Set<string>();
    set.add(catId);
    postCats.set(objId, set);
  }
  // Reduce to single primary category by priority.
  const primary = new Map<string, string>();
  for (const [postId, set] of postCats) {
    const chosen = CATEGORY_PRIORITY.find((c) => set.has(c)) ?? 'blog-cat-astrology';
    primary.set(postId, chosen);
  }
  return primary;
}

interface BuiltPost {
  _id: string;
  legacyId: string;
  doc: Record<string, unknown>;
  imageUrls: string[];
}

function buildPostDoc(
  row: Record<string, SqlValue>,
  categoryId: string,
): { built: BuiltPost; body: PtNode[] } {
  const legacyId = row.ID as string;
  const title = (row.post_title as string)?.trim() || 'Untitled';
  const slug = (row.post_name as string)?.trim() || slugify(title);
  const content = (row.post_content as string) ?? '';
  const { blocks } = htmlToPortableText(content);
  const publishedAt = toIso((row.post_date_gmt as string) || (row.post_date as string));
  const excerpt = deriveExcerpt((row.post_excerpt as string) ?? '', content);

  const imageUrls = blocks
    .filter(isImageBlock)
    .map((b) => (b as PtImageBlock)._srcUrl);

  const doc: Record<string, unknown> = {
    _id: `blog-${legacyId}`,
    _type: 'blogPost',
    title,
    slug: { _type: 'slug', current: slug },
    excerpt,
    category: { _type: 'reference', _ref: categoryId },
    author: { _type: 'reference', _ref: AUTHOR.id },
    body: blocks, // images resolved later
    featured: false,
    publishedAt,
    seoTitle: title.slice(0, 70),
    seoDescription: excerpt.slice(0, 160),
  };

  return {
    built: { _id: `blog-${legacyId}`, legacyId, doc, imageUrls },
    body: blocks,
  };
}

async function seedTaxonomy(client: SanityClient) {
  const txn = client.transaction();
  for (const c of CATEGORY_DEFS) {
    txn.createOrReplace({
      _id: c.id,
      _type: 'blogCategory',
      title: c.title,
      slug: { _type: 'slug', current: c.slug },
      description: c.description,
    });
  }
  txn.createOrReplace({
    _id: AUTHOR.id,
    _type: 'author',
    name: AUTHOR.name,
    slug: { _type: 'slug', current: AUTHOR.slug },
    title: AUTHOR.title,
    bio: AUTHOR.bio,
  });
  await txn.commit();
  console.log(`✓ Seeded ${CATEGORY_DEFS.length} categories + 1 author`);
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) {
    throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_TOKEN');
  }

  const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token });

  console.log(`\n=== Blog migration ${DRY ? '(DRY RUN)' : '(LIVE)'} ===`);
  console.log(`Project: ${projectId}/${dataset}`);

  console.log('\nBuilding category map from dump…');
  const categoryMap = await buildCategoryMap();
  console.log(`  ${categoryMap.size} posts have a category assignment`);

  if (!DRY) await seedTaxonomy(client);

  const imageCache = loadImageCache();
  let processed = 0;
  let withImage = 0;
  let imagesUploaded = 0;
  const catCounts: Record<string, number> = {};
  const slugSeen = new Set<string>();

  const pending: BuiltPost[] = [];

  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_posts',
    filter: (r) => r.post_type === 'blog' && r.post_status === 'publish',
  })) {
    if (processed >= LIMIT) break;
    processed++;

    const categoryId = categoryMap.get(row.ID as string) ?? 'blog-cat-astrology';
    catCounts[categoryId] = (catCounts[categoryId] ?? 0) + 1;

    const { built } = buildPostDoc(row, categoryId);

    // Ensure slug uniqueness.
    let slug = (built.doc.slug as { current: string }).current;
    if (slugSeen.has(slug)) slug = `${slug}-${built.legacyId}`;
    slugSeen.add(slug);
    (built.doc.slug as { current: string }).current = slug;

    if (built.imageUrls.length > 0) withImage++;

    if (DRY) {
      pending.push(built);
      if (processed <= 3) {
        console.log(`\n  [${built.legacyId}] ${built.doc.title}`);
        console.log(`    slug=${slug} cat=${categoryId} images=${built.imageUrls.length} blocks=${(built.doc.body as unknown[]).length}`);
        console.log(`    excerpt="${(built.doc.excerpt as string).slice(0, 80)}…"`);
      }
      continue;
    }

    // Resolve images: upload binaries, attach asset refs, promote first → mainImage.
    const body = built.doc.body as PtNode[];
    let mainImageSet = false;
    const resolvedBody: PtNode[] = [];
    for (const node of body) {
      if (!isImageBlock(node)) {
        resolvedBody.push(node);
        continue;
      }
      const assetId = await uploadImage(client, (node as PtImageBlock)._srcUrl, imageCache);
      if (!assetId) continue; // drop unreachable image
      imagesUploaded++;
      if (!mainImageSet) {
        built.doc.mainImage = {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
          alt: (node as PtImageBlock).alt || (built.doc.title as string),
        };
        mainImageSet = true;
        continue; // remove from body (it's now the hero)
      }
      resolvedBody.push({
        _type: 'imageBlock',
        _key: node._key,
        asset: { _type: 'reference', _ref: assetId },
        alt: (node as PtImageBlock).alt,
      } as unknown as PtNode);
    }
    // Strip the temp _srcUrl from any leftover (shouldn't remain).
    built.doc.body = resolvedBody;

    await client.createOrReplace(built.doc as never);
    if ((built.doc as { mainImage?: unknown }).mainImage) {
      // counted in withImage already
    }
    if (processed % 25 === 0) console.log(`  …${processed} posts migrated`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Processed posts : ${processed}`);
  console.log(`Posts w/ image  : ${withImage}`);
  if (!DRY) console.log(`Images uploaded : ${imagesUploaded} (cache size ${Object.keys(imageCache).length})`);
  console.log(`Category split  :`, catCounts);
  if (DRY) console.log(`\nDRY RUN — nothing written. Re-run without --dry to migrate.`);
  else console.log(`\n✓ Migration complete.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
