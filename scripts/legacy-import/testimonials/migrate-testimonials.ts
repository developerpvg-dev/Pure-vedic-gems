import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { streamWpTable, type SqlValue } from '../lib/wp-sql.js';
import { ownMediaUrl } from '../lib/own-media-url.js';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const DUMP = path.resolve('..', 'purevedi_comnewlive', 'purevedi_comnewlive.sql');
const PROOF_DIR = path.resolve('public', 'legacy', 'testimonials');
const PUBLIC_PROOF_BASE = '/legacy/testimonials/';

type TestimonialRow = {
  id: string;
  date: string | null;
  name: string;
  location: string;
  slug: string;
  proofUrl: string;
  message: string;
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

function buildProofIndex() {
  const files = fs.existsSync(PROOF_DIR) ? fs.readdirSync(PROOF_DIR) : [];
  const byBase = new Map<string, string>();
  const score = (name: string) => name.endsWith('.webp') ? 0 : name.endsWith('.jpg') || name.endsWith('.jpeg') ? 1 : 2;
  for (const file of files.sort((a, b) => score(a) - score(b))) {
    const base = file.replace(/\.(webp|jpe?g|png)$/i, '');
    if (!byBase.has(base)) byBase.set(base, file);
  }
  return byBase;
}

function normalizeUrl(url: string | null | undefined) {
  return url ? url.replace(/^http:\/\//i, 'https://') : '';
}

function proofUrlFor(row: TestimonialRow, proofIndex: Map<string, string>) {
  if (!row.proofUrl) return null;
  const local = proofIndex.get(`${row.slug}-proof`);
  if (local) return PUBLIC_PROOF_BASE + local;
  return normalizeUrl(row.proofUrl);
}

function publishedAt(date: string | null) {
  const normalized = date?.includes(' ')
    ? `${date.replace(' ', 'T')}Z`
    : date ? `${date}T00:00:00Z` : null;
  const value = normalized ? new Date(normalized) : new Date();
  return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
}

function cleanMessage(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function readTestimonials(): Promise<TestimonialRow[]> {
  const posts = new Map<string, TestimonialRow>();
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_posts',
    filter: (record) => record.post_type === 'testimonial' && record.post_status === 'publish',
  })) {
    const id = String(row.ID ?? '');
    const message = cleanMessage(String(row.post_content ?? ''));
    if (!id || !row.post_name || !row.post_title || !message) continue;
    posts.set(id, {
      id,
      date: row.post_date_gmt || row.post_date || null,
      name: String(row.post_title).trim(),
      location: '',
      slug: String(row.post_name).trim(),
      proofUrl: '',
      message,
    });
  }

  const thumbByPost = new Map<string, string>();
  const attachedFileById = new Map<string, string>();
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_postmeta',
    filter: (record: Record<string, SqlValue>) =>
      (posts.has(String(record.post_id)) && (record.meta_key === 'user_location' || record.meta_key === '_thumbnail_id')) ||
      record.meta_key === '_wp_attached_file',
  })) {
    if (row.meta_key === 'user_location') {
      const post = posts.get(String(row.post_id));
      if (post) post.location = String(row.meta_value ?? '').trim();
    } else if (row.meta_key === '_thumbnail_id') {
      thumbByPost.set(String(row.post_id), String(row.meta_value ?? ''));
    } else if (row.meta_key === '_wp_attached_file') {
      attachedFileById.set(String(row.post_id), String(row.meta_value ?? ''));
    }
  }

  const guidById = new Map<string, string>();
  for await (const row of streamWpTable({
    filePath: DUMP,
    tableName: 'pvg_posts',
    filter: (record) => record.post_type === 'attachment',
  })) {
    guidById.set(String(row.ID), normalizeUrl(row.guid));
  }

  for (const [postId, post] of posts) {
    const thumbId = thumbByPost.get(postId);
    if (!thumbId) continue;
    const attachedFile = attachedFileById.get(thumbId);
    post.proofUrl = attachedFile
      ? `https://www.purevedicgems.com/wp-content/uploads/${attachedFile}`
      : guidById.get(thumbId) ?? '';
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

  const proofIndex = buildProofIndex();
  const rows = await readTestimonials();
  const selected = flags.limit ? rows.slice(0, flags.limit) : rows;
  console.log(`Source testimonials: ${rows.length}`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let upserted = 0;
  try {
    await client.query('BEGIN');
    for (const row of selected) {
      const rawProof = proofUrlFor(row, proofIndex);
      const proof = flags.write && rawProof ? await ownMediaUrl(rawProof) : rawProof;
      const result = await client.query(
        `INSERT INTO testimonials (
          legacy_wp_id, slug, name, location, rating, title, message, proof_image_url, proof_alt,
          source_url, status, is_active, show_on_homepage, sort_order, published_at, legacy_data
        ) VALUES ($1,$2,$3,$4,5,$5,$6,$7,$8,$9,'approved',true,false,$10,$11,$12::jsonb)
        ON CONFLICT (slug) DO UPDATE SET
          legacy_wp_id = COALESCE(testimonials.legacy_wp_id, EXCLUDED.legacy_wp_id),
          name = EXCLUDED.name,
          location = EXCLUDED.location,
          title = EXCLUDED.title,
          message = EXCLUDED.message,
          proof_image_url = EXCLUDED.proof_image_url,
          proof_alt = EXCLUDED.proof_alt,
          source_url = EXCLUDED.source_url,
          status = 'approved',
          is_active = true,
          published_at = EXCLUDED.published_at,
          legacy_data = testimonials.legacy_data || EXCLUDED.legacy_data,
          updated_at = NOW()
        RETURNING id`,
        [
          Number(row.id),
          row.slug,
          row.name,
          row.location || null,
          `Testimonial by ${row.name}`,
          row.message,
          proof,
          proof ? `Proof from ${row.name}` : null,
          `https://www.purevedicgems.com/testimonial/${row.slug}/`,
          upserted + 1,
          publishedAt(row.date),
          JSON.stringify({ source: 'purevedi_comnewlive.sql', originalProofUrl: row.proofUrl || null }),
        ],
      );
      if (result.rows.length) upserted++;
    }
    console.log(`Upserted testimonials: ${upserted}`);
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
  console.error(error);
  process.exit(1);
});
