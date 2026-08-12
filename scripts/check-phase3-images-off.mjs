/**
 * ponytail: Phase 3 — Image Optimization must stay off (no Vercel transform bill).
 * Run: node scripts/check-phase3-images-off.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const nextConfig = readFileSync(join(root, 'next.config.ts'), 'utf8');
const proxy = readFileSync(join(root, 'src/proxy.ts'), 'utf8');

let failed = false;
function ok(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`ok: ${msg}`);
  }
}

ok(/unoptimized:\s*true/.test(nextConfig), 'next.config has images.unoptimized: true');
ok(!/unoptimized:\s*false/.test(nextConfig), 'next.config does not set unoptimized: false');
ok(proxy.includes('passthroughNextImage') || proxy.includes('resolveImageOptimizerTarget'), 'proxy has /_next/image passthrough');
ok(proxy.includes("'/_next/image'") || proxy.includes('"/_next/image"'), 'proxy matcher includes /_next/image');
ok(proxy.includes('307') || proxy.includes('redirect'), 'proxy redirects optimizer URLs away from Vercel transforms');

if (failed) process.exit(1);
console.log('phase3 images-off check passed');
