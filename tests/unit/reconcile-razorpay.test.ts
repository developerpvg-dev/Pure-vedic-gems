import { describe, expect, it } from 'vitest';
import { capturedChargeMatches } from '@/lib/orders/reconcile-razorpay';

describe('capturedChargeMatches', () => {
  it('accepts a GBP capture that matches the stored gateway reference', () => {
    expect(
      capturedChargeMatches(
        {
          captured: true,
          razorpayOrderAmountPaise: 87727,
          razorpayPaymentAmountPaise: 87727,
          currency: 'GBP',
        },
        87727,
        'GBP',
      ),
    ).toBe(true);
  });

  it('rejects an INR paise total against a GBP charge', () => {
    expect(
      capturedChargeMatches(
        {
          captured: true,
          razorpayOrderAmountPaise: 87727,
          razorpayPaymentAmountPaise: 87727,
          currency: 'GBP',
        },
        10795000,
        'INR',
      ),
    ).toBe(false);
  });
});
