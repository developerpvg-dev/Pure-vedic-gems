export type StaticGuideStat = {
  label: string;
  value: string;
};

export type StaticGuideSection = {
  title: string;
  body: string;
};

export type StaticGuideFaq = {
  question: string;
  answer: string;
};

export type StaticKnowledgeGuide = {
  title: string;
  shortTitle: string;
  slug: string;
  category: 'Navaratna Guide' | 'Rudraksha Guide';
  eyebrow: string;
  description: string;
  heroImage: string;
  shopHref: string;
  parentHref: string;
  parentLabel: string;
  readingTime: number;
  updatedAt: string;
  stats: StaticGuideStat[];
  intro: string;
  vedicSignificance: string;
  benefits: string[];
  whoShouldWear: StaticGuideSection[];
  howToWear: StaticGuideSection[];
  qualityPricing: string[];
  expertCorner: string;
  faqs: StaticGuideFaq[];
};

type GemstoneSeed = {
  name: string;
  vedicName: string;
  slug: string;
  planet: string;
  day: string;
  metal: string;
  finger: string;
  focus: string;
  quality: string;
  image: string;
  shopHref: string;
};

const gemstoneSeeds: GemstoneSeed[] = [
  {
    name: 'Ruby',
    vedicName: 'Manik',
    slug: 'ruby-manik-guide',
    planet: 'Sun',
    day: 'Sunday',
    metal: 'gold or copper alloy as advised',
    finger: 'ring finger',
    focus: 'confidence, authority, vitality, and father or leadership themes',
    quality: 'a lively red body color, good transparency, and disclosed treatment status',
    image: '/home/navratnaimg/stone1.webp',
    shopHref: '/shop/navaratna/ruby',
  },
  {
    name: 'Pearl',
    vedicName: 'Moti',
    slug: 'pearl-moti-guide',
    planet: 'Moon',
    day: 'Monday',
    metal: 'silver',
    finger: 'little finger',
    focus: 'calmness, emotional steadiness, motherly support, and mental peace',
    quality: 'smooth surface, natural luster, roundness, and reliable origin disclosure',
    image: '/home/navratnaimg/stone2.webp',
    shopHref: '/shop/navaratna/pearl',
  },
  {
    name: 'Red Coral',
    vedicName: 'Moonga',
    slug: 'red-coral-moonga-guide',
    planet: 'Mars',
    day: 'Tuesday',
    metal: 'gold or copper alloy as advised',
    finger: 'ring finger',
    focus: 'courage, stamina, discipline, and decisive action',
    quality: 'uniform red to reddish-orange color, clean surface, and natural coral disclosure',
    image: '/home/navratnaimg/stone3.webp',
    shopHref: '/shop/navaratna/red-coral',
  },
  {
    name: 'Emerald',
    vedicName: 'Panna',
    slug: 'emerald-panna-guide',
    planet: 'Mercury',
    day: 'Wednesday',
    metal: 'gold or panchdhatu as advised',
    finger: 'little finger',
    focus: 'communication, learning, trade, memory, and analytical clarity',
    quality: 'rich green color, visible but acceptable inclusions, and oil/treatment disclosure',
    image: '/home/navratnaimg/stone4.webp',
    shopHref: '/shop/navaratna/emerald',
  },
  {
    name: 'Yellow Sapphire',
    vedicName: 'Pukhraj',
    slug: 'yellow-sapphire-pukhraj-guide',
    planet: 'Jupiter',
    day: 'Thursday',
    metal: 'gold',
    finger: 'index finger',
    focus: 'wisdom, prosperity, education, marriage guidance, and spiritual counsel',
    quality: 'clear yellow body color, strong brightness, origin notes, and heat treatment disclosure',
    image: '/home/navratnaimg/stone5.webp',
    shopHref: '/shop/navaratna/yellow-sapphire',
  },
  {
    name: 'Diamond',
    vedicName: 'Heera',
    slug: 'diamond-heera-guide',
    planet: 'Venus',
    day: 'Friday',
    metal: 'white gold, platinum, or silver as advised',
    finger: 'middle or ring finger depending on guidance',
    focus: 'comfort, refinement, relationships, aesthetics, and luxury-related prosperity',
    quality: 'cut quality, clarity, color, carat, fluorescence notes, and trusted certification',
    image: '/home/navratnaimg/stone6.webp',
    shopHref: '/shop/navaratna/diamond',
  },
  {
    name: 'Blue Sapphire',
    vedicName: 'Neelam',
    slug: 'blue-sapphire-neelam-guide',
    planet: 'Saturn',
    day: 'Saturday',
    metal: 'silver, panchdhatu, or gold as advised',
    finger: 'middle finger',
    focus: 'discipline, endurance, responsibility, and long-term career stability',
    quality: 'velvety blue color, high transparency, no surface-reaching damage, and strong lab documentation',
    image: '/home/navratnaimg/stone7.webp',
    shopHref: '/shop/navaratna/blue-sapphire',
  },
  {
    name: 'Hessonite',
    vedicName: 'Gomed',
    slug: 'hessonite-gomed-guide',
    planet: 'Rahu',
    day: 'Saturday',
    metal: 'silver or panchdhatu as advised',
    finger: 'middle finger',
    focus: 'focus during uncertainty, public life, obsessive patterns, and Rahu-related remedies',
    quality: 'honey to cinnamon color, good transparency, and natural garnet certification',
    image: '/home/navratnaimg/stone8.webp',
    shopHref: '/shop/navaratna/hessonite',
  },
  {
    name: "Cat's Eye",
    vedicName: 'Lehsunia',
    slug: 'cats-eye-lehsunia-guide',
    planet: 'Ketu',
    day: 'Tuesday or Thursday as advised',
    metal: 'silver or panchdhatu as advised',
    finger: 'middle or ring finger depending on guidance',
    focus: 'detachment, intuition, sudden shifts, and Ketu-related protection practices',
    quality: 'sharp centered chatoyancy, even body color, cabochon symmetry, and certificate support',
    image: '/home/navratnaimg/stone9.webp',
    shopHref: '/shop/navaratna/cats-eye',
  },
];

