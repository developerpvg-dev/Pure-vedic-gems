import { describe, expect, it } from 'vitest';

import {
  calculateEarnedPointsPreview,
  calculateMaxRedeemablePoints,
  calculateRewardDiscount,
} from '@/lib/rewards/rules';

const base = {
  is_active: true,
  point_value_inr: 1,
  min_redeem_points: 1,
  max_redeem_points_per_order: 5000,
  max_redeem_percent: 20,
};

describe('reward redeem edge cases', () => {
  it('caps 100 pts on ₹100 order at 20% → 20 pts (pay ₹80)', () => {
    expect(calculateMaxRedeemablePoints(base, 100, 100)).toBe(20);
    expect(calculateRewardDiscount(20, 1)).toBe(20);
  });

  it('uses balance when balance is under the % cap', () => {
    expect(calculateMaxRedeemablePoints(base, 15, 100)).toBe(15);
  });

  it('returns 0 when program is inactive', () => {
    expect(calculateMaxRedeemablePoints({ ...base, is_active: false }, 100, 100)).toBe(0);
  });

  it('returns 0 when order merchandise is 0', () => {
    expect(calculateMaxRedeemablePoints(base, 100, 0)).toBe(0);
  });

  it('returns 0 when balance is 0', () => {
    expect(calculateMaxRedeemablePoints(base, 0, 100)).toBe(0);
  });

  it('honours 0% redeem (no points usable)', () => {
    expect(calculateMaxRedeemablePoints({ ...base, max_redeem_percent: 0 }, 100, 100)).toBe(0);
  });

  it('honours 100% redeem up to balance and order', () => {
    expect(calculateMaxRedeemablePoints({ ...base, max_redeem_percent: 100 }, 80, 100)).toBe(80);
    expect(calculateMaxRedeemablePoints({ ...base, max_redeem_percent: 100 }, 150, 100)).toBe(100);
  });

  it('applies fixed per-order point cap when tighter than %', () => {
    // 20% of ₹50_000 = ₹10_000, but fixed cap 100 pts
    expect(
      calculateMaxRedeemablePoints(
        { ...base, max_redeem_points_per_order: 100 },
        10_000,
        50_000
      )
    ).toBe(100);
  });

  it('applies % cap when tighter than fixed per-order cap', () => {
    // 20% of ₹100 = ₹20; fixed cap 5000
    expect(calculateMaxRedeemablePoints(base, 5000, 100)).toBe(20);
  });

  it('respects point value ≠ ₹1', () => {
    // 20% of ₹100 = ₹20 discount → 10 points at ₹2/pt
    expect(
      calculateMaxRedeemablePoints({ ...base, point_value_inr: 2 }, 100, 100)
    ).toBe(10);
    expect(calculateRewardDiscount(10, 2)).toBe(20);
  });

  it('returns 0 when max usable is below min_redeem_points', () => {
    expect(
      calculateMaxRedeemablePoints({ ...base, min_redeem_points: 50 }, 100, 100)
    ).toBe(0); // max by % is 20 < min 50
  });

  it('reduces earn 1:1 when points were redeemed on the order', () => {
    expect(calculateEarnedPointsPreview({ earn_points_per_order: 500 }, 0)).toBe(500);
    expect(calculateEarnedPointsPreview({ earn_points_per_order: 500 }, 100)).toBe(400);
    expect(calculateEarnedPointsPreview({ earn_points_per_order: 500 }, 600)).toBe(0);
  });

  it('uses coupon-reduced eligible amount as % base', () => {
    // merchandise 1000, coupon 500 → eligible 500 → 20% = 100
    expect(calculateMaxRedeemablePoints(base, 1000, 500)).toBe(100);
  });
});
