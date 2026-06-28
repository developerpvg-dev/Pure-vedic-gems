import {
  classifyLegacyEnergizationOption,
  splitLegacyEnergizationValues,
  type ParsedLegacyEnergizationOption,
} from '@/lib/utils/legacy-energization-options';
import type { OptionKind, ParsedOption } from './attributes';

export function parseAttributeValues(kind: OptionKind, rawValue: string): ParsedOption[] {
  if (kind !== 'energization') {
    throw new Error(`parseAttributeValues: only energization kind is implemented (got ${kind}).`);
  }

  return splitLegacyEnergizationValues(rawValue).map((raw) => {
    const parsed = classifyLegacyEnergizationOption(raw);
    return energizationParsedToOption(parsed);
  });
}

function energizationParsedToOption(parsed: ParsedLegacyEnergizationOption): ParsedOption {
  return {
    kind: 'energization',
    optionLabel: parsed.raw,
    optionSlug: parsed.legacySlug ?? undefined,
    priceDelta: parsed.priceInr ?? undefined,
    raw: parsed.raw,
  };
}
