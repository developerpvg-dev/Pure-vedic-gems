/**
 * Verify Phase-4 offloaded images are reachable on Supabase Storage.
 *
 * A) Lists every image in bucket `site-static` → HEAD/GET public URL
 * B) Scans src/ for hardcoded offloaded paths → HEAD/GET those URLs
 * C) Confirms public/home/hero still exists locally
 *
 * Usage: node scripts/verify-site-static.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(__dirname, 'site-static-offload.json'), 'utf8'));

function loadEnvFile(name) {
  const p = join(root, name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const bucket = manifest.bucket;
const publicBase = `${base}/storage/v1/object/public/${bucket}`;
const supabase = createClient(base, key, { auth: { persistSession: false, autoRefreshToken: false } });
const IMAGE_EXT = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif', '.css']);

function toPublicUrl(objectPath) {
  const clean = objectPath.replace(/^\//, '');
  return `${publicBase}/${clean.split('/').map(encodeURIComponent).join('/')}`;
}

async function headOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.ok) return { ok: true, status: res.status };
    const get = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'follow' });
    return { ok: get.ok || get.status === 206, status: get.status };
  } catch (e) {
    return { ok: false, status: 0, error: String(e) };
  }
}

async function listAll(prefix = '') {
  /** @type {string[]} */
  const files = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix || undefined, {
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

async function checkPaths(label, paths) {
  console.log(`\n--- ${label} (${paths.length}) ---`);
  let ok = 0;
  /** @type {string[]} */
  const failures = [];
  const concurrency = 12;
  for (let i = 0; i < paths.length; i += concurrency) {
    const chunk = paths.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (p) => {
        const url = toPublicUrl(p);
        const res = await headOk(url);
        return { p, res, url };
      }),
    );
    for (const { p, res } of results) {
      if (res.ok) ok++;
      else failures.push(`${res.status || 'ERR'} ${p}${res.error ? ` (${res.error})` : ''}`);
    }
    process.stdout.write(`\rchecked ${Math.min(i + concurrency, paths.length)}/${paths.length}`);
  }
  console.log(`\nok=${ok} fail=${failures.length}`);
  if (failures.length) {
    console.log('failures:');
    for (const line of failures.slice(0, 40)) console.log(' ', line);
    if (failures.length > 40) console.log(`  … +${failures.length - 40} more`);
  }
  return failures.length;
}

function walkSrc(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      walkSrc(full, out);
    } else if (/\.(tsx?|jsx?|css)$/.test(name)) out.push(full);
  }
  return out;
}

function collectCodeRefs() {
  const prefixes = [
    ...manifest.topLevelDirs.map((d) => `/${d}/`),
    ...manifest.homeSubdirs.map((s) => `/home/${s}/`),
  ];
  const exact = new Set(manifest.rootFiles.map((f) => `/${f}`));
  /** @type {Set<string>} */
  const refs = new Set();
  const re = /['"`](\/(?:[^'"`]+?\.(?:webp|jpg|jpeg|png|gif|svg|css)))['"`]/gi;
  for (const file of walkSrc(join(root, 'src'))) {
    const text = readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(text))) {
      const raw = m[1].split('?')[0];
      // skip template stubs like /rudraksha-knowledge/m${n}-hero.png
      if (raw.includes('${')) continue;
      const p = decodeURIComponent(raw);
      if (exact.has(p) || prefixes.some((pre) => p.startsWith(pre))) refs.add(p);
    }
  }
  return [...refs].sort();
}

console.log(`bucket=${bucket}`);
console.log(`publicBase=${publicBase}`);

const all = await listAll('');
const images = all.filter((p) => IMAGE_EXT.has(extname(p).toLowerCase()));
console.log(`bucket objects=${all.length} (images/css=${images.length})`);

const failBucket = await checkPaths('Bucket public URLs', images);
const codeRefs = collectCodeRefs().map((p) => p.replace(/^\//, ''));
const failCode = await checkPaths('Code path references', codeRefs);

console.log('\n--- Local hero ---');
const heroOk = existsSync(join(root, 'public/home/hero'));
console.log(heroOk ? 'ok: public/home/hero exists' : 'FAIL: public/home/hero missing');

const failed = failBucket > 0 || failCode > 0 || !heroOk;
console.log(failed ? '\nVERIFY FAILED' : '\nVERIFY PASSED — checked images are reachable');
process.exit(failed ? 1 : 0);
