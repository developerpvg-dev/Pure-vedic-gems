import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const jsonPath = path.resolve(root, '..', 'legacy_tier_images.json');
const publicBase = path.join(root, 'public', 'gems-knowledge');

const KEY_TO_SLUG = {
  'buy-online-blue-sapphire-gemstone': 'blue-sapphire',
  'buy-online-yellow-sapphire-gemstone': 'yellow-sapphire',
  'buy-online-ruby-gemstone': 'ruby',
  'buy-online-emerald-gemstone': 'emerald',
  'red-coral-qualities': 'red-coral',
  'buy-online-catseye-gemstone': 'catseye',
  'hessonite-qualites': 'hessonite',
};

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

let downloaded = 0;
let skipped = 0;

for (const [key, meta] of Object.entries(data)) {
  const slug = KEY_TO_SLUG[key];
  if (!slug) continue;
  const dir = path.join(publicBase, slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const img of meta.images) {
    const dest = path.join(dir, img.filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      skipped++;
      continue;
    }
    await download(img.url, dest);
    downloaded++;
    process.stdout.write(`ok ${slug}/${img.filename}\n`);
  }
}

console.log(`Done: ${downloaded} downloaded, ${skipped} skipped`);
