import { describe, expect, it } from 'vitest';

import {
  classifyLegacyCertificateOption,
  parseLegacyCertificateOptions,
  legacySlugsFromParsedOptions,
  productLooksPrecertified,
} from '@/lib/utils/legacy-certificate-options';
import { resolveProductCertificationRules } from '@/lib/utils/resolve-product-certification-rules';
import { isCertificationAllowed } from '@/lib/utils/configurator-rules';

const LABS = new Map<string, string>([
  ['free-lab-certificate', '11111111-1111-1111-1111-111111111111'],
  ['gtl-jaipur', '22222222-2222-2222-2222-222222222222'],
  ['igi', '33333333-3333-3333-3333-333333333333'],
  ['igi-gtl-delhi', '44444444-4444-4444-4444-444444444444'],
  ['igi-international', '55555555-5555-5555-5555-555555555555'],
]);

describe('legacy certificate option parser', () => {
  it('parses GTL Jaipur price and turnaround', () => {
    const parsed = classifyLegacyCertificateOption(
      'Lab Certificate - GTL Jaipur (+3 Days) .....+Rs1,200.00'
    );
    expect(parsed.kind).toBe('lab');
    expect(parsed.legacySlug).toBe('gtl-jaipur');
    expect(parsed.priceInr).toBe(1200);
    expect(parsed.turnaroundDays).toBe(3);
  });

  it('detects without certificate and already certified options', () => {
    expect(classifyLegacyCertificateOption('WITHOUT CERTIFICATE').kind).toBe('skip');
    expect(classifyLegacyCertificateOption('Already Certified').kind).toBe('already_certified');
  });

  it('extracts allowed lab slugs from Woo pipe-separated values', () => {
    const raw =
      'Free Lab Certificate, Lab Certificate - GTL Jaipur (+3 Days) .....+Rs1,200.00, Lab Certificate - IGI (+2 Days) .....+Rs4,000.00';
    const slugs = legacySlugsFromParsedOptions(parseLegacyCertificateOptions(raw));
    expect(slugs).toEqual(['free-lab-certificate', 'gtl-jaipur', 'igi']);
  });
});

describe('resolveProductCertificationRules', () => {
  it('disables addons for jewellery category products', () => {
    const resolved = resolveProductCertificationRules(
      { category: 'jewellery', configurator_enabled: true },
      'Free Lab Certificate, Lab Certificate - GTL Jaipur (+3 Days) .....+Rs1,200.00',
      LABS
    );
    expect(resolved.certificate_enabled).toBe(false);
    expect(resolved.allowed_certification_lab_ids).toEqual([]);
  });

  it('maps Woo certificate list to allowed lab ids', () => {
    const resolved = resolveProductCertificationRules(
      { category: 'navaratna', configurator_enabled: true },
      'Free Lab Certificate, Lab Certificate - GTL Jaipur (+3 Days) .....+Rs1,200.00',
      LABS
    );
    expect(resolved.certificate_enabled).toBe(true);
    expect(resolved.allowed_certification_lab_ids).toEqual([
      LABS.get('free-lab-certificate'),
      LABS.get('gtl-jaipur'),
    ]);
  });

  it('disables addons when product is already certified and Woo has no list', () => {
    const resolved = resolveProductCertificationRules(
      {
        category: 'navaratna',
        configurator_enabled: true,
        certificate_number: 'IGI-123',
        certificate_lab: 'IGI',
      },
      null,
      LABS
    );
    expect(resolved.certificate_enabled).toBe(false);
    expect(productLooksPrecertified({ certificate_number: 'IGI-123' })).toBe(true);
  });
});

describe('isCertificationAllowed strict allow-list', () => {
  it('rejects labs when allow-list is empty', () => {
    expect(
      isCertificationAllowed(
        {
          product_id: 'p1',
          certificate_enabled: true,
          energization_enabled: true,
          jewelry_design_enabled: true,
          metal_enabled: true,
          ring_size_enabled: true,
          allowed_setting_types: ['loose'],
          allowed_metals: [],
          allowed_ring_size_systems: ['indian'],
          allowed_ring_sizes: [],
          allowed_certification_lab_ids: [],
          allowed_energization_option_ids: [],
          legacy_certificate_options: [],
          legacy_energization_options: [],
          legacy_metal_options: [],
          legacy_setting_options: [],
          legacy_ring_size_options: [],
        },
        '33333333-3333-3333-3333-333333333333'
      )
    ).toBe(false);
  });

  it('allows only listed lab ids', () => {
    const rules = {
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
      allowed_certification_lab_ids: ['22222222-2222-2222-2222-222222222222'],
      allowed_energization_option_ids: [],
      legacy_certificate_options: [],
      legacy_energization_options: [],
      legacy_metal_options: [],
      legacy_setting_options: [],
      legacy_ring_size_options: [],
    };
    expect(isCertificationAllowed(rules, '22222222-2222-2222-2222-222222222222')).toBe(true);
    expect(isCertificationAllowed(rules, '33333333-3333-3333-3333-333333333333')).toBe(false);
  });
});
