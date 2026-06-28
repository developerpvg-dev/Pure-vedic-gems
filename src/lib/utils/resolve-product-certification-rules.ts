import {
  DEFAULT_GEMSTONE_CERT_LAB_SLUGS,
  legacySlugsFromParsedOptions,
  parseLegacyCertificateOptions,
  productLooksPrecertified,
  shouldDisableCertificateAddons,
  type CertLabLegacySlug,
  type ParsedLegacyCertificateOption,
} from '@/lib/utils/legacy-certificate-options';

export interface ProductCertRuleInput {
  category?: string | null;
  product_type?: string | null;
  configurator_enabled?: boolean | null;
  certificate_number?: string | null;
  certificate_lab?: string | null;
  certification?: string | null;
  display_certificate_option?: string | null;
}

export interface ResolvedProductCertRules {
  certificate_enabled: boolean;
  allowed_certification_lab_ids: string[];
  legacy_certificate_options: Array<{
    kind: ParsedLegacyCertificateOption['kind'];
    legacySlug: CertLabLegacySlug | null;
    raw: string;
    priceInr: number | null;
    turnaroundDays: number | null;
  }>;
}

function serializeLegacyOptions(options: ParsedLegacyCertificateOption[]) {
  return options.map((option) => ({
    kind: option.kind,
    legacySlug: option.legacySlug,
    raw: option.raw,
    priceInr: option.priceInr,
    turnaroundDays: option.turnaroundDays,
  }));
}

function mapSlugsToIds(
  slugs: CertLabLegacySlug[],
  labsByLegacySlug: Map<string, string>
): string[] {
  const ids: string[] = [];
  for (const slug of slugs) {
    const id = labsByLegacySlug.get(slug);
    if (id) ids.push(id);
  }
  return ids;
}

export function resolveProductCertificationRules(
  product: ProductCertRuleInput,
  wooCertificateRaw: string | null | undefined,
  labsByLegacySlug: Map<string, string>
): ResolvedProductCertRules {
  if (
    shouldDisableCertificateAddons({
      category: product.category,
      product_type: product.product_type,
      configurator_enabled: product.configurator_enabled,
      display_certificate_option: product.display_certificate_option,
    })
  ) {
    return {
      certificate_enabled: false,
      allowed_certification_lab_ids: [],
      legacy_certificate_options: [],
    };
  }

  const parsed = parseLegacyCertificateOptions(wooCertificateRaw);
  const legacy_certificate_options = serializeLegacyOptions(parsed);
  const labSlugs = legacySlugsFromParsedOptions(parsed);
  const hasSelectableLab = parsed.some((option) => option.kind === 'lab');
  const onlySkipOrPrecertified =
    parsed.length > 0 && !hasSelectableLab && parsed.every((option) => option.kind !== 'unknown');

  if (onlySkipOrPrecertified) {
    return {
      certificate_enabled: false,
      allowed_certification_lab_ids: [],
      legacy_certificate_options,
    };
  }

  if (
    productLooksPrecertified(product) &&
    parsed.length === 0
  ) {
    return {
      certificate_enabled: false,
      allowed_certification_lab_ids: [],
      legacy_certificate_options: [],
    };
  }

  const allowedSlugs =
    labSlugs.length > 0
      ? labSlugs
      : product.configurator_enabled !== false
        ? DEFAULT_GEMSTONE_CERT_LAB_SLUGS
        : [];

  const allowed_certification_lab_ids = mapSlugsToIds(allowedSlugs, labsByLegacySlug);

  return {
    certificate_enabled: hasSelectableLab || allowed_certification_lab_ids.length > 0,
    allowed_certification_lab_ids,
    legacy_certificate_options,
  };
}
