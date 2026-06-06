/**
 * upratna/05-media.ts
 *
 * Enumerate Upratna attachment IDs, download legacy images, convert to WebP,
 * and upload to Supabase Storage under the upratna/ prefix.
 */

import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import pgTypes from 'pg';
import sharp from 'sharp';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parseRunMode } from '../lib/supabase.js';

pgTypes.types.setTypeParser(20, (val: string) => parseInt(val, 10));

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? 'product-images';
const LEGACY_MEDIA_BASE_URL = (process.env.LEGACY_MEDIA_BASE_URL ?? 'https://www.purevedicgems.com/wp-content/uploads/').replace(/\/?$/, '/');
const DOWNLOAD_CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.LEGACY_IMPORT_DOWNLOAD_CONCURRENCY ?? '2') || 1));
const FETCH_TIMEOUT_MS = 30_000;

type CliFlags = { write: boolean; writeProd: boolean; enumerate: boolean; download: boolean };
type MediaCandidate = { legacy_attachment_id: number; legacy_url: string };

function parseFlags(argv: string[]): CliFlags {
  const writeProd = argv.includes('--write-prod');
  const rest = argv.filter((arg) => arg !== '--enumerate' && arg !== '--download' && arg !== '--write-prod');
  const { write } = parseRunMode(rest);
  return {
    write,
    writeProd,
    enumerate: argv.includes('--enumerate') || !argv.includes('--download'),
    download: argv.includes('--download'),
  };
}

