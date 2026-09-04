/**
 * Copy public Supabase Storage buckets → Cloudflare R2 (pvg-public).
 * Keys: {bucket}/{objectPath} → https://cdn…/{bucket}/{path}
 *
 * Usage:
 *   node scripts/copy-public-buckets-to-r2.mjs
 *   node scripts/copy-public-buckets-to-r2.mjs --buckets=products,product-images
 *   node scripts/copy-public-buckets-to-r2.mjs --dry-run
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const bucketsArg = process.argv.find((a) => a.startsWith('--buckets='))?.slice('--buckets='.length);
const DEFAULT_BUCKETS = ['products', 'product-images', 'certificates', 'jewelry-designs', 'reviews'];
const buckets = (bucketsArg ? bucketsArg.split(',') : DEFAULT_BUCKETS).map((b) => b.trim()).filter(Boolean);

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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
  '.css': 'text/css',
};

const s3 = dryRun
  ? null
  : new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

async function listAll(bucket, prefix = '') {
  const files = [];
  let offset = 0;
  const limit = 100;
  const FILE_EXT = new Set(Object.keys(MIME));
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix || undefined, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) {
      if (/not found|does not exist/i.test(error.message)) return files;
      throw new Error(`list ${bucket} "${prefix}": ${error.message}`);
    }
    if (!data?.length) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const isFile = Boolean(entry.metadata) || FILE_EXT.has(extname(entry.name).toLowerCase());
      if (isFile) files.push(path);
      else files.push(...(await listAll(bucket, path)));
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function copyOne(bucket, objectPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error || !data) throw new Error(`${bucket}/${objectPath}: ${error?.message || 'empty'}`);
  const body = Buffer.from(await data.arrayBuffer());
  const contentType = MIME[extname(objectPath).toLowerCase()] || 'application/octet-stream';
  const Key = `${bucket}/${objectPath}`;
  if (dryRun) return Key;
  await s3.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return Key;
}

console.log(`buckets=${buckets.join(',')} dryRun=${dryRun} r2=${r2Bucket}`);

let ok = 0;
let fail = 0;
for (const bucket of buckets) {
  const jobs = await listAll(bucket);
  console.log(`\n[${bucket}] objects=${jobs.length}`);
  const concurrency = 6;
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      const objectPath = jobs[idx];
      try {
        const key = await copyOne(bucket, objectPath);
        ok++;
        if (ok % 50 === 0 || idx === jobs.length - 1) {
          console.log(`  ${dryRun ? '[dry] ' : ''}${ok} ${key}`);
        }
      } catch (e) {
        fail++;
        console.error(String(e));
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

console.log(`\ndone ok=${ok} fail=${fail}`);
if (fail > 0) process.exit(1);
const cdn = (process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.purevedicgems.com').replace(/\/$/, '');
console.log(`CDN example: ${cdn}/products/…`);
console.log('Next: node scripts/rewrite-public-urls-to-cdn.mjs --write');
