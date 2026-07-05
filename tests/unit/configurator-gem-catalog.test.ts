import { describe, expect, it } from 'vitest';
import {
  isConfiguratorGemCatalogScope,
  isGemConfiguratorEnabled,
  isRudrakshaConfiguratorBrowseScope,
} from '@/lib/shop/configurator';

describe('configurator gem catalog scope', () => {
  it('treats navaratna ruby scope as catalog browsing', () => {
    expect(isConfiguratorGemCatalogScope('navaratna', 'ruby')).toBe(true);
    expect(isConfiguratorGemCatalogScope('ruby')).toBe(true);
  });

  it('treats rudraksha as catalog browsing when category is rudraksha', () => {
    expect(isConfiguratorGemCatalogScope('rudraksha', '1-mukhi')).toBe(true);
    expect(isConfiguratorGemCatalogScope('rudraksha')).toBe(true);
  });

  it('enables rudraksha configurator without per-SKU flag', () => {
    expect(isGemConfiguratorEnabled('rudraksha', false)).toBe(true);
  });

  it('enables configurator for navaratna products without per-SKU flag', () => {
    expect(isGemConfiguratorEnabled('navaratna', false)).toBe(true);
    expect(isGemConfiguratorEnabled('gemstone', false)).toBe(false);
  });

  it('uses shop-style browse for rudraksha configurator listings', () => {
    expect(isRudrakshaConfiguratorBrowseScope('rudraksha', true)).toBe(true);
    expect(isRudrakshaConfiguratorBrowseScope('rudraksha', false)).toBe(false);
    expect(isRudrakshaConfiguratorBrowseScope('navaratna', true)).toBe(false);
  });
});
