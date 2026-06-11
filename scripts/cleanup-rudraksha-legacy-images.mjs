/**
 * Remove superseded WebP/JPG/large PNG sources after optimizing to public/home/rudraksha-cards/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'home',
  'rudrakhshas images',
);

const toDelete = [
  // Low-quality WebP thumbnails
  '1Mukhi-150x150.webp', '2Mukhi-150x150.webp', '3Mukhi-150x150.webp',
  '4Mukhi-150x150.webp', '5Mukhi-150x150.webp', '6Mukhi-150x150.webp',
  '7Mukhi-150x150.webp', '8Mukhi-150x150.webp', '9Mukhi-150x150.webp',
  '10Mukhi-150x150.webp', '11Mukhi-150x150.webp', '12Mukhi-150x150.webp',
  '13Mukhi-150x150.webp', '14Mukhi-150x150.webp', '15Mukhi--150x150.webp',
  '15mukhirudraksha.webp',
  '16Mukhi rudraksha.webp', '17Mukhi rudraksha.webp', '18Mukhi rudraksha.webp',
  '19Mukhi rudraksha.webp', '20Mukhi rudraksha.webp', '21Mukhi Rudraksha.webp',
  // Feature WebPs (replaced by optimized PNGs in rudraksha-cards/)
  '1-15 FINEST QUALITY RUDRAKSHAS.webp',
  'EXCLUSIVE RUDRAKSHA MALAS.webp',
  'CUSTOMISED RUDRAKSHA JEWELLERIES.webp',
  // Gauri Shankar leftovers
  'GAURI-SHANKAR-150x150.jpg', 'GAURI-SHANKAR-150x150.webp',
  // Large source PNGs (optimized copies live in rudraksha-cards/)
  '1Mukhi Rudraksha-523x528.png', '2Mukhi Rudraksha-523x528.png',
  '3Mukhi Rudraksh-523x528.png', '4Mukhi Rudraksha-523x528.png',
  '5Mukhi Rudraksha-523x528.png', '6Mukhi Rudraksha-523x528.png',
  '7Mukhi Rudraksha-523x528.png', '8Mukhi Rudraksha-523x528.png',
  '9Mukhi Rudraksha-523x528.png', '10Mukhi Rudraksha-523x528.png',
  '11Mukhi Rudraksha-523x528.png', '12Mukhi Rudraksha-523x528.png',
  '13mukhi Rudraksha.png', '14Mukhi Rudraksha-523x528.png',
  '15Mukhi Rudraksha-523x528.png', '16Mukhi Rudraksha-523x528.png',
  '17Mukhi Rudraksha-523x528.png', '18Mukhi Rudraksha-523x528.png',
  '19Mukhi Rudraksha-523x528.png', '20Mukhi Rudraksha-523x528.png',
  '21Mukhi Rudraksha-523x528.png',
  // Unused specialty PNGs (not referenced in app)
  'Ganesh Rudraksha-523x528.png', 'gauri Shankar Rudraksha-523x528.png',
];

let removed = 0;
for (const file of toDelete) {
  const full = path.join(dir, file);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    console.log('deleted:', file);
    removed++;
  }
}
console.log(`\nRemoved ${removed} files from rudrakhshas images/`);
