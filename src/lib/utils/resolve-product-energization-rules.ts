import {
  DEFAULT_GEMSTONE_ENERGIZATION_SLUGS,
  legacySlugsFromParsedEnergizationOptions,
  parseLegacyEnergizationOptions,
  shouldDisableEnergizationAddons,
  type EnergizationLegacySlug,
  type ParsedLegacyEnergizationOption,
} from '@/lib/utils/legacy-energization-options';

export interface ProductEnergizationRuleInput {
  category?: string | null;
  product_type?: string | null;
  configurator_enabled?: boolean | null;
  energization_eligible?: boolean | null;
}

export interface ResolvedProductEnergizationRules {
  energization_enabled: boolean;
  allowed_energization_option_ids: string[];
  legacy_energization_options: Array<{
    kind: ParsedLegacyEnergizationOption['kind'];
    legacySlug: EnergizationLegacySlug | null;
    raw: string;
    priceInr: number | null;
  }>;
}

function serializeLegacyOptions(options: ParsedLegacyEnergizationOption[]) {
  return options.map((option) => ({
    kind: option.kind,
    legacySlug: option.legacySlug,
    raw: option.raw,
    priceInr: option.priceInr,
  }));
}

function mapSlugsToIds(
  slugs: EnergizationLegacySlug[],
  optionsByLegacySlug: Map<string, string>
): string[] {
  const ids: string[] = [];
  for (const slug of slugs) {
    const id = optionsByLegacySlug.get(slug);
    if (id) ids.push(id);
  }
  return ids;
}

export function resolveProductEnergizationRules(
  product: ProductEnergizationRuleInput,
  wooEnergizationRaw: string | null | undefined,
  optionsByLegacySlug: Map<string, string>
): ResolvedProductEnergizationRules {
  if (
    shouldDisableEnergizationAddons({
      category: product.category,
      product_type: product.product_type,
      configurator_enabled: product.configurator_enabled,
      energization_eligible: product.energization_eligible,
    })
  ) {
    return {
      energization_enabled: false,
      allowed_energization_option_ids: [],
      legacy_energization_options: [],
    };
  }

  const parsed = parseLegacyEnergizationOptions(wooEnergizationRaw);
  const legacy_energization_options = serializeLegacyOptions(parsed);
  const optionSlugs = legacySlugsFromParsedEnergizationOptions(parsed);
  const hasSelectableOption = parsed.some((option) => option.kind === 'option');
  const onlySkip =
    parsed.length > 0 && !hasSelectableOption && parsed.every((option) => option.kind !== 'unknown');

  if (onlySkip) {
    return {
      energization_enabled: false,
      allowed_energization_option_ids: [],
      legacy_energization_options,
    };
  }

  const allowedSlugs =
    optionSlugs.length > 0
      ? optionSlugs
      : product.configurator_enabled !== false
        ? DEFAULT_GEMSTONE_ENERGIZATION_SLUGS
        : [];

  const allowed_energization_option_ids = mapSlugsToIds(allowedSlugs, optionsByLegacySlug);

  return {
    energization_enabled: hasSelectableOption || allowed_energization_option_ids.length > 0,
    allowed_energization_option_ids,
    legacy_energization_options,
  };
}
