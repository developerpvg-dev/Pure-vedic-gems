import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const DUMP = path.resolve('..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const LEGACY_BASE = 'https://www.purevedicgems.com/videos/';

type VideoRow = {
  id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  date: string | null;
  youtubeId: string;
  categoryTermId: string | null;
};

type CategoryRow = {
  termId: string;
  name: string;
  slug: string;
};

function parseFlags(argv: string[]) {
  const write = argv.includes('--write');
  const writeProd = argv.includes('--write-prod');
  const limitArg = argv.find((arg) => arg.startsWith('--limit'));
  const limit = limitArg ? Number(limitArg.split('=')[1] ?? argv[argv.indexOf(limitArg) + 1]) : null;
  return { write, writeProd, limit: Number.isFinite(limit) ? limit : null };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod after dry-run review.`);
  }
  return dbHost;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/** Decode WordPress percent-encoded slugs so Hindi URLs match Next.js decoded params. */
function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function extractYouTubeId(...sources: string[]): string {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,40})/i,
    /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{6,40})/i,
    /youtube\.com\/watch\?[^"'\s]*v=([a-zA-Z0-9_-]{6,40})/i,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{6,40})/i,
    /[?&]v=([a-zA-Z0-9_-]{6,40})/i,
  ];
  for (const source of sources) {
    if (!source) continue;
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match?.[1]) return match[1];
    }
  }
  return '';
}

function cleanText(html: string) {
  return html
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&#8217;/gi, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function publishedAt(date: string | null) {
  const normalized = date?.includes(' ') ? `${date.replace(' ', 'T')}Z` : date ? `${date}T00:00:00Z` : null;
  const value = normalized ? new Date(normalized) : new Date();
  return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
}

/** Preferred display order for the known legacy video categories. */
const CATEGORY_ORDER: Record<string, number> = {
  'informational-videos-on-vedic-jyotish-remedies-basic': 1,
  'informational-videos-about-gemstones-and-rudrakshas': 2,
  'informational-videos-on-vedic-karmic-remedies-basic': 3,
  'informational-videos-on-astrological-remedies': 4,
  'ratna-suddhikaran-and-pran-pratishta': 5,
  'promotion-playlist-english': 6,
};

async function readCategories(): Promise<Map<string, CategoryRow>> {
  // term_taxonomy_id -> term_id for taxonomy 'vidoss_cat'
  const taxByTtId = new Map<string, string>();
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_term_taxonomy',
    filter: (record: Record<string, SqlValue>) => record.taxonomy === 'vidoss_cat',
  })) {
    taxByTtId.set(String(row.term_taxonomy_id), String(row.term_id));
  }

  const termIds = new Set([...taxByTtId.values()]);
  const categories = new Map<string, CategoryRow>();
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_terms',
    filter: (record: Record<string, SqlValue>) => termIds.has(String(record.term_id)),
  })) {
    const termId = String(row.term_id);
    categories.set(termId, {
      termId,
      name: String(row.name ?? '').trim(),
      slug: slugify(String(row.name ?? row.slug ?? '')),
    });
  }

  // expose ttId -> termId mapping via a side property on the returned map
  (categories as unknown as { taxByTtId: Map<string, string> }).taxByTtId = taxByTtId;
  return categories;
}

async function readVideos(categories: Map<string, CategoryRow>): Promise<VideoRow[]> {
  const taxByTtId = (categories as unknown as { taxByTtId: Map<string, string> }).taxByTtId;

  const posts = new Map<string, VideoRow>();
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_posts',
    filter: (record) => record.post_type === 'videos' && record.post_status === 'publish',
  })) {
    const id = String(row.ID ?? '');
    if (!id || !row.post_title) continue;
    const content = String(row.post_content ?? '');
    posts.set(id, {
      id,
      title: String(row.post_title).trim(),
      slug: decodeSlug(String(row.post_name ?? '').trim()),
      content,
      description: '',
      date: row.post_date_gmt || row.post_date || null,
      youtubeId: '',
      categoryTermId: null,
    });
  }

  // descriptions from postmeta
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_postmeta',
    filter: (record: Record<string, SqlValue>) =>
      posts.has(String(record.post_id)) && (record.meta_key === 'description' || record.meta_key === '_description'),
  })) {
    const post = posts.get(String(row.post_id));
    if (!post) continue;
    const value = String(row.meta_value ?? '').trim();
    if (value && (row.meta_key === 'description' || !post.description)) post.description = value;
  }

  // category relationships
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_term_relationships',
    filter: (record: Record<string, SqlValue>) =>
      posts.has(String(record.object_id)) && taxByTtId.has(String(record.term_taxonomy_id)),
  })) {
    const post = posts.get(String(row.object_id));
    if (!post || post.categoryTermId) continue;
    post.categoryTermId = taxByTtId.get(String(row.term_taxonomy_id)) ?? null;
  }

  for (const post of posts.values()) {
    post.youtubeId = extractYouTubeId(post.content, post.description);
    post.description = cleanText(post.description || post.content);
  }

  return [...posts.values()].sort((a, b) => {
    const ad = a.date ? new Date(a.date).getTime() : 0;
    const bd = b.date ? new Date(b.date).getTime() : 0;
    return ad - bd || Number(a.id) - Number(b.id);
  });
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Dump: ${DUMP}\n`);

  const categories = await readCategories();
  const videos = await readVideos(categories);
  const selected = flags.limit ? videos.slice(0, flags.limit) : videos;

  const missingYouTube = videos.filter((video) => !video.youtubeId);
  const uncategorised = videos.filter((video) => !video.categoryTermId);
  console.log(`Source published videos: ${videos.length}`);
  console.log(`Categories (vidoss_cat): ${categories.size}`);
  console.log(`Videos without a YouTube ID: ${missingYouTube.length}`);
  console.log(`Videos without a category: ${uncategorised.length}\n`);
  if (missingYouTube.length) {
    console.log('  Missing YouTube IDs (first 10):');
    for (const video of missingYouTube.slice(0, 10)) console.log(`   - [${video.id}] ${video.title}`);
    console.log('');
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let categoryCount = 0;
  let videoCount = 0;
  try {
    await client.query('BEGIN');

    // Upsert categories (skip empty ones) and remember UUID per legacy term id.
    const categoryIdByTerm = new Map<string, string>();
    const sortedCategories = [...categories.values()].sort(
      (a, b) => (CATEGORY_ORDER[a.slug] ?? 99) - (CATEGORY_ORDER[b.slug] ?? 99) || a.name.localeCompare(b.name),
    );
    for (const category of sortedCategories) {
      if (!category.name || !category.slug) continue;
      const result = await client.query(
        `INSERT INTO video_categories (title, slug, legacy_term_id, sort_order, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           legacy_term_id = EXCLUDED.legacy_term_id,
           sort_order = EXCLUDED.sort_order,
           updated_at = NOW()
         RETURNING id`,
        [category.name, category.slug, Number(category.termId), CATEGORY_ORDER[category.slug] ?? 50],
      );
      categoryIdByTerm.set(category.termId, result.rows[0].id);
      categoryCount++;
    }

    // Fallback "General" category for uncategorised videos.
    let generalCategoryId: string | null = null;
    if (uncategorised.length) {
      const result = await client.query(
        `INSERT INTO video_categories (title, slug, sort_order, is_active)
         VALUES ('Gemstone & Vedic Videos', 'gemstone-and-vedic-videos', 90, true)
         ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
      );
      generalCategoryId = result.rows[0].id;
    }

    const usedSlugs = new Set<string>();
    let order = 0;
    for (const video of selected) {
      if (!video.youtubeId) continue; // cannot embed without a YouTube id
      order++;
      let slug = video.slug || slugify(video.title) || `video-${video.id}`;
      if (usedSlugs.has(slug)) slug = `${slug}-${video.id}`;
      usedSlugs.add(slug);

      const categoryId = (video.categoryTermId && categoryIdByTerm.get(video.categoryTermId)) || generalCategoryId;
      const description = video.description ? video.description.slice(0, 4000) : null;
      const seoDescription = description ? description.replace(/\s+/g, ' ').slice(0, 320) : `Watch "${video.title}" — an educational video from Pure Vedic Gems.`;

      const result = await client.query(
        `INSERT INTO videos (
            legacy_wp_id, category_id, title, slug, youtube_url, youtube_id,
            description, legacy_url, seo_title, seo_description, sort_order,
            is_featured, is_active, published_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,true,$12)
         ON CONFLICT (slug) DO UPDATE SET
            legacy_wp_id = COALESCE(videos.legacy_wp_id, EXCLUDED.legacy_wp_id),
            category_id = EXCLUDED.category_id,
            title = EXCLUDED.title,
            youtube_url = EXCLUDED.youtube_url,
            youtube_id = EXCLUDED.youtube_id,
            description = EXCLUDED.description,
            legacy_url = EXCLUDED.legacy_url,
            seo_title = EXCLUDED.seo_title,
            seo_description = EXCLUDED.seo_description,
            sort_order = EXCLUDED.sort_order,
            published_at = EXCLUDED.published_at,
            updated_at = NOW()
         RETURNING id`,
        [
          Number(video.id),
          categoryId,
          video.title,
          slug,
          `https://www.youtube.com/watch?v=${video.youtubeId}`,
          video.youtubeId,
          description,
          `${LEGACY_BASE}${video.slug}/`,
          `${video.title} | Pure Vedic Gems`.slice(0, 300),
          seoDescription,
          order,
          publishedAt(video.date),
        ],
      );
      if (result.rows.length) videoCount++;
    }

    console.log(`Upserted categories: ${categoryCount}`);
    console.log(`Upserted videos: ${videoCount}`);

    if (flags.write) {
      await client.query('COMMIT');
      console.log('COMMITTED.');
    } else {
      await client.query('ROLLBACK');
      console.log('DRY-RUN: rolled back. Pass --write --write-prod to persist.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
