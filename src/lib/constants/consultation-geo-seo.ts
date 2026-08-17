/**
 * Internal SEO harvested from legacy geo consultation + related Malaysia landings.
 * Redirect sources → /consultation. Do not render this corpus as page copy.
 */

export const CONSULTATION_PATH = '/consultation';

/** All legacy paths redirected to the consultation booking page. */
export const CONSULTATION_GEO_REDIRECT_SOURCES = [
  '/astrological-consultation-in-abu-dhabi-professional-guidance-for-your-birth-chart',
  '/astrological-consultation-in-birmingham-kundli-guidance',
  '/best-astrological-consultation-in-california-expert-vedic-astrologer',
  '/best-astrological-consultation-in-new-york-and-expert-vedic-astrology-guidance',
  '/trusted-astrological-consultation-in-sharjah-personalised-vedic-guidance',
  '/tag/astrological-consultation',
] as const;

export const CONSULTATION_GEO_META = {
  title:
    'Book Vedic Astrology Consultation Online | Kundli, Gemstone & Rudraksha Guidance | Pure Vedic Gems',
  description:
    'Book a professional Vedic astrology consultation online — Kundli / birth chart analysis, career, marriage, health, gemstone and Rudraksha guidance. Serving clients in India and worldwide including Abu Dhabi, Birmingham, California, New York, Sharjah, and Malaysia. Personalized remedies from Pure Vedic Gems astrologers since 1937.',
};

/** High-intent queries from legacy city + Malaysia landings (meta + WebPage JSON-LD). */
export const CONSULTATION_GEO_KEYWORDS = [
  'vedic astrology consultation online',
  'astrological consultation Abu Dhabi',
  'astrological consultation Birmingham',
  'best astrological consultation California',
  'astrological consultation New York',
  'astrological consultation Sharjah',
  'Kundli reading online',
  'birth chart analysis Vedic',
  'horoscope consultation',
  'gemstone recommendation consultation',
  'Rudraksha recommendation consultation',
  'online Vedic remedies consultation',
  'blue sapphire Malaysia astrology',
  'emerald gemstone Malaysia Vedic',
  'hessonite Gomed Malaysia',
  'pearl Moti Malaysia astrology',
  'white sapphire Malaysia',
  'yellow sapphire Malaysia Pukhraj',
  'red coral Moonga Malaysia',
  'ruby Manik Malaysia astrology',
  'expert Vedic astrologer',
  'personalised Vedic guidance',
];

