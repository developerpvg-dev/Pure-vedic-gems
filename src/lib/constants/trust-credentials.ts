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

export const METAL_TRUST_HIGHLIGHT = {
  eyebrow: 'Government Certified',
  title: 'BIS Hallmarked',
  subtitle: 'Govt. Certified Purity',
  detail: 'Every gold & silver piece carries a unique HUID — verify purity anytime on the BIS Care app.',
} as const;

export const METAL_TRUST_POINTS = [
  'Unique HUID — Verify Anytime',
  '916 Gold & 925 Silver Purity',
  'Bureau of Indian Standards',
] as const;

/** @deprecated Use METAL_TRUST_HIGHLIGHT + METAL_TRUST_POINTS in configurator metal step */
export const METAL_TRUST_MESSAGES = [
  'BIS Hallmarked — Govt. Certified Purity',
  'Unique HUID — Verify Anytime',
  'Gold & Silver — Bureau of Indian Standards',
  'GIA · IGI · GRS · IIGJ Certified Gemstones',
  'Gubelin · SSEF · HRD · GJEPC Labs',
] as const;
