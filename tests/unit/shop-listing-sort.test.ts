import { describe, expect, it } from 'vitest';
import { applyShopListingSort } from '@/lib/shop/listing';

describe('shop listing sort', () => {
  it('uses in_stock first then display_order for catalog sort', () => {
    const orders: string[] = [];
    const query = {
      order(column: string, options: { ascending: boolean }) {
        orders.push(`${column}:${options.ascending ? 'asc' : 'desc'}`);
        return this;
      },
    };

    applyShopListingSort(query, { sort_by: 'catalog', sort_order: 'asc' });
    expect(orders).toEqual(['in_stock:desc', 'display_order:asc', 'legacy_woo_id:asc']);
  });

  it('keeps in_stock first for price sorts', () => {
    const orders: string[] = [];
    const query = {
      order(column: string, options: { ascending: boolean }) {
        orders.push(`${column}:${options.ascending ? 'asc' : 'desc'}`);
        return this;
      },
    };

    applyShopListingSort(query, { sort_by: 'price', sort_order: 'asc' });
    expect(orders[0]).toBe('in_stock:desc');
  });
});
