/**
 * Run: npx tsx src/lib/razorpay/charge-currency.check.ts
 */
import assert from 'node:assert/strict';
import {
  ceilToChargeMajor,
  encodeGatewayReference,
  normalizeChargeCurrency,
  parseGatewayReference,
  razorpayMinorFactor,
  toRazorpayMinor,
} from './charge-currency';

assert.equal(normalizeChargeCurrency('usd'), 'USD');
assert.equal(normalizeChargeCurrency('nope'), 'INR');
assert.equal(razorpayMinorFactor('JPY'), 1);
assert.equal(razorpayMinorFactor('USD'), 100);
assert.equal(toRazorpayMinor(12.34, 'USD'), 1234);
assert.equal(toRazorpayMinor(100, 'JPY'), 100);
assert.equal(encodeGatewayReference('usd', 1234), 'USD:1234');
assert.deepEqual(parseGatewayReference('USD:1234'), { currency: 'USD', minor: 1234 });
assert.equal(parseGatewayReference('bank-utr-xyz'), null);

// FX must ceil so merchant never under-collects (1.001 USD → 1.01, not 1.00)
assert.equal(ceilToChargeMajor(1.001, 'USD'), 1.01);
assert.equal(ceilToChargeMajor(100.1, 'JPY'), 101);

console.log('charge-currency check ok');
