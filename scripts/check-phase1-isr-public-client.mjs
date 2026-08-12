/**
 * ponytail: fails if Phase-1 public ISR pages still import cookie supabase/server.
 * Run: node scripts/check-phase1-isr-public-client.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const files = [
  'src/app/page.tsx',
  'src/lib/hero-slides.ts',
  'src/components/home/HomeVideosSection.tsx',
  'src/app/videos/page.tsx',
  'src/app/videos/[slug]/page.tsx',
  'src/app/testimonials/page.tsx',
  'src/app/events-and-seminars/page.tsx',
  'src/app/events-and-seminars/[slug]/page.tsx',
  'src/app/lab-certificate/page.tsx',
  'src/app/consultation/page.tsx',
];

let failed = false;
for (const rel of files) {
  const src = readFileSync(join(root, rel), 'utf8');
  if (src.includes("@/lib/supabase/server")) {
    console.error(`FAIL: ${rel} still imports @/lib/supabase/server`);
    failed = true;
    continue;
  }
  if (!src.includes('createOptionalPublicClient')) {
    console.error(`FAIL: ${rel} missing createOptionalPublicClient`);
    failed = true;
    continue;
  }
  console.log(`ok: ${rel}`);
}

if (failed) process.exit(1);
console.log('phase1 public-client check passed');
