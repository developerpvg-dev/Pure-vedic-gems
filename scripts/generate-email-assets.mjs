/**
 * Regenerate email logo assets from the site master PNG.
 * Usage: node scripts/generate-email-assets.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const emailDir = path.join(root, 'email');
fs.mkdirSync(emailDir, { recursive: true });

const master = path.join(root, 'PVG NEW LOGO DESIGN.PNG');

await sharp(master)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(path.join(emailDir, 'pvg-emblem.png'));

console.log(
  'pvg-emblem.png',
  fs.statSync(path.join(emailDir, 'pvg-emblem.png')).size,
  '→ /email/pvg-emblem.png',
);
