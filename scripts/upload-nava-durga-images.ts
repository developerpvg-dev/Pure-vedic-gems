/**
 * One-shot: upload Nava Durga article images to Sanity and write CDN URLs.
 *   npx tsx scripts/upload-nava-durga-images.ts
 */
import path from 'node:path';
import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const dir = path.resolve('public/articles/nava-durga');
const names = [
  'Maa Shailputri',
  'Maa Brahmacharini',
  'Maa Chandraghanta',
  'Maa Kushmanda',
  'Maa Skandamata',
  'Maa Katyayani',
  'Maa Kaalratri',
  'Maa Mahagauri',
  'Maa Siddhidatri',
];

async function main() {
  const out: Record<string, { assetId: string; url: string }> = {};
  for (let i = 1; i <= 9; i++) {
    const file = path.join(dir, `day-${i}.jpg`);
    const buf = fs.readFileSync(file);
    const asset = await client.assets.upload('image', buf, {
      filename: `nava-durga-day-${i}.jpg`,
      contentType: 'image/jpeg',
      title: names[i - 1],
    });
    out[`day-${i}`] = { assetId: asset._id, url: asset.url as string };
    console.log(`day-${i}`, asset._id, asset.url);
  }
  fs.writeFileSync(path.join(dir, 'sanity-urls.json'), JSON.stringify(out, null, 2));
  console.log('wrote sanity-urls.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
