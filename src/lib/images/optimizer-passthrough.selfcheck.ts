/**
 * ponytail: assert /_next/image allowlist — fails if open-redirect or blocks legit assets.
 * Run: npx tsx src/lib/images/optimizer-passthrough.selfcheck.ts
 */
import assert from 'node:assert/strict';
import { resolveImageOptimizerTarget } from '../../proxy';

const origin = 'https://www.purevedicgems.com';

const rel = resolveImageOptimizerTarget('/home/foo.png', origin);
assert.equal(rel.ok, true);
if (rel.ok) assert.equal(rel.href, 'https://www.purevedicgems.com/home/foo.png');

assert.equal(resolveImageOptimizerTarget('//evil.com/x', origin).ok, false);
assert.equal(resolveImageOptimizerTarget('https://evil.com/x.jpg', origin).ok, false);

const supabase = resolveImageOptimizerTarget(
  'https://abcd.supabase.co/storage/v1/object/public/x.jpg',
  origin,
);
assert.equal(supabase.ok, true);

const sanity = resolveImageOptimizerTarget(
  'https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fx%2Fy.jpg',
  origin,
);
assert.equal(sanity.ok, true);

const r2 = resolveImageOptimizerTarget(
  'https://cdn.purevedicgems.com/site-static/home/ctas/cta2.webp',
  origin,
);
assert.equal(r2.ok, true);

console.log('optimizer-passthrough.selfcheck: ok');
