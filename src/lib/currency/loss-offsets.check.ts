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
  savedLossOffsetInr,
} from './loss-offsets';
import { rateComparison } from '../admin/commerce-currency';
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

// Admin-set buffer survives "Update rates from API".
assert.equal(savedLossOffsetInr('AED', { api_rate: 26.1911, rate: 25.6911 }), 0.5);
assert.equal(savedLossOffsetInr('AUD', { api_rate: 66.9023, rate: 65.9023 }), 1);
assert.equal(savedLossOffsetInr('USD', { api_rate: 90, rate: 90 }), 0, 'admin may set 0');
assert.equal(savedLossOffsetInr('USD', { api_rate: 90, rate: 91 }), 0, 'never negative');
assert.equal(savedLossOffsetInr('USD', { api_rate: null, rate: 88 }), 1.7, 'no snapshot → default');
assert.equal(savedLossOffsetInr('USD', null), 1.7);
assert.equal(applyLossOffset(70, 'AUD', 1), 69);
assert.ok(isBufferedRate(70, 69, 'AUD', 1));

const base = { id: null, base_currency: 'INR', manual_override: true, is_active: true, source: null, updated_at: null };
assert.equal(rateComparison({ ...base, currency: 'AUD', rate: 65.9023, api_rate: 66.9023 })?.bufferLabel, '−₹1 loss buffer');
assert.equal(rateComparison({ ...base, currency: 'JPY', rate: 0.6, api_rate: 0.6 })?.bufferLabel, 'no buffer');

console.log('loss-offsets check ok');
