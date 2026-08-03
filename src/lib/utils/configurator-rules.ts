import type { SettingType } from '@/lib/types/configurator';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import { isRudrakshaConfiguratorContext } from '@/lib/utils/rudraksha-design-rules';

export type RingSizeSystemId = 'indian' | 'european' | 'uk_au' | 'us';

export interface RingSizeSystem {
  id: RingSizeSystemId;
  label: string;
  aliases: string[];
  sizes: Array<{ value: string; label: string }>;
}

export interface ConfiguratorOptionRules {
  product_id: string | null;
  certificate_enabled: boolean;
  energization_enabled: boolean;
  jewelry_design_enabled: boolean;
  metal_enabled: boolean;
  ring_size_enabled: boolean;
  allowed_setting_types: readonly SettingType[];
  allowed_metals: readonly string[];
  allowed_ring_size_systems: readonly RingSizeSystemId[];
  allowed_ring_sizes: readonly string[];
  allowed_certification_lab_ids: readonly string[];
  allowed_energization_option_ids: readonly string[];
  legacy_certificate_options: readonly unknown[];
  legacy_energization_options: readonly unknown[];
  legacy_metal_options: readonly unknown[];
  legacy_setting_options: readonly unknown[];
  legacy_ring_size_options: readonly unknown[];
}

export const RING_SIZE_SYSTEMS: RingSizeSystem[] = [
  {
    id: 'indian',
    label: 'Indian',
    aliases: ['india', 'indian', 'in'],
    sizes: Array.from({ length: 27 }, (_, index) => {
      const value = String(index + 1);
      return { value, label: value };
    }),
  },
  {
    id: 'european',
    label: 'EU',
    aliases: ['eu', 'europe', 'european'],
    sizes: Array.from({ length: 16 }, (_, index) => {
      const value = String(40 + index * 2);
      return { value, label: value };
    }),
  },
  {
    id: 'uk_au',
    label: 'UK',
    aliases: ['uk', 'au', 'uk_au', 'uk-au'],
    sizes: [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    ].map((value) => ({ value, label: value })),
  },
  {
    id: 'us',
    label: 'US',
    aliases: ['us', 'usa'],
    sizes: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13']
      .map((value) => ({ value, label: value })),
  },
];

const DEFAULT_SETTING_TYPES: SettingType[] = ['ring', 'pendant', 'bracelet', 'loose'];
const DEFAULT_RING_SYSTEMS: RingSizeSystemId[] = RING_SIZE_SYSTEMS.map((system) => system.id);

export const DEFAULT_CONFIGURATOR_RULES: ConfiguratorOptionRules = {
  product_id: null,
  certificate_enabled: true,
  energization_enabled: true,
  jewelry_design_enabled: true,
  metal_enabled: true,
  ring_size_enabled: true,
  allowed_setting_types: DEFAULT_SETTING_TYPES,
  allowed_metals: [],
  allowed_ring_size_systems: DEFAULT_RING_SYSTEMS,
  allowed_ring_sizes: [],
  allowed_certification_lab_ids: [],
  allowed_energization_option_ids: [],
  legacy_certificate_options: [],
  legacy_energization_options: [],
  legacy_metal_options: [],
  legacy_setting_options: [],
  legacy_ring_size_options: [],
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function asUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeRingSizeSystemId(value: string | null | undefined): RingSizeSystemId | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  return RING_SIZE_SYSTEMS.find((system) => system.aliases.includes(normalized))?.id ?? null;
}

export function parseRingSizeValue(value: string | null): { system: RingSizeSystemId; size: string | null } {
  if (!value) return { system: 'indian', size: null };

  const separatorIndex = value.indexOf(':');
  if (separatorIndex === -1) {
    return { system: 'indian', size: value };
  }

  const system = normalizeRingSizeSystemId(value.slice(0, separatorIndex)) ?? 'indian';
  const size = value.slice(separatorIndex + 1) || null;
  return { system, size };
}

function extractLegacyRingSizeValue(item: unknown): string | null {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

  const record = item as Record<string, unknown>;
  const value = record.value ?? record.size ?? record.label ?? record.name;
  return typeof value === 'string' ? value : null;
}

