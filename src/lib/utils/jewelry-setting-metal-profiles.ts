import {
  JEWELRY_DESIGN_SETTING_TYPES,
  JEWELRY_GST_RATE_PERCENT,
  JEWELRY_PRODUCT_SCOPES,
  type JewelryDesignSettingType,
  type JewelryProductScope,
} from '@/lib/constants/jewelry-design-metals';
import { laborRatesFromDesignRecord } from '@/lib/utils/jewelry-design-fields';

export const JEWELRY_SETTING_PROFILES_COMMERCE_KEY = 'jewelry_setting_metal_profiles';

export interface JewelrySettingMetalProfile {
  default_gst_percent: number;
  labor_rates: Record<string, number>;
  gst_rates: Record<string, number>;
}

export type JewelryScopedSettingProfiles = Partial<
  Record<JewelryDesignSettingType, JewelrySettingMetalProfile>
>;

export type JewelrySettingMetalProfiles = Partial<
  Record<JewelryProductScope, JewelryScopedSettingProfiles>
>;

export function isJewelrySettingType(value: string): value is JewelryDesignSettingType {
  return (JEWELRY_DESIGN_SETTING_TYPES as readonly string[]).includes(value);
}

export function isJewelryProductScope(value: string): value is JewelryProductScope {
  return (JEWELRY_PRODUCT_SCOPES as readonly string[]).includes(value as JewelryProductScope);
}

export function normalizeJewelryProductScope(
  value: string | null | undefined
): JewelryProductScope {
  return value === 'rudraksha' ? 'rudraksha' : 'gemstone';
}

export function emptySettingProfile(
  fallbackGst = JEWELRY_GST_RATE_PERCENT
): JewelrySettingMetalProfile {
  return {
    default_gst_percent: fallbackGst,
    labor_rates: {},
    gst_rates: {},
  };
}

function asNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) out[key] = raw;
  }
  return out;
}

function parseProfileEntry(entry: unknown): JewelrySettingMetalProfile | null {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  const record = entry as Record<string, unknown>;
  if (!('labor_rates' in record || 'default_gst_percent' in record || 'gst_rates' in record)) {
    return null;
  }
  return {
    default_gst_percent:
      typeof record.default_gst_percent === 'number' && record.default_gst_percent >= 0
        ? record.default_gst_percent
        : JEWELRY_GST_RATE_PERCENT,
    labor_rates: asNumberRecord(record.labor_rates),
    gst_rates: asNumberRecord(record.gst_rates),
  };
}

function parseScopedProfiles(scopeRaw: unknown): JewelryScopedSettingProfiles {
  if (!scopeRaw || typeof scopeRaw !== 'object' || Array.isArray(scopeRaw)) return {};
  const out: JewelryScopedSettingProfiles = {};
  for (const settingType of JEWELRY_DESIGN_SETTING_TYPES) {
    const profile = parseProfileEntry((scopeRaw as Record<string, unknown>)[settingType]);
    if (profile) out[settingType] = profile;
  }
  return out;
}

function isNestedScopeFormat(raw: Record<string, unknown>): boolean {
  return JEWELRY_PRODUCT_SCOPES.some((scope) => {
    const entry = raw[scope];
    return entry != null && typeof entry === 'object' && !Array.isArray(entry);
  });
}

export function parseJewelrySettingProfilesFromCommerce(
  values: Record<string, unknown> | null | undefined
): JewelrySettingMetalProfiles {
  const raw = values?.[JEWELRY_SETTING_PROFILES_COMMERCE_KEY];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const record = raw as Record<string, unknown>;

  if (isNestedScopeFormat(record)) {
    return {
      gemstone: parseScopedProfiles(record.gemstone),
      rudraksha: parseScopedProfiles(record.rudraksha),
    };
  }

  return {
    gemstone: parseScopedProfiles(record),
    rudraksha: {},
  };
}

export function getSettingMetalProfile(
  profiles: JewelrySettingMetalProfiles | null | undefined,
  productScope: string | null | undefined,
  settingType: string | null | undefined,
  fallbackGst = JEWELRY_GST_RATE_PERCENT
): JewelrySettingMetalProfile {
  const scope = normalizeJewelryProductScope(productScope);
  if (settingType && isJewelrySettingType(settingType) && profiles?.[scope]?.[settingType]) {
    return profiles[scope][settingType]!;
  }
  return emptySettingProfile(fallbackGst);
}

export function resolveLaborRatesForJewelry(
  settingType: string | null | undefined,
  design: { labor_rates?: unknown; product_scope?: string | null } | null | undefined,
  profiles: JewelrySettingMetalProfiles | null | undefined,
  productScopeFallback?: string | null
): Record<string, number> {
  const scope = design?.product_scope
    ? normalizeJewelryProductScope(design.product_scope)
    : normalizeJewelryProductScope(productScopeFallback);
  const profileLabor = getSettingMetalProfile(profiles, scope, settingType).labor_rates;
  const designLabor = design ? laborRatesFromDesignRecord(design) : {};
  return { ...profileLabor, ...designLabor };
}

export function resolveGstPercentForMetal(
  metalSlug: string,
  productScope: string | null | undefined,
  settingType: string | null | undefined,
  profiles: JewelrySettingMetalProfiles | null | undefined,
  metalCatalogGst: number | null | undefined,
  globalFallback = JEWELRY_GST_RATE_PERCENT
): number {
  const profile = getSettingMetalProfile(profiles, productScope, settingType, globalFallback);
  const fromProfileMetal = profile.gst_rates[metalSlug];
  if (typeof fromProfileMetal === 'number' && fromProfileMetal >= 0) return fromProfileMetal;
  if (typeof metalCatalogGst === 'number' && metalCatalogGst >= 0) return metalCatalogGst;
  return profile.default_gst_percent ?? globalFallback;
}

export function settingTypeLabel(settingType: string): string {
  if (!isJewelrySettingType(settingType)) return settingType;
  return settingType.charAt(0).toUpperCase() + settingType.slice(1);
}

export function productScopeLabel(productScope: string): string {
  return productScope === 'rudraksha' ? 'Rudraksha' : 'Gemstone';
}

export function applySettingProfileDefaultsToRows<T extends {
  slug: string;
  laborRatePercent: number | null;
  gstRatePercent: number | null;
}>(
  rows: T[],
  productScope: string,
  settingType: string,
  profiles: JewelrySettingMetalProfiles | null | undefined
): T[] {
  const profile = getSettingMetalProfile(profiles, productScope, settingType);
  return rows.map((row) => ({
    ...row,
    laborRatePercent: row.laborRatePercent ?? profile.labor_rates[row.slug] ?? null,
    gstRatePercent:
      row.gstRatePercent ?? profile.gst_rates[row.slug] ?? profile.default_gst_percent,
  }));
}

export function mergeScopedSettingProfile(
  profiles: JewelrySettingMetalProfiles,
  productScope: JewelryProductScope,
  settingType: JewelryDesignSettingType,
  draft: JewelrySettingMetalProfile
): JewelrySettingMetalProfiles {
  return {
    ...profiles,
    [productScope]: {
      ...profiles[productScope],
      [settingType]: draft,
    },
  };
}
