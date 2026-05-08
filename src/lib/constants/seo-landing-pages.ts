export type SeoLandingKind = 'rashi' | 'planet' | 'purpose';

export type SeoLandingFaq = {
  question: string;
  answer: string;
};

export type SeoLandingPage = {
  kind: SeoLandingKind;
  slug: string;
  href: string;
  title: string;
  seoTitle: string;
  description: string;
  eyebrow: string;
  intro: string;
  advisory: string;
  primaryGemSlugs: string[];
  primaryGemNames: string[];
  supportingGemNames: string[];
  planet?: string;
  rashiName?: string;
  purpose?: string;
  faqs: SeoLandingFaq[];
  relatedKnowledge: Array<{ label: string; href: string }>;
};

const commonAdvisory =
  'Final gemstone selection should be confirmed with a qualified astrologer because birth chart strength, dasha, contraindications, and lifestyle context matter.';

const rashiPages: SeoLandingPage[] = [
  {
    kind: 'rashi',
    slug: 'gemstones-for-aries',
    href: '/shop/gemstones-for-aries',
    title: 'Gemstones for Aries (Mesha Rashi)',
    seoTitle: 'Gemstones for Aries Rashi | Mesha Rashi Gemstone Guide',
    description: 'Explore traditional Vedic gemstone options for Aries or Mesha Rashi, including Ruby and Red Coral with certified buying guidance.',
    eyebrow: 'Rashi Guide',
    intro: 'Aries or Mesha natives are traditionally associated with initiative, courage, and active fire energy. The shortlist below focuses on stones commonly discussed for vitality, discipline, and confident action.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['ruby', 'red-coral'],
    primaryGemNames: ['Ruby (Manik)', 'Red Coral (Moonga)'],
    supportingGemNames: ['Yellow Sapphire', 'Garnet'],
    planet: 'Mars',
    rashiName: 'Aries / Mesha',
    faqs: [
      { question: 'Which gemstone is commonly suggested for Aries Rashi?', answer: 'Red Coral is often discussed for Mars-led Aries energy, while Ruby may be considered when Sun support is also indicated by the full chart.' },
      { question: 'Can Aries wear Ruby and Red Coral together?', answer: 'Some charts support combinations, but gemstone stacking should be reviewed by an astrologer before wearing.' },
    ],
    relatedKnowledge: [{ label: 'Ruby guide', href: '/knowledge/gemstones/ruby-manik-guide' }, { label: 'Red Coral guide', href: '/knowledge/gemstones/red-coral-moonga-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-taurus',
    href: '/shop/gemstones-for-taurus',
    title: 'Gemstones for Taurus (Vrishabha Rashi)',
    seoTitle: 'Gemstones for Taurus Rashi | Vrishabha Gemstone Guide',
    description: 'Shop Vedic gemstone options for Taurus or Vrishabha Rashi, including Venus and Mercury aligned choices with expert guidance.',
    eyebrow: 'Rashi Guide',
    intro: 'Taurus or Vrishabha is linked with steadiness, material refinement, and Venusian taste. These gemstone options focus on harmony, clarity, and graceful prosperity.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['diamond', 'emerald', 'opal'],
    primaryGemNames: ['Diamond (Heera)', 'Emerald (Panna)', 'Opal'],
    supportingGemNames: ['White Sapphire', 'Rose Quartz'],
    planet: 'Venus',
    rashiName: 'Taurus / Vrishabha',
    faqs: [
      { question: 'Is Diamond suitable for Taurus Rashi?', answer: 'Diamond is traditionally connected with Venus, but suitability depends on chart condition, budget, and treatment disclosure.' },
      { question: 'What is a practical alternative to Diamond?', answer: 'White Sapphire or Opal may be discussed as Venus alternatives when the chart supports Venus strengthening.' },
    ],
    relatedKnowledge: [{ label: 'Emerald guide', href: '/knowledge/gemstones/emerald-panna-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-gemini',
    href: '/shop/gemstones-for-gemini',
    title: 'Gemstones for Gemini (Mithuna Rashi)',
    seoTitle: 'Gemstones for Gemini Rashi | Mithuna Gemstone Guide',
    description: 'Explore Emerald and Mercury-aligned gemstone options for Gemini or Mithuna Rashi with certification and wearing guidance.',
    eyebrow: 'Rashi Guide',
    intro: 'Gemini or Mithuna is associated with communication, trade, learning, and analysis. Emerald is the classic Mercury stone considered for these themes.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['emerald'],
    primaryGemNames: ['Emerald (Panna)'],
    supportingGemNames: ['Peridot', 'Green Tourmaline'],
    planet: 'Mercury',
    rashiName: 'Gemini / Mithuna',
    faqs: [
      { question: 'Which gemstone is linked with Gemini Rashi?', answer: 'Emerald is traditionally associated with Mercury and is commonly discussed for Gemini.' },
      { question: 'What should I check before buying Emerald?', answer: 'Review color, clarity, oil treatment disclosure, origin, certification, and whether Mercury strengthening is suitable for your chart.' },
    ],
    relatedKnowledge: [{ label: 'Emerald guide', href: '/knowledge/gemstones/emerald-panna-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-cancer',
    href: '/shop/gemstones-for-cancer',
    title: 'Gemstones for Cancer (Karka Rashi)',
    seoTitle: 'Gemstones for Cancer Rashi | Karka Gemstone Guide',
    description: 'Browse Pearl and Moonstone options for Cancer or Karka Rashi with Vedic wearing and buying support.',
    eyebrow: 'Rashi Guide',
    intro: 'Cancer or Karka is linked with the Moon, emotional balance, family care, and intuitive rhythm. Pearl and Moonstone are commonly explored for gentle lunar support.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['pearl', 'moonstone'],
    primaryGemNames: ['Pearl (Moti)', 'Moonstone'],
    supportingGemNames: ['Yellow Sapphire', 'Opal'],
    planet: 'Moon',
    rashiName: 'Cancer / Karka',
    faqs: [
      { question: 'Is Pearl the main gemstone for Cancer?', answer: 'Pearl is the traditional Moon gemstone and is often considered for Cancer, subject to chart confirmation.' },
      { question: 'Can Moonstone be used instead of Pearl?', answer: 'Moonstone is a gentler lunar alternative for some use cases, but it is still best selected after consultation.' },
    ],
    relatedKnowledge: [{ label: 'Pearl guide', href: '/knowledge/gemstones/pearl-moti-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-leo',
    href: '/shop/gemstones-for-leo',
    title: 'Gemstones for Leo (Simha Rashi)',
    seoTitle: 'Gemstones for Leo Rashi | Simha Gemstone Guide',
    description: 'Shop Ruby and Sun-aligned gemstone options for Leo or Simha Rashi with expert Jyotish guidance.',
    eyebrow: 'Rashi Guide',
    intro: 'Leo or Simha is connected with the Sun, leadership, visibility, and creative authority. Ruby is the classical Surya gemstone considered for these themes.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['ruby'],
    primaryGemNames: ['Ruby (Manik)'],
    supportingGemNames: ['Garnet', 'Sunstone'],
    planet: 'Sun',
    rashiName: 'Leo / Simha',
    faqs: [
      { question: 'Which gemstone is most associated with Leo?', answer: 'Ruby is traditionally associated with the Sun and Leo, but it should be worn only when suitable for the chart.' },
      { question: 'What matters most in Ruby quality?', answer: 'Color, transparency, treatment disclosure, origin, and certification are key purchase checkpoints.' },
    ],
    relatedKnowledge: [{ label: 'Ruby guide', href: '/knowledge/gemstones/ruby-manik-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-virgo',
    href: '/shop/gemstones-for-virgo',
    title: 'Gemstones for Virgo (Kanya Rashi)',
    seoTitle: 'Gemstones for Virgo Rashi | Kanya Gemstone Guide',
    description: 'Explore Emerald and Mercury-linked gemstone options for Virgo or Kanya Rashi with certified buying guidance.',
    eyebrow: 'Rashi Guide',
    intro: 'Virgo or Kanya is associated with discernment, service, health routines, and skilled communication. Emerald is the classic Mercury gemstone considered for this sign.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['emerald', 'peridot'],
    primaryGemNames: ['Emerald (Panna)', 'Peridot'],
    supportingGemNames: ['Green Tourmaline', 'Citrine'],
    planet: 'Mercury',
    rashiName: 'Virgo / Kanya',
    faqs: [
      { question: 'Is Emerald suitable for Virgo?', answer: 'Emerald is associated with Mercury and may be considered for Virgo when the birth chart supports it.' },
      { question: 'Is Peridot a Vedic substitute?', answer: 'Peridot is sometimes used as a gentler green alternative, but it is not a direct replacement for all Jyotish cases.' },
    ],
    relatedKnowledge: [{ label: 'Emerald guide', href: '/knowledge/gemstones/emerald-panna-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-libra',
    href: '/shop/gemstones-for-libra',
    title: 'Gemstones for Libra (Tula Rashi)',
    seoTitle: 'Gemstones for Libra Rashi | Tula Gemstone Guide',
    description: 'Browse Venus-aligned gemstone options for Libra or Tula Rashi, including Diamond, Opal, and White Sapphire.',
    eyebrow: 'Rashi Guide',
    intro: 'Libra or Tula is linked with Venus, balance, aesthetics, partnership, and refinement. Venus gemstones are often explored for these areas of life.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['diamond', 'opal', 'white-sapphire'],
    primaryGemNames: ['Diamond (Heera)', 'Opal', 'White Sapphire'],
    supportingGemNames: ['Rose Quartz', 'Zircon'],
    planet: 'Venus',
    rashiName: 'Libra / Tula',
    faqs: [
      { question: 'Which gemstones are associated with Libra?', answer: 'Diamond, White Sapphire, and Opal are commonly discussed for Venus-aligned Libra themes.' },
      { question: 'Should Venus stones be worn casually?', answer: 'For astrological use, Venus stones should be chosen after reviewing the full chart and quality details.' },
    ],
    relatedKnowledge: [{ label: 'Buying guide', href: '/knowledge/buying-guides' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-scorpio',
    href: '/shop/gemstones-for-scorpio',
    title: 'Gemstones for Scorpio (Vrishchika Rashi)',
    seoTitle: 'Gemstones for Scorpio Rashi | Vrishchika Gemstone Guide',
    description: 'Shop Red Coral, Cat Eye, and protective gemstone options for Scorpio or Vrishchika Rashi with expert review.',
    eyebrow: 'Rashi Guide',
    intro: 'Scorpio or Vrishchika is traditionally connected with depth, transformation, discipline, and Mars-led intensity. The shortlist favors stones considered for courage and protection.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['red-coral', 'cats-eye'],
    primaryGemNames: ['Red Coral (Moonga)', "Cat's Eye (Lehsunia)"],
    supportingGemNames: ['Ruby', 'Garnet'],
    planet: 'Mars',
    rashiName: 'Scorpio / Vrishchika',
    faqs: [
      { question: 'Is Red Coral connected with Scorpio?', answer: 'Red Coral is associated with Mars and is commonly considered for Scorpio when Mars support is suitable.' },
      { question: 'Is Cat Eye safe for everyone?', answer: 'Cat Eye is a Ketu gemstone and should be worn only after careful chart review.' },
    ],
    relatedKnowledge: [{ label: 'Red Coral guide', href: '/knowledge/gemstones/red-coral-moonga-guide' }, { label: "Cat's Eye guide", href: '/knowledge/gemstones/cats-eye-lehsunia-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-sagittarius',
    href: '/shop/gemstones-for-sagittarius',
    title: 'Gemstones for Sagittarius (Dhanu Rashi)',
    seoTitle: 'Gemstones for Sagittarius Rashi | Dhanu Gemstone Guide',
    description: 'Explore Yellow Sapphire and Jupiter-linked gemstone options for Sagittarius or Dhanu Rashi.',
    eyebrow: 'Rashi Guide',
    intro: 'Sagittarius or Dhanu is associated with Jupiter, wisdom, teachers, dharma, and long-range optimism. Yellow Sapphire is the classic Guru gemstone considered here.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['yellow-sapphire', 'citrine'],
    primaryGemNames: ['Yellow Sapphire (Pukhraj)', 'Citrine'],
    supportingGemNames: ['Topaz', 'Pearl'],
    planet: 'Jupiter',
    rashiName: 'Sagittarius / Dhanu',
    faqs: [
      { question: 'Which gemstone is best known for Sagittarius?', answer: 'Yellow Sapphire is traditionally linked with Jupiter and is often discussed for Sagittarius.' },
      { question: 'Can Citrine be considered?', answer: 'Citrine may be discussed as a budget-friendly yellow alternative, but Jyotish use should be confirmed.' },
    ],
    relatedKnowledge: [{ label: 'Yellow Sapphire guide', href: '/knowledge/gemstones/yellow-sapphire-pukhraj-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-capricorn',
    href: '/shop/gemstones-for-capricorn',
    title: 'Gemstones for Capricorn (Makara Rashi)',
    seoTitle: 'Gemstones for Capricorn Rashi | Makara Gemstone Guide',
    description: 'Browse Saturn-aligned gemstone options for Capricorn or Makara Rashi, including Blue Sapphire and Amethyst.',
    eyebrow: 'Rashi Guide',
    intro: 'Capricorn or Makara is linked with Saturn, responsibility, structure, and endurance. Blue Sapphire is powerful and should be approached with expert caution.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['blue-sapphire', 'amethyst'],
    primaryGemNames: ['Blue Sapphire (Neelam)', 'Amethyst'],
    supportingGemNames: ['Iolite', 'Lapis Lazuli'],
    planet: 'Saturn',
    rashiName: 'Capricorn / Makara',
    faqs: [
      { question: 'Can Capricorn wear Blue Sapphire?', answer: 'Blue Sapphire is Saturn aligned and may suit some Capricorn charts, but it requires careful astrological review.' },
      { question: 'Why is Amethyst listed?', answer: 'Amethyst is often discussed as a gentler Saturn-related alternative in some traditions.' },
    ],
    relatedKnowledge: [{ label: 'Blue Sapphire guide', href: '/knowledge/gemstones/blue-sapphire-neelam-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-aquarius',
    href: '/shop/gemstones-for-aquarius',
    title: 'Gemstones for Aquarius (Kumbha Rashi)',
    seoTitle: 'Gemstones for Aquarius Rashi | Kumbha Gemstone Guide',
    description: 'Shop Saturn and Rahu-linked gemstone options for Aquarius or Kumbha Rashi with expert suitability checks.',
    eyebrow: 'Rashi Guide',
    intro: 'Aquarius or Kumbha carries Saturnian discipline with unconventional, future-facing themes. Blue Sapphire, Amethyst, and Rahu-related stones require chart-sensitive guidance.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['blue-sapphire', 'hessonite', 'amethyst'],
    primaryGemNames: ['Blue Sapphire (Neelam)', 'Hessonite (Gomed)', 'Amethyst'],
    supportingGemNames: ['Iolite', 'Lapis Lazuli'],
    planet: 'Saturn',
    rashiName: 'Aquarius / Kumbha',
    faqs: [
      { question: 'Which gemstone is linked to Aquarius?', answer: 'Blue Sapphire is traditionally linked with Saturn and may be considered for Aquarius only after chart review.' },
      { question: 'Is Hessonite always suitable for Aquarius?', answer: 'No. Hessonite is associated with Rahu and should be worn only when Rahu support is advised.' },
    ],
    relatedKnowledge: [{ label: 'Blue Sapphire guide', href: '/knowledge/gemstones/blue-sapphire-neelam-guide' }, { label: 'Hessonite guide', href: '/knowledge/gemstones/hessonite-gomed-guide' }],
  },
  {
    kind: 'rashi',
    slug: 'gemstones-for-pisces',
    href: '/shop/gemstones-for-pisces',
    title: 'Gemstones for Pisces (Meena Rashi)',
    seoTitle: 'Gemstones for Pisces Rashi | Meena Gemstone Guide',
    description: 'Explore Yellow Sapphire, Pearl, and gentle Jupiter-Moon gemstone options for Pisces or Meena Rashi.',
    eyebrow: 'Rashi Guide',
    intro: 'Pisces or Meena is connected with Jupiter, devotion, intuition, and compassion. Yellow Sapphire and gentle lunar support may be discussed for aligned charts.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['yellow-sapphire', 'pearl', 'aquamarine'],
    primaryGemNames: ['Yellow Sapphire (Pukhraj)', 'Pearl (Moti)', 'Aquamarine'],
    supportingGemNames: ['Citrine', 'Moonstone'],
    planet: 'Jupiter',
    rashiName: 'Pisces / Meena',
    faqs: [
      { question: 'Is Yellow Sapphire associated with Pisces?', answer: 'Yellow Sapphire is traditionally linked with Jupiter and may be considered for Pisces charts where Guru support is suitable.' },
      { question: 'Can Pisces wear Pearl?', answer: 'Pearl may be considered when Moon support is also beneficial, but chart context matters.' },
    ],
    relatedKnowledge: [{ label: 'Yellow Sapphire guide', href: '/knowledge/gemstones/yellow-sapphire-pukhraj-guide' }, { label: 'Pearl guide', href: '/knowledge/gemstones/pearl-moti-guide' }],
  },
];

const planetPages: SeoLandingPage[] = [
  ['sun', 'Sun', 'Ruby (Manik)', ['ruby'], ['Garnet'], 'Surya guidance for confidence, visibility, authority, and vitality.', '/knowledge/gemstones/ruby-manik-guide'],
  ['moon', 'Moon', 'Pearl (Moti)', ['pearl'], ['Moonstone'], 'Chandra guidance for calmness, emotional steadiness, and nurturing support.', '/knowledge/gemstones/pearl-moti-guide'],
  ['mars', 'Mars', 'Red Coral (Moonga)', ['red-coral'], ['Ruby', 'Garnet'], 'Mangal guidance for courage, stamina, initiative, and disciplined action.', '/knowledge/gemstones/red-coral-moonga-guide'],
  ['mercury', 'Mercury', 'Emerald (Panna)', ['emerald'], ['Peridot'], 'Budh guidance for communication, trade, learning, and analytical clarity.', '/knowledge/gemstones/emerald-panna-guide'],
  ['jupiter', 'Jupiter', 'Yellow Sapphire (Pukhraj)', ['yellow-sapphire'], ['Citrine'], 'Guru guidance for wisdom, prosperity, learning, counsel, and dharma.', '/knowledge/gemstones/yellow-sapphire-pukhraj-guide'],
  ['venus', 'Venus', 'Diamond, Opal, White Sapphire', ['diamond', 'opal', 'white-sapphire'], ['Rose Quartz'], 'Shukra guidance for refinement, relationships, art, beauty, and comforts.', '/knowledge/buying-guides'],
  ['saturn', 'Saturn', 'Blue Sapphire (Neelam)', ['blue-sapphire', 'amethyst'], ['Iolite'], 'Shani guidance for discipline, endurance, structure, and responsibility.', '/knowledge/gemstones/blue-sapphire-neelam-guide'],
  ['rahu', 'Rahu', 'Hessonite (Gomed)', ['hessonite'], ['Lapis Lazuli'], 'Rahu guidance for focus during complexity, ambition, and unconventional paths.', '/knowledge/gemstones/hessonite-gomed-guide'],
  ['ketu', 'Ketu', "Cat's Eye (Lehsunia)", ['cats-eye'], ['Tiger Eye'], 'Ketu guidance for detachment, intuition, protection, and spiritual insight.', '/knowledge/gemstones/cats-eye-lehsunia-guide'],
].map(([slug, planet, gemLabel, primaryGemSlugs, supportingGemNames, focus, knowledgeHref]) => ({
  kind: 'planet' as const,
  slug: `gemstones-by-planet-${slug}`,
  href: `/shop/gemstones-by-planet-${slug}`,
  title: `Gemstones for ${planet}`,
  seoTitle: `${planet} Gemstone Guide | Vedic Gemstones by Planet`,
  description: `Explore certified Vedic gemstone options for ${planet}, including ${gemLabel} with buying and wearing guidance.`,
  eyebrow: 'Planet Guide',
  intro: `${focus} This page collects the main gemstone shortlist and related alternatives so shoppers can compare certified options before consultation.`,
  advisory: commonAdvisory,
  primaryGemSlugs: primaryGemSlugs as string[],
  primaryGemNames: [gemLabel as string],
  supportingGemNames: supportingGemNames as string[],
  planet: planet as string,
  faqs: [
    { question: `Which gemstone is linked with ${planet}?`, answer: `${gemLabel} is the traditional primary recommendation most often discussed for ${planet}, subject to chart suitability.` },
    { question: 'Should I buy before consultation?', answer: 'For astrological wearing, consultation is recommended before purchase so the stone, metal, weight, and timing are aligned.' },
  ],
  relatedKnowledge: [{ label: `${planet} knowledge guide`, href: knowledgeHref as string }],
}));

const purposePages: SeoLandingPage[] = [
  {
    kind: 'purpose',
    slug: 'gemstones-for-career-growth',
    href: '/shop/gemstones-for-career-growth',
    title: 'Gemstones for Career Growth',
    seoTitle: 'Gemstones for Career Growth | Vedic Gemstone Guide',
    description: 'Explore traditional gemstones for career clarity, leadership, communication, and professional growth with expert guidance.',
    eyebrow: 'Purpose Guide',
    intro: 'Career growth can involve visibility, communication, decision-making, and disciplined execution. This shortlist brings together stones commonly discussed for those themes.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['emerald', 'yellow-sapphire', 'ruby'],
    primaryGemNames: ['Emerald (Panna)', 'Yellow Sapphire (Pukhraj)', 'Ruby (Manik)'],
    supportingGemNames: ['Citrine', 'Peridot'],
    purpose: 'Career growth',
    faqs: [
      { question: 'Which gemstone helps career growth?', answer: 'Emerald, Yellow Sapphire, and Ruby are often discussed for communication, guidance, and leadership respectively, but chart fit is essential.' },
      { question: 'Can one gemstone solve career issues?', answer: 'No. Gemstones are traditionally used as supportive remedies alongside effort, timing, and practical decisions.' },
    ],
    relatedKnowledge: [{ label: 'Gemstone buying guide', href: '/knowledge/buying-guides' }],
  },
  {
    kind: 'purpose',
    slug: 'gemstones-for-marriage-harmony',
    href: '/shop/gemstones-for-marriage-harmony',
    title: 'Gemstones for Marriage and Harmony',
    seoTitle: 'Gemstones for Marriage and Harmony | Vedic Guide',
    description: 'Browse traditional gemstone options for marriage support, harmony, and relationship balance with consultation-first guidance.',
    eyebrow: 'Purpose Guide',
    intro: 'Relationship and marriage guidance usually involves Jupiter, Venus, Moon, and seventh-house context. The gemstones below are common starting points, not automatic prescriptions.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['yellow-sapphire', 'diamond', 'opal'],
    primaryGemNames: ['Yellow Sapphire (Pukhraj)', 'Diamond (Heera)', 'Opal'],
    supportingGemNames: ['Pearl', 'Rose Quartz'],
    purpose: 'Marriage and harmony',
    faqs: [
      { question: 'Is Yellow Sapphire used for marriage?', answer: 'Yellow Sapphire is commonly discussed for Jupiter-led marriage guidance, especially in some traditional contexts.' },
      { question: 'Are Venus stones always good for relationships?', answer: 'Venus stones may support harmony in suitable charts, but they are not universally recommended.' },
    ],
    relatedKnowledge: [{ label: 'Yellow Sapphire guide', href: '/knowledge/gemstones/yellow-sapphire-pukhraj-guide' }],
  },
  {
    kind: 'purpose',
    slug: 'gemstones-for-protection-grounding',
    href: '/shop/gemstones-for-protection-grounding',
    title: 'Gemstones for Protection and Grounding',
    seoTitle: 'Gemstones for Protection and Grounding | Vedic Guide',
    description: 'Explore Saturn, Rahu, Ketu, and grounding gemstone options with clear cautions and expert guidance.',
    eyebrow: 'Purpose Guide',
    intro: 'Protection and grounding pages require extra care because powerful gemstones are not casual accessories. These stones should be considered only after chart review.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['blue-sapphire', 'hessonite', 'cats-eye'],
    primaryGemNames: ['Blue Sapphire (Neelam)', 'Hessonite (Gomed)', "Cat's Eye (Lehsunia)"],
    supportingGemNames: ['Amethyst', 'Tiger Eye'],
    purpose: 'Protection and grounding',
    faqs: [
      { question: 'Which gemstones are considered protective?', answer: 'Blue Sapphire, Hessonite, and Cat Eye are discussed in protective contexts, but each can be unsuitable if chart conditions are wrong.' },
      { question: 'Should I test a powerful gemstone first?', answer: 'Many astrologers recommend a trial or staged approach for strong Saturn, Rahu, and Ketu stones.' },
    ],
    relatedKnowledge: [{ label: 'Blue Sapphire guide', href: '/knowledge/gemstones/blue-sapphire-neelam-guide' }],
  },
  {
    kind: 'purpose',
    slug: 'gemstones-for-wealth-prosperity',
    href: '/shop/gemstones-for-wealth-prosperity',
    title: 'Gemstones for Wealth and Prosperity',
    seoTitle: 'Gemstones for Wealth and Prosperity | Vedic Guide',
    description: 'Compare traditional gemstones for prosperity, opportunity, business clarity, and long-term abundance.',
    eyebrow: 'Purpose Guide',
    intro: 'Prosperity guidance often blends Jupiter wisdom, Mercury trade skill, Venus refinement, and practical financial discipline. This page helps compare common gemstone options.',
    advisory: commonAdvisory,
    primaryGemSlugs: ['yellow-sapphire', 'emerald', 'citrine'],
    primaryGemNames: ['Yellow Sapphire (Pukhraj)', 'Emerald (Panna)', 'Citrine'],
    supportingGemNames: ['Ruby', 'Diamond'],
    purpose: 'Wealth and prosperity',
    faqs: [
      { question: 'Which gemstone is used for prosperity?', answer: 'Yellow Sapphire and Emerald are commonly discussed for prosperity, wisdom, trade, and decision-making themes.' },
      { question: 'Is Citrine a substitute for Yellow Sapphire?', answer: 'Citrine may be considered as a budget-friendly yellow stone, but it is not always equivalent for Jyotish purposes.' },
    ],
    relatedKnowledge: [{ label: 'Yellow Sapphire guide', href: '/knowledge/gemstones/yellow-sapphire-pukhraj-guide' }, { label: 'Emerald guide', href: '/knowledge/gemstones/emerald-panna-guide' }],
  },
];

export const RASHI_SEO_PAGES = rashiPages;
export const PLANET_SEO_PAGES = planetPages;
export const PURPOSE_SEO_PAGES = purposePages;

export const SEO_LANDING_PAGES = [
  ...RASHI_SEO_PAGES,
  ...PLANET_SEO_PAGES,
  ...PURPOSE_SEO_PAGES,
] as const satisfies readonly SeoLandingPage[];

export function getSeoLandingPageBySlug(slug: string) {
  return SEO_LANDING_PAGES.find((page) => page.slug === slug) ?? null;
}

export function getSeoLandingPagesByKind(kind: SeoLandingKind) {
  return SEO_LANDING_PAGES.filter((page) => page.kind === kind);
}