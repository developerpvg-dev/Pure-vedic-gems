/**
 * Self-check: INR → FX conversion math (1 FX = N INR) + language→currency.
 * Run: npx tsx src/lib/currency/convert.check.ts
 */

import assert from 'node:assert/strict';
import {
  convertFromInr,
  convertToInr,
  setCurrencyDisplay,
} from './display-store';
import {
  suggestCurrencyFromCountryCode,
  suggestCurrencyFromLanguage,
} from './geo';

setCurrencyDisplay({
  enabled: true,
  currency: 'USD',
  rates: { INR: 1, USD: 83, AED: 22.6 },
});

assert.equal(convertFromInr(8300, 'USD'), 100);
assert.equal(convertFromInr(2260, 'AED'), 100);
assert.equal(convertFromInr(500, 'INR'), 500);
assert.equal(convertToInr(100, 'USD'), 8300);
assert.equal(convertToInr(100, 'AED'), 2260);

setCurrencyDisplay({ enabled: false, currency: 'USD' });
assert.equal(convertFromInr(8300, 'USD'), 8300); // conversion off → passthrough
assert.equal(convertToInr(100, 'USD'), 100);

assert.equal(suggestCurrencyFromLanguage('en-US'), 'USD');
assert.equal(suggestCurrencyFromLanguage('en-GB'), 'GBP');
assert.equal(suggestCurrencyFromLanguage('hi-IN'), 'INR');
assert.equal(suggestCurrencyFromLanguage('de-DE'), 'EUR');

assert.equal(suggestCurrencyFromCountryCode('US'), 'USD');
assert.equal(suggestCurrencyFromCountryCode('GB'), 'GBP');
assert.equal(suggestCurrencyFromCountryCode('AE'), 'AED');
assert.equal(suggestCurrencyFromCountryCode('IN'), 'INR');
assert.equal(suggestCurrencyFromCountryCode('DE'), 'EUR');
assert.equal(suggestCurrencyFromCountryCode(null), 'INR');

console.log('currency convert check ok');
