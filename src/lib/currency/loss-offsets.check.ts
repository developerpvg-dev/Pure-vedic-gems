/**
 * Self-check: FX loss offsets — apply correctly and raise FX prices vs mid-market.
 * Run: npx tsx src/lib/currency/loss-offsets.check.ts
 */

import assert from 'node:assert/strict';
import {
  FX_LOSS_OFFSETS_INR,
  applyLossOffset,
  isBufferedRate,
  lossOffsetInr,
} from './loss-offsets';
import {
  convertFromInr,
  setCurrencyDisplay,
} from './display-store';

assert.equal(lossOffsetInr('USD'), 1.7);
assert.equal(lossOffsetInr('EUR'), 2.0);
assert.equal(lossOffsetInr('GBP'), 2.5);
assert.equal(lossOffsetInr('CAD'), 1.0);
assert.equal(lossOffsetInr('JPY'), 0);
assert.equal(applyLossOffset(90, 'USD'), 88.3);
assert.equal(applyLossOffset(109.670029, 'EUR'), 107.670029);
assert.equal(applyLossOffset(22.6, 'AED'), 22.1);
assert.equal(applyLossOffset(55, 'AUD'), 55); // no offset configured
assert.equal(applyLossOffset(0.001, 'GBP'), 0.0001); // floor
assert.ok(isBufferedRate(109.670029, 107.670029, 'EUR'));
assert.ok(!isBufferedRate(109.670029, 109.670029, 'EUR'));

for (const [code, offset] of Object.entries(FX_LOSS_OFFSETS_INR)) {
  const api = 100;
  const stored = applyLossOffset(api, code);
  assert.equal(stored, Number((api - offset).toFixed(6)));
  assert.ok(isBufferedRate(api, stored, code), `${code} buffer mismatch`);
}

// Merchant protection: buffered rate → customer pays MORE FX than mid-market.
const apiEur = 109.670029;
const storedEur = applyLossOffset(apiEur, 'EUR');
setCurrencyDisplay({
  enabled: true,
  currency: 'EUR',
  rates: { INR: 1, EUR: storedEur },
});
const inr = 2600;
const chargedFx = convertFromInr(inr, 'EUR');
const midMarketFx = inr / apiEur;
assert.ok(chargedFx > midMarketFx, 'buffer must raise FX price vs mid-market');
assert.ok(Math.abs(chargedFx - inr / storedEur) < 1e-9);
assert.ok(chargedFx > 20 && chargedFx < 30, `EUR for ₹2600 should be ~24, got ${chargedFx}`);

// Same for every configured buffer currency.
for (const code of Object.keys(FX_LOSS_OFFSETS_INR)) {
  const api = 100;
  const stored = applyLossOffset(api, code);
  setCurrencyDisplay({ enabled: true, currency: code, rates: { INR: 1, [code]: stored } });
  const withBuffer = convertFromInr(10_000, code);
  const without = 10_000 / api;
  assert.ok(withBuffer > without, `${code}: buffer must increase FX amount`);
}

console.log('loss-offsets check ok');
