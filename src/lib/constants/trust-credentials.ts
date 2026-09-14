export const LAB_LOGOS = [
  { name: 'GIA', logo: '/labslogo/GIA.webp' },
  { name: 'IGI', logo: '/labslogo/IGI.webp' },
  { name: 'GRS', logo: '/labslogo/GRS.webp' },
  { name: 'Gübelin', logo: '/labslogo/GUBELIN.webp' },
  { name: 'GII', logo: '/labslogo/GII.webp' },
  { name: 'IIGJ', logo: '/labslogo/IIGJ.webp' },
  { name: 'HRD Antwerp', logo: '/labslogo/HRD ANTWERP.webp' },
  { name: 'GJEPC', logo: '/labslogo/GJEPC.webp' },
  { name: 'SSEF', logo: '/labslogo/SSEF.webp' },
  { name: 'GFCO', logo: '/labslogo/GFCO.webp' },
] as const;

export type LabLogo = (typeof LAB_LOGOS)[number];

const EMPTY_LAB = /^(none|n\/a|na|nil|-|null|undefined)$/i;

/** Ordered: more specific lab names before shorter ones (IIGJ before IGI, IGI-GTL before IGI). */
const LAB_INFER_PATTERNS: Array<{ re: RegExp; lab: string }> = [
  { re: /\biigj\b/i, lab: 'IIGJ' },
  { re: /\bgübelin\b|\bgubelin\b/i, lab: 'Gübelin' },
  { re: /\bhrd(?:\s*antwerp)?\b/i, lab: 'HRD Antwerp' },
  { re: /\bgjepc\b/i, lab: 'GJEPC' },
  { re: /\bssef\b/i, lab: 'SSEF' },
  { re: /\bgfco\b/i, lab: 'GFCO' },
  { re: /\bgrs\b/i, lab: 'GRS' },
  { re: /\bgia\b/i, lab: 'GIA' },
  { re: /\bgii\b/i, lab: 'GII' },
  { re: /\bigi[\s\-]?gtl\b|\bigigtl\b|\bigitl\b|\bgtl(?:\s*jaipur)?\b/i, lab: 'IGI-GTL' },
  { re: /\bigi\b/i, lab: 'IGI' },
  // ponytail: PVG product copy uses "Govt. Lab" for IGI-GTL Delhi; remap if other govt labs appear
  { re: /\bgovt\.?\s*lab\b|\bgovernment\s*lab\b/i, lab: 'IGI-GTL' },
];

function normalizeLabToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compactLabToken(value: string): string {
  return normalizeLabToken(value).replace(/\s+/g, '');
}

/** Pull a canonical lab label out of free text (fields, description, cert number). */
export function inferCertificateLab(...texts: Array<string | null | undefined>): string | null {
  const blob = texts.filter((t): t is string => Boolean(t?.trim())).join('\n');
  if (!blob) return null;
  if (EMPTY_LAB.test(blob.trim())) return null;
  for (const { re, lab } of LAB_INFER_PATTERNS) {
    if (re.test(blob)) return lab;
  }
  return null;
}

/** Map product certificate_lab / certification / cert number / description text to a known lab logo. */
export function resolveLabLogo(...candidates: Array<string | null | undefined>): LabLogo | null {
  const inferred = inferCertificateLab(...candidates);
  const haystacks = [...candidates, inferred]
    .map((c) => (c && !EMPTY_LAB.test(c.trim()) ? normalizeLabToken(c) : ''))
    .filter(Boolean);
  if (!haystacks.length) return null;

  const labs = [...LAB_LOGOS].sort((a, b) => b.name.length - a.name.length);
  for (const lab of labs) {
    const needle = normalizeLabToken(lab.name);
    const needleCompact = compactLabToken(lab.name);
    if (
      haystacks.some((h) => {
        const hc = h.replace(/\s+/g, '');
        return h === needle || h.includes(needle) || hc.includes(needleCompact);
      })
    ) {
      return lab;
    }
  }
  return null;
}

export const METAL_TRUST_HIGHLIGHT = {
  title: 'BIS Hallmarked',
  detail: 'Govt. certified 916 gold & 925 silver, each with a unique HUID verifiable on the BIS Care app.',
} as const;

/** @deprecated Legacy marquee copy — use METAL_TRUST_HIGHLIGHT in configurator metal step */
export const METAL_TRUST_MESSAGES = [
  'BIS Hallmarked — Govt. Certified Purity',
  'Unique HUID — Verify Anytime',
  'Gold & Silver — Bureau of Indian Standards',
  'GIA · IGI · GRS · IIGJ Certified Gemstones',
  'Gubelin · SSEF · HRD · GJEPC Labs',
] as const;
