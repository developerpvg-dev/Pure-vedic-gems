import { describe, expect, it } from 'vitest';

import {
  classifyLegacyEnergizationOption,
  LEGACY_ENERGIZATION_OPTIONS,
  legacySlugsFromParsedEnergizationOptions,
  parseLegacyEnergizationOptions,
} from '@/lib/utils/legacy-energization-options';
import { resolveProductEnergizationRules } from '@/lib/utils/resolve-product-energization-rules';
import { isEnergizationAllowed } from '@/lib/utils/configurator-rules';

const OPTIONS = new Map<string, string>([
  ['prana-pratishta-pooja', '11111111-1111-1111-1111-111111111111'],
  ['prana-pratishta-live-streaming', '22222222-2222-2222-2222-222222222222'],
  ['prana-pratishta-with-video', '33333333-3333-3333-3333-333333333333'],
  ['prana-pratishta-with-picture', '66666666-6666-6666-6666-666666666666'],
  ['vedic-pooja', '44444444-4444-4444-4444-444444444444'],
  ['vedic-pooja-with-video', '55555555-5555-5555-5555-555555555555'],
]);

const LEGACY_RAW =
  'No Energization, Prana Pratishta Pooja .....+Rs2,100.00, Prana Pratishta Pooja (Live Streaming) .....+Rs3,500.00, Prana Pratishta Pooja (With Video) .....+Rs3,100.00, Vedic Pooja .....+Rs1,100.00, Vedic Pooja (With Video) .....+Rs2,100.00';

describe('legacy energization option parser', () => {
  it('keeps active catalog to video + picture at ₹2100', () => {
    expect(LEGACY_ENERGIZATION_OPTIONS.map((o) => [o.legacy_slug, o.price])).toEqual([
      ['prana-pratishta-with-video', 2100],
      ['prana-pratishta-with-picture', 1500],
    ]);
  });

  it('parses Woo pipe-separated energization values', () => {
    const slugs = legacySlugsFromParsedEnergizationOptions(parseLegacyEnergizationOptions(LEGACY_RAW));
    expect(slugs).toEqual([
      'prana-pratishta-pooja',
      'prana-pratishta-live-streaming',
      'prana-pratishta-with-video',
      'vedic-pooja',
      'vedic-pooja-with-video',
    ]);
  });

  it('classifies skip and priced options', () => {
    expect(classifyLegacyEnergizationOption('No Energization').kind).toBe('skip');
    const prana = classifyLegacyEnergizationOption('Prana Pratishta Pooja .....+Rs2,100.00');
    expect(prana.kind).toBe('option');
    expect(prana.legacySlug).toBe('prana-pratishta-pooja');
    expect(prana.priceInr).toBe(2100);
    const picture = classifyLegacyEnergizationOption('Prana Pratishta Pooja (With picture) .....+Rs2,100.00');
    expect(picture.legacySlug).toBe('prana-pratishta-with-picture');
  });
});

describe('resolveProductEnergizationRules', () => {
  it('disables energization for jewellery products', () => {
    const resolved = resolveProductEnergizationRules(
      { category: 'jewellery', configurator_enabled: true },
      LEGACY_RAW,
      OPTIONS
    );
    expect(resolved.energization_enabled).toBe(false);
    expect(resolved.allowed_energization_option_ids).toEqual([]);
  });

  it('maps Woo energization list to allowed option ids', () => {
    const resolved = resolveProductEnergizationRules(
      { category: 'navaratna', configurator_enabled: true },
      LEGACY_RAW,
      OPTIONS
    );
    expect(resolved.energization_enabled).toBe(true);
    expect(resolved.allowed_energization_option_ids).toHaveLength(5);
  });

  it('disables when only No Energization is listed', () => {
    const resolved = resolveProductEnergizationRules(
      { category: 'navaratna', configurator_enabled: true },
      'No Energization',
      OPTIONS
    );
    expect(resolved.energization_enabled).toBe(false);
  });
});

describe('isEnergizationAllowed strict allow-list', () => {
  const baseRules = {
    product_id: 'p1',
    certificate_enabled: true,
    energization_enabled: true,
    jewelry_design_enabled: true,
    metal_enabled: true,
    ring_size_enabled: true,
    allowed_setting_types: ['loose'] as const,
    allowed_metals: [],
    allowed_ring_size_systems: ['indian'] as const,
    allowed_ring_sizes: [],
    allowed_certification_lab_ids: [],
    allowed_energization_option_ids: ['11111111-1111-1111-1111-111111111111'],
    legacy_certificate_options: [],
    legacy_energization_options: [],
    legacy_metal_options: [],
    legacy_setting_options: [],
    legacy_ring_size_options: [],
  };

  it('rejects options when allow-list is empty', () => {
    expect(
      isEnergizationAllowed(
        { ...baseRules, allowed_energization_option_ids: [] },
        '11111111-1111-1111-1111-111111111111'
      )
    ).toBe(false);
  });

  it('allows only listed option ids', () => {
    expect(isEnergizationAllowed(baseRules, '11111111-1111-1111-1111-111111111111')).toBe(true);
    expect(isEnergizationAllowed(baseRules, '22222222-2222-2222-2222-222222222222')).toBe(false);
  });
});
