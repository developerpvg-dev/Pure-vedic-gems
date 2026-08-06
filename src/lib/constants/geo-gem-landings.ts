import landings from '@/lib/constants/geo-gem-landings.json';

export type GeoGemLanding = (typeof landings.pages)[number];

const bySlug = new Map(landings.pages.map((p) => [p.slug, p]));

export function getAllGeoGemLandingSlugs() {
  return landings.pages.map((p) => p.slug);
}

export function getGeoGemLanding(slug: string): GeoGemLanding | null {
  return bySlug.get(slug) ?? null;
}

export function isGeoGemLandingSlug(slug: string) {
  return bySlug.has(slug);
}

/** Paths that must NOT 301 — served as live rebuilt pages. */
export const GEO_GEM_LANDING_PATHS = new Set(landings.pages.map((p) => p.path));

export function geoGemLandingJsonLd(
  page: GeoGemLanding,
  absoluteUrl: (path?: string) => string,
) {
  const url = absoluteUrl(page.path);
  const faqs = page.faqs
    .map((f) => ({
      question: f.question.replace(/:\?$/, '?').replace(/\?\?$/, '?'),
      answer: f.answer,
    }))
    .filter((f) => f.question.length > 8 && f.answer.length > 40);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.h1,
      description: page.description,
      image: page.ogImage ? [absoluteUrl(page.ogImage)] : undefined,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: 'PureVedicGems' },
      publisher: {
        '@type': 'Organization',
        name: 'PureVedicGems',
        url: absoluteUrl('/'),
      },
      about: {
        '@type': 'Thing',
        name: page.gemLabel,
      },
      contentLocation: {
        '@type': 'Place',
        name: page.region,
      },
      inLanguage: 'en',
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['h1', '.geo-gem-lead', '.geo-gem-faq'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Gem Qualities',
          item: absoluteUrl('/knowledge/gem-qualities'),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: page.gemLabel,
          item: absoluteUrl(page.qualityPath),
        },
        { '@type': 'ListItem', position: 4, name: page.h1, item: url },
      ],
    },
    faqs.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }
      : null,
  ].filter(Boolean);
}
