/**
 * ponytail: Phase 4 wiring — rewrites + keep home/hero local.
 * Run: node scripts/check-phase4-site-static.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const nextConfig = readFileSync(join(root, 'next.config.ts'), 'utf8');
const manifest = JSON.parse(readFileSync(join(root, 'scripts/site-static-offload.json'), 'utf8'));
const upload = readFileSync(join(root, 'scripts/upload-site-static.mjs'), 'utf8');

let failed = false;
function ok(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed = true;
  } else {
    console.log(`ok: ${msg}`);
  }
}

ok(nextConfig.includes('siteStaticAssetRewrites'), 'next.config has siteStaticAssetRewrites');
ok(nextConfig.includes('site-static-offload.json'), 'next.config loads offload manifest');
ok(upload.includes(manifest.bucket), 'upload script targets site-static bucket');
ok(existsSync(join(root, 'public/home/hero')), 'public/home/hero kept local');
ok(!manifest.homeSubdirs.includes('hero'), 'hero is not in offload homeSubdirs');
ok(manifest.keepLocal.includes('home/hero'), 'manifest documents keepLocal home/hero');

if (failed) process.exit(1);
console.log('phase4 site-static check passed');
