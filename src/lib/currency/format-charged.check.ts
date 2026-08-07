/**
 * Run: npx tsx src/lib/currency/format-charged.check.ts
 */
import assert from 'node:assert/strict';
import {
  formatChargedMoney,
  formatOrderMoney,
  formatPaymentCharge,
  resolveOrderChargeContext,
  withPaymentChargeFlags,
} from './format-charged';

assert.match(formatChargedMoney({ amount_inr: 101, currency: 'INR' }), /₹101|Rs/);
assert.match(
  formatChargedMoney({ amount_inr: 101, amount_paise: 106, currency: 'USD' }),
  /\$1\.06/,
);
assert.match(formatPaymentCharge(5525, 'USD:6650'), /\$66\.50/);
assert.match(formatPaymentCharge(5525, null), /₹5,525|Rs/);

const ctx = { currency: 'USD', rate: 5525 / 57.77 };
assert.match(formatOrderMoney(5525, ctx), /\$57\.77/);
assert.match(formatOrderMoney(5525, ctx), /₹5,525|Rs/);
assert.match(formatOrderMoney(3000, ctx), /\$/);

const locked = withPaymentChargeFlags({}, { currency: 'USD', rate: 95 });
assert.equal(
  resolveOrderChargeContext({ complianceFlags: locked })?.currency,
  'USD',
);
// First lock wins
const again = withPaymentChargeFlags(locked, { currency: 'GBP', rate: 110 });
assert.equal(
  resolveOrderChargeContext({ complianceFlags: again })?.currency,
  'USD',
);

assert.equal(
  resolveOrderChargeContext({
    payments: [{ amount: 5525, reference: 'USD:5777' }],
  })?.currency,
  'USD',
);

console.log('format-charged check ok');
