/**
 * ponytail: public CDN URL helper — fails if CDN/supabase parse drifts.
 * Run: npx tsx src/lib/media/public-url.selfcheck.ts
 */
process.env.NEXT_PUBLIC_CDN_URL = 'https://cdn.purevedicgems.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co';

import assert from 'node:assert/strict';
import { publicObjectUrl, parsePublicMediaUrl, encodeObjectKey } from './public-url';

assert.equal(
  publicObjectUrl('products', 'images/a.webp'),
  'https://cdn.purevedicgems.com/products/images/a.webp',
);
assert.equal(encodeObjectKey('a b/c'), 'a%20b/c');

const cdn = parsePublicMediaUrl(
  'https://cdn.purevedicgems.com/products/images/hello%20world.webp',
);
assert.equal(cdn?.bucket, 'products');
assert.equal(cdn?.path, 'images/hello world.webp');
assert.equal(cdn?.via, 'cdn');

const sb = parsePublicMediaUrl(
  'https://xyz.supabase.co/storage/v1/object/public/product-images/navratna/x.webp',
);
assert.equal(sb?.bucket, 'product-images');
assert.equal(sb?.path, 'navratna/x.webp');

assert.equal(parsePublicMediaUrl('https://evil.com/products/x.webp'), null);

console.log('public-url.selfcheck: ok');
