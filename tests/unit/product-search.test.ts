import { describe, expect, it } from 'vitest';
import { applyProductIlikeSearch, parseProductWeightSearch } from '@/lib/shop/product-search';

describe('parseProductWeightSearch', () => {
  it('reads carat with unit', () => {
    expect(parseProductWeightSearch('5.76ct')).toMatchObject({ value: 5.76, unit: 'carat', min: 5.76, max: 5.76 });
    expect(parseProductWeightSearch('5 ct')).toMatchObject({ value: 5, unit: 'carat', min: 5, max: 5.99 });
  });

  it('reads ratti with unit', () => {
    expect(parseProductWeightSearch('6 ratti')).toMatchObject({ value: 6, unit: 'ratti', min: 6, max: 6.99 });
  });

  it('reads a bare decimal as weight', () => {
    expect(parseProductWeightSearch('6.73')).toMatchObject({ value: 6.73, unit: 'any' });
  });

  it('does not treat integer-only queries as weight', () => {
    expect(parseProductWeightSearch('7')).toBeNull();
    expect(parseProductWeightSearch('7 mukhi')).toBeNull();
  });
});

describe('applyProductIlikeSearch', () => {
  it('ANDs leftover text with a weight clause', () => {
    const calls: string[] = [];
    const query = {
      or(filters: string) {
        calls.push(filters);
        return this;
      },
    };

    applyProductIlikeSearch(query, 'yellow 5.76ct');
    expect(calls[0]).toContain('name.ilike.%yellow%');
    expect(calls[1]).toContain('carat_weight.gte.5.76');
    expect(calls[1]).toContain('carat_weight.lte.5.76');
  });

  it('searches weight only for a bare decimal', () => {
    const calls: string[] = [];
    const query = {
      or(filters: string) {
        calls.push(filters);
        return this;
      },
    };

    applyProductIlikeSearch(query, '5.76');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('carat_weight.gte.5.76');
    expect(calls[0]).toContain('ratti_weight.gte.5.76');
  });
});
