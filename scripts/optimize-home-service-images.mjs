/**
 * Optimize pasted service JPEGs into WebP cards for the homepage.
 * Output: public/home/ourservicesimg/{slug}.webp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public', 'home', 'ourservicesimg');

const CARD_WIDTH = 640;

const SOURCES = {
  'horoscope-consultation': 'Online LiveTelephonic Chat.jpeg',
  'astro-jewellery': 'Making GemstonesRudrakshas.jpeg',
  'gem-energization': 'Energizing the GemstonesRudrakshas.jpeg',
  'cod-shipping': 'COD Service.jpeg',
  'vedic-remedies': 'Ancient Genuine Vedic Remedies.jpeg',
  'retail-store': 'Online and Offline store.jpeg',
};

async function main() {
  for (const [slug, file] of Object.entries(SOURCES)) {
    const input = path.join(dir, file);
    const output = path.join(dir, `${slug}.webp`);
    if (!fs.existsSync(input)) {
      console.warn(`SKIP missing: ${file}`);
      continue;
    }
    await sharp(input)
      .resize({ width: CARD_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(output);
    const kb = (fs.statSync(output).size / 1024).toFixed(1);
    console.log(`OK ${slug}.webp (${kb} KB) <- ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