function assertSafeTarget(dbUrl: string, write: boolean, writeProd: boolean) {
  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean);
  if (write && !writeProd && prodHosts.some((host) => normalised === host.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}". Add --write-prod only after dry-run review.`);
  }
  return dbHost;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
  const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  if (flags.download && flags.write && (!supaUrl || !supaKey)) throw new Error('Missing LEGACY_IMPORT_SUPABASE_URL or LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY.');

  const dbHost = assertSafeTarget(dbUrl, flags.write, flags.writeProd);
  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}${flags.writeProd ? ' (prod override)' : ''}  enumerate=${flags.enumerate}  download=${flags.download}`);
  console.log(`Host: ${dbHost}`);
  console.log(`Bucket: ${MEDIA_BUCKET}`);
  console.log(`Legacy media base: ${LEGACY_MEDIA_BASE_URL}\n`);

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    if (flags.enumerate) await enumerate(client, flags);
    if (flags.download) await download(client, flags, supaUrl!, supaKey!);
  } finally {
    await client.end();
  }
}

async function loadCandidates(client: Client): Promise<MediaCandidate[]> {
  const products = await client.query(`SELECT legacy_thumbnail_url, legacy_image_urls FROM legacy_import.stg_upratna_products`);
  const attachmentIds = new Set<number>();
  for (const row of products.rows) {
    const thumbnailId = row.legacy_thumbnail_url ? Number(row.legacy_thumbnail_url) : null;
    if (thumbnailId && Number.isFinite(thumbnailId) && thumbnailId > 0) attachmentIds.add(thumbnailId);
    const gallery = Array.isArray(row.legacy_image_urls) ? row.legacy_image_urls : [];
    for (const value of gallery) {
      const id = Number(value);
      if (Number.isFinite(id) && id > 0) attachmentIds.add(id);
    }
  }
  console.log(`Products: ${products.rows.length}`);
  console.log(`Distinct attachment IDs referenced: ${attachmentIds.size}`);
  if (attachmentIds.size === 0) return [];

  const paths = await client.query(
    `SELECT post_id, meta_value
       FROM legacy_import.stg_wp_postmeta
      WHERE meta_key = '_wp_attached_file'
        AND post_id = ANY($1::bigint[])`,
    [[...attachmentIds]],
  );
  const pathById = new Map<number, string>();
  for (const row of paths.rows) pathById.set(Number(row.post_id), String(row.meta_value));
  console.log(`Resolved _wp_attached_file: ${pathById.size}/${attachmentIds.size}`);

  const missing = [...attachmentIds].filter((id) => !pathById.has(id));
  if (missing.length) console.log(`  missing path for ${missing.length} attachment ids; sample: ${missing.slice(0, 5).join(', ')}`);
  return [...pathById].map(([id, path]) => ({ legacy_attachment_id: id, legacy_url: LEGACY_MEDIA_BASE_URL + path }));
}

async function enumerate(client: Client, flags: CliFlags): Promise<void> {
  console.log('--- Phase A: enumerate ---\n');
  const candidates = await loadCandidates(client);
  console.log(`Candidate URLs: ${candidates.length}\n`);
  for (const candidate of candidates.slice(0, 5)) console.log(`  ${candidate.legacy_url}`);

  if (!flags.write) {
    console.log('\nDry-run only. Pass --enumerate --write to populate stg_media_url_map. Add --write-prod after production review.');
    return;
  }

  const batch = 500;
  let processed = 0;
  for (let index = 0; index < candidates.length; index += batch) {
    const slice = candidates.slice(index, index + batch);
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let param = 1;
    for (const candidate of slice) {
      placeholders.push(`($${param++},$${param++})`);
      params.push(candidate.legacy_url, candidate.legacy_attachment_id);
    }
    await client.query(
      `INSERT INTO legacy_import.stg_media_url_map (legacy_url, legacy_attachment_id)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (legacy_url) DO NOTHING`,
      params,
    );
    processed += slice.length;
  }
  console.log(`\nstg_media_url_map for Upratna after upsert (${processed} processed):`);
  console.table((await mediaStatus(client, candidates.map((candidate) => candidate.legacy_url))).rows);
}

async function download(client: Client, flags: CliFlags, supaUrl: string, supaKey: string): Promise<void> {
  const candidates = await loadCandidates(client);
  const candidateUrls = candidates.map((candidate) => candidate.legacy_url);
  if (!flags.write) {
    console.log('--- Phase B: dry-run ---\n');
    console.table((await mediaStatus(client, candidateUrls)).rows);
    console.log('\nDownload requires --write. Add --write-prod after production review.');
    return;
  }

  console.log('--- Phase B: download + WebP + upload ---\n');
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: bucket } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!bucket) {
    console.log(`Creating bucket "${MEDIA_BUCKET}" (public)...`);
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, { public: true });
    if (error) throw error;
  }

  const pending = await client.query(
    `SELECT legacy_url, legacy_attachment_id
       FROM legacy_import.stg_media_url_map
      WHERE legacy_url = ANY($1::text[])
        AND download_status IN ('pending','failed')
      ORDER BY legacy_url`,
    [candidateUrls],
  );
  console.log(`Pending Upratna rows: ${pending.rows.length}`);
  if (pending.rows.length === 0) return;

  let done = 0;
  let ok = 0;
  let failed = 0;
  let duplicates = 0;
  const queue = [...pending.rows];

  async function worker(id: number) {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      done++;
      try {
        const result = await processOne(client, supabase, job.legacy_url, Number(job.legacy_attachment_id));
        if (result === 'duplicate') duplicates++;
        else ok++;
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        await client.query(
          `UPDATE legacy_import.stg_media_url_map
              SET download_status='failed', download_error=$2
            WHERE legacy_url=$1`,
          [job.legacy_url, message.slice(0, 500)],
        );
      }
      if (done % 50 === 0 || done === pending.rows.length) {
        process.stdout.write(`\r  [w${id}] processed ${done}/${pending.rows.length}  ok=${ok} dup=${duplicates} failed=${failed}   `);
      }
    }
  }

  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, (_, index) => worker(index + 1)));
  console.log(`\n\nDone. ok=${ok} duplicates=${duplicates} failed=${failed}`);
  console.table((await mediaStatus(client, candidateUrls)).rows);
}

async function processOne(client: Client, supabase: SupabaseClient, legacyUrl: string, attachmentId: number): Promise<'ok' | 'duplicate'> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let bytes: Buffer;
  try {
    const response = await fetch(legacyUrl, { signal: ac.signal, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }

  const sha = createHash('sha256').update(bytes).digest('hex');
  const duplicate = await client.query(
    `SELECT storage_bucket, storage_path, public_url, width, height, mime_type, bytes
       FROM legacy_import.stg_media_url_map
      WHERE sha256=$1 AND download_status='ok'
      LIMIT 1`,
    [sha],
  );
  if (duplicate.rows.length > 0) {
    const row = duplicate.rows[0];
    await client.query(
      `UPDATE legacy_import.stg_media_url_map
          SET sha256=$2, storage_bucket=$3, storage_path=$4, public_url=$5,
              width=$6, height=$7, mime_type=$8, bytes=$9,
              download_status='ok', download_error=NULL, completed_at=NOW()
        WHERE legacy_url=$1`,
      [legacyUrl, sha, row.storage_bucket, row.storage_path, row.public_url, row.width, row.height, row.mime_type, row.bytes],
    );
    return 'duplicate';
  }

  const image = sharp(bytes, { failOn: 'none' }).rotate();
  const sourceMeta = await image.metadata();
  const webp = await image.webp({ quality: 82 }).toBuffer();
  const finalMeta = await sharp(webp).metadata();
  const key = `upratna/${sha.slice(0, 2)}/${sha}.webp`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(key, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(`upload: ${error.message}`);

  const { data: publicUrl } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key);
  await client.query(
    `UPDATE legacy_import.stg_media_url_map
        SET sha256=$2, storage_bucket=$3, storage_path=$4, public_url=$5,
            width=$6, height=$7, mime_type='image/webp', bytes=$8,
            download_status='ok', download_error=NULL, completed_at=NOW()
      WHERE legacy_url=$1`,
    [legacyUrl, sha, MEDIA_BUCKET, key, publicUrl.publicUrl, finalMeta.width ?? sourceMeta.width ?? null, finalMeta.height ?? sourceMeta.height ?? null, webp.byteLength],
  );

  void attachmentId;
  return 'ok';
}

function mediaStatus(client: Client, candidateUrls: string[]) {
  return client.query(
    `SELECT download_status, count(*)::int AS rows
       FROM legacy_import.stg_media_url_map
      WHERE legacy_url = ANY($1::text[])
      GROUP BY 1
      ORDER BY 1`,
    [candidateUrls],
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
