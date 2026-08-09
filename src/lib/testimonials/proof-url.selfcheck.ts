import assert from 'node:assert/strict';
import { isViewableProofUrl } from './proof-url';

assert.equal(isViewableProofUrl(null), false);
assert.equal(isViewableProofUrl('/legacy/testimonials/anagha-proof.webp'), false);
assert.equal(isViewableProofUrl('https://xxx.supabase.co/storage/v1/object/public/testimonials/a.jpg'), true);
console.log('proof-url.selfcheck: ok');