export const NAVARATNA_GUIDES: StaticKnowledgeGuide[] = gemstoneSeeds.map((gem) => ({
  title: `${gem.name} (${gem.vedicName}) Complete Guide`,
  shortTitle: `${gem.name} Guide`,
  slug: gem.slug,
  category: 'Navaratna Guide',
  eyebrow: `${gem.planet} Gemstone`,
  description: `A practical Vedic buying and wearing guide for ${gem.name} (${gem.vedicName}), including suitability, quality checks, pricing factors, FAQs, and shop links.`,
  heroImage: gem.image,
  shopHref: gem.shopHref,
  parentHref: '/knowledge/gemstones',
  parentLabel: 'Gemstone Guides',
  readingTime: 6,
  updatedAt: '2026-05-06',
  stats: [
    { label: 'Vedic name', value: gem.vedicName },
    { label: 'Planet', value: gem.planet },
    { label: 'Common day', value: gem.day },
    { label: 'Usual metal', value: gem.metal },
  ],
  intro: `${gem.name}, known in the Vedic gemstone tradition as ${gem.vedicName}, is one of the nine Navaratna gemstones. Buyers should evaluate both the spiritual recommendation and the physical stone quality before purchase. For astrological wearing, the stone should be selected only after reviewing suitability, strength, budget, and practical comfort for daily use.`,
  vedicSignificance: `${gem.vedicName} is traditionally connected with ${gem.planet}. In classical guidance it is considered when a qualified expert recommends strengthening or balancing themes such as ${gem.focus}. Suitability is individual, so the recommendation should be reviewed with birth details rather than copied from a generic rashi list.`,
  benefits: [
    `Traditionally selected for ${gem.focus}.`,
    'Used as a focused remedial gemstone only after chart-based suitability checks.',
    'Can be configured into a ring, pendant, bracelet, or loose certified stone depending on eligibility.',
    'A strong candidate for expert review when the purchase is high value or intended for long-term wearing.',
  ],
  whoShouldWear: [
    {
      title: `When ${gem.planet} support is advised`,
      body: `This guide is useful when an expert has suggested ${gem.name} for ${gem.planet}-related support. The final choice should consider chart strength, current dasha or transit context, profession, lifestyle, and budget.`,
    },
    {
      title: 'When buying for collection or jewellery',
      body: `If the goal is beauty, gifting, or jewellery, focus more on color, durability, certification, cut, and setting design. Spiritual rules are still useful, but they should not replace quality verification.`,
    },
    {
      title: 'When to pause',
      body: `Avoid self-prescribing powerful planetary gemstones. Pause if the stone is uncertified, heavily treated without disclosure, priced unusually low, or recommended without any personal context.`,
    },
  ],
  howToWear: [
    {
      title: 'Confirm suitability',
      body: 'Share birth date, time, place, current concern, and budget with an expert. Confirm whether the stone should be worn, kept, gifted, or avoided.',
    },
    {
      title: 'Select the stone',
      body: `Shortlist stones with ${gem.quality}. Confirm carat or ratti, certificate lab, treatment status, and tag number before final approval.`,
    },
    {
      title: 'Choose setting and timing',
      body: `Traditional practice often uses ${gem.metal}, the ${gem.finger}, and ${gem.day}. The final ring or pendant plan should follow the expert's instruction and comfort needs.`,
    },
    {
      title: 'Care after wearing',
      body: 'Clean gently, avoid harsh chemicals, store safely, and keep the certificate and invoice with the product tag details for future verification.',
    },
  ],
  qualityPricing: [
    `Color and brightness are primary pricing drivers. For this stone, look for ${gem.quality}.`,
    'Certification, origin notes, treatment disclosure, cut, size, and supply rarity can change price substantially.',
    'Compare price per carat only after confirming quality tier, certificate confidence, return terms, and whether jewellery configuration is included.',
    'For astrological use, a smaller natural and suitable stone can be better than a larger stone selected only by price.',
  ],
  expertCorner: `For ${gem.name}, do not separate spiritual recommendation from physical verification. Ask for the tag number, certificate details, treatment disclosure, and a clear wearing plan before purchase.`,
  faqs: [
    {
      question: `Is ${gem.name} the same as ${gem.vedicName}?`,
      answer: `Yes. ${gem.vedicName} is the common Vedic or Hindi trade name used for ${gem.name}. Product pages may use both names for clarity.`,
    },
    {
      question: `Which planet is ${gem.vedicName} associated with?`,
      answer: `${gem.vedicName} is traditionally associated with ${gem.planet}. Actual suitability depends on individual guidance.`,
    },
    {
      question: `Can I wear ${gem.name} without consultation?`,
      answer: 'For jewellery or collection, you can choose by quality and preference. For astrological wearing, consultation is strongly recommended before use.',
    },
    {
      question: 'What should I verify before buying?',
      answer: 'Verify certificate, treatment disclosure, origin notes where available, weight, tag number, return terms, photos or video, and whether the selected setting is eligible.',
    },
  ],
}));

