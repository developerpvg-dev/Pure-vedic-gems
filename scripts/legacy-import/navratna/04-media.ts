/**
 * navratna/04-media.ts
 *
 * Two phases:
 *
 *   Phase A (no flag, or --enumerate):
 *     Walk stg_navratna_products + stg_wp_postmeta to resolve every
 *     legacy attachment ID to its `_wp_attached_file` path, build the
 *     full legacy URL, and upsert into stg_media_url_map with
 *     download_status='pending'. No network calls.
 *
 *   Phase B (--download --write):
 *     Process every row where download_status='pending':
 *       - GET the legacy URL (3 retries, 30s timeout)
 *       - sha256 the bytes → dedupe (skip if a row with same sha is 'ok')
 *       - sharp(...).webp() at the original resolution, quality 82
 *       - upload to Supabase Storage bucket (env MEDIA_BUCKET, default
 *         'product-images'), key navratna/<sha-prefix-2>/<sha>.webp
 *       - update the row to 'ok' with storage_path / public_url / width /
 *         height / mime / bytes
 *
 * Idempotent in both phases. Re-running Phase A is a no-op for known URLs.
 * Re-running Phase B picks up any 'pending' or 'failed' rows.
 *
 * Usage:
 *   npx tsx scripts/legacy-import/navratna/04-media.ts                 # enumerate (dry-run)
 *   npx tsx scripts/legacy-import/navratna/04-media.ts --enumerate --write
 *   npx tsx scripts/legacy-import/navratna/04-media.ts --download --write
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
const LEGACY_MEDIA_BASE_URL = (process.env.LEGACY_MEDIA_BASE_URL
  ?? 'https://www.purevedicgems.com/wp-content/uploads/').replace(/\/?$/, '/');
const DOWNLOAD_CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 30_000;

interface CliFlags { write: boolean; enumerate: boolean; download: boolean }

function parseFlags(argv: string[]): CliFlags {
  const { write } = parseRunMode(argv.filter((a) => a !== '--enumerate' && a !== '--download'));
  return {
    write,
    enumerate: argv.includes('--enumerate') || !argv.includes('--download'),
    download: argv.includes('--download'),
  };
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  const dbUrl = process.env.LEGACY_IMPORT_DATABASE_URL;
  const supaUrl = process.env.LEGACY_IMPORT_SUPABASE_URL;
  const supaKey = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl) throw new Error('Missing LEGACY_IMPORT_DATABASE_URL.');
  if (flags.download && (!supaUrl || !supaKey)) {
    throw new Error('Missing LEGACY_IMPORT_SUPABASE_URL or LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY.');
  }

  const dbHost = new URL(dbUrl).hostname.toLowerCase();
  const normalised = dbHost.startsWith('db.') ? dbHost.slice(3) : dbHost;
  const prodHosts = (process.env.PROD_SUPABASE_HOSTS ?? '')
    .split(',').map((h) => h.trim()).filter(Boolean);
  if (flags.write && prodHosts.some((h) => normalised === h.toLowerCase())) {
    throw new Error(`Refusing to --write against production host "${dbHost}".`);
  }

  console.log(`Mode: ${flags.write ? 'WRITE' : 'DRY-RUN'}  enumerate=${flags.enumerate}  download=${flags.download}`);
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

interface MediaCandidate {
  legacy_attachment_id: number;
  legacy_url: string;
}

async function enumerate(client: Client, flags: CliFlags): Promise<void> {
  console.log('--- Phase A: enumerate ---\n');

  const products = await client.query(`
    SELECT legacy_woo_id, legacy_thumbnail_url, legacy_image_urls
    FROM legacy_import.stg_navratna_products`);
  console.log(`Products: ${products.rows.length}`);

  const attachmentIds = new Set<number>();
  for (const r of products.rows) {
    const tid = r.legacy_thumbnail_url ? Number(r.legacy_thumbnail_url) : null;
    if (tid && Number.isFinite(tid) && tid > 0) attachmentIds.add(tid);
    const gallery = Array.isArray(r.legacy_image_urls) ? r.legacy_image_urls : [];
    for (const g of gallery) {
      const n = Number(g);
      if (Number.isFinite(n) && n > 0) attachmentIds.add(n);
    }
  }
  console.log(`Distinct attachment IDs referenced: ${attachmentIds.size}`);

  if (attachmentIds.size === 0) {
    console.log('Nothing to enumerate.');
    return;
  }

  // Resolve attachment_id -> _wp_attached_file path via stg_wp_postmeta.
  const pmRes = await client.query(
    `SELECT post_id, meta_value FROM legacy_import.stg_wp_postmeta
       WHERE meta_key = '_wp_attached_file' AND post_id = ANY($1::bigint[])`,
    [[...attachmentIds]],
  );
  const pathById = new Map<number, string>();
  for (const r of pmRes.rows) pathById.set(Number(r.post_id), String(r.meta_value));
  console.log(`Resolved _wp_attached_file: ${pathById.size}/${attachmentIds.size}`);

  const missing = [...attachmentIds].filter((id) => !pathById.has(id));
  if (missing.length) console.log(`  (missing path for ${missing.length} attachment ids — sample: ${missing.slice(0, 5).join(', ')})`);

  const candidates: MediaCandidate[] = [];
  for (const [id, path] of pathById) {
    candidates.push({
      legacy_attachment_id: id,
      legacy_url: LEGACY_MEDIA_BASE_URL + path,
    });
  }
  console.log(`Candidate URLs: ${candidates.length}\n`);

  // Show a few samples
  console.log('Sample URLs:');
  for (const c of candidates.slice(0, 5)) console.log(`  ${c.legacy_url}`);

  if (!flags.write) {
    console.log('\nDry-run only. Pass --enumerate --write to populate stg_media_url_map.');
    return;
  }

  // Batch insert; ON CONFLICT keeps existing row (preserves any sha/storage info).
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < candidates.length; i += BATCH) {
    const slice = candidates.slice(i, i + BATCH);
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const c of slice) {
      placeholders.push(`($${p++},$${p++})`);
      params.push(c.legacy_url, c.legacy_attachment_id);
    }
    await client.query(
      `INSERT INTO legacy_import.stg_media_url_map (legacy_url, legacy_attachment_id)
         VALUES ${placeholders.join(',')}
         ON CONFLICT (legacy_url) DO NOTHING`,
      params,
    );
    inserted += slice.length;
  }

  const { rows: nRows } = await client.query(
    `SELECT download_status, COUNT(*)::int n FROM legacy_import.stg_media_url_map GROUP BY 1 ORDER BY 1`);
  console.log(`\nstg_media_url_map after upsert (${inserted} processed):`);
  for (const r of nRows) console.log(`  ${r.download_status.padEnd(10)} ${r.n}`);
}

async function download(client: Client, flags: CliFlags, supaUrl: string, supaKey: string): Promise<void> {
  if (!flags.write) {
    console.log('--- Phase B requires --write ---');
    return;
  }
  console.log('--- Phase B: download + WebP + upload ---\n');

  const supabase = createClient(supaUrl, supaKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Ensure bucket exists.
  const { data: bucket } = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!bucket) {
    console.log(`Creating bucket "${MEDIA_BUCKET}" (public)...`);
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, { public: true });
    if (error) throw error;
  }

  const { rows: pending } = await client.query(
    `SELECT legacy_url, legacy_attachment_id
       FROM legacy_import.stg_media_url_map
       WHERE download_status IN ('pending','failed')`);
  console.log(`Pending rows: ${pending.length}`);
  if (pending.length === 0) return;

  let done = 0, ok = 0, failed = 0, skippedDup = 0;
  const queue = [...pending];

  async function worker(id: number) {
    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) break;
      done++;
      try {
        const result = await processOne(client, supabase, job.legacy_url, job.legacy_attachment_id);
        if (result === 'duplicate') skippedDup++;
        else ok++;
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        await client.query(
          `UPDATE legacy_import.stg_media_url_map
             SET download_status='failed', download_error=$2
             WHERE legacy_url=$1`,
          [job.legacy_url, msg.slice(0, 500)],
        );
      }
      if (done % 50 === 0 || done === pending.length) {
        process.stdout.write(`\r  [w${id}] processed ${done}/${pending.length}  ok=${ok} dup=${skippedDup} failed=${failed}   `);
      }
    }
  }

  await Promise.all(
    Array.from({ length: DOWNLOAD_CONCURRENCY }, (_, i) => worker(i + 1)),
  );
  console.log(`\n\nDone. ok=${ok}  duplicates=${skippedDup}  failed=${failed}`);
}

async function processOne(
  client: Client,
  supabase: SupabaseClient,
  legacyUrl: string,
  attachmentId: number,
): Promise<'ok' | 'duplicate'> {
  // Download with timeout
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let bytes: Buffer;
  try {
    const res = await fetch(legacyUrl, { signal: ac.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    bytes = Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }

  const sha = createHash('sha256').update(bytes).digest('hex');

  // Dedupe: if another row already uploaded the same sha, reuse it.
  const dup = await client.query(
    `SELECT storage_bucket, storage_path, public_url, width, height, mime_type, bytes
       FROM legacy_import.stg_media_url_map
       WHERE sha256=$1 AND download_status='ok' LIMIT 1`,
    [sha],
  );
  if (dup.rows.length > 0) {
    const d = dup.rows[0];
    await client.query(
      `UPDATE legacy_import.stg_media_url_map
          SET sha256=$2, storage_bucket=$3, storage_path=$4, public_url=$5,
              width=$6, height=$7, mime_type=$8, bytes=$9,
              download_status='ok', download_error=NULL, completed_at=NOW()
        WHERE legacy_url=$1`,
      [legacyUrl, sha, d.storage_bucket, d.storage_path, d.public_url, d.width, d.height, d.mime_type, d.bytes],
    );
    return 'duplicate';
  }

  // Convert to WebP
  const img = sharp(bytes, { failOn: 'none' }).rotate(); // honour EXIF orientation
  const meta = await img.metadata();
  const webp = await img.webp({ quality: 82 }).toBuffer();
  const finalMeta = await sharp(webp).metadata();

  const key = `navratna/${sha.slice(0, 2)}/${sha}.webp`;
  const { error: upErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(key, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key);

  await client.query(
    `UPDATE legacy_import.stg_media_url_map
        SET sha256=$2, storage_bucket=$3, storage_path=$4, public_url=$5,
            width=$6, height=$7, mime_type='image/webp', bytes=$8,
            download_status='ok', download_error=NULL, completed_at=NOW()
      WHERE legacy_url=$1`,
    [legacyUrl, sha, MEDIA_BUCKET, key, pub.publicUrl,
      finalMeta.width ?? meta.width ?? null,
      finalMeta.height ?? meta.height ?? null,
      webp.byteLength],
  );

  void attachmentId; // kept for tracing in failed rows
  return 'ok';
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