/** Per-source SEO payloads kept for WebPage abstract (not shown in UI). */
export const CONSULTATION_GEO_SOURCES = [
  {
    path: '/astrological-consultation-in-abu-dhabi-professional-guidance-for-your-birth-chart',
    title: 'Astrological Consultation in Abu Dhabi – Professional Guidance for Your Birth Chart',
    description:
      'Book a professional astrological consultation in Abu Dhabi. Get accurate birth chart analysis, Kundli reading, Vedic astrology guidance, personalized remedies, gemstones, Rudraksha, and horoscope consultation.',
    topics: [
      'What is an astrological consultation',
      'Career, marriage, finance and health guidance from Kundli',
      'Vedic astrology and personalised remedies',
      'Online consultation for Abu Dhabi clients',
    ],
  },
  {
    path: '/astrological-consultation-in-birmingham-kundli-guidance',
    title: 'Astrological Consultation in Birmingham | Trusted Horoscope & Kundli Guidance',
    description:
      'Book a personal astrology consultation and receive thoughtful guidance based on your birth chart. Sessions include Kundli reading, horoscope interpretation, gemstone recommendations, Vedic remedies, and online consultations.',
    topics: [
      'Why people choose astrological consultation',
      'Kundli reading, gemstone and Rudraksha services',
      'Online astrology consultation in Birmingham',
      'How to prepare birth details for consultation',
    ],
  },
  {
    path: '/best-astrological-consultation-in-california-expert-vedic-astrologer',
    title: 'Best Astrological Consultation in California | Expert Vedic Astrologer',
    description:
      'Book the best astrological consultation in California with an expert Vedic astrologer. Get accurate Kundli analysis, birth chart reading, gemstone guidance, and personalized Vedic remedies.',
    topics: [
      'Professional Vedic consultation vs generic predictions',
      'What happens during an astrology consultation',
      'Gemstone recommendations based on horoscope',
      'Why California clients choose online Vedic consultation',
    ],
  },
  {
    path: '/best-astrological-consultation-in-new-york-and-expert-vedic-astrology-guidance',
    title: 'Best Astrological Consultation in New York and Expert Vedic Astrology Guidance',
    description:
      'Get expert Vedic astrology consultation in New York. Receive personalized horoscope analysis, gemstone recommendations, Rudraksha guidance, and traditional Vedic remedies from experienced astrologers.',
    topics: [
      'Detailed horoscope analysis and personalised Vedic guidance',
      'How gemstones and Rudraksha are recommended',
      'Career, marriage, business and personal challenges',
      'In-person and online consultations',
    ],
  },
  {
    path: '/trusted-astrological-consultation-in-sharjah-personalised-vedic-guidance',
    title: 'Trusted Astrological Consultation in Sharjah – Personalised Vedic Guidance',
    description:
      'Get trusted Vedic astrological consultation in Sharjah with personalised Kundli analysis, career, marriage, health, gemstone, Rudraksha, and horoscope guidance from experienced astrologers.',
    topics: [
      'What is a Vedic astrology consultation',
      'Birth chart, career, marriage, health and remedy services',
      'Why proper horoscope analysis matters',
      'Beware of fake astrology services',
    ],
  },
  {
    path: '/natural-certified-blue-sapphire-gemstone-in-malaysia-benefits-astrology-buying-guide',
    title: 'Blue Sapphire Gemstone in Malaysia | Benefits & Astrology',
    description:
      'Discover natural and certified Blue Sapphire gemstones in Malaysia, their astrological significance, benefits, authenticity, and buying tips.',
    topics: ['Neelam / Saturn (Shani)', 'Certified natural blue sapphire', 'Concentration discipline and buying tips in Malaysia'],
  },
  {
    path: '/natural-certified-emerald-gemstone-in-malaysia-benefits-astrology-buying-guide',
    title: 'Natural & Certified Emerald Gemstone in Malaysia | Benefits, Astrology & Buying Guide',
    description:
      'Looking for a natural emerald gemstone in Malaysia? Discover emerald benefits, Vedic astrology significance, certification tips, and how to choose an authentic emerald.',
    topics: ['Panna / Mercury (Budh)', 'Creativity focus confidence', 'Certified emerald buying in Malaysia'],
  },
  {
    path: '/natural-certified-hessonite-gemstone-in-malaysia-benefits-astrology-buying-guide',
    title: 'Natural & Certified Hessonite Gemstone in Malaysia – Benefits, Astrology & Buying Guide',
    description:
      'Learn about Natural & Certified Hessonite Gemstone in Malaysia, its benefits, astrology significance, healing properties, pricing, quality factors, and buying guide.',
    topics: ['Gomed / Rahu', 'Clarity confidence concentration', 'Hessonite quality and pricing in Malaysia'],
  },
  {
    path: '/natural-certified-pearl-gemstone-in-malaysia-benefits-astrology-buying-guide',
    title: 'Natural & Certified Pearl Gemstone in Malaysia – Benefits, Astrology & Buying Guide',
    description:
      'Discover natural & certified pearl gemstones in Malaysia. Learn about pearl benefits, Vedic astrology significance, authenticity, quality factors, pricing, and buying tips.',
    topics: ['Moti / Moon (Chandra)', 'Emotional balance calmness', 'Certified pearl authenticity in Malaysia'],
  },
  {
    path: '/natural-certified-white-sapphire-gemstone-in-malaysia-benefits-astrology-buying-guide',
    title: 'Natural & Certified White Sapphire in Malaysia – Benefits, Astrology & Buying Guide',
    description:
      'Explore natural certified white sapphire gemstones in Malaysia with Vedic astrology significance, benefits, authenticity checks, and buying guidance.',
    topics: ['White sapphire / Venus (Shukra)', 'Harmony relationships', 'Certified white sapphire Malaysia'],
  },
  {
    path: '/natural-yellow-sapphire-gemstone-in-malaysia-benefits-astrology-buying-guide',
    title: 'Yellow Sapphire Gemstone in Malaysia | Benefits, Astrology & Buying Guide',
    description:
      'Natural yellow sapphire (Pukhraj) in Malaysia — Jupiter astrology benefits, certification tips, and how to choose authentic Pukhraj.',
    topics: ['Pukhraj / Jupiter (Guru)', 'Prosperity wisdom education', 'Yellow sapphire buying guide Malaysia'],
  },
  {
    path: '/red-coral-gemstone-in-malaysia-benefits-price-astrology-and-buying-guide',
    title: 'Red Coral Gemstone in Malaysia | Benefits, Price, Astrology & Buying Guide',
    description:
      'Red coral (Moonga) in Malaysia — Mars astrology benefits, pricing factors, authenticity, and Vedic buying guidance.',
    topics: ['Moonga / Mars (Mangal)', 'Courage energy vitality', 'Red coral price and authenticity Malaysia'],
  },
  {
    path: '/ruby-gemstone-in-malaysia-natural-certified-astrological-stone-for-confidence-success-and-wealth-growth',
    title: 'Ruby Gemstone in Malaysia | Natural Certified Astrological Stone',
    description:
      'Natural certified ruby (Manik) in Malaysia for confidence, success and wealth growth — Sun astrology significance and buying guide.',
    topics: ['Manik / Sun (Surya)', 'Confidence success authority', 'Certified ruby Malaysia'],
  },
] as const;

export function consultationGeoInternalJsonLd(absoluteUrl: (path?: string) => string) {
  const url = absoluteUrl(CONSULTATION_PATH);
  const abstract = CONSULTATION_GEO_SOURCES.map(
    (s) => `${s.title}. ${s.description} Topics: ${s.topics.join('; ')}.`,
  ).join(' ');

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: CONSULTATION_GEO_META.title,
      description: CONSULTATION_GEO_META.description,
      keywords: CONSULTATION_GEO_KEYWORDS.join(', '),
      inLanguage: ['en', 'hi'],
      isPartOf: { '@type': 'WebSite', name: 'Pure Vedic Gems', url: absoluteUrl('/') },
      about: [
        { '@type': 'Thing', name: 'Vedic astrology consultation' },
        { '@type': 'Thing', name: 'Kundli / birth chart analysis' },
        { '@type': 'Thing', name: 'Gemstone recommendation' },
        { '@type': 'Thing', name: 'Rudraksha recommendation' },
        { '@type': 'Thing', name: 'Online horoscope consultation' },
      ],
      audience: {
        '@type': 'Audience',
        audienceType:
          'Clients seeking Vedic consultation in India and worldwide including Abu Dhabi, Birmingham, California, New York, Sharjah, and Malaysia',
      },
      abstract,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Legacy consultation & regional astrology landings consolidated here',
      itemListElement: CONSULTATION_GEO_SOURCES.map((s, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: s.title,
        description: s.description,
        url: absoluteUrl(CONSULTATION_PATH),
      })),
    },
  ];
}
