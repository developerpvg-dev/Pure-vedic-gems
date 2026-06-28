import { describe, expect, it } from 'vitest';
import { normalisePricing } from '../../scripts/legacy-import/lib/transform/pricing';

describe('legacy pricing normalisation', () => {
  it('uses per_carat mode when only rate and weight exist', () => {
    const result = normalisePricing({
      price_carat: '3200',
      weight_carat: '5.76',
    });

    expect(result.priceMode).toBe('per_carat');
    expect(result.price).toBe(18432);
    expect(result.pricePerCarat).toBe(3200);
  });

  it('marks exclusive gems without any price as on_demand', () => {
    const result = normalisePricing({});

    expect(result.priceMode).toBe('on_demand');
    expect(result.price).toBeNull();
  });

  it('prefers sale price and sets per_carat when rate exists', () => {
    const result = normalisePricing({
      _regular_price: '25000',
      _sale_price: '22000',
      _price: '22000',
      price_carat: '3200',
      weight_carat: '5.76',
    });

    expect(result.price).toBe(22000);
    expect(result.priceMode).toBe('per_carat');
  });
});
