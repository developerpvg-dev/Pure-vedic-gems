import { afterEach, describe, expect, it } from 'vitest';
import { setCurrencyDisplay } from '@/lib/currency/display-store';
import {
  INTL_SHIPPING_ZONE,
  planAppliesToCountry,
  planAppliesToSubtotal,
  resolveShippingPlanCountry,
} from '@/lib/shipping/plans';
import { localizeInrAmountsInText } from '@/lib/utils/format';

describe('shipping plan matching', () => {
  it('maps address country to plan zone', () => {
    expect(resolveShippingPlanCountry('IN')).toBe('IN');
    expect(resolveShippingPlanCountry('US')).toBe(INTL_SHIPPING_ZONE);
  });

  it('applies IN / XX zones correctly', () => {
    expect(planAppliesToCountry('IN', 'IN')).toBe(true);
    expect(planAppliesToCountry('XX', 'GB')).toBe(true);
    expect(planAppliesToCountry('IN', 'GB')).toBe(false);
  });

  it('applies order-value bands at the ₹25,000 boundary', () => {
    expect(planAppliesToSubtotal({ max_order_amount: 25000 }, 25000)).toBe(true);
    expect(planAppliesToSubtotal({ max_order_amount: 25000 }, 25001)).toBe(false);
    expect(planAppliesToSubtotal({ min_order_amount: 25001 }, 25000)).toBe(false);
    expect(planAppliesToSubtotal({ min_order_amount: 25001 }, 25001)).toBe(true);
  });
});

describe('shipping plan copy currency', () => {
  afterEach(() => {
    setCurrencyDisplay({ enabled: false, currency: 'INR', rates: { INR: 1 } });
  });

  it('rewrites ₹ thresholds into the active display currency', () => {
    setCurrencyDisplay({ enabled: true, currency: 'USD', rates: { INR: 1, USD: 83 } });
    const out = localizeInrAmountsInText(
      'International shipping (orders above ₹25,000)'
    );
    expect(out).not.toMatch(/₹/);
    expect(out).toMatch(/\$/);
  });
});
