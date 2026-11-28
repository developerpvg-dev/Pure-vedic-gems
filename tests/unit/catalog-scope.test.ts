import { describe, expect, it } from 'vitest';
import {
  applyExclusiveGemsShelfFilter,
  applyQuoteOnlyListingFilter,
  isExclusiveGemsShelf,
  shouldHideQuoteOnlyFromListing,
} from '@/lib/shop/catalog-scope';

describe('catalog listing scope', () => {
  it('keeps on-demand SKUs on the ruby listing', () => {
    expect(shouldHideQuoteOnlyFromListing('navaratna', 'ruby')).toBe(false);
    expect(shouldHideQuoteOnlyFromListing('navaratna', 'pitambari')).toBe(false);
    expect(shouldHideQuoteOnlyFromListing('navaratna', 'exclusive-gems')).toBe(false);
  });

  it('does not strip on-demand rows from a ruby query', () => {
    const calls: string[] = [];
    const query = {
      not(column: string, operator: string, value: string) {
        calls.push(`${column} ${operator} ${value}`);
        return this;
      },
    };
    applyQuoteOnlyListingFilter(query, 'navaratna', 'ruby');
    applyQuoteOnlyListingFilter(query, 'navaratna', 'ruby', undefined, 'on_demand');
    expect(calls).toEqual([]);
  });

  it('exclusive shelf includes remapped quality_label Exclusive', () => {
    expect(isExclusiveGemsShelf('exclusive-gems')).toBe(true);
    const calls: string[] = [];
    const query = {
      or(filters: string) {
        calls.push(filters);
        return this;
      },
    };
    applyExclusiveGemsShelfFilter(query, 'exclusive-gems');
    expect(calls).toEqual(['sub_category.eq.exclusive-gems,quality_label.eq.Exclusive']);
  });
});
