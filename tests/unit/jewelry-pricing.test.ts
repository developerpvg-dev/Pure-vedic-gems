import { describe, expect, it } from 'vitest';

import {

  calculateJewelryDesignPricing,

  getAvailableMetalsForDesign,

  isMetalAvailableForDesign,

  parseDiamondCharge,

} from '@/lib/utils/jewelry-pricing';



describe('jewelry-pricing', () => {

  const design1 = {

    making_charges: { silver_925: 3000, panchdhatu: 2500, panchdhatu_with_gold: 10000 },

    estimated_metal_weight: { gold_22k: 5, gold_18k: 5, gold_14k: 5, platinum: 5 },

  };



  it('uses fixed sheet price for silver', () => {

    const result = calculateJewelryDesignPricing({

      metal: 'silver_925',

      makingCharges: design1.making_charges,

      estimatedMetalWeight: design1.estimated_metal_weight,

      metalRatePerGram: 95,

    });

    expect(result).toEqual({
      makingCharge: 3000,
      diamondCharge: 0,
      metalPrice: 0,
      metalWeightGrams: 0,
      laborRatePercent: 0,
      pricingKind: 'fixed',
    });

  });



  it('applies labor percent on weight-based gold', () => {

    const result = calculateJewelryDesignPricing({

      metal: 'gold_22k',

      makingCharges: design1.making_charges,

      estimatedMetalWeight: design1.estimated_metal_weight,

      metalRatePerGram: 7200,
      laborRates: { gold_22k: 20 },
    });

    expect(result.metalWeightGrams).toBe(5);

    expect(result.metalPrice).toBe(36000);

    expect(result.makingCharge).toBe(7200);

    expect(result.diamondCharge).toBe(0);

  });



  it('parses lakh-based diamond notes', () => {

    expect(parseDiamondCharge('+1lakh Approx Extra Diamonds Cost')).toBe(100000);

    expect(parseDiamondCharge('+2Lakhs Extra For Diamonds')).toBe(200000);

  });



  it('adds design-wide diamond charges for every available metal', () => {
    const diamondCharges = { gold_18k: 17500 };

    const gold18 = calculateJewelryDesignPricing({
      metal: 'gold_18k',
      makingCharges: {},
      estimatedMetalWeight: { gold_18k: 5, gold_14k: 5, platinum: 5 },
      diamondCharges,
      metalRatePerGram: 6000,
      laborRates: { gold_18k: 25 },
    });

    const gold14 = calculateJewelryDesignPricing({
      metal: 'gold_14k',
      makingCharges: {},
      estimatedMetalWeight: { gold_18k: 5, gold_14k: 5, platinum: 5 },
      diamondCharges,
      metalRatePerGram: 5500,
    });

    expect(gold18.diamondCharge).toBe(17500);
    expect(gold14.diamondCharge).toBe(17500);
    expect(gold18.metalPrice).toBe(30000);
    expect(gold18.makingCharge).toBe(7500);
  });



  it('uses design labor rates when provided', () => {
    const result = calculateJewelryDesignPricing({
      metal: 'gold_22k',
      makingCharges: design1.making_charges,
      estimatedMetalWeight: design1.estimated_metal_weight,
      metalRatePerGram: 7200,
      laborRates: { gold_22k: 15 },
    });
    expect(result.makingCharge).toBe(5400);
    expect(result.laborRatePercent).toBe(15);
  });

  it('lists only configured metals for a design', () => {
    const metals = getAvailableMetalsForDesign(design1.making_charges, design1.estimated_metal_weight);

    expect(metals).toContain('silver_925');

    expect(metals).toContain('gold_22k');

    expect(isMetalAvailableForDesign('gold_22k', design1.making_charges, design1.estimated_metal_weight)).toBe(true);

    expect(isMetalAvailableForDesign('copper', design1.making_charges, design1.estimated_metal_weight)).toBe(false);

  });

});

