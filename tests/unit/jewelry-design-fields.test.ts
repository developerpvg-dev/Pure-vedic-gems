import { describe, expect, it } from 'vitest';

import {
  decodeMetalRowsFromDesign,
  encodeMetalRowsToDesignFields,
  enableMetalOnDesign,
  catalogMetalsAddableToDesign,
  getStoneAddonLabelFromDesign,
  getDesignConfiguratorNote,
  resolveStoneAddonLabelForSave,
} from '@/lib/utils/jewelry-design-fields';

describe('jewelry-design-fields', () => {
  it('decodes and encodes a fixed silver + weight gold design', () => {
    const design = {
      making_charges: { silver_925: 3000 },
      estimated_metal_weight: { gold_22k: 5, gold_18k: 5 },
      diamond_charges: { gold_18k: 17500 },
      metal_flags: { platinum: 'on_request' },
    };

    const rows = decodeMetalRowsFromDesign(design);
    const silver = rows.find((row) => row.slug === 'silver_925');
    const gold22 = rows.find((row) => row.slug === 'gold_22k');
    const gold18 = rows.find((row) => row.slug === 'gold_18k');
    const platinum = rows.find((row) => row.slug === 'platinum');

    expect(silver?.status).toBe('available');
    expect(silver?.fixedPrice).toBe(3000);
    expect(gold22?.status).toBe('available');
    expect(gold22?.weightGrams).toBe(5);
    expect(platinum?.status).toBe('on_request');

    const encoded = encodeMetalRowsToDesignFields(rows, 17500);
    expect(encoded.making_charges.silver_925).toBe(3000);
    expect(encoded.estimated_metal_weight?.gold_22k).toBe(5);
    expect(encoded.diamond_charges.silver_925).toBe(17500);
    expect(encoded.diamond_charges.gold_22k).toBe(17500);
    expect(encoded.diamond_charges.gold_18k).toBe(17500);
    expect(encoded.diamond_charges.platinum).toBeUndefined();
  });

  it('defaults stone label to Diamond when charges exist', () => {
    expect(
      getStoneAddonLabelFromDesign({ diamond_charges: { gold_18k: 17500 } })
    ).toBe('Diamond');
    expect(
      getStoneAddonLabelFromDesign({
        stone_addon_label: 'Ruby',
        diamond_charges: { gold_18k: 12000 },
      })
    ).toBe('Ruby');
    expect(resolveStoneAddonLabelForSave(null, 5000)).toBe('Diamond');
    expect(resolveStoneAddonLabelForSave('Emerald', 8000)).toBe('Emerald');
    expect(resolveStoneAddonLabelForSave('Ruby', null)).toBeNull();
  });

  it('extracts configurator note from remark descriptions', () => {
    expect(
      getDesignConfiguratorNote({
        description:
          'Silver: Remark the price of the small stones to be used around the centre big depends on quality.',
      })
    ).toBe(
      'The price of the small stones to be used around the centre big depends on quality.'
    );
    expect(getDesignConfiguratorNote({ description: '18K Gold: +17500 diamonds cost' })).toBeNull();
  });

  it('encodes and decodes per-design labor rates', () => {
    const rows = decodeMetalRowsFromDesign({
      making_charges: {},
      estimated_metal_weight: { gold_18k: 5 },
      labor_rates: { gold_18k: 22 },
    });
    const gold18 = rows.find((row) => row.slug === 'gold_18k');
    expect(gold18?.laborRatePercent).toBe(22);

    const encoded = encodeMetalRowsToDesignFields(rows);
    expect(encoded.labor_rates.gold_18k).toBe(22);
  });

  it('lists catalog metals not yet available on a design', () => {
    const catalog = [
      {
        slug: 'gold_22k',
        name: 'Gold 22K',
        pricing_mode: 'weight' as const,
        is_active: true,
        price_per_gram: 0,
        labor_rate_percent: null,
        gst_rate_percent: null,
      },
      {
        slug: 'silver_925',
        name: 'Silver',
        pricing_mode: 'fixed_sheet' as const,
        is_active: true,
        price_per_gram: 0,
        labor_rate_percent: null,
        gst_rate_percent: null,
      },
      {
        slug: 'rose_gold',
        name: 'Rose Gold',
        pricing_mode: 'weight' as const,
        is_active: true,
        price_per_gram: 0,
        labor_rate_percent: null,
        gst_rate_percent: null,
      },
    ];
    const rows = decodeMetalRowsFromDesign(
      { making_charges: { silver_925: 3000 }, metal_flags: { gold_22k: 'unavailable' } },
      catalog
    );
    const addable = catalogMetalsAddableToDesign(catalog, rows);
    expect(addable.map((m) => m.slug)).toEqual(['gold_22k', 'rose_gold']);

    const enabled = enableMetalOnDesign(rows, catalog[2], catalog);
    const rose = enabled.find((row) => row.slug === 'rose_gold');
    expect(rose?.status).toBe('available');
  });
});
