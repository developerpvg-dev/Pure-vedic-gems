import { describe, expect, it } from 'vitest';

import {
  inferJewelleryTypeFromSubCategory,
  resolveBaseMetal,
  resolveJewelleryType,
} from '@/components/admin/product-form/kinds';

describe('jewellery field inference', () => {
  it('maps bracelet sub-categories to jewellery_type bracelet', () => {
    expect(inferJewelleryTypeFromSubCategory('bracelet')).toBe('bracelet');
    expect(inferJewelleryTypeFromSubCategory('bracelets')).toBe('bracelet');
    expect(inferJewelleryTypeFromSubCategory('healing-bracelets')).toBe('bracelet');
  });

  it('prefers stored jewellery_type over sub-category inference', () => {
    expect(resolveJewelleryType('pendant', 'bracelets')).toBe('pendant');
    expect(resolveJewelleryType('', 'bracelets')).toBe('bracelet');
  });

  it('falls back to wearing metal for base metal', () => {
    expect(resolveBaseMetal('', 'Silver 925')).toBe('Silver 925');
    expect(resolveBaseMetal('Gold 18K', 'Silver 925')).toBe('Gold 18K');
  });
});
