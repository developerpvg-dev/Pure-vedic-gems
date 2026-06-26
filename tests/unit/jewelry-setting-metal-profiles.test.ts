import { describe, expect, it } from 'vitest';

import {
  parseJewelrySettingProfilesFromCommerce,
  resolveLaborRatesForJewelry,
  getSettingMetalProfile,
} from '@/lib/utils/jewelry-setting-metal-profiles';

describe('jewelry-setting-metal-profiles', () => {
  it('parses nested scope + setting labor profiles', () => {
    const profiles = parseJewelrySettingProfilesFromCommerce({
      jewelry_setting_metal_profiles: {
        gemstone: {
          ring: {
            default_gst_percent: 3,
            labor_rates: { gold_18k: 22 },
            gst_rates: {},
          },
        },
        rudraksha: {
          pendant: {
            default_gst_percent: 3,
            labor_rates: { gold_18k: 15 },
            gst_rates: {},
          },
        },
      },
    });

    expect(profiles.gemstone?.ring?.labor_rates.gold_18k).toBe(22);
    expect(profiles.rudraksha?.pendant?.labor_rates.gold_18k).toBe(15);
  });

  it('maps legacy flat profiles to gemstone scope', () => {
    const profiles = parseJewelrySettingProfilesFromCommerce({
      jewelry_setting_metal_profiles: {
        ring: { default_gst_percent: 3, labor_rates: { gold_18k: 20 }, gst_rates: {} },
      },
    });

    expect(getSettingMetalProfile(profiles, 'gemstone', 'ring').labor_rates.gold_18k).toBe(20);
    expect(getSettingMetalProfile(profiles, 'rudraksha', 'ring').labor_rates).toEqual({});
  });

  it('merges scoped profile labor with design overrides', () => {
    const profiles = parseJewelrySettingProfilesFromCommerce({
      jewelry_setting_metal_profiles: {
        gemstone: {
          ring: { default_gst_percent: 3, labor_rates: { gold_18k: 20 }, gst_rates: {} },
        },
        rudraksha: {
          ring: { default_gst_percent: 3, labor_rates: { gold_18k: 12 }, gst_rates: {} },
        },
      },
    });

    const gemstoneMerged = resolveLaborRatesForJewelry(
      'ring',
      { product_scope: 'gemstone', labor_rates: { gold_18k: 25 } },
      profiles
    );
    expect(gemstoneMerged.gold_18k).toBe(25);

    const rudrakshaFromProfile = resolveLaborRatesForJewelry(
      'ring',
      { product_scope: 'rudraksha', labor_rates: {} },
      profiles
    );
    expect(rudrakshaFromProfile.gold_18k).toBe(12);
  });
});
