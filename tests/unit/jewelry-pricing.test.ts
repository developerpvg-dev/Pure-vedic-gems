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

  it('uses FIXED ₹ from design for silver/panchdhatu and % labor for gold/platinum', () => {
    const design = {
      making_charges: {
        silver_925: 4500,
        panchdhatu: 3200,
        panchdhatu_with_gold: 12000,
      },
      estimated_metal_weight: {
        gold_14k: 6,
        gold_18k: 6,
        gold_22k: 6,
        platinum: 6,
      },
      labor_rates: {
        gold_14k: 25,
        gold_18k: 25,
        gold_22k: 20,
        platinum: 20,
      },
      diamond_charges: { gold_18k: 5000 },
    };

    // ── FIXED metals: ignore rate/g and labor %; use design making_charges only ──
    for (const metal of ['silver_925', 'panchdhatu', 'panchdhatu_with_gold'] as const) {
      const result = calculateJewelryDesignPricing({
        metal,
        makingCharges: design.making_charges,
        estimatedMetalWeight: design.estimated_metal_weight,
        diamondCharges: design.diamond_charges,
        metalRatePerGram: 9999, // must be ignored
        laborRates: design.labor_rates,
      });
      expect(result.pricingKind).toBe('fixed');
      expect(result.metalPrice).toBe(0);
      expect(result.laborRatePercent).toBe(0);
      expect(result.makingCharge).toBe(design.making_charges[metal]);
      expect(result.diamondCharge).toBe(5000); // design-wide add-on still applies
    }

    // ── WEIGHT / % metals: metal = g × rate; labor = metal × design % ──
    const cases = [
      { metal: 'gold_14k', rate: 5000, laborPct: 25 },
      { metal: 'gold_18k', rate: 5900, laborPct: 25 },
      { metal: 'gold_22k', rate: 7200, laborPct: 20 },
      { metal: 'platinum', rate: 4000, laborPct: 20 },
    ] as const;

    for (const { metal, rate, laborPct } of cases) {
      const result = calculateJewelryDesignPricing({
        metal,
        makingCharges: design.making_charges,
        estimatedMetalWeight: design.estimated_metal_weight,
        diamondCharges: design.diamond_charges,
        metalRatePerGram: rate,
        laborRates: design.labor_rates,
      });
      const metalPrice = Math.round(6 * rate);
      expect(result.pricingKind).toBe('weight');
      expect(result.metalWeightGrams).toBe(6);
      expect(result.metalPrice).toBe(metalPrice);
      expect(result.laborRatePercent).toBe(laborPct);
      expect(result.makingCharge).toBe(Math.round((metalPrice * laborPct) / 100));
      expect(result.diamondCharge).toBe(5000);
    }
  });

  it('falls back to sheet labor % when metal missing from map', () => {
    const result = calculateJewelryDesignPricing({
      metal: 'gold_22k',
      makingCharges: design1.making_charges,
      estimatedMetalWeight: design1.estimated_metal_weight,
      metalRatePerGram: 7200,
      laborRates: {}, // empty map must not zero labor
    });
    expect(result.metalPrice).toBe(36000);
    expect(result.makingCharge).toBe(7200); // 20% default
    expect(result.laborRatePercent).toBe(20);
  });

  it('respects explicit zero labor on design map', () => {
    const result = calculateJewelryDesignPricing({
      metal: 'gold_22k',
      makingCharges: design1.making_charges,
      estimatedMetalWeight: design1.estimated_metal_weight,
      metalRatePerGram: 7200,
      laborRates: { gold_22k: 0 },
    });
    expect(result.makingCharge).toBe(0);
    expect(result.laborRatePercent).toBe(0);
  });
});

