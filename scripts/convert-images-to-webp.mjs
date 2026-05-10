/**
 * convert-images-to-webp.mjs
 *
 * Converts all PNG/JPG/JPEG images under public/ to WebP format.
 * Skips files that already have a corresponding .webp counterpart.
 * Keeps originals so existing references keep working as fallback.
 *
 * Run: node scripts/convert-images-to-webp.mjs
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const TARGET_EXTS = new Set(['.png', '.jpg', '.jpeg']);
const QUALITY = 82; // good balance of quality vs file size

let converted = 0;
let skipped = 0;
let errors = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (TARGET_EXTS.has(ext)) {
        await convertToWebP(fullPath);
      }
    }
  }
}

async function convertToWebP(inputPath) {
  const webpPath = inputPath.replace(/\.(png|jpe?g)$/i, '.webp');

  // Skip if webp already exists
  try {
    await stat(webpPath);
    console.log(`  skip (exists): ${basename(webpPath)}`);
    skipped++;
    return;
  } catch {
    // doesn't exist, proceed
  }

  try {
    const inputStat = await stat(inputPath);
    await sharp(inputPath)
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(webpPath);
    const outputStat = await stat(webpPath);
    const savings = Math.round((1 - outputStat.size / inputStat.size) * 100);
    console.log(`  converted: ${basename(inputPath)} → ${basename(webpPath)}  (${savings}% smaller)`);
    converted++;
  } catch (err) {
    console.error(`  ERROR converting ${inputPath}: ${err.message}`);
    errors++;
  }
}

console.log('Converting images to WebP...\n');
await walk(PUBLIC_DIR);
console.log(`\nDone. Converted: ${converted}  Skipped: ${skipped}  Errors: ${errors}`);
