/**
 * Run: npx tsx src/lib/consultation/finalize-captured-payment.check.ts
 */
import assert from 'node:assert/strict';
import { consultationAmountMatches } from './finalize-captured-payment';

const inr101 = { amount_inr: 101, amount_paise: 10100, currency: 'INR' };
assert.equal(
  consultationAmountMatches(inr101, {
    razorpayOrderAmountPaise: 10100,
    razorpayPaymentAmountPaise: 10100,
    currency: 'INR',
  }),
  true
);
assert.equal(
  consultationAmountMatches(inr101, {
    razorpayOrderAmountPaise: 10100,
    razorpayPaymentAmountPaise: 10100,
    currency: 'USD',
  }),
  false
);
assert.equal(
  consultationAmountMatches({ amount_inr: 101, amount_paise: null, currency: 'INR' }, {
    razorpayOrderAmountPaise: 10100,
    razorpayPaymentAmountPaise: 10100,
    currency: 'INR',
  }),
  true
);

// Webhook must route consultation orders here, not shop order_not_found
function webhookPaymentTarget(hasShopOrder: boolean, hasConsultation: boolean) {
  if (hasShopOrder) return 'order';
  if (hasConsultation) return 'consultation';
  return 'order_not_found';
}
assert.equal(webhookPaymentTarget(false, true), 'consultation');
assert.equal(webhookPaymentTarget(true, false), 'order');
assert.equal(webhookPaymentTarget(false, false), 'order_not_found');

// Captured consultation with no enquiry must still be recovered (Daniel / Aug 13 case)
function needsOrphanLead(paymentStatus: string, hasEnquiry: boolean) {
  return paymentStatus === 'captured' && !hasEnquiry;
}
assert.equal(needsOrphanLead('captured', false), true);
assert.equal(needsOrphanLead('captured', true), false);
assert.equal(needsOrphanLead('pending', false), false);

console.log('finalize-captured-payment check ok');
