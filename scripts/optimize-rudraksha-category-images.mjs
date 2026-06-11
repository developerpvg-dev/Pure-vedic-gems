/**
 * Build optimized PNG category cards from high-quality source PNGs (and feature WebPs).
 * Output: public/home/rudraksha-cards/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'public', 'home', 'rudrakhshas images');
const outDir = path.join(root, 'public', 'home', 'rudraksha-cards');

const CARD_WIDTH = 320;

const MUKHI_SOURCES = {
  '1-mukhi': '1Mukhi Rudraksha-523x528.png',
  '2-mukhi': '2Mukhi Rudraksha-523x528.png',
  '3-mukhi': '3Mukhi Rudraksh-523x528.png',
  '4-mukhi': '4Mukhi Rudraksha-523x528.png',
  '5-mukhi': '5Mukhi Rudraksha-523x528.png',
  '6-mukhi': '6Mukhi Rudraksha-523x528.png',
  '7-mukhi': '7Mukhi Rudraksha-523x528.png',
  '8-mukhi': '8Mukhi Rudraksha-523x528.png',
  '9-mukhi': '9Mukhi Rudraksha-523x528.png',
  '10-mukhi': '10Mukhi Rudraksha-523x528.png',
  '11-mukhi': '11Mukhi Rudraksha-523x528.png',
  '12-mukhi': '12Mukhi Rudraksha-523x528.png',
  '13-mukhi': '13mukhi Rudraksha.png',
  '14-mukhi': '14Mukhi Rudraksha-523x528.png',
  '15-mukhi': '15Mukhi Rudraksha-523x528.png',
  '16-mukhi': '16Mukhi Rudraksha-523x528.png',
  '17-mukhi': '17Mukhi Rudraksha-523x528.png',
  '18-mukhi': '18Mukhi Rudraksha-523x528.png',
  '19-mukhi': '19Mukhi Rudraksha-523x528.png',
  '20-mukhi': '20Mukhi Rudraksha-523x528.png',
  '21-mukhi': '21Mukhi Rudraksha-523x528.png',
};

const FEATURE_SOURCES = {
  'finest-quality-collection': '1-15 FINEST QUALITY RUDRAKSHAS.webp',
  'exclusive-malas': 'EXCLUSIVE RUDRAKSHA MALAS.webp',
  'customised-jewellery': 'CUSTOMISED RUDRAKSHA JEWELLERIES.webp',
};

async function optimizePng(inputPath, outputPath, width = CARD_WIDTH) {
  await sharp(inputPath)
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(outputPath);
  const kb = (fs.statSync(outputPath).size / 1024).toFixed(1);
  return kb;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  for (const [slug, file] of Object.entries(MUKHI_SOURCES)) {
    const input = path.join(sourceDir, file);
    const output = path.join(outDir, `${slug}.png`);
    if (!fs.existsSync(input)) {
      console.warn(`SKIP missing source: ${file}`);
      continue;
    }
    const kb = await optimizePng(input, output);
    console.log(`OK ${slug}.png (${kb} KB) <- ${file}`);
  }

  for (const [name, file] of Object.entries(FEATURE_SOURCES)) {
    const input = path.join(sourceDir, file);
    const output = path.join(outDir, `${name}.png`);
    if (!fs.existsSync(input)) {
      console.warn(`SKIP missing feature: ${file}`);
      continue;
    }
    const kb = await optimizePng(input, output, 480);
    console.log(`OK ${name}.png (${kb} KB) <- ${file}`);
  }

  console.log(`\nDone. Cards in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
