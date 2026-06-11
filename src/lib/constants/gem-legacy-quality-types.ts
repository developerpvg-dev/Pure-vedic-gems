export type GemLegacyTier = {
  title: string;
  note?: string;
  rows: { label: string; value: string }[];
  images: { src: string; alt: string }[];
};

export type GemLegacyGuide = {
  slug: string;
  legacyH1: string;
  certificationQuote: string;
  sectionIntro?: string;
  tiers: GemLegacyTier[];
  shopHref: string;
  shopLabel: string;
  aboutTitle?: string;
  aboutParagraphs: string[];
  generalCharacteristicsTitle?: string;
  generalCharacteristics?: string[];
  goodQualitiesTitle?: string;
  goodQualities?: string[];
  introBullets?: string[];
  trustPoints?: { bold: string; text: string }[];
  instructionColumns?: string[][];
  jewelleryCta?: { title: string; href: string; label: string };
  energizingVideoLabel?: string;
  energizingVideoHref?: string;
  phone?: string;
  faqTitle?: string;
  faqs: { question: string; answer: string }[];
};
