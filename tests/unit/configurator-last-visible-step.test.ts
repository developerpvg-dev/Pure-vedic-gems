import { describe, expect, it } from 'vitest';

import type { ConfiguratorState } from '@/lib/types/configurator';
import { normalizeConfiguratorRules } from '@/lib/utils/configurator-rules';
import { getConfiguratorLastVisibleStep } from '@/lib/utils/configurator-steps';

function baseState(overrides: Partial<ConfiguratorState> = {}): ConfiguratorState {
  return {
    current_step: 5,
    gem_category: 'ruby',
    selected_product: {
      id: 'p1',
      name: 'Ruby',
      category: 'gemstone',
    } as ConfiguratorState['selected_product'],
    rudraksha_combo_products: [],
    setting_type: 'ring',
    selected_design: null,
    custom_design_url: null,
    custom_design_brief: null,
    metal: 'gold_18k',
    ring_size: '12',
    chain_length: null,
    selected_lab: null,
    certification_skipped: true,
    selected_energization: null,
    energization_form: null,
    pricing: {} as ConfiguratorState['pricing'],
    ...overrides,
  };
}

describe('getConfiguratorLastVisibleStep', () => {
  it('keeps energization as last when enabled with options (cert skipped)', () => {
    const rules = normalizeConfiguratorRules({
      certificate_enabled: false,
      energization_enabled: true,
      allowed_energization_option_ids: ['e1'],
    });
    expect(getConfiguratorLastVisibleStep(3, baseState(), rules)).toBe(7);
  });

  it('ends at metal when cert + energization are both off', () => {
    const rules = normalizeConfiguratorRules({
      certificate_enabled: false,
      energization_enabled: false,
    });
    expect(getConfiguratorLastVisibleStep(3, baseState(), rules)).toBe(5);
  });

  it('keeps energization for rudraksha pendant flow', () => {
    const rules = normalizeConfiguratorRules({
      certificate_enabled: true,
      allowed_certification_lab_ids: ['lab-1'],
      energization_enabled: true,
      allowed_energization_option_ids: ['e1'],
    });
    expect(
      getConfiguratorLastVisibleStep(
        2,
        baseState({
          gem_category: 'rudraksha',
          selected_product: {
            id: 'p-r',
            name: '5 Mukhi',
            category: 'rudraksha',
            sub_category: '5-mukhi',
          } as ConfiguratorState['selected_product'],
          setting_type: 'pendant',
        }),
        rules
      )
    ).toBe(7);
  });
});
