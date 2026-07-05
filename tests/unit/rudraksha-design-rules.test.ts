import { describe, expect, it } from 'vitest';

import {
  countRudrakshaBeadsInSelection,
  designMatchesRudrakshaProduct,
  designMatchesRudrakshaSelection,
  getRudrakshaDesignCategoriesForProduct,
  getRudrakshaDesignCategoriesForSelection,
  isRudrakshaConfiguratorContext,
} from '@/lib/utils/rudraksha-design-rules';
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

describe('rudraksha-design-rules', () => {
  it('detects rudraksha configurator context', () => {
    expect(isRudrakshaConfiguratorContext('rudraksha', null)).toBe(true);
    expect(isRudrakshaConfiguratorContext(null, product({ category: 'rudraksha' }))).toBe(true);
    expect(isRudrakshaConfiguratorContext('ruby', product({ category: 'ruby' }))).toBe(false);
  });

  it('maps one mukhi products to one_mukhi mountings only', () => {
    const categories = getRudrakshaDesignCategoriesForProduct(
      product({ sub_category: '1-mukhi' })
    );
    expect(categories).toEqual(['one_mukhi']);
    expect(designMatchesRudrakshaProduct('one_mukhi', product({ sub_category: '1-mukhi' }))).toBe(
      true
    );
    expect(designMatchesRudrakshaProduct('standard_mukhi', product({ sub_category: '1-mukhi' }))).toBe(
      false
    );
  });

  it('maps 2–17 mukhi and special shapes to standard_mukhi', () => {
    expect(getRudrakshaDesignCategoriesForProduct(product({ sub_category: '5-mukhi' }))).toEqual([
      'standard_mukhi',
    ]);
    expect(
      getRudrakshaDesignCategoriesForProduct(product({ sub_category: 'gauri-shankar' }))
    ).toEqual(['standard_mukhi']);
  });

  it('maps malas and multi-bead products to multiple_beads', () => {
    expect(
      getRudrakshaDesignCategoriesForProduct(product({ sub_category: 'rudraksha-mala' }))
    ).toEqual(['multiple_beads']);
    expect(
      designMatchesRudrakshaProduct('multiple_beads', product({ sub_category: 'siddha-mala' }))
    ).toBe(true);
  });

  it('falls back to mukhi_count when sub_category is missing', () => {
    expect(
      getRudrakshaDesignCategoriesForProduct(product({ sub_category: '', mukhi_count: 1 }))
    ).toEqual(['one_mukhi']);
    expect(
      getRudrakshaDesignCategoriesForProduct(product({ sub_category: '', mukhi_count: 7 }))
    ).toEqual(['standard_mukhi']);
  });

  it('unlocks multiple_beads mountings when 3+ beads are selected', () => {
    const primary = product({ id: 'a', sub_category: '5-mukhi' });
    const combo = [
      product({ id: 'b', sub_category: '7-mukhi' }),
      product({ id: 'c', sub_category: '9-mukhi' }),
    ];

    expect(countRudrakshaBeadsInSelection(primary, combo)).toBe(3);
    expect(getRudrakshaDesignCategoriesForSelection(primary, combo)).toEqual(['multiple_beads']);
    expect(designMatchesRudrakshaSelection('multiple_beads', primary, combo)).toBe(true);
    expect(designMatchesRudrakshaSelection('standard_mukhi', primary, combo)).toBe(false);
  });
});
