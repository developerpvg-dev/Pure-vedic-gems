/**
 * Compress homepage CDN images under 150KB and overwrite the same R2 keys.
 * No Cloudflare Image Resizing / Next optimizer — bill stays flat aside from one-time Class A puts.
 *
 * Usage: node scripts/compress-homepage-cdn-images.mjs [--dry-run]
 *
 * Env: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 *      NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (optional DB URL bust)
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');
const BUST = '20261118';
const MAX_BYTES = 150 * 1024;

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

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY_ID;
const secretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Bucket = process.env.R2_BUCKET || 'pvg-public';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!accountId || !accessKey || !secretKey)) {
  console.error('Missing R2 credentials');
  process.exit(1);
}

const s3 = dryRun
  ? null
  : new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

/** Audit URLs (homepage large-image list). */
const URLS = [
  'https://cdn.purevedicgems.com/products/hero-slides/images/1785414986278-1st_banner_1920x755_-_copy.jpg',
  'https://cdn.purevedicgems.com/products/hero-slides/images/1785415198061-1024x962_actual_size_banner7_copy.jpg',
  'https://cdn.purevedicgems.com/products/hero-slides/images/1785421574103-4th_banner_2239x755_copy.jpg',
  'https://cdn.purevedicgems.com/products/hero-slides/images/1785410826540-1024x962_actual_size_banner6_copy.jpg',
  'https://cdn.purevedicgems.com/site-static/home/whoweare/1Heritage.webp',
  'https://cdn.purevedicgems.com/site-static/home/whoweare/puja-energization.jpeg',
  'https://cdn.purevedicgems.com/site-static/home/whoweare/genuine-rudraksha-xray-certified.jpeg',
  'https://cdn.purevedicgems.com/site-static/home/whoweare/most-reasonable-genuine-prices.jpeg',
  'https://cdn.purevedicgems.com/site-static/home/whoweare/powerful-vedic-talisman.jpeg',
  'https://cdn.purevedicgems.com/site-static/home/whoweare/87yeara.webp',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781070777332-ChatGPT_Image_Jun_10__2026__11_21_30_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241374478-ChatGPT_Image_Jun_12__2026__10_32_30_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781136695321-ChatGPT_Image_Jun_11__2026__05_31_05_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241499249-ChatGPT_Image_Jun_12__2026__10_32_54_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1785246745502-red_coral_pvg1.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241552290-ChatGPT_Image_Jun_12__2026__10_32_42_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241594489-ChatGPT_Image_Jun_12__2026__10_32_36_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1785245944634-yellow_sapphire_pvg_copy_copy.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781239913294-ChatGPT_Image_Jun_12__2026__10_11_02_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781148711379-ChatGPT_Image_Jun_11__2026__08_58_05_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241636049-ChatGPT_Image_Jun_12__2026__10_45_17_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781151980462-ChatGPT_Image_Jun_11__2026__09_55_31_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241677545-ChatGPT_Image_Jun_12__2026__10_45_10_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241736059-ChatGPT_Image_Jun_12__2026__10_45_05_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781148768967-ChatGPT_Image_Jun_11__2026__09_01_01_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1781241777977-ChatGPT_Image_Jun_12__2026__10_44_59_AM.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1782546942156-f5aebf94-b92a-4a91-9f29-574218c162c8.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1786017176055-ChatGPT_Image_Jun_28__2026__06_49_23_PM__1_.png',
  'https://cdn.purevedicgems.com/site-static/home/ctas/cta1.webp',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1783157425725-ChatGPT_Image_Jul_4__2026__02_58_33_PM.jpg',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1785247915528-rudraksha_mala_website_images_pvg_copy.jpg',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778136831125-1Mukhi_Rudraksha-523x528.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778136852114-2Mukhi_Rudraksha-523x528.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778137379619-3Mukhi_Rudraksh-523x528.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778137397561-4Mukhi_Rudraksha-523x528.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778137415430-5Mukhi_Rudraksha-523x528.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778137433185-6Mukhi_Rudraksha-523x528.png',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1778136588381-15Mukhi_Rudraksha-523x528.png',
  'https://cdn.purevedicgems.com/site-static/home/ctas/cta2.webp',
  'https://cdn.purevedicgems.com/site-static/home/ctas/cta3.webp',
  'https://cdn.purevedicgems.com/site-static/home/ctas/cta4.webp',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1782201338104-ChatGPT_Image_Jun_23__2026__12_34_41_PM.jpg',
  'https://cdn.purevedicgems.com/products/homepage-categories/images/1782201719341-da5b88c4-7a4f-475c-98cb-e2636b40264e.jpg',
  'https://cdn.purevedicgems.com/products/images/1789739290264-7.29ct-M194-6.jpg',
  'https://cdn.purevedicgems.com/products/images/1789723385999-4.12ct-Q250-3.jpg',
  'https://cdn.purevedicgems.com/products/images/1789721107101-5.01ct-T162-3.jpg',
  'https://cdn.purevedicgems.com/products/images/1789723431115-3.63ct-Q419-3.jpg',
  'https://cdn.purevedicgems.com/products/images/1788530617079-15.55ct-A758-2.jpg',
  'https://cdn.purevedicgems.com/site-static/home/configuratorsteps/step4.webp',
  'https://cdn.purevedicgems.com/site-static/home/configuratorsteps/step5.webp',
  'https://cdn.purevedicgems.com/site-static/home/heri/heri2b.jpeg',
  'https://cdn.purevedicgems.com/site-static/home/testimonial/cardbg.webp',
];

