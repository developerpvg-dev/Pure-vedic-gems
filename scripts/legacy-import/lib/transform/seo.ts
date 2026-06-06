/**
 * SEO field migration: AIOSEO / Yoast meta keys → meta_title / meta_description
 * / canonical_url / meta_keywords, with deterministic fallback templates.
 *
 * Rules (best-practice baseline applied during migration):
 *   - meta_title:        10..60 chars. Prefer _aioseop_title, then _yoast_wpseo_title.
 *                        Fallback template:
 *                          "{Label} {Carat}ct {Origin} – Natural Certified Gemstone | PureVedicGems"
 *                        Truncate at word boundary; never mid-word.
 *   - meta_description:  50..160 chars. Prefer _aioseop_description, then
 *                        _yoast_wpseo_metadesc.
 *                        Fallback template:
 *                          "Buy {Label} ({Weight}ct / {Ratti}ratti) from {Origin}. {CertificateLab}-certified. Astrologer-vetted Vedic gemstone with secure shipping."
 *   - canonical_url:     ALWAYS set to the new storefront path; never carry
 *                        a legacy canonical forward.
 *   - meta_keywords:     _aioseop_keywords split on commas, trimmed, de-duped,
 *                        lower-cased.
 *
 * PR-3 implements.
 */

export interface SeoInputs {
  title: string;
  subCategoryLabel: string;
  caratWeight?: number | null;
  rattiWeight?: number | null;
  originDisplay?: string | null;
  certificateLab?: string | null;
  legacyMeta: Record<string, string | null | undefined>;
  canonicalPath: string;
}

export interface SeoOutput {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  canonicalUrl: string;
  legacySeo: Record<string, unknown>;
  warnings: string[];
}

export function buildSeo(input: SeoInputs): SeoOutput {
  const warnings: string[] = [];
  const m = input.legacyMeta;

  const rawTitle = nonEmpty(m._aioseop_title) ?? nonEmpty(m._yoast_wpseo_title) ?? '';
  const rawDesc = nonEmpty(m._aioseop_description) ?? nonEmpty(m._yoast_wpseo_metadesc) ?? '';
  const rawKw = nonEmpty(m._aioseop_keywords) ?? nonEmpty(m._yoast_wpseo_metakeywords) ?? '';

  let metaTitle = rawTitle;
  if (!metaTitle || metaTitle.length < 10) {
    const parts = [input.subCategoryLabel];
    if (input.caratWeight) parts.push(`${input.caratWeight}ct`);
    if (input.originDisplay) parts.push(input.originDisplay);
    metaTitle = `${parts.join(' ')} – Natural Certified Gemstone | PureVedicGems`;
  }
  metaTitle = truncateAtWord(metaTitle, 60);
  if (metaTitle.length < 10) warnings.push(`meta_title shorter than 10 chars: "${metaTitle}"`);

  let metaDescription = rawDesc;
  if (!metaDescription || metaDescription.length < 50) {
    const wt = [
      input.caratWeight ? `${input.caratWeight}ct` : null,
      input.rattiWeight ? `${input.rattiWeight} ratti` : null,
    ].filter(Boolean).join(' / ');
    const origin = input.originDisplay ? ` from ${input.originDisplay}` : '';
    const lab = input.certificateLab ? ` ${input.certificateLab}-certified.` : '';
    metaDescription = `Buy ${input.subCategoryLabel}${wt ? ` (${wt})` : ''}${origin}.${lab} Astrologer-vetted Vedic gemstone with secure shipping.`;
  }
  metaDescription = truncateAtWord(metaDescription, 160);
  if (metaDescription.length < 50) warnings.push(`meta_description shorter than 50 chars`);

  const metaKeywords = Array.from(
    new Set(
      rawKw
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0 && k.length <= 60),
    ),
  ).slice(0, 20);

  // Always rewrite canonical to the new storefront URL.
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '';
  const canonicalUrl = siteBase + input.canonicalPath;

  // Preserve raw legacy SEO meta for forensic audit.
  const legacySeo: Record<string, unknown> = {};
  for (const k of Object.keys(m)) {
    if (k.startsWith('_aioseop_') || k.startsWith('_yoast_')) {
      legacySeo[k] = m[k];
    }
  }

  return { metaTitle, metaDescription, metaKeywords, canonicalUrl, legacySeo, warnings };
}

function nonEmpty(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function truncateAtWord(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > max * 0.6 ? cut.slice(0, lastSpace).trimEnd() : cut.trimEnd();
}
