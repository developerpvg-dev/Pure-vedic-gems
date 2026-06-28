/**
 * Parse legacy WooCommerce per-product attribute option strings.
 */
import {
  classifyLegacyCertificateOption,
  splitLegacyCertificateValues,
  type ParsedLegacyCertificateOption,
} from '@/lib/utils/legacy-certificate-options';
import type { OptionKind, ParsedOption } from './attributes';

export type { OptionKind, ParsedOption };

export function parseAttributeValues(kind: OptionKind, rawValue: string): ParsedOption[] {
  if (kind !== 'certificate') {
    throw new Error(`parseAttributeValues: only certificate kind is implemented (got ${kind}).`);
  }

  return splitLegacyCertificateValues(rawValue).map((raw) => {
    const parsed = classifyLegacyCertificateOption(raw);
    return certificateParsedToOption(parsed);
  });
}

function certificateParsedToOption(parsed: ParsedLegacyCertificateOption): ParsedOption {
  return {
    kind: 'certificate',
    optionLabel: parsed.raw,
    optionSlug: parsed.legacySlug ?? undefined,
    priceDelta: parsed.priceInr ?? undefined,
    turnaroundDays: parsed.turnaroundDays ?? undefined,
    labCode: parsed.legacySlug ?? undefined,
    raw: parsed.raw,
  };
}
