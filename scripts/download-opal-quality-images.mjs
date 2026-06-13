import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'gems-knowledge', 'opal');

const IMAGES = [
  { filename: 'low-Quality-1.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/low-Quality-1.jpg' },
  { filename: 'Low-Quality-2.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Low-Quality-2.jpg' },
  { filename: 'Low-Quality-3.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Low-Quality-3.jpg' },
  { filename: 'Opal-Medium-Quality-1.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-Medium-Quality-1.jpg' },
  { filename: 'Opal-Medium-Quality-2.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-Medium-Quality-2.jpg' },
  { filename: 'Opal-Medium-Quality-3.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-Medium-Quality-3.jpg' },
  { filename: 'Opal-High-Quality-1.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-High-Quality-1.jpg' },
  { filename: 'Opal-High-Quality-2.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-High-Quality-2.jpg' },
  { filename: 'Opal-High-Quality-3.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-High-Quality-3.jpg' },
  { filename: 'Opal-Very-High-Quality-1.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-Very-High-Quality-1.jpg' },
  { filename: 'Opal-Very-High-Quality-2.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-Very-High-Quality-2.jpg' },
  { filename: 'Opal-Very-High-Quality-3.jpg', url: 'https://www.purevedicgems.com/wp-content/uploads/2017/09/Opal-Very-High-Quality-3.jpg' },
];

fs.mkdirSync(outDir, { recursive: true });

for (const img of IMAGES) {
  const dest = path.join(outDir, img.filename);
  if (fs.existsSync(dest)) {
    console.log('skip', img.filename);
    continue;
  }
  const res = await fetch(img.url);
  if (!res.ok) throw new Error(`Failed ${img.url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log('saved', img.filename);
}

console.log('Done —', IMAGES.length, 'images in', outDir);