export function normalizeLegacyRingSizes(input: unknown): string[] {
  return asUnknownArray(input)
    .map(extractLegacyRingSizeValue)
    .filter((value): value is string => !!value)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function normalizeConfiguratorRules(input: unknown): ConfiguratorOptionRules {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_CONFIGURATOR_RULES };
  }

  const record = input as Record<string, unknown>;
  const jewelryDesignEnabled = asBoolean(record.jewelry_design_enabled, true);
  const allowedSettingTypes = asStringArray(record.allowed_setting_types)
    .filter((type): type is SettingType => DEFAULT_SETTING_TYPES.includes(type as SettingType));
  const normalizedSettingTypes = (allowedSettingTypes.length > 0 ? allowedSettingTypes : DEFAULT_SETTING_TYPES)
    .filter((type) => jewelryDesignEnabled || type === 'loose');

  return {
    product_id: typeof record.product_id === 'string' ? record.product_id : null,
    certificate_enabled: asBoolean(record.certificate_enabled, true),
    energization_enabled: asBoolean(record.energization_enabled, true),
    jewelry_design_enabled: jewelryDesignEnabled,
    metal_enabled: asBoolean(record.metal_enabled, true),
    ring_size_enabled: asBoolean(record.ring_size_enabled, true),
    allowed_setting_types: Array.from(new Set([...normalizedSettingTypes, 'loose'])),
    allowed_metals: asStringArray(record.allowed_metals),
    allowed_ring_size_systems: asStringArray(record.allowed_ring_size_systems)
      .map(normalizeRingSizeSystemId)
      .filter((system): system is RingSizeSystemId => !!system),
    allowed_ring_sizes: normalizeLegacyRingSizes(record.legacy_ring_size_options),
    allowed_certification_lab_ids: asStringArray(record.allowed_certification_lab_ids),
    allowed_energization_option_ids: asStringArray(record.allowed_energization_option_ids),
    legacy_certificate_options: asUnknownArray(record.legacy_certificate_options),
    legacy_energization_options: asUnknownArray(record.legacy_energization_options),
    legacy_metal_options: asUnknownArray(record.legacy_metal_options),
    legacy_setting_options: asUnknownArray(record.legacy_setting_options),
    legacy_ring_size_options: asUnknownArray(record.legacy_ring_size_options),
  };
}

type ConfiguratorProductRef = {
  id: string;
  category: string;
  sub_category?: string | null;
  configurator_enabled?: boolean | null;
};

/** Merge DB option rules with product-level configurator defaults. */
export function resolveConfiguratorOptionRules(
  product: ConfiguratorProductRef,
  rawRules: unknown
): ConfiguratorOptionRules {
  const rules = normalizeConfiguratorRules(rawRules);
  const configuratorActive = isGemConfiguratorEnabled(
    product.category,
    product.configurator_enabled
  );
  const rudrakshaPendantFlow = isRudrakshaConfiguratorContext(product.category, {
    category: product.category,
    sub_category: product.sub_category ?? null,
  });

  if (rudrakshaPendantFlow) {
    return {
      ...rules,
      product_id: product.id,
      jewelry_design_enabled: true,
      metal_enabled: true,
      ring_size_enabled: false,
      allowed_setting_types: ['pendant'],
      // Labs in rules mean the cert step is on — don't leave stale certificate_enabled:false
      certificate_enabled:
        rules.certificate_enabled || rules.allowed_certification_lab_ids.length > 0,
      energization_enabled: false,
      allowed_energization_option_ids: [],
    };
  }

  // Navaratna / uparatna / flagged gems: category gate wins over stale DB rules that
  // collapse the UI to Loose Stone only (jewelry_design_enabled false or loose-only list).
  const looseOnly =
    rules.allowed_setting_types.length === 1 && rules.allowed_setting_types[0] === 'loose';
  if (configuratorActive && (!rules.jewelry_design_enabled || looseOnly)) {
    return {
      ...rules,
      product_id: product.id,
      jewelry_design_enabled: true,
      metal_enabled: true,
      ring_size_enabled: true,
      allowed_setting_types: DEFAULT_SETTING_TYPES,
      certificate_enabled:
        rules.certificate_enabled || rules.allowed_certification_lab_ids.length > 0,
    };
  }

  if (!rules.product_id) {
    return {
      ...rules,
      product_id: product.id,
      jewelry_design_enabled: configuratorActive,
      metal_enabled: configuratorActive,
      ring_size_enabled: configuratorActive,
      allowed_setting_types: configuratorActive ? rules.allowed_setting_types : ['loose'],
    };
  }

  return {
    ...rules,
    product_id: product.id,
    // ponytail: storefront "display certificate" used to override this and hide the step
    certificate_enabled:
      rules.certificate_enabled || rules.allowed_certification_lab_ids.length > 0,
  };
}

