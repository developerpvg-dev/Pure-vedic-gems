import fs from 'node:fs';
import path from 'node:path';

const targets = ['.next', '.turbo'];

for (const target of targets) {
  const fullPath = path.join(process.cwd(), target);
  if (!fs.existsSync(fullPath)) continue;
  fs.rmSync(fullPath, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}

console.log('Dev cache cleared. Run npm run dev to start fresh.');
