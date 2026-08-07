/**
 * Run: npx tsx src/lib/currency/format-charged.check.ts
 */
import assert from 'node:assert/strict';
import { formatChargedMoney, formatPaymentCharge } from './format-charged';

assert.match(formatChargedMoney({ amount_inr: 101, currency: 'INR' }), /₹101|Rs/);
assert.match(
  formatChargedMoney({ amount_inr: 101, amount_paise: 106, currency: 'USD' }),
  /\$1\.06/,
);
assert.match(formatPaymentCharge(5525, 'USD:6650'), /\$66\.50/);
assert.match(formatPaymentCharge(5525, null), /₹5,525|Rs/);

console.log('format-charged check ok');
