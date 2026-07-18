import { describe, expect, it } from 'vitest';
import { clampCartQuantity, getMaxAvailableQuantity } from '@/lib/cart/client';
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
