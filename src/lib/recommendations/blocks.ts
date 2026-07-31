/**
 * Block document model for recommendation PDF reports.
 * Source of truth for editor, preview, public page, and PDF.
 */

export {
  BENEFIT_ICONS,
  BENEFIT_OPTIONS,
  type BenefitIcon,
  type BenefitOption,
} from '@/lib/recommendations/benefit-icons';
import type { BenefitIcon } from '@/lib/recommendations/benefit-icons';
import { DEFAULT_REPORT_LOGO } from '@/lib/recommendations/benefit-icons';

export type StoneRole = 'life' | 'lucky' | 'benefic' | 'marriage';

export const STONE_ROLE_LABELS: Record<StoneRole, string> = {
  life: 'Life Stone',
  lucky: 'Lucky Stone',
  benefic: 'Benefic Stone',
  marriage: 'Marriage Stone',
};

export type ProductRef = {
  productId: string | null;
  name: string;
  imageUrl: string | null;
  slug: string | null;
  priceLabel: string | null;
  origin: string | null;
  buyUrl: string | null;
};

export function emptyProductRef(): ProductRef {
  return {
    productId: null,
    name: '',
    imageUrl: null,
    slug: null,
    priceLabel: null,
    origin: null,
    buyUrl: null,
  };
}

export type StoneCard = {
  role: StoneRole;
  gemLabel: string;
  weight: string;
  product: ProductRef;
  benefits: BenefitIcon[];
  wearDay?: string;
  wearFinger?: string;
  metal?: string;
  wearDeity?: string;
};

export function emptyStoneCard(role: StoneRole = 'life'): StoneCard {
  return {
    role,
    gemLabel: '',
    weight: '',
    product: emptyProductRef(),
    benefits: [],
  };
}

export type ReportCustomer = {
  name: string;
  email: string;
  phone: string;
  dob: string;
  birthPlace: string;
  purpose: string;
  weightNote: string;
};

export function emptyCustomer(): ReportCustomer {
  return {
    name: '',
    email: '',
    phone: '',
    dob: '',
    birthPlace: '',
    purpose: 'General',
    weightNote: '',
  };
}

type BlockBase = { id: string };

export type HeaderBlock = BlockBase & {
  type: 'header';
  logoUrl: string | null;
  navLinks: string[];
};

export type GreetingBlock = BlockBase & {
  type: 'greeting';
  headline: string;
  subheadline: string;
};

export type CustomerDetailsBlock = BlockBase & {
  type: 'customerDetails';
};

export type NatalChartBlock = BlockBase & {
  type: 'natalChart';
  description: string;
  imageUrl: string | null;
};

export type PrimaryStoneBlock = BlockBase & {
  type: 'primaryStone';
  stone: StoneCard;
};

export type AdditionalStonesBlock = BlockBase & {
  type: 'additionalStones';
  stones: StoneCard[];
};

export type TierSlot = {
  label: string;
  product: ProductRef;
};

export type TieredProductsBlock = BlockBase & {
  type: 'tieredProducts';
  category: string;
  gemLabel: string;
  weight: string;
  endorsement: string;
  suggestedFor: string[];
  tiers: TierSlot[];
};

export type StoneGridBlock = BlockBase & {
  type: 'stoneGrid';
  stones: StoneCard[];
};

export type ConsultationCtaBlock = BlockBase & {
  type: 'consultationCta';
  title: string;
  priceLabel: string;
  buttonLabel: string;
  href: string;
};

export type WhyUsItem = { icon: string; text: string };

export type WhyUsBlock = BlockBase & {
  type: 'whyUs';
  title: string;
  items: WhyUsItem[];
};

export type FooterBlock = BlockBase & {
  type: 'footer';
  contact: string;
  address: string;
  note: string;
};

export type ReportBlock =
  | HeaderBlock
  | GreetingBlock
  | CustomerDetailsBlock
  | NatalChartBlock
  | PrimaryStoneBlock
  | AdditionalStonesBlock
  | TieredProductsBlock
  | StoneGridBlock
  | ConsultationCtaBlock
  | WhyUsBlock
  | FooterBlock;

export type ReportBlockType = ReportBlock['type'];

export const BLOCK_PALETTE: { type: ReportBlockType; label: string; description: string }[] = [
  { type: 'header', label: 'Header', description: 'Logo and nav links' },
  { type: 'greeting', label: 'Greeting', description: 'Hi name + headline' },
  { type: 'customerDetails', label: 'Customer Details', description: 'Birth / contact grid' },
  { type: 'natalChart', label: 'Natal Birth Chart', description: 'Copy + kundli image' },
  { type: 'primaryStone', label: 'Primary Stone', description: 'Life stone + product + benefits' },
  { type: 'additionalStones', label: 'Additional Stones', description: '2–3 helpful gemstones' },
  { type: 'tieredProducts', label: 'Tiered Products', description: 'Tight / Value / Best Effects' },
  { type: 'stoneGrid', label: 'Stone Grid', description: '3-up wear details cards' },
  { type: 'consultationCta', label: 'Consultation CTA', description: 'Phone consult banner' },
  { type: 'whyUs', label: 'Why Us', description: 'Trust points grid' },
  { type: 'footer', label: 'Footer', description: 'Contact and note' },
];

