import { describe, expect, it } from 'vitest';
import {
  applyExclusiveGemsShelfFilter,
  applyQuoteOnlyListingFilter,
  isExclusiveGemsShelf,
  shouldHideQuoteOnlyFromListing,
} from '@/lib/shop/catalog-scope';

describe('catalog listing scope', () => {
  it('hides quote-only SKUs from ruby listing', () => {
    expect(shouldHideQuoteOnlyFromListing('navaratna', 'ruby')).toBe(true);
  });

  it('shows quote-only SKUs on exclusive-gems page', () => {
    expect(shouldHideQuoteOnlyFromListing('navaratna', 'exclusive-gems')).toBe(false);
  });

  it('hides quote-only SKUs from pitambari listing', () => {
    expect(shouldHideQuoteOnlyFromListing('navaratna', 'pitambari')).toBe(true);
  });

  it('does not filter upratna listings', () => {
    expect(shouldHideQuoteOnlyFromListing('upratna', 'amethyst')).toBe(false);
  });

  it('applies supabase filter for navaratna ruby', () => {
    const calls: string[] = [];
    const query = {
      not(column: string, operator: string, value: string) {
        calls.push(`${column} ${operator} ${value}`);
        return this;
      },
    };
    applyQuoteOnlyListingFilter(query, 'navaratna', 'ruby');
    expect(calls).toEqual(['price_mode in (on_demand,quote_required)']);
  });

  it('keeps quote-only rows when Exclusive quality filter is active', () => {
    const calls: string[] = [];
    const query = {
      not(column: string, operator: string, value: string) {
        calls.push(`${column} ${operator} ${value}`);
        return this;
      },
    };
    applyQuoteOnlyListingFilter(query, 'navaratna', 'ruby', 'Exclusive');
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
