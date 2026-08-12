/**
 * Upload offloaded public/ assets to Supabase Storage (bucket: site-static).
 * Does NOT touch Postgres — Storage only.
 *
 * Usage:
 *   node scripts/upload-site-static.mjs           # upload
 *   node scripts/upload-site-static.mjs --dry-run
 *   node scripts/upload-site-static.mjs --delete-local   # after successful upload, remove local copies
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (env or .env.local)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, unlinkSync, rmSync, existsSync } from 'node:fs';
import { join, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const manifest = JSON.parse(readFileSync(join(__dirname, 'site-static-offload.json'), 'utf8'));

const dryRun = process.argv.includes('--dry-run');
const deleteLocal = process.argv.includes('--delete-local');

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const bucket = manifest.bucket;
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const MIME = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.css': 'text/css',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function walkFiles(absDir) {
  /** @type {string[]} */
  const out = [];
  if (!existsSync(absDir)) return out;
  for (const name of readdirSync(absDir)) {
    const full = join(absDir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function collectJobs() {
  /** @type {{ abs: string, objectPath: string }[]} */
  const jobs = [];

  for (const dir of manifest.topLevelDirs) {
    const abs = join(publicDir, dir);
    for (const file of walkFiles(abs)) {
      const objectPath = relative(publicDir, file).split('\\').join('/');
      jobs.push({ abs: file, objectPath });
    }
  }

  for (const sub of manifest.homeSubdirs) {
    const abs = join(publicDir, 'home', sub);
    for (const file of walkFiles(abs)) {
      const objectPath = relative(publicDir, file).split('\\').join('/');
      jobs.push({ abs: file, objectPath });
    }
  }

  for (const file of manifest.rootFiles) {
    const abs = join(publicDir, file);
    if (existsSync(abs) && statSync(abs).isFile()) {
      jobs.push({ abs, objectPath: file });
    }
  }

  return jobs;
}

async function ensureBucket() {
  const { data: existing } = await supabase.storage.getBucket(bucket);
  if (existing) {
    console.log(`bucket ok: ${bucket}`);
    return;
  }
  const { error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 25 * 1024 * 1024,
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error('createBucket failed:', error.message);
    process.exit(1);
  }
  console.log(`bucket created: ${bucket}`);
}

async function uploadOne(job) {
  const body = readFileSync(job.abs);
  const contentType = MIME[extname(job.abs).toLowerCase()] || 'application/octet-stream';
  const { error } = await supabase.storage.from(bucket).upload(job.objectPath, body, {
    contentType,
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) throw new Error(`${job.objectPath}: ${error.message}`);
}

async function uploadAll(jobs) {
  let ok = 0;
  let fail = 0;
  const concurrency = 8;
  let i = 0;

  async function worker() {
    while (i < jobs.length) {
      const idx = i++;
      const job = jobs[idx];
      try {
        if (dryRun) {
          console.log(`[dry-run] ${job.objectPath}`);
        } else {
          await uploadOne(job);
          if ((ok + fail + 1) % 25 === 0 || idx === jobs.length - 1) {
            console.log(`uploaded ${ok + fail + 1}/${jobs.length}: ${job.objectPath}`);
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
  return { ok, fail };
}

function deleteLocalCopies(jobs) {
  for (const job of jobs) {
    try {
      unlinkSync(job.abs);
    } catch {
      /* ignore */
    }
  }

  for (const dir of manifest.topLevelDirs) {
    const abs = join(publicDir, dir);
    if (existsSync(abs)) {
      try {
        rmSync(abs, { recursive: true, force: true });
        console.log(`removed public/${dir}`);
      } catch (e) {
        console.warn(`could not remove public/${dir}:`, e);
      }
    }
  }

  for (const sub of manifest.homeSubdirs) {
    const abs = join(publicDir, 'home', sub);
    if (existsSync(abs)) {
      try {
        rmSync(abs, { recursive: true, force: true });
        console.log(`removed public/home/${sub}`);
      } catch (e) {
        console.warn(`could not remove public/home/${sub}:`, e);
      }
    }
  }

  for (const file of manifest.rootFiles) {
    const abs = join(publicDir, file);
    if (existsSync(abs)) {
      try {
        unlinkSync(abs);
        console.log(`removed public/${file}`);
      } catch {
        /* ignore */
      }
    }
  }

  // leave home/hero + home.css
  console.log('kept public/home/hero (and any remaining home files)');
}

const jobs = collectJobs();
console.log(`jobs=${jobs.length} dryRun=${dryRun} deleteLocal=${deleteLocal} bucket=${bucket}`);

if (!dryRun) await ensureBucket();
const { ok, fail } = await uploadAll(jobs);
console.log(`done upload ok=${ok} fail=${fail}`);

if (fail > 0) {
  console.error('Aborting local delete due to upload failures.');
  process.exit(1);
}

if (deleteLocal && !dryRun) {
  deleteLocalCopies(jobs);
}

console.log(`public CDN base: ${url}/storage/v1/object/public/${bucket}/`);