export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyBlock(type: ReportBlockType): ReportBlock {
  const id = newBlockId();
  switch (type) {
    case 'header':
      return { id, type, logoUrl: DEFAULT_REPORT_LOGO, navLinks: ['GEMSTONES', 'JEWELLERY', 'GEM RECOMMENDATION'] };
    case 'greeting':
      return {
        id,
        type,
        headline: '{gem} is the perfect gemstone for your Life',
        subheadline: '{secondary} are also helpful',
      };
    case 'customerDetails':
      return { id, type };
    case 'natalChart':
      return {
        id,
        type,
        description:
          'Vedic astrology (Jyotisha) studies planetary positions at birth. Natural gemstones are used as remedial measures to strengthen beneficial planets.',
        imageUrl: null,
      };
    case 'primaryStone':
      return {
        id,
        type,
        stone: {
          ...emptyStoneCard('life'),
          gemLabel: 'Yellow Sapphire (Pukhraj)',
          weight: '7.92 + CARAT',
          benefits: ['Health', 'Life Longevity', 'Standard of Living', 'Mental Strength'],
        },
      };
    case 'additionalStones':
      return {
        id,
        type,
        stones: [
          {
            ...emptyStoneCard('benefic'),
            gemLabel: 'Red Coral (Moonga)',
            weight: '9.5 + CARAT',
            benefits: ['Luck', 'Success', 'Financial Prosperity', 'Education'],
          },
          {
            ...emptyStoneCard('lucky'),
            gemLabel: 'Pearl (Moti)',
            weight: '9.5 + CARAT',
            benefits: ['Luck', 'Success', 'Financial Prosperity', 'Education'],
          },
        ],
      };
    case 'tieredProducts':
      return {
        id,
        type,
        category: 'Life Stone',
        gemLabel: 'Pearl (Moti)',
        weight: '10.4 carat',
        endorsement: 'STRONGLY RECOMMENDED',
        suggestedFor: ['HEALTH', 'LIFE LONGEVITY', 'STANDARD OF LIVING', 'PROTECTION'],
        tiers: [
          { label: 'Tight Budget', product: emptyProductRef() },
          { label: 'Value for Money', product: emptyProductRef() },
          { label: 'Best Effects', product: emptyProductRef() },
        ],
      };
    case 'stoneGrid':
      return {
        id,
        type,
        stones: [
          {
            ...emptyStoneCard('lucky'),
            gemLabel: 'Ruby',
            weight: '3 - 4.25',
            wearDay: 'Sunday',
            wearFinger: 'Ring',
            metal: 'Gold',
            wearDeity: 'Sun',
          },
          {
            ...emptyStoneCard('life'),
            gemLabel: 'Yellow Sapphire (Pukhraj)',
            weight: '4 - 5.25',
            wearDay: 'Thursday',
            wearFinger: 'Index',
            metal: 'Gold',
            wearDeity: 'Jupiter',
          },
          {
            ...emptyStoneCard('benefic'),
            gemLabel: 'Coral (Moonga)',
            weight: '6 - 10.25',
            wearDay: 'Tuesday',
            wearFinger: 'Ring',
            metal: 'Gold',
            wearDeity: 'Mars',
          },
        ],
      };
    case 'consultationCta':
      return {
        id,
        type,
        title: 'PHONE CONSULTATION WITH EXPERT ASTROLOGER',
        priceLabel: '₹ 2100',
        buttonLabel: 'BOOK AN APPOINTMENT',
        href: '/consultations',
      };
    case 'whyUs':
      return {
        id,
        type,
        title: 'Why Us',
        items: [
          { icon: 'gem', text: 'Pure, Natural Gemstones' },
          { icon: 'lab', text: 'Laboratory Certified for Quality and Authenticity' },
          { icon: 'ship', text: 'Worldwide Shipping' },
          { icon: 'ring', text: 'Customized Jewelry Created Just for you' },
        ],
      };
    case 'footer':
      return {
        id,
        type,
        contact: '+91 98715-82404',
        address: 'Karol Bagh, New Delhi',
        note: '© All Rights Reserved — PureVedicGems',
      };
  }
}

export type TemplateId = 'gempundit-classic' | 'blank';

export function buildGempunditClassicBlocks(): ReportBlock[] {
  return [
    createEmptyBlock('header'),
    {
      ...createEmptyBlock('greeting'),
      headline: 'Yellow Sapphire (Pukhraj) is the perfect gemstone for your Life',
      subheadline: 'Red Coral (Moonga) & Pearl (Moti) are also helpful',
    } as GreetingBlock,
    createEmptyBlock('customerDetails'),
    createEmptyBlock('natalChart'),
    createEmptyBlock('primaryStone'),
    createEmptyBlock('additionalStones'),
    createEmptyBlock('consultationCta'),
    createEmptyBlock('footer'),
  ];
}

export function blocksForTemplate(template: TemplateId): ReportBlock[] {
  if (template === 'gempundit-classic') return buildGempunditClassicBlocks();
  return [createEmptyBlock('header'), createEmptyBlock('greeting'), createEmptyBlock('customerDetails')];
}

/** ponytail: one assert-style check that fails if template shape drifts */
export function assertGempunditClassicShape(blocks: ReportBlock[]): void {
  const types = blocks.map((b) => b.type);
  const required: ReportBlockType[] = [
    'header',
    'greeting',
    'customerDetails',
    'natalChart',
    'primaryStone',
    'additionalStones',
  ];
  for (const t of required) {
    if (!types.includes(t)) throw new Error(`gempundit-classic missing block: ${t}`);
  }
}

if (process.env.NODE_ENV !== 'production') {
  try {
    assertGempunditClassicShape(buildGempunditClassicBlocks());
  } catch (e) {
    console.error('[recommendations] template self-check failed', e);
  }
}