function parseKey(url) {
  const u = new URL(url.split('?')[0]);
  const path = u.pathname.replace(/^\//, '');
  // path is site-static/... or products/...
  return path;
}

function maxWidthFor(key) {
  if (key.includes('hero-slides')) return 1600;
  if (key.includes('homepage-categories')) return 480;
  if (key.includes('/products/images/')) return 900;
  if (key.includes('configuratorsteps')) return 900;
  if (key.includes('whoweare') || key.includes('/ctas/')) return 1000;
  if (key.includes('testimonial/cardbg')) return 900;
  if (key.includes('/heri/')) return 1200;
  return 1200;
}

async function compress(buf, key) {
  const ext = key.split('.').pop().toLowerCase();
  const maxW = maxWidthFor(key);
  let img = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  if ((meta.width || 0) > maxW) img = img.resize({ width: maxW, withoutEnlargement: true });

  const tryEncode = async (fn) => {
    let q = 82;
    let out = null;
    while (q >= 35) {
      out = await fn(q);
      if (out.length <= MAX_BYTES) return out;
      q -= 8;
    }
    return out;
  };

  if (ext === 'webp') {
    const out = await tryEncode((q) => img.webp({ quality: q }).toBuffer());
    return { body: out, type: 'image/webp' };
  }
  if (ext === 'png') {
    // ponytail: PNG→WebP bytes at .png key with image/webp — browsers + next/image accept it; URL stays stable
    const out = await tryEncode((q) => img.webp({ quality: q }).toBuffer());
    return { body: out, type: 'image/webp' };
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    const out = await tryEncode((q) => img.jpeg({ quality: q, mozjpeg: true }).toBuffer());
    return { body: out, type: 'image/jpeg' };
  }
  const out = await tryEncode((q) => img.webp({ quality: q }).toBuffer());
  return { body: out, type: 'image/webp' };
}

function withBust(url) {
  const base = url.split('?')[0];
  return `${base}?v=${BUST}`;
}

async function main() {
  const report = [];
  for (const url of URLS) {
    const key = parseKey(url);
    const res = await fetch(url.includes('?') ? url : url);
    if (!res.ok) {
      console.log(`SKIP ${key} HTTP ${res.status}`);
      report.push({ key, status: 'skip', reason: res.status });
      continue;
    }
    const before = Buffer.from(await res.arrayBuffer());
    if (before.length <= MAX_BYTES) {
      console.log(`ok   ${key} already ${(before.length / 1024).toFixed(0)}KB`);
      report.push({ key, status: 'ok', before: before.length });
      continue;
    }
    const { body, type } = await compress(before, key);
    console.log(
      `${dryRun ? 'DRY' : 'PUT'} ${key} ${(before.length / 1024).toFixed(0)}KB → ${(body.length / 1024).toFixed(0)}KB (${type})`,
    );
    if (!dryRun) {
      await s3.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: body,
          ContentType: type,
          // ponytail: avoid year-long immutable so bust query + overwrite can win at edge
          CacheControl: 'public, max-age=86400, must-revalidate',
        }),
      );
    }
    report.push({
      key,
      status: dryRun ? 'dry' : 'put',
      before: before.length,
      after: body.length,
      type,
      bustUrl: withBust(`https://cdn.purevedicgems.com/${key}`),
    });
  }

  const outDir = join(root, 'scripts', '.cache');
  mkdirSync(outDir, { recursive: true });
  const reportPath = join(outDir, `homepage-image-compress-${BUST}.json`);
  writeFileSync(reportPath, JSON.stringify({ bust: BUST, dryRun, report }, null, 2));
  console.log(`report → ${reportPath}`);

  if (dryRun || !supabaseUrl || !serviceKey) {
    console.log('DB bust skipped (dry-run or missing Supabase service role)');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Bust hero slide URLs so CDN cache key changes.
  const { data: slides, error: slideErr } = await supabase
    .from('hero_slides')
    .select('id, desktop_image_url, mobile_image_url');
  if (slideErr) {
    console.error('hero_slides read failed', slideErr.message);
  } else {
    for (const row of slides || []) {
      const desktop = row.desktop_image_url?.includes('cdn.purevedicgems.com')
        ? withBust(row.desktop_image_url)
        : row.desktop_image_url;
      const mobile = row.mobile_image_url?.includes('cdn.purevedicgems.com')
        ? withBust(row.mobile_image_url)
        : row.mobile_image_url;
      if (desktop === row.desktop_image_url && mobile === row.mobile_image_url) continue;
      const { error } = await supabase
        .from('hero_slides')
        .update({ desktop_image_url: desktop, mobile_image_url: mobile })
        .eq('id', row.id);
      if (error) console.error('hero update', row.id, error.message);
      else console.log(`hero_slides ${row.id} busted`);
    }
  }

  // Bust category image URLs used on homepage.
  for (const table of ['categories', 'shop_categories']) {
    const { data, error } = await supabase.from(table).select('id, image_url, hover_image_url');
    if (error) {
      // table may not exist under that name
      console.log(`skip ${table}: ${error.message}`);
      continue;
    }
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
    }
    console.log(`busted URLs in ${table}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
