/**
 * Copy `site-static` objects from Supabase Storage → Cloudflare R2.
 * Keys: site-static/{objectPath} so CDN URL is https://cdn…/site-static/{path}
 *
 * Usage:
 *   node scripts/copy-site-static-to-r2.mjs
 *   node scripts/copy-site-static-to-r2.mjs --dry-run
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *      R2_BUCKET (default pvg-public)
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(__dirname, 'site-static-offload.json'), 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const KEY_PREFIX = manifest.bucket; // site-static

function loadEnvFile(name) {
  const p = join(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET || 'pvg-public';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!dryRun && (!accountId || !accessKey || !secretKey)) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIME = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.css': 'text/css',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const s3 = dryRun
  ? null
  : new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

async function r2Put(objectKey, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
}

async function listAll(prefix = '') {
  const files = [];
  let offset = 0;
  const limit = 100;
  const IMAGE_EXT = new Set(Object.keys(MIME));
  for (;;) {
    const { data, error } = await supabase.storage.from(manifest.bucket).list(prefix || undefined, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list "${prefix}": ${error.message}`);
    if (!data?.length) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFile = Boolean(entry.metadata) || IMAGE_EXT.has(extname(entry.name).toLowerCase());
      if (isFile) files.push(path);
      else files.push(...(await listAll(path)));
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function downloadSupabase(objectPath) {
  const { data, error } = await supabase.storage.from(manifest.bucket).download(objectPath);
  if (error || !data) throw new Error(`${objectPath}: ${error?.message || 'empty download'}`);
  return Buffer.from(await data.arrayBuffer());
}

const jobs = await listAll('');
console.log(`jobs=${jobs.length} dryRun=${dryRun} r2Bucket=${r2Bucket} prefix=${KEY_PREFIX}/`);

let ok = 0;
let fail = 0;
const concurrency = 8;
let i = 0;

async function worker() {
  while (i < jobs.length) {
    const idx = i++;
    const objectPath = jobs[idx];
    const r2Key = `${KEY_PREFIX}/${objectPath}`;
    try {
      if (dryRun) {
        if ((idx + 1) % 50 === 0 || idx === jobs.length - 1) {
          console.log(`[dry-run] ${idx + 1}/${jobs.length} ${r2Key}`);
        }
      } else {
        const body = await downloadSupabase(objectPath);
        const contentType = MIME[extname(objectPath).toLowerCase()] || 'application/octet-stream';
        await r2Put(r2Key, body, contentType);
        if ((ok + fail + 1) % 25 === 0 || idx === jobs.length - 1) {
          console.log(`copied ${ok + fail + 1}/${jobs.length}: ${r2Key}`);
        }
      }
      ok++;
    } catch (e) {
      fail++;
      console.error(String(e));
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
console.log(`done ok=${ok} fail=${fail}`);
if (fail > 0) process.exit(1);
const cdn = (process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.purevedicgems.com').replace(/\/$/, '');
console.log(`CDN example: ${cdn}/${KEY_PREFIX}/home/ctas/cta2.webp`);
