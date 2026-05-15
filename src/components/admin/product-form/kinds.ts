/**
 * Per-kind configuration for the dedicated product creation flows.
 *
 * Each "kind" corresponds to one focused product type with its own
 * sub-category list, default category, default product_type, and
 * which form sections are relevant.
 *
 * Sub-category lists are derived from the WooCommerce product export
 * (wc-product-export-20-3-2026...) and the legacy purevedicgems.in/.com
 * navratna/upratna/rudraksha/idol/jewellery sections.
 */

export type FormKind = 'navratna' | 'upratna' | 'rudraksha' | 'idol' | 'jewellery';

export type SectionKey =
  | 'basic'
  | 'gemstone'
  | 'rudraksha'
  | 'idol'
  | 'jewellery'
  | 'pricing'
  | 'vedic'
  | 'media'
  | 'seo';

export type KindConfig = {
  kind: FormKind;
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
  accent: 'amber' | 'orange' | 'emerald' | 'violet' | 'rose';
  /** Maps to PRODUCT_CATEGORIES enum value. */
  category: 'navaratna' | 'upratna' | 'rudraksha' | 'idol' | 'jewelry';
  /** Maps to PRODUCT_TYPES enum value. */
  productType: 'gemstone' | 'rudraksha' | 'idol' | 'jewelry';
  /** Ordered list of step keys to render for this kind. */
  steps: SectionKey[];
  /** Predefined sub-category options for this kind. */
  subCategories: { value: string; label: string }[];
  /** Default treatment / finish value. */
  defaultTreatment: string;
  /** Per-kind suggested keywords for SEO bootstrapping. */
  seoStarterKeywords: string[];
  /** Per-kind suggested FAQ prompts. */
  faqStarters: string[];
};

/** Standard 5-step layout for tangible products. */
const GEM_STEPS: SectionKey[] = ['basic', 'gemstone', 'pricing', 'vedic', 'media', 'seo'];
const RUDRAKSHA_STEPS: SectionKey[] = ['basic', 'rudraksha', 'pricing', 'vedic', 'media', 'seo'];
const IDOL_STEPS: SectionKey[] = ['basic', 'idol', 'pricing', 'vedic', 'media', 'seo'];
const JEWELLERY_STEPS: SectionKey[] = ['basic', 'jewellery', 'pricing', 'vedic', 'media', 'seo'];

export const NAVRATNA_SUB_CATEGORIES = [
  { value: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)' },
  { value: 'blue-sapphire', label: 'Blue Sapphire (Neelam)' },
  { value: 'ruby', label: 'Ruby (Manik)' },
  { value: 'emerald', label: 'Emerald (Panna)' },
  { value: 'red-coral', label: 'Red Coral (Moonga)' },
  { value: 'hessonite', label: 'Hessonite (Gomed)' },
  { value: 'pearl', label: 'Pearl (Moti)' },
  { value: 'cats-eye', label: "Cat's Eye (Lehsunia)" },
  { value: 'diamond', label: 'Diamond (Heera)' },
  { value: 'white-sapphire', label: 'White Sapphire (Safed Pukhraj)' },
  { value: 'pitambari', label: 'Pitambari Neelam' },
];

export const UPRATNA_SUB_CATEGORIES = [
  { value: 'opal', label: 'Opal (Australian)' },
  { value: 'turquoise', label: 'Turquoise (Firoza)' },
  { value: 'amethyst', label: 'Amethyst (Katela / Jamunia)' },
  { value: 'moonstone', label: 'Moonstone (Chandrakant)' },
  { value: 'garnet', label: 'Garnet' },
  { value: 'peridot', label: 'Peridot (Zabarjad)' },
  { value: 'tanzanite', label: 'Tanzanite' },
  { value: 'lapis-lazuli', label: 'Lapis Lazuli (Lajward)' },
  { value: 'citrine', label: 'Citrine / Golden Topaz (Sunela)' },
  { value: 'aquamarine', label: 'Aquamarine (Beruj)' },
  { value: 'blue-topaz', label: 'Blue Topaz' },
  { value: 'white-topaz', label: 'White Topaz' },
  { value: 'zircon', label: 'Zircon' },
  { value: 'iolite', label: 'Iolite (Neeli)' },
  { value: 'tourmaline', label: 'Tourmaline' },
  { value: 'diopside', label: 'Diopside' },
  { value: 'malachite', label: 'Malachite' },
  { value: 'tiger-eye', label: 'Tiger Eye' },
  { value: 'kyanite', label: 'Kyanite' },
  { value: 'sunstone', label: 'Sunstone' },
  { value: 'hakik', label: 'Hakik (Agate)' },
  { value: 'white-coral', label: 'White Coral' },
  { value: 'spinel', label: 'Spinel' },
  { value: 'chrysoberyl', label: 'Chrysoberyl' },
];

