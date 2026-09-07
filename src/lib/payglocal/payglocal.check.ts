/**
 * Run: npx tsx src/lib/payglocal/payglocal.check.ts
 */
import assert from 'node:assert/strict';
import { newMerchantTxnId, parseMerchantTxnId, isPayGlocalMerchantTxnId } from './config';
import { toAlpha3Country, splitPhone, splitName } from './country';
import {
  amountsMatch,
  formatPayGlocalAmount,
  isPayGlocalCaptured,
  isPayGlocalFailed,
  payGlocalAmountToMinor,
  payGlocalChargeMatches,
} from './status';

const orderTxn = newMerchantTxnId('order');
assert.equal(parseMerchantTxnId(orderTxn), 'order');
assert.equal(isPayGlocalMerchantTxnId(orderTxn), true);
assert.equal(isPayGlocalMerchantTxnId('order_abc'), false);
assert.match(orderTxn, /^PVGO[A-F0-9]{32}$/);

assert.equal(toAlpha3Country('IN'), 'IND');
assert.equal(toAlpha3Country('us'), 'USA');
assert.equal(toAlpha3Country('United Kingdom'), 'GBR');
assert.equal(toAlpha3Country('IND'), 'IND');
assert.equal(toAlpha3Country(''), 'IND');

assert.deepEqual(splitPhone('+14155552671'), { callingCode: '+1', phoneNumber: '4155552671' });
assert.deepEqual(splitPhone('+919876543210'), { callingCode: '+91', phoneNumber: '9876543210' });
assert.equal(splitName('Himanshu Sharma').firstName, 'Himanshu');

assert.equal(formatPayGlocalAmount(12.34, 'USD'), '12.34');
assert.equal(formatPayGlocalAmount(100, 'JPY'), '100');
assert.equal(payGlocalAmountToMinor('12.34', 'USD'), 1234);
assert.equal(payGlocalAmountToMinor('101.00', 'INR'), 10100);
// A missing amount must stay unknown; reading it as 0 flagged captured payments as mismatches.
assert.equal(payGlocalAmountToMinor(null, 'INR'), null);
assert.equal(payGlocalAmountToMinor('', 'INR'), null);
assert.equal(payGlocalAmountToMinor(undefined, 'INR'), null);
assert.equal(payGlocalChargeMatches({
  expectedMinor: 3650,
  expectedCurrency: 'USD',
  amount: '3100.00',
  currencies: ['INR', 'USD'],
  ledgerInrMinor: 310000,
}), true);
assert.equal(payGlocalChargeMatches({
  expectedMinor: 310000,
  expectedCurrency: 'INR',
  amount: '3100.00',
  currencies: ['INR'],
  ledgerInrMinor: 310000,
}), true);
assert.equal(payGlocalChargeMatches({
  expectedMinor: 10100,
  expectedCurrency: 'INR',
  amount: null,
  currencies: [null],
  ledgerInrMinor: 10100,
}), true);
assert.equal(amountsMatch(1234, 1235, 'USD'), true);
assert.equal(amountsMatch(1234, 1236, 'USD'), false);
assert.equal(isPayGlocalCaptured('sent_for_capture'), true);
assert.equal(isPayGlocalCaptured('CAPTURED'), true);
assert.equal(isPayGlocalCaptured('Transaction is sent_for_capture'), true);
assert.equal(isPayGlocalFailed('AUTHENTICATION_TIMEOUT'), true);
assert.equal(isPayGlocalFailed('AUTHENTICATION_FAILURE'), true);
assert.equal(isPayGlocalFailed('SYSTEM_ERROR'), true);
assert.equal(isPayGlocalFailed('Rule Config Error'), true);
assert.equal(isPayGlocalFailed('RULE_CONFIG_ERROR'), true);
assert.equal(isPayGlocalFailed('SENT_FOR_CAPTURE'), false);

console.log('payglocal check ok');
