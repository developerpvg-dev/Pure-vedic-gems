import assert from 'node:assert/strict';
import { productUpdateSchema } from './product';

const cleared = productUpdateSchema.parse({ video_url: null });
assert.equal(cleared.video_url, null, 'removed video must clear the column');
assert.equal(productUpdateSchema.parse({ video_url: '' }).video_url, null);
assert.equal(productUpdateSchema.parse({}).video_url, undefined, 'omitted video leaves column untouched');
assert.equal(
  productUpdateSchema.parse({ video_url: 'https://youtu.be/abcdefghijk' }).video_url,
  'https://youtu.be/abcdefghijk',
);

console.log('product.video.check: ok');