type RudrakshaSeed = {
  mukhi: number;
  focus: string;
  deity: string;
  association: string;
  image: string;
};

const rudrakshaSeeds: RudrakshaSeed[] = [
  { mukhi: 1, focus: 'deep spiritual focus, leadership, and single-pointed devotion', deity: 'Lord Shiva', association: 'Sun', image: '/home/rudrakhshas images/1Mukhi-150x150.webp' },
  { mukhi: 2, focus: 'harmony, partnership, and emotional balance', deity: 'Ardhanarishvara', association: 'Moon', image: '/home/rudrakhshas images/2Mukhi-150x150.webp' },
  { mukhi: 3, focus: 'confidence, release from past burden, and active energy', deity: 'Agni', association: 'Mars', image: '/home/rudrakhshas images/3Mukhi-150x150.webp' },
  { mukhi: 4, focus: 'learning, communication, and structured thinking', deity: 'Lord Brahma', association: 'Mercury', image: '/home/rudrakhshas images/4Mukhi-150x150.webp' },
  { mukhi: 5, focus: 'daily discipline, calmness, and regular spiritual practice', deity: 'Kalagni Rudra', association: 'Jupiter', image: '/home/rudrakhshas images/5Mukhi-150x150.webp' },
  { mukhi: 6, focus: 'discipline, courage, and self-control', deity: 'Kartikeya', association: 'Venus', image: '/home/rudrakhshas images/6Mukhi-150x150.webp' },
  { mukhi: 7, focus: 'stability, responsibility, and prosperity discipline', deity: 'Mahalakshmi', association: 'Saturn', image: '/home/rudrakhshas images/7Mukhi-150x150.webp' },
  { mukhi: 8, focus: 'obstacle clearing, resilience, and Rahu-related support', deity: 'Lord Ganesha', association: 'Rahu', image: '/home/rudrakhshas images/8Mukhi-150x150.webp' },
  { mukhi: 9, focus: 'strength, protection, and devotional energy', deity: 'Goddess Durga', association: 'Ketu', image: '/home/rudrakhshas images/9Mukhi-150x150.webp' },
  { mukhi: 10, focus: 'directional protection and steadiness during external pressure', deity: 'Lord Vishnu', association: 'All planets', image: '/home/rudrakhshas images/10Mukhi-150x150.webp' },
  { mukhi: 11, focus: 'discipline, courage, and devotional strength', deity: 'Ekadash Rudra', association: 'Meditative protection', image: '/home/rudrakhshas images/11Mukhi-150x150.webp' },
  { mukhi: 12, focus: 'radiance, authority, and self-belief', deity: 'Surya', association: 'Sun', image: '/home/rudrakhshas images/12Mukhi-150x150.webp' },
  { mukhi: 13, focus: 'attraction, refinement, and wish-fulfilment traditions', deity: 'Indra and Kamadeva', association: 'Venus', image: '/home/rudrakhshas images/13Mukhi-150x150.webp' },
  { mukhi: 14, focus: 'intuition, decision-making, and deep protection practice', deity: 'Lord Shiva', association: 'Saturn and Mars traditions', image: '/home/rudrakhshas images/14Mukhi-150x150.webp' },
  { mukhi: 15, focus: 'emotional healing, heart-led clarity, and steady devotion', deity: 'Pashupatinath', association: 'Inner balance', image: '/home/rudrakhshas images/15Mukhi--150x150.webp' },
  { mukhi: 16, focus: 'protection, courage, and resilience in difficult periods', deity: 'Mahamrityunjaya Shiva', association: 'Moon traditions', image: '/home/rudrakhshas images/16Mukhi rudraksha.webp' },
  { mukhi: 17, focus: 'prosperity, achievement, and long-range effort', deity: 'Vishwakarma', association: 'Material growth', image: '/home/rudrakhshas images/17Mukhi rudraksha.webp' },
  { mukhi: 18, focus: 'grounding, stability, and connection with the earth element', deity: 'Bhumi Devi', association: 'Earth element', image: '/home/rudrakhshas images/18Mukhi rudraksha.webp' },
  { mukhi: 19, focus: 'abundance, protection, and balanced leadership', deity: 'Lord Narayana', association: 'Prosperity traditions', image: '/home/rudrakhshas images/19Mukhi rudraksha.webp' },
  { mukhi: 20, focus: 'spiritual discipline, protection, and broad wisdom', deity: 'Brahma, Vishnu, and Mahesh', association: 'Higher guidance', image: '/home/rudrakhshas images/20Mukhi rudraksha.webp' },
  { mukhi: 21, focus: 'rare all-round spiritual and material prosperity traditions', deity: 'Kubera', association: 'Rare prosperity bead', image: '/home/rudrakhshas images/21Mukhi Rudraksha.webp' },
];

