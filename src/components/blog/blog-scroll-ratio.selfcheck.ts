import assert from 'node:assert/strict';
import { blogScrollRatio } from './blog-scroll-ratio';

assert.equal(blogScrollRatio(0, 800, 800), 0, 'layout not ready');
assert.equal(blogScrollRatio(0, 500, 800), 0, 'taller viewport than page');
assert.equal(blogScrollRatio(300, 1800, 800), 0.3, 'exactly 30%');
assert.ok(blogScrollRatio(200, 1800, 800) < 0.3, 'under 30%');
assert.ok(blogScrollRatio(500, 1800, 800) > 0.3, 'over 30%');

console.log('blog-scroll-ratio self-check ok');
