import { describe, expect, it } from 'vitest';
import {
  formatProductListPrice,
  isProductPriceOnRequest,
  isProductPurchasable,
  isProductStockUnavailable,
  resolveProductCartPrice,
  resolveProductDisplayPrice,
} from '@/lib/shop/product-pricing';

describe('product-pricing', () => {
  it('derives total from per-carat when stored price is zero', () => {
    const product = {
      price: 0,
      price_per_carat: 3200,
      carat_weight: 5.76,
      price_mode: 'per_carat',
      in_stock: true,
    };

    expect(resolveProductDisplayPrice(product)).toBe(18432);
    expect(resolveProductCartPrice(product)).toBe(18432);
    expect(isProductPriceOnRequest(product)).toBe(false);
    expect(isProductPurchasable(product)).toBe(true);
    expect(formatProductListPrice(product)).toEqual({
      label: '₹18,432',
      detail: '₹3,200/ct',
    });
  });

  it('treats explicit on_demand mode as quote-only even with per-carat meta', () => {
    const product = {
      price: 0,
      price_per_carat: 3200,
      carat_weight: 5.76,
      price_mode: 'on_demand',
    };

    expect(isProductPriceOnRequest(product)).toBe(true);
    expect(isProductPurchasable(product)).toBe(false);
    expect(formatProductListPrice(product)).toEqual({ label: 'Price on Request' });
  });

  it('marks out-of-stock priced products unavailable but not on request', () => {
    const product = {
      price: 50000,
      price_mode: 'fixed',
      in_stock: false,
      availability_status: 'out_of_stock',
    };

    expect(isProductPriceOnRequest(product)).toBe(false);
    expect(isProductStockUnavailable(product)).toBe(true);
    expect(isProductPurchasable(product)).toBe(false);
  });

  it('shows price on request when no price can be resolved', () => {
    expect(
      formatProductListPrice({
        price: 0,
        price_mode: 'on_demand',
      }),
    ).toEqual({ label: 'Price on Request' });
  });
});
