import fs from 'node:fs';
import path from 'node:path';

const targets = ['.next', '.turbo'].map((dir) => path.join(process.cwd(), dir));

let removed = 0;

for (const fullPath of targets) {
  if (!fs.existsSync(fullPath)) continue;
  fs.rmSync(fullPath, { recursive: true, force: true });
  console.log(`Removed ${fullPath}`);
  removed += 1;
}

if (removed === 0) {
  console.log('No dev cache folders found.');
} else {
  console.log(`Cleared ${removed} dev cache location(s).`);
}

console.log('Run npm run dev to start fresh.');