export const RUDRAKSHA_SUB_CATEGORIES = [
  ...Array.from({ length: 21 }, (_, i) => ({
    value: `${i + 1}-mukhi`,
    label: `${i + 1} Mukhi Rudraksha`,
  })),
  { value: 'gauri-shankar', label: 'Gauri Shankar Rudraksha' },
  { value: 'ganesh-rudraksha', label: 'Ganesh Rudraksha' },
  { value: 'savar-rudraksha', label: 'Savar Rudraksha' },
  { value: 'trijuti-rudraksha', label: 'Trijuti Rudraksha' },
  { value: 'indrakshi-mala', label: 'Indrakshi Mala' },
  { value: 'rudraksha-mala', label: 'Rudraksha Mala (108+1)' },
  { value: 'siddha-mala', label: 'Siddha Mala' },
];

export const IDOL_SUB_CATEGORIES = [
  { value: 'shree-yantra', label: 'Shree Yantra' },
  { value: 'ganesha', label: 'Ganesha Idol' },
  { value: 'lakshmi', label: 'Lakshmi Idol' },
  { value: 'durga-devi', label: 'Durga Devi' },
  { value: 'hanuman', label: 'Hanuman' },
  { value: 'shiv-ji', label: 'Shiva Idol' },
  { value: 'shivling', label: 'Shivling' },
  { value: 'nandi', label: 'Nandi' },
  { value: 'krishna', label: 'Krishna' },
  { value: 'ram-darbar', label: 'Ram Darbar' },
  { value: 'kuber', label: 'Kuber Idol' },
  { value: 'saraswati', label: 'Saraswati Idol' },
  { value: 'sai-baba', label: 'Sai Baba Idol' },
  { value: 'narmada-shivling', label: 'Narmadeshwar Shivling' },
  { value: 'other-idol', label: 'Other Idol / Yantra' },
];

