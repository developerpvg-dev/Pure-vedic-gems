import { describe, expect, it } from 'vitest';
import { capManualDiscount } from '@/lib/orders/manual-discount-target';

const parts = {
  subtotal: 17060,
  jewelry: 24110,
  metal: 96440,
  certification: 1900,
  energization: 0,
  shipping: 1500,
  merchandiseAfterCouponReward: 139510,
};

describe('capManualDiscount', () => {
  it('keeps an untargeted discount off the whole merchandise total', () => {
    const result = capManualDiscount({ ...parts, target: null, requested: 200000 });
    expect(result).toEqual({
      amount: 139510,
      onMerchandise: 139510,
      onShipping: 0,
      gstBaseReduction: 0,
    });
  });

  it('caps a gemstone discount at the gem line', () => {
    const result = capManualDiscount({ ...parts, target: 'stones', requested: 20000 });
    expect(result.amount).toBe(17060);
    expect(result.onShipping).toBe(0);
    expect(result.gstBaseReduction).toBe(0);
  });

  it('caps a design discount at metal plus making and marks it for GST', () => {
    const result = capManualDiscount({ ...parts, target: 'design', requested: 200000 });
    expect(result.amount).toBe(120550);
    expect(result.gstBaseReduction).toBe(120550);
    expect(result.onShipping).toBe(0);
  });

  it('takes a shipping discount off shipping only', () => {
    const result = capManualDiscount({
      ...parts,
      merchandiseAfterCouponReward: 0,
      target: 'shipping',
      requested: 5000,
    });
    expect(result).toEqual({
      amount: 1500,
      onMerchandise: 0,
      onShipping: 1500,
      gstBaseReduction: 0,
    });
  });
});
