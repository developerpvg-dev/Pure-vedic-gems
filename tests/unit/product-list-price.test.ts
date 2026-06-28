import { describe, expect, it } from 'vitest';
import {
  formatProductListPrice,
  resolveProductDisplayPrice,
} from '@/lib/utils/format';

describe('product list price display', () => {
  it('derives total from per-carat price when fixed price is zero', () => {
    const product = {
      price: 0,
      price_per_carat: 3200,
      carat_weight: 5.76,
      price_mode: 'per_carat',
    };

    expect(resolveProductDisplayPrice(product)).toBe(18432);
    expect(formatProductListPrice(product)).toEqual({
      label: '₹18,432',
      detail: '₹3,200/ct',
    });
  });

  it('shows price on request for quote-only products', () => {
    expect(
      formatProductListPrice({
        price: 0,
        price_mode: 'on_demand',
      })
    ).toEqual({ label: 'Price on Request' });
  });
});