export const RUDRAKSHA_GUIDES: StaticKnowledgeGuide[] = rudrakshaSeeds.map((rudraksha) => ({
  title: `${rudraksha.mukhi} Mukhi Rudraksha Complete Guide`,
  shortTitle: `${rudraksha.mukhi} Mukhi Rudraksha`,
  slug: `${rudraksha.mukhi}-mukhi`,
  category: 'Rudraksha Guide',
  eyebrow: rudraksha.association,
  description: `A practical guide to ${rudraksha.mukhi} Mukhi Rudraksha, including traditional benefits, identification checks, wearing rules, quality notes, pricing factors, and shop links.`,
  heroImage: rudraksha.image,
  shopHref: `/shop/rudraksha/${rudraksha.mukhi}-mukhi`,
  parentHref: '/knowledge/rudraksha',
  parentLabel: 'Rudraksha Guides',
  readingTime: 5,
  updatedAt: '2026-05-06',
  stats: [
    { label: 'Mukhi', value: `${rudraksha.mukhi}` },
    { label: 'Tradition', value: rudraksha.deity },
    { label: 'Association', value: rudraksha.association },
    { label: 'Best use', value: 'Guided wearing' },
  ],
  intro: `${rudraksha.mukhi} Mukhi Rudraksha is traditionally selected for ${rudraksha.focus}. The bead should be chosen by natural mukhi lines, origin, condition, comfort, and certificate support rather than by appearance alone.`,
  vedicSignificance: `In Rudraksha tradition, ${rudraksha.mukhi} Mukhi is associated with ${rudraksha.deity}. It is commonly discussed for ${rudraksha.focus}. These associations are spiritual and traditional, so they should be treated as guidance rather than guaranteed outcomes.`,
  benefits: [
    `Traditionally used for ${rudraksha.focus}.`,
    'Helpful for devotees who want a specific mukhi-based wearing practice.',
    'Can be worn as a loose bead, bracelet, pendant, mala, or custom Rudraksha jewellery depending on comfort.',
    'Best purchased with clear origin, bead condition, and x-ray or lab verification for premium pieces.',
  ],
  whoShouldWear: [
    {
      title: 'Guided spiritual wearing',
      body: `Choose ${rudraksha.mukhi} Mukhi when a qualified guide or family tradition specifically recommends this mukhi for your practice.`,
    },
    {
      title: 'Daily discipline and comfort',
      body: 'The bead should be comfortable for daily wearing and should not interfere with work, hygiene, or personal obligations.',
    },
    {
      title: 'When to avoid rushing',
      body: 'Pause if the bead is very rare, unusually cheap, cracked, artificially altered, or sold without reliable mukhi verification.',
    },
  ],
  howToWear: [
    {
      title: 'Verify mukhi and condition',
      body: 'Count the natural mukhi lines from top to bottom. For rare or expensive beads, request x-ray or lab-backed confirmation before purchase.',
    },
    {
      title: 'Choose the wearing format',
      body: 'Select a pendant, bracelet, mala, or loose bead based on daily comfort. The bead should touch the body when the tradition requires it.',
    },
    {
      title: 'Energization and sankalp',
      body: 'If energization is requested, share the wearer name and sankalp details accurately. Keep expectations spiritual and devotional, not medical.',
    },
    {
      title: 'Care routine',
      body: 'Keep Rudraksha dry, avoid chemical exposure, wipe gently, and store separately. Ask for care guidance for silver, gold, or thread-mounted pieces.',
    },
  ],
  qualityPricing: [
    'Pricing depends on mukhi rarity, origin, size, shape, bead health, natural lines, and certificate confidence.',
    'Rare mukhi beads should be treated as verification-first purchases. Do not rely on photos alone.',
    'Surface cracks, filled lines, artificial carving, glued beads, and unclear origin reduce confidence and value.',
    'For daily wearing, comfort and authenticity are more important than buying the largest bead available.',
  ],
  expertCorner: `For ${rudraksha.mukhi} Mukhi Rudraksha, ask for clear photos of every side, origin notes, mukhi verification, and x-ray support when the value is high. A clean buying trail matters as much as the spiritual association.`,
  faqs: [
    {
      question: `What is ${rudraksha.mukhi} Mukhi Rudraksha used for?`,
      answer: `It is traditionally selected for ${rudraksha.focus}. Exact suitability depends on the wearer's purpose and guidance.`,
    },
    {
      question: 'Is x-ray certification required?',
      answer: 'For common low-value beads it may not always be necessary, but for rare or premium Rudraksha it is strongly recommended.',
    },
    {
      question: 'Can Rudraksha be worn daily?',
      answer: 'Many devotees wear Rudraksha daily. Keep it clean, avoid harsh chemicals, and follow the care instructions given with the bead.',
    },
    {
      question: 'Can I combine multiple mukhi beads?',
      answer: 'Yes, combinations are common, but they should be selected by purpose, tradition, comfort, and expert guidance.',
    },
  ],
}));

export const STATIC_GUIDE_PATHS = [
  ...NAVARATNA_GUIDES.map((guide) => `/knowledge/gemstones/${guide.slug}`),
  ...RUDRAKSHA_GUIDES.map((guide) => `/knowledge/rudraksha/${guide.slug}`),
];

export function getNavaratnaGuide(slug: string) {
  return NAVARATNA_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export function getRudrakshaGuide(slug: string) {
  const normalizedSlug = /^\d+$/.test(slug) ? `${slug}-mukhi` : slug;
  return RUDRAKSHA_GUIDES.find((guide) => guide.slug === normalizedSlug) ?? null;
}
