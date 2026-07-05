import { describe, expect, it } from 'vitest';

import { resolveRudrakshaSelectionPrice } from '@/lib/utils/rudraksha-pricing';
import type { ProductCard } from '@/lib/types/product';

function product(overrides: Partial<ProductCard>): ProductCard {
  return {
    id: '1',
    slug: 'test',
    name: 'Test Rudraksha',
    category: 'rudraksha',
    sub_category: '5-mukhi',
    price: 1000,
    ...overrides,
  } as ProductCard;
}

describe('rudraksha-pricing', () => {
  it('sums primary and combo bead prices without duplicates', () => {
    const primary = product({ id: 'a', price: 1000 });
    const combo = [
      product({ id: 'b', price: 2000 }),
      product({ id: 'c', price: 3000 }),
      product({ id: 'a', price: 9999 }),
    ];

    expect(resolveRudrakshaSelectionPrice(primary, combo)).toBe(6000);
  });

  it('returns zero when no primary bead is selected', () => {
    expect(resolveRudrakshaSelectionPrice(null, [product({ id: 'b', price: 2000 })])).toBe(0);
  });
});