export function isAllowedByList(value: string | null | undefined, allowedValues: readonly string[]) {
  if (!value) return false;
  return allowedValues.length === 0 || allowedValues.includes(value);
}

/**
 * When cert/energization are enabled but allow-lists were never seeded (gap-fill,
 * pre-seed upserts), fill storefront defaults so steps 6–7 still appear.
 * Non-empty allow-lists and disabled flags are left alone.
 */
export function withDefaultConfiguratorAllowLists(
  rules: ConfiguratorOptionRules,
  defaults: {
    certificationLabIds: readonly string[];
    energizationOptionIds: readonly string[];
  },
): ConfiguratorOptionRules {
  const next = { ...rules };
  if (
    next.certificate_enabled &&
    next.allowed_certification_lab_ids.length === 0 &&
    defaults.certificationLabIds.length > 0
  ) {
    next.allowed_certification_lab_ids = [...defaults.certificationLabIds];
  }
  if (
    next.energization_enabled &&
    next.allowed_energization_option_ids.length === 0 &&
    defaults.energizationOptionIds.length > 0
  ) {
    next.allowed_energization_option_ids = [...defaults.energizationOptionIds];
  }
  return next;
}

export function isSettingTypeAllowed(rules: ConfiguratorOptionRules | null, settingType: SettingType) {
  return (rules ?? DEFAULT_CONFIGURATOR_RULES).allowed_setting_types.includes(settingType);
}

export function isMetalAllowed(rules: ConfiguratorOptionRules | null, metal: string | null | undefined) {
  const resolvedRules = rules ?? DEFAULT_CONFIGURATOR_RULES;
  if (!resolvedRules.metal_enabled) return false;
  return isAllowedByList(metal, resolvedRules.allowed_metals);
}

export function isCertificationAllowed(rules: ConfiguratorOptionRules | null, certificationId: string | null | undefined) {
  const resolvedRules = rules ?? DEFAULT_CONFIGURATOR_RULES;
  if (!resolvedRules.certificate_enabled) return false;
  if (!certificationId) return false;
  const allowed = resolvedRules.allowed_certification_lab_ids;
  if (allowed.length === 0) return false;
  return allowed.includes(certificationId);
}

export function isCertificationStepAvailable(rules: ConfiguratorOptionRules | null) {
  const resolvedRules = rules ?? DEFAULT_CONFIGURATOR_RULES;
  return resolvedRules.certificate_enabled && resolvedRules.allowed_certification_lab_ids.length > 0;
}

export function isEnergizationAllowed(rules: ConfiguratorOptionRules | null, energizationId: string | null | undefined) {
  const resolvedRules = rules ?? DEFAULT_CONFIGURATOR_RULES;
  if (!resolvedRules.energization_enabled) return false;
  if (!energizationId) return false;
  const allowed = resolvedRules.allowed_energization_option_ids;
  if (allowed.length === 0) return false;
  return allowed.includes(energizationId);
}

export function isEnergizationStepAvailable(rules: ConfiguratorOptionRules | null) {
  const resolvedRules = rules ?? DEFAULT_CONFIGURATOR_RULES;
  return resolvedRules.energization_enabled && resolvedRules.allowed_energization_option_ids.length > 0;
}

export function getAllowedRingSizeSystems(rules: ConfiguratorOptionRules | null) {
  const systems = rules?.allowed_ring_size_systems ?? DEFAULT_RING_SYSTEMS;
  return systems.length > 0 ? systems : DEFAULT_RING_SYSTEMS;
}

export function validateRingSizeValue(rules: ConfiguratorOptionRules | null, ringSize: string | null | undefined) {
  if (!ringSize) return { valid: true };

  const resolvedRules = rules ?? DEFAULT_CONFIGURATOR_RULES;
  if (!resolvedRules.ring_size_enabled) {
    return { valid: false, reason: 'Ring sizes are not available for this product.' };
  }

  const parsed = parseRingSizeValue(ringSize);
  if (!getAllowedRingSizeSystems(resolvedRules).includes(parsed.system)) {
    return { valid: false, reason: 'This ring size system is not available for this product.' };
  }

  const system = RING_SIZE_SYSTEMS.find((item) => item.id === parsed.system);
  if (!system || !parsed.size || !system.sizes.some((size) => size.value === parsed.size)) {
    return { valid: false, reason: 'This ring size is malformed or no longer supported.' };
  }

  if (resolvedRules.allowed_ring_sizes.length > 0 && !resolvedRules.allowed_ring_sizes.includes(parsed.size)) {
    return { valid: false, reason: 'This ring size is not available for this product.' };
  }

  return { valid: true };
}