/**
 * Upload public/home/rudraksha-cards/*-mukhi into storage and set
 * gem_categories.image_url (Main) + hover_image_url — same as admin upload.
 *
 * Fills empty Main images (fixes empty admin thumbnails / hover swap from local fallback).
 * Always refreshes Hover to the matching card.
 *
 *   node scripts/sync-rudraksha-hover-cards.mjs
 *   node scripts/sync-rudraksha-hover-cards.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
loadEnv({ path: path.join(root, '.env.local') });

const write = process.argv.includes('--write');
const cardsDir = path.join(root, 'public', 'home', 'rudraksha-cards');
const BUCKET = 'products';

const slugs = Array.from({ length: 21 }, (_, i) => `${i + 1}-mukhi`);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let updated = 0;
  for (const slug of slugs) {
    const webp = path.join(cardsDir, `${slug}.webp`);
    const png = path.join(cardsDir, `${slug}.png`);
    const filePath = fs.existsSync(webp) ? webp : fs.existsSync(png) ? png : null;
    if (!filePath) {
      console.warn(`SKIP ${slug}: no card file`);
      continue;
    }

    const ext = path.extname(filePath).slice(1);
    const contentType = ext === 'png' ? 'image/png' : 'image/webp';
    // Stable path — same file used for main + hover so they never mismatch
    const storagePath = `homepage-categories/images/rudraksha-card-${slug}.${ext}`;
    const body = fs.readFileSync(filePath);

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const publicUrl = pub.publicUrl;

    const { data: existing } = await supabase
      .from('gem_categories')
      .select('id, name, image_url, hover_image_url')
      .eq('type', 'rudraksha')
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) {
      console.warn(`SKIP ${slug}: no gem_categories row`);
      continue;
    }

    const needMain = !existing.image_url;
    const needHover = existing.hover_image_url !== publicUrl;
    if (!needMain && !needHover) {
      console.log(`OK ${slug}: main+hover already set`);
      continue;
    }

    console.log(
      `${write ? 'UPDATE' : 'WOULD'} ${slug}: main=${needMain ? 'SET' : 'keep'} hover=${needHover ? 'SET' : 'ok'}`,
    );

    if (!write) continue;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, body, {
      contentType,
      upsert: true,
    });
    if (upErr) {
      console.error(`UPLOAD FAIL ${slug}:`, upErr.message);
      continue;
    }

    const patch = { hover_image_url: publicUrl };
    if (needMain) patch.image_url = publicUrl;

    const { error: dbErr } = await supabase.from('gem_categories').update(patch).eq('id', existing.id);
    if (dbErr) {
      console.error(`DB FAIL ${slug}:`, dbErr.message);
      continue;
    }
    updated++;
  }

  console.log(write ? `\nUpdated ${updated} categories.` : `\nDry-run done. Pass --write to apply.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
