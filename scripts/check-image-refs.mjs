import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src');
const publicDir = join(__dirname, '..', 'public');

function getFiles(dir, exts) {
  const results = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, f.name);
    if (f.isDirectory()) results.push(...getFiles(full, exts));
    else if (exts.some(e => f.name.endsWith(e))) results.push(full);
  }
  return results;
}

const srcFiles = getFiles(srcDir, ['.ts', '.tsx', '.css']);
let issues = 0;
// Match static image paths (not template literals)
const imgRe = /['"](\/(?:home|config_img|labslogo|stones_img|our_expets_img|flags)[^'"]*\.(?:png|jpg|jpeg|PNG|JPG|webp))['"]/g;

for (const f of srcFiles) {
  const content = readFileSync(f, 'utf8');
  let m;
  imgRe.lastIndex = 0;
  while ((m = imgRe.exec(content)) !== null) {
    const imgPath = m[1]
      .replace(/^\//, '')
      .replace(/%20/g, ' ')
      .replace(/%27/g, "'");
    const fullPath = join(publicDir, imgPath);
    if (!existsSync(fullPath)) {
      const rel = f.replace(srcDir, 'src').replaceAll('\\', '/');
      console.log(`BROKEN: ${rel} -> /${imgPath}`);
      issues++;
    }
  }
}

if (issues === 0) {
  console.log('✓ All image references OK — no broken paths found');
} else {
  console.log(`\n${issues} broken reference(s) found — fix before deploying`);
}
