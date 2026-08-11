/**
 * Self-check: FX loss offsets.
 * Run: npx tsx src/lib/currency/loss-offsets.check.ts
 */

import assert from 'node:assert/strict';
import { applyLossOffset, lossOffsetInr } from './loss-offsets';

assert.equal(lossOffsetInr('USD'), 1.7);
assert.equal(lossOffsetInr('CAD'), 1.0);
assert.equal(lossOffsetInr('JPY'), 0);
assert.equal(applyLossOffset(90, 'USD'), 88.3);
assert.equal(applyLossOffset(22.6, 'AED'), 22.1);
assert.equal(applyLossOffset(55, 'AUD'), 55); // no offset configured
assert.equal(applyLossOffset(0.001, 'GBP'), 0.0001); // floor

console.log('loss-offsets check ok');
