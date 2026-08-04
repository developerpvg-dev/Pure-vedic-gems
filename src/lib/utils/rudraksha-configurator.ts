/**
 * Rudraksha pendant configurator (multi-bead selection, mounting designs, etc.)
 *
 * Set to `true` when ready to ship. Also uncomment the Rudraksha section in:
 * - src/components/configurator/steps/GemCategorySelector.tsx
 */
export const RUDRAKSHA_CONFIGURATOR_ENABLED = true;

/** Default option_rules fields for a new configurable rudraksha product. */
export function defaultConfigurableRudrakshaOptionRules(
  energizationOptionIds: readonly string[],
  certificationLabIds: readonly string[] = [],
) {
  return {
    certificate_enabled: certificationLabIds.length > 0,
    energization_enabled: true,
    jewelry_design_enabled: true,
    metal_enabled: true,
    ring_size_enabled: false,
    allowed_setting_types: ['pendant'] as const,
    allowed_metals: [] as string[],
    allowed_ring_size_systems: [] as string[],
    allowed_certification_lab_ids: [...certificationLabIds],
    allowed_energization_option_ids: [...energizationOptionIds],
  };
}

/**
 * When creating a configurable rudraksha without energization rules (or with an
 * empty allow-list while enabled), fill storefront defaults. Explicit
 * energization_enabled: false is left alone.
 */
export function withConfigurableRudrakshaEnergizationDefaults<
  T extends {
    energization_enabled?: boolean;
    allowed_energization_option_ids?: string[] | null;
  },
>(
  optionRules: T | null | undefined,
  defaultEnergizationOptionIds: readonly string[],
): T | ReturnType<typeof defaultConfigurableRudrakshaOptionRules> | null | undefined {
  if (defaultEnergizationOptionIds.length === 0) return optionRules;

  if (!optionRules) {
    return defaultConfigurableRudrakshaOptionRules(defaultEnergizationOptionIds);
  }

  if (optionRules.energization_enabled === false) return optionRules;

  const allowed = optionRules.allowed_energization_option_ids ?? [];
  if (optionRules.energization_enabled && allowed.length > 0) return optionRules;

  return {
    ...optionRules,
    energization_enabled: true,
    allowed_energization_option_ids: allowed.length > 0 ? allowed : [...defaultEnergizationOptionIds],
  };
}
