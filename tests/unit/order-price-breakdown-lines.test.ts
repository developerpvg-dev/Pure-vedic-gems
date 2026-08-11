import { describe, expect, it } from 'vitest';
import {
  buildOrderPriceLines,
  orderItemMerchandiseTotal,
} from '@/lib/orders/price-breakdown-lines';

describe('buildOrderPriceLines', () => {
  it('bakes jewellery tax into Jewellery line — never shows a GST row', () => {
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
      'cert',
      'energization',
      'shipping',
    ]);
    expect(lines.find((l) => l.key === 'gst')).toBeUndefined();
    expect(lines.every((l) => !/gst|cgst|sgst|igst/i.test(l.label))).toBe(true);
    const sum = lines.reduce((s, l) => s + l.sign * l.amount, 0);
    expect(sum).toBe(15048 + 10325 + 41300 + 4000 + 3500 + 1500 + 3413);
    expect(lines.find((l) => l.key === 'jewelry')?.amount).toBe(10325 + 41300 + 3413);
    expect(lines.find((l) => l.key === 'jewelry')?.label).toBe('Jewellery');
  });

  it('folds jewellery GST into the jewellery amount (no separate GST line)', () => {
    const lines = buildOrderPriceLines({
      subtotal: 10000,
      jewelry_charges: 2000,
      metal_charges: 8000,
      shipping_cost: 0,
      gst_amount: 300,
      total: 20300,
    });
    expect(lines.find((l) => l.key === 'jewelry')?.label).toBe('Jewellery');
    expect(lines.find((l) => l.key === 'jewelry')?.amount).toBe(10300);
    expect(lines.find((l) => l.key === 'gst')).toBeUndefined();
  });

  it('folds ready jewellery/bracelet GST into product subtotal', () => {
    const lines = buildOrderPriceLines({
      subtotal: 10000,
      jewelry_charges: 0,
      metal_charges: 0,
      gst_amount: 300,
      tax_breakdown: {
        components: [
          {
            label: 'Bracelet',
            component: 'product',
            taxable_amount: 10000,
            rate_percent: 3,
            cgst: 0,
            sgst: 0,
            igst: 300,
            total_tax: 300,
          },
        ],
        totals: { taxable_amount: 10000, cgst: 0, sgst: 0, igst: 300, gst_amount: 300 },
      },
      total: 10300,
    });
    expect(lines.find((l) => l.key === 'gst')).toBeUndefined();
    expect(lines.find((l) => l.key === 'subtotal')?.amount).toBe(10300);
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