export const JEWELLERY_SUB_CATEGORIES = [
  { value: 'ring', label: 'Ring' },
  { value: 'pendant', label: 'Pendant' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'earring', label: 'Earrings' },
  { value: 'malas', label: 'Mala (Wearable)' },
  { value: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas' },
  { value: 'rudraksha-jewelry', label: 'Ready Rudraksha Jewellery' },
  { value: 'diamond-jewellery', label: 'Diamond Jewellery' },
  { value: 'astro-gems-stock', label: 'Ready Astro-Gems Setting' },
  { value: 'custom-design', label: 'Custom Design' },
];

export const KIND_CONFIGS: Record<FormKind, KindConfig> = {
  navratna: {
    kind: 'navratna',
    label: 'Navratna Gemstone',
    shortLabel: 'Navratna',
    description: 'Sacred nine astrological gemstones (Ruby, Pearl, Coral, Emerald, Yellow Sapphire, Diamond, Blue Sapphire, Hessonite, Cat\'s Eye).',
    emoji: '💎',
    accent: 'amber',
    category: 'navaratna',
    productType: 'gemstone',
    steps: GEM_STEPS,
    subCategories: NAVRATNA_SUB_CATEGORIES,
    defaultTreatment: 'Natural',
    seoStarterKeywords: ['natural gemstone', 'astrologically approved', 'jyotish standard', 'vedic gemstone', 'energized'],
    faqStarters: [
      'Is this gemstone 100% natural and untreated?',
      'Which planet does this gemstone represent?',
      'How should this gemstone be worn for astrological benefits?',
      'Is a lab certificate included with this gemstone?',
    ],
  },
  upratna: {
    kind: 'upratna',
    label: 'Upratna Gemstone',
    shortLabel: 'Upratna',
    description: 'Semi-precious astrological gemstones used as affordable substitutes for the Navratnas (Opal, Tanzanite, Amethyst, Citrine, Topaz, Garnet, Peridot, etc.).',
    emoji: '✨',
    accent: 'rose',
    category: 'upratna',
    productType: 'gemstone',
    steps: GEM_STEPS,
    subCategories: UPRATNA_SUB_CATEGORIES,
    defaultTreatment: 'Natural',
    seoStarterKeywords: ['semi-precious gemstone', 'upratna', 'astrological substitute', 'vedic gemstone', 'natural untreated'],
    faqStarters: [
      'Which Navratna does this Upratna substitute?',
      'What planetary energy does this stone carry?',
      'How is the quality and authenticity verified?',
      'Can this gem be set in a ring or pendant?',
    ],
  },
  rudraksha: {
    kind: 'rudraksha',
    label: 'Rudraksha',
    shortLabel: 'Rudraksha',
    description: 'Sacred beads from Elaeocarpus ganitrus — 1 to 21 mukhi, Gauri Shankar, Ganesh, Savar, Trijuti, and complete malas. Origin Nepali / Indonesian / Java.',
    emoji: '🟤',
    accent: 'orange',
    category: 'rudraksha',
    productType: 'rudraksha',
    steps: RUDRAKSHA_STEPS,
    subCategories: RUDRAKSHA_SUB_CATEGORIES,
    defaultTreatment: 'none',
    seoStarterKeywords: ['rudraksha bead', 'natural rudraksha', 'mukhi rudraksha', 'energized rudraksha', 'nepali rudraksha'],
    faqStarters: [
      'Is this Rudraksha X-ray certified and authentic?',
      'Which mukhi (face) is this Rudraksha, and what does it signify?',
      'Which deity rules this Rudraksha?',
      'How should this Rudraksha be energized and worn?',
    ],
  },
  idol: {
    kind: 'idol',
    label: 'Spiritual Idol',
    shortLabel: 'Idols',
    description: 'Vedic idols, yantras, and shivlings for puja and temple — Ganesha, Lakshmi, Shiva, Durga, Sai Baba, Shree Yantra, Narmadeshwar Shivling, and more.',
    emoji: '🕉',
    accent: 'violet',
    category: 'idol',
    productType: 'idol',
    steps: IDOL_STEPS,
    subCategories: IDOL_SUB_CATEGORIES,
    defaultTreatment: 'none',
    seoStarterKeywords: ['vedic idol', 'puja idol', 'panchdhatu idol', 'temple decor', 'energized murti'],
    faqStarters: [
      'Which deity does this idol represent and what are its benefits?',
      'What material / metal is this idol made of?',
      'Has this idol been energized (Pran Pratishta)?',
      'What are the dimensions and weight of this idol?',
    ],
  },
  jewellery: {
    kind: 'jewellery',
    label: 'Vedic Jewellery',
    shortLabel: 'Jewellery',
    description: 'Rings, pendants, bracelets, necklaces, earrings, and malas in gold, silver, panchdhatu, or copper — including ready astro-gem settings and custom designs.',
    emoji: '💍',
    accent: 'emerald',
    category: 'jewelry',
    productType: 'jewelry',
    steps: JEWELLERY_STEPS,
    subCategories: JEWELLERY_SUB_CATEGORIES,
    defaultTreatment: 'none',
    seoStarterKeywords: ['astrological jewellery', 'vedic jewellery', 'gemstone ring', 'panchdhatu pendant', 'silver mala'],
    faqStarters: [
      'What metal and purity is this jewellery made of?',
      'Is a gemstone set in this design, and is the gem certified?',
      'How is the ring size adjusted or customized?',
      'How long does delivery / making take for this piece?',
    ],
  },
};

export const KIND_ORDER: FormKind[] = ['navratna', 'upratna', 'rudraksha', 'idol', 'jewellery'];

/** Detect the appropriate form kind from a loaded product record (for edit page). */
export function detectKindFromProduct(p: { category?: string | null; product_type?: string | null }): FormKind {
  const cat = p.category ?? '';
  const pt = p.product_type ?? '';
  if (cat === 'navaratna') return 'navratna';
  if (cat === 'upratna') return 'upratna';
  if (cat === 'rudraksha' || pt === 'rudraksha') return 'rudraksha';
  if (cat === 'idol' || pt === 'idol') return 'idol';
  if (cat === 'jewelry' || cat === 'mala' || pt === 'jewelry' || pt === 'mala') return 'jewellery';
  // Default fallback — most legacy gemstones land here.
  return 'navratna';
}

/** UI accent classes per kind. */
export function accentClasses(accent: KindConfig['accent']) {
  const map = {
    amber: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'hover:border-amber-300 hover:bg-amber-50/60',
      solid: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    orange: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      ring: 'hover:border-orange-300 hover:bg-orange-50/60',
      solid: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    emerald: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'hover:border-emerald-300 hover:bg-emerald-50/60',
      solid: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    violet: {
      border: 'border-violet-200',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      ring: 'hover:border-violet-300 hover:bg-violet-50/60',
      solid: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    rose: {
      border: 'border-rose-200',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      ring: 'hover:border-rose-300 hover:bg-rose-50/60',
      solid: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
  } as const;
  return map[accent];
}

// ── Static option lists (shared across all kinds) ──────────────────
export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export const SHAPES = ['Round', 'Oval', 'Cushion', 'Emerald Cut', 'Pear', 'Heart', 'Marquise', 'Princess', 'Octagonal', 'Triangular', 'Cabochon', 'Mixed'] as const;
export const CERTIFICATIONS = ['IGI', 'IGI-GTL Delhi', 'GTL Jaipur', 'GIA', 'GJEPC', 'IIGJ', 'GRS', 'Gübelin', 'SSEF', 'AGL', 'HRD Antwerp', 'GII', 'GFCO', 'None'] as const;
export const QUALITIES = ['Economy', 'Good', 'Premium', 'Luxury', 'Super Luxury', 'Collector'] as const;
export const GEM_TREATMENTS = ['Natural', 'Unheated', 'Heated', 'Minor Oil', 'No Oil', 'No Treatment', 'None'] as const;
export const METALS = ['Gold 22K', 'Gold 18K', 'Gold 14K', 'Silver 925', 'Platinum', 'Panchdhatu', 'Ashtadhatu', 'Copper (Tamba)', 'Brass'] as const;
export const ORIGINS = [
  'Ceylon (Sri Lanka)',
  'Burma (Myanmar)',
  'Kashmir',
  'Colombia',
  'Zambia',
  'Madagascar',
  'Thailand',
  'Brazil',
  'Italy',
  'Australia',
  'India',
  'Nepal',
  'Tanzania',
  'Japan',
  'Afghanistan',
  'Russia',
  'Ethiopia',
  'Mozambique',
] as const;
export const RUDRAKSHA_ORIGINS = ['Nepal', 'Indonesia', 'Java (Indonesia)', 'India', 'Collector Grade'] as const;
export const RUDRAKSHA_TYPES = ['Nepali Round', 'Nepali Oval', 'Indonesian', 'Java', 'Collector', 'Gauri Shankar', 'Ganesh', 'Savar', 'Trijuti'] as const;
export const IDOL_COMPOSITIONS = ['Brass', 'Copper (Tamba)', 'Panchdhatu', 'Ashtadhatu', 'Silver 925', 'Crystal', 'Marble', 'Gemstone', 'Wood', 'Narmada Stone'] as const;
export const JEWELLERY_TYPE_OPTS = [
  { value: 'ring', label: 'Ring' },
  { value: 'pendant', label: 'Pendant' },
  { value: 'bracelet', label: 'Bracelet' },
  { value: 'necklace', label: 'Necklace' },
  { value: 'earring', label: 'Earrings' },
  { value: 'mala', label: 'Mala' },
  { value: 'ready_stock', label: 'Ready Stock Setting' },
  { value: 'custom', label: 'Custom Design' },
];
export const RING_SIZE_SYSTEM_OPTS = [
  { value: 'india', label: 'India' },
  { value: 'us', label: 'US' },
  { value: 'uk_au', label: 'UK / Australia' },
  { value: 'eu', label: 'Europe' },
];
export const TARGET_GEO_OPTIONS = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' },
  { value: 'NP', label: 'Nepal' },
  { value: 'GLOBAL', label: 'Global / Worldwide' },
];
export const SCHEMA_TYPE_OPTIONS = [
  { value: 'Product', label: 'Product (default)' },
  { value: 'IndividualProduct', label: 'IndividualProduct (one-of-a-kind)' },
  { value: 'ProductGroup', label: 'ProductGroup (variants)' },
];
