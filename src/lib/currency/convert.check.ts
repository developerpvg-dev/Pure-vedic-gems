/**
 * Self-check: INR → FX conversion math (1 FX = N INR).
 * Run: npx tsx src/lib/currency/convert.check.ts
 */

import assert from 'node:assert/strict';
import {
  convertFromInr,
  setCurrencyDisplay,
} from './display-store';

setCurrencyDisplay({
  enabled: true,
  currency: 'USD',
  rates: { INR: 1, USD: 83, AED: 22.6 },
});

assert.equal(convertFromInr(8300, 'USD'), 100);
assert.equal(convertFromInr(2260, 'AED'), 100);
assert.equal(convertFromInr(500, 'INR'), 500);

setCurrencyDisplay({ enabled: false, currency: 'USD' });
assert.equal(convertFromInr(8300, 'USD'), 8300); // conversion off → passthrough

console.log('currency convert check ok');
