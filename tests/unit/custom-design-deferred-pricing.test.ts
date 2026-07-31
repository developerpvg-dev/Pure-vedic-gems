import { describe, expect, it } from 'vitest';

import {
  isCustomDesignPricingPending,
  orderHasCustomDesignPricingPending,
} from '@/lib/utils/configuration-snapshot';
import { isOrderFullyPaid } from '@/lib/constants/order-status';
import { applyCustomDesignPriceToPricing } from '@/lib/orders/custom-design-price-adjust';

describe('custom design deferred pricing', () => {
  it('detects pending from flag or unpriced custom upload', () => {
    expect(
      isCustomDesignPricingPending({
        selections: { custom_design_url: 'https://x/a.png' },
        pricing: { custom_design_pricing_pending: true, metal_price: 0, making_charge: 0 },
      }),
    ).toBe(true);

    expect(
      isCustomDesignPricingPending({
        selections: { custom_design_url: 'https://x/a.png' },
        pricing: { metal_price: 0, making_charge: 0, custom_design_fee: 0 },
      }),
    ).toBe(true);

    expect(
      isCustomDesignPricingPending({
        selections: { custom_design_url: 'https://x/a.png' },
        pricing: {
          custom_design_pricing_pending: false,
          metal_price: 5000,
          making_charge: 1000,
        },
      }),
    ).toBe(false);
  });

  it('gates fully-paid while custom design price is TBD', () => {
    const items = [
      {
        configuration_snapshot: {
          selections: { custom_design_url: 'https://x/a.png' },
          pricing: { custom_design_pricing_pending: true },
        },
      },
    ];
    expect(
      isOrderFullyPaid({
        payment_status: 'captured',
        amount_due: 0,
        items,
      }),
    ).toBe(false);
    expect(orderHasCustomDesignPricingPending(items)).toBe(true);
  });

  it('clears pending when admin prices weight mode', () => {
    const result = applyCustomDesignPriceToPricing(
      {
        selections: { custom_design_url: 'https://x/a.png', metal: 'gold_18k' },
        pricing: {
          gem_price: 10000,
          making_charge: 0,
          diamond_charge: 0,
          metal_price: 0,
          metal_weight_grams: 0,
          gold_rate_per_gram: 0,
          labor_rate_percent: 0,
          jewelry_pricing_mode: null,
          certification_fee: 0,
          energization_fee: 0,
          custom_design_fee: 0,
          custom_design_pricing_pending: true,
          total: 10000,
        },
      },
      {
        mode: 'weight',
        metal: 'gold_22k',
        metal_weight_grams: 4,
        gold_rate_per_gram: 2000,
        labor_rate_percent: 25,
      },
    );
    expect(result.nextPricing.custom_design_pricing_pending).toBe(false);
    expect(result.nextPricing.metal_price).toBe(8000);
    expect(result.nextPricing.making_charge).toBe(2000);
    expect(result.nextSelections.metal).toBe('gold_22k');
  });
});
