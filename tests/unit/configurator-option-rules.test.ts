import { describe, expect, it } from 'vitest';

import {
  normalizeConfiguratorRules,
  resolveConfiguratorOptionRules,
  withDefaultConfiguratorAllowLists,
} from '@/lib/utils/configurator-rules';

describe('resolveConfiguratorOptionRules', () => {
  const looseOnlyRules = normalizeConfiguratorRules({
    product_id: 'prod-1',
    jewelry_design_enabled: false,
    metal_enabled: false,
    allowed_setting_types: ['loose'],
  });

  it('forces pendant design + metal for rudraksha despite loose-only DB rules', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-1',
        category: 'rudraksha',
        sub_category: '2-mukhi',
        configurator_enabled: false,
      },
      looseOnlyRules
    );

    expect(rules.jewelry_design_enabled).toBe(true);
    expect(rules.metal_enabled).toBe(true);
    expect(rules.allowed_setting_types).toEqual(['pendant']);
    expect(rules.energization_enabled).toBe(false);
    expect(rules.allowed_energization_option_ids).toEqual([]);
  });

  it('keeps loose-only rules for non-configurator products with stored rules', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-2',
        category: 'gemstone',
        sub_category: 'ruby',
        configurator_enabled: false,
      },
      looseOnlyRules
    );

    expect(rules.jewelry_design_enabled).toBe(false);
    expect(rules.allowed_setting_types).toEqual(['loose']);
  });

  it('restores full jewelry settings for navaratna even when DB rules are loose-only', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-3',
        category: 'navaratna',
        sub_category: 'yellow-sapphire',
        configurator_enabled: false,
      },
      looseOnlyRules
    );

    expect(rules.jewelry_design_enabled).toBe(true);
    expect(rules.metal_enabled).toBe(true);
    expect(rules.allowed_setting_types).toEqual(['ring', 'pendant', 'bracelet', 'loose']);
  });

  it('fills empty allow-lists with storefront defaults when addons are enabled', () => {
    const filled = withDefaultConfiguratorAllowLists(
      normalizeConfiguratorRules({
        product_id: 'prod-5',
        certificate_enabled: true,
        energization_enabled: true,
        allowed_certification_lab_ids: [],
        allowed_energization_option_ids: [],
      }),
      {
        certificationLabIds: ['lab-1'],
        energizationOptionIds: ['energ-1'],
      }
    );
    expect(filled.allowed_certification_lab_ids).toEqual(['lab-1']);
    expect(filled.allowed_energization_option_ids).toEqual(['energ-1']);
  });

  it('keeps certificate step from option rules, not storefront display flag', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-4',
        category: 'navaratna',
        sub_category: 'ruby',
        configurator_enabled: true,
      },
      normalizeConfiguratorRules({
        product_id: 'prod-4',
        certificate_enabled: true,
        allowed_certification_lab_ids: ['11111111-1111-1111-1111-111111111111'],
      })
    );

    expect(rules.certificate_enabled).toBe(true);
    expect(rules.allowed_certification_lab_ids).toEqual([
      '11111111-1111-1111-1111-111111111111',
    ]);
  });

  it('enables certification when labs are configured even if flag was left false', () => {
    const rules = resolveConfiguratorOptionRules(
      {
        id: 'prod-5',
        category: 'navaratna',
        sub_category: 'ruby',
        configurator_enabled: true,
      },
      normalizeConfiguratorRules({
        product_id: 'prod-5',
        certificate_enabled: false,
        allowed_certification_lab_ids: ['11111111-1111-1111-1111-111111111111'],
      })
    );

    expect(rules.certificate_enabled).toBe(true);
  });
});
