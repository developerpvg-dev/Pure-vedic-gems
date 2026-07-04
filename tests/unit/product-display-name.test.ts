import { describe, expect, it } from 'vitest';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';

describe('formatProductDisplayName', () => {
  it('removes legacy per-carat pricing from product titles', () => {
    expect(formatProductDisplayName('African Ruby 10.85ct. @2200 per. ct. (Premium)')).toBe(
      'African Ruby 10.85ct. (Premium)',
    );
    expect(formatProductDisplayName('Diopside 9.31ct.@350per.ct')).toBe('Diopside 9.31ct.');
    expect(formatProductDisplayName('Fresh Water Pearl 8.16ct.@150perct.(Economy)')).toBe(
      'Fresh Water Pearl 8.16ct. (Economy)',
    );
    expect(formatProductDisplayName('White Sapphire 5.16ct.@12900per.ct.(Super Premium)')).toBe(
      'White Sapphire 5.16ct. (Super Premium)',
    );
  });

  it('returns empty string for blank input', () => {
    expect(formatProductDisplayName('')).toBe('');
    expect(formatProductDisplayName(null)).toBe('');
  });
});
