/**
 * Append ?v=20261120 to CDN image URLs in gem_categories / product_categories / targeted products.
 * Run after compress-homepage-cdn-images.mjs.
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUST = '20261120';
const PRODUCT_KEYS = [
  '1789739290264',
  '1785247649508',
  '1785246399470',
];

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

const withBust = (url) => `${String(url).split('?')[0]}?v=${BUST}`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, ''),
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

for (const table of ['gem_categories', 'product_categories']) {
  const { data, error } = await supabase.from(table).select('id, image_url, hover_image_url');
  if (error) {
    console.log('skip', table, error.message);
    continue;
  }
  let n = 0;
  for (const row of data || []) {
    const patch = {};
    for (const col of ['image_url', 'hover_image_url']) {
      const v = row[col];
      if (typeof v === 'string' && v.includes('cdn.purevedicgems.com') && !v.includes(`v=${BUST}`)) {
        patch[col] = withBust(v);
      }
    }
    if (!Object.keys(patch).length) continue;
    const { error: upErr } = await supabase.from(table).update(patch).eq('id', row.id);
    if (upErr) console.error(table, row.id, upErr.message);
    else n += 1;
  }
  console.log(table, 'updated', n);
}

const { data: products, error: pErr } = await supabase.from('products').select('id, images, thumbnail_url');
if (pErr) {
  console.log('skip products', pErr.message);
} else {
  let n = 0;
  for (const row of products || []) {
    const blob = JSON.stringify(row);
    if (!PRODUCT_KEYS.some((k) => blob.includes(k))) continue;
    const patch = {};
    if (typeof row.thumbnail_url === 'string' && row.thumbnail_url.includes('cdn.purevedicgems.com') && !row.thumbnail_url.includes(`v=${BUST}`)) {
      patch.thumbnail_url = withBust(row.thumbnail_url);
    }
    if (Array.isArray(row.images)) {
      const next = row.images.map((u) =>
        typeof u === 'string' && u.includes('cdn.purevedicgems.com') && !u.includes(`v=${BUST}`) ? withBust(u) : u,
      );
      if (JSON.stringify(next) !== JSON.stringify(row.images)) patch.images = next;
    }
    if (!Object.keys(patch).length) continue;
    const { error: upErr } = await supabase.from('products').update(patch).eq('id', row.id);
    if (upErr) console.error('products', row.id, upErr.message);
    else {
      n += 1;
      console.log('products', row.id);
    }
  }
  console.log('products updated', n);
}
