import { describe, expect, it } from 'vitest';
import { clampCartQuantity, dedupeCartByProductId, getMaxAvailableQuantity } from '@/lib/cart/client';
import type { CartItem } from '@/lib/types/cart';

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    key: 'p1',
    product_id: '00000000-0000-4000-8000-000000000001',
    sku: 'TEST-SKU',
    name: 'Test Ruby',
    category: 'ruby',
    image_url: '',
    price: 1000,
    quantity: 1,
    in_stock: true,
    stock_quantity: 5,
    stock_status: 'in_stock',
    availability_status: 'in_stock',
    sold_individually: false,
    carat_weight: null,
    origin: null,
    ...overrides,
  };
}

describe('unique piece cart quantity', () => {
  it('never allows more than 1 even when stock_quantity is higher', () => {
    expect(getMaxAvailableQuantity(item({ stock_quantity: 99 }))).toBe(1);
    expect(clampCartQuantity(item({ stock_quantity: 99 }), 5)).toBe(1);
  });

  it('returns 0 when out of stock', () => {
    expect(getMaxAvailableQuantity(item({ stock_quantity: 0 }))).toBe(0);
    expect(getMaxAvailableQuantity(item({ availability_status: 'sold' }))).toBe(0);
    expect(clampCartQuantity(item({ stock_quantity: 0 }), 1)).toBe(0);
  });
});

describe('dedupeCartByProductId', () => {
  const productId = '00000000-0000-4000-8000-000000000001';

  it('keeps configured line and drops loose when same product appears twice', () => {
    const loose = item({ key: productId, product_id: productId, price: 18430 });
    const configured = item({
      key: `${productId}:cfg:cfg-1`,
      product_id: productId,
      price: 50243,
      configuration_id: 'cfg-1',
    });
    const result = dedupeCartByProductId([loose, configured]);
    expect(result).toHaveLength(1);
    expect(result[0].configuration_id).toBe('cfg-1');
    expect(result[0].price).toBe(50243);
  });

  it('does not collapse different products', () => {
    const a = item({ key: 'a', product_id: 'a' });
    const b = item({ key: 'b', product_id: 'b' });
    expect(dedupeCartByProductId([a, b])).toHaveLength(2);
  });
});
