import path from 'node:path';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@sanity/client';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..', '..');
const workspaceRoot = resolve(appRoot, '..');
const dump = resolve(
  process.env.LEGACY_BLOG_SQL_DUMP_PATH ||
    resolve(workspaceRoot, 'latestsqldump', 'purevedi_comnewlive(1).sql'),
);

loadEnv({ path: resolve(appRoot, '.env.local'), override: true });

const WRITE = process.argv.includes('--write');
const SITE_NAME = 'Pure Vedic Gems';
const TITLE_KEYS = ['_yoast_wpseo_title', '_aioseo_title', 'rank_math_title'];
const DESCRIPTION_KEYS = ['_yoast_wpseo_metadesc', '_aioseo_description', 'rank_math_description'];
const META_KEYS = new Set([...TITLE_KEYS, ...DESCRIPTION_KEYS]);

type LegacyPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
};

type SeoMeta = {
  title?: string;
  description?: string;
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWord(value: string, max: number) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function deriveExcerpt(post: LegacyPost) {
  const base = post.excerpt.trim() || stripHtml(post.content);
  return truncateAtWord(base, 160);
}

function normalizeSeoValue(value: string, post: LegacyPost, max: number) {
  const excerpt = deriveExcerpt(post);
  const replaced = value
    .replace(/%%title%%/gi, post.title)
    .replace(/%%sitename%%/gi, SITE_NAME)
    .replace(/%%sep%%/gi, '-')
    .replace(/%%excerpt%%/gi, excerpt)
    .replace(/%%excerpt_only%%/gi, excerpt)
    .replace(/%%page%%/gi, '')
    .replace(/%%primary_category%%/gi, '')
    .replace(/%%category%%/gi, '')
    .replace(/\s+-\s+-\s+/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return truncateAtWord(stripHtml(replaced), max);
}

function pickFirst(record: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]?.trim();
    if (value) return value;
  }
  return null;
}

async function readLegacySeo(): Promise<Map<string, SeoMeta>> {
  const posts = new Map<string, LegacyPost>();
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'pvg_posts',
    filter: (record) => record.post_type === 'blog' && record.post_status === 'publish',
  })) {
    const id = String(row.ID ?? '');
    const title = String(row.post_title ?? '').trim();
    if (!id || !title) continue;
    posts.set(id, {
      id,
      title,
      excerpt: String(row.post_excerpt ?? ''),
      content: String(row.post_content ?? ''),
    });
  }

  const rawMeta = new Map<string, Record<string, string>>();
  for await (const row of streamWpTable({
    filePath: dump,
    tableName: 'pvg_postmeta',
    filter: (record: Record<string, SqlValue>) => posts.has(String(record.post_id)) && META_KEYS.has(String(record.meta_key)),
  })) {
    const postId = String(row.post_id ?? '');
    const key = String(row.meta_key ?? '');
    const value = String(row.meta_value ?? '').trim();
    if (!value) continue;
    const record = rawMeta.get(postId) ?? {};
    record[key] = value;
    rawMeta.set(postId, record);
  }

  const seo = new Map<string, SeoMeta>();
  for (const [postId, record] of rawMeta) {
    const post = posts.get(postId);
    if (!post) continue;
    const title = pickFirst(record, TITLE_KEYS);
    const description = pickFirst(record, DESCRIPTION_KEYS);
    const normalized: SeoMeta = {};
    if (title) normalized.title = normalizeSeoValue(title, post, 70);
    if (description) normalized.description = normalizeSeoValue(description, post, 160);
    if (normalized.title || normalized.description) seo.set(postId, normalized);
  }
  return seo;
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) throw new Error('Missing Sanity project id or token.');

  const seo = await readLegacySeo();
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY-RUN'}`);
  console.log(`Legacy blog posts with custom SEO meta: ${seo.size}`);

  const samples = [...seo.entries()].slice(0, 5).map(([id, value]) => ({ id, ...value }));
  console.table(samples);

  if (!WRITE) {
    console.log('DRY-RUN: pass --write to patch Sanity blog SEO fields.');
    return;
  }

  const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token });
  let patched = 0;
  const entries = [...seo.entries()];
  for (let index = 0; index < entries.length; index += 100) {
    const batch = entries.slice(index, index + 100);
    let transaction = client.transaction();
    for (const [legacyId, fields] of batch) {
      transaction = transaction.patch(`blog-${legacyId}`, (patch) => patch.set({
        ...(fields.title ? { seoTitle: fields.title } : {}),
        ...(fields.description ? { seoDescription: fields.description } : {}),
      }));
    }
    await transaction.commit();
    patched += batch.length;
  }
  console.log(`Patched Sanity blog SEO docs: ${patched}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
