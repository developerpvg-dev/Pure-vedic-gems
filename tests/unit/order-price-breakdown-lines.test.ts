import { describe, expect, it } from 'vitest';
import {
  buildOrderPriceLines,
  orderItemMerchandiseTotal,
} from '@/lib/orders/price-breakdown-lines';

describe('buildOrderPriceLines', () => {
  it('lists every charge so gem + metal + making + cert + GST + shipping = total context', () => {
    const lines = buildOrderPriceLines({
      subtotal: 15048,
      jewelry_charges: 10325,
      metal_charges: 41300,
      certification_charges: 4000,
      energization_charges: 3500,
      shipping_cost: 1500,
      gst_amount: 3413,
      total: 79086,
    });

    expect(lines.map((l) => l.key)).toEqual([
      'subtotal',
      'jewelry',
      'metal',
      'cert',
      'energization',
      'shipping',
      'gst',
    ]);
    expect(lines.find((l) => l.key === 'gst')?.label).toBe('GST');
    const sum = lines.reduce((s, l) => s + l.sign * l.amount, 0);
    expect(sum).toBe(15048 + 10325 + 41300 + 4000 + 3500 + 1500 + 3413);
  });

  it('does not double-count discount when coupon and rewards are present', () => {
    const lines = buildOrderPriceLines({
      subtotal: 20000,
      jewelry_charges: 0,
      metal_charges: 0,
      shipping_cost: 0,
      discount: 1500,
      coupon_discount: 1000,
      coupon_code: 'SAVE10',
      reward_discount: 500,
      reward_points_redeemed: 500,
      gst_amount: 50,
      total: 18550,
    });

    expect(lines.filter((l) => l.sign < 0).map((l) => l.key)).toEqual(['coupon', 'rewards']);
    expect(lines.some((l) => l.key === 'discount')).toBe(false);
  });
});

describe('orderItemMerchandiseTotal', () => {
  it('uses snapshot piece total for configured jewellery', () => {
    expect(
      orderItemMerchandiseTotal({
        line_total: 15048,
        quantity: 1,
        configuration_snapshot: { pricing: { total: 74173 } },
      }),
    ).toBe(74173);
  });

  it('falls back to gem line_total for plain products', () => {
    expect(orderItemMerchandiseTotal({ line_total: 9999, quantity: 2 })).toBe(9999);
  });
});
