import { UPRATNA_STOREFRONT_SLUGS } from '@/lib/categories/canonical-storefront-path';
import { isRudrakshaMukhiSlug } from '@/lib/constants/rudraksha-subcategories';
import type { ShopCategoryPageContent, ShopCategorySectionKey } from '@/lib/types/shop-category-page';

export type CategoryHubProfile = 'gem' | 'rudraksha' | 'idol' | 'jewelry' | 'mala';

export type CategoryHubSectionDef = {
  key: ShopCategorySectionKey;
  field: keyof ShopCategoryPageContent;
  title: (label: string) => string;
};

const SECTION_FIELDS: Record<ShopCategorySectionKey, keyof ShopCategoryPageContent> = {
  about: 'about_html',
  'how-to-wear': 'how_to_wear_html',
  'who-should-wear': 'who_should_wear_html',
  benefits: 'benefits_html',
  types: 'types_html',
  'quality-price': 'quality_price_html',
  jewellery: 'jewellery_html',
  'cleaning-care': 'cleaning_care_html',
  'buyer-beware': 'buyer_beware_html',
  faqs: 'faqs',
};

function gemSections(): CategoryHubSectionDef[] {
  return [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'How To Wear' },
    { key: 'who-should-wear', field: 'who_should_wear_html', title: () => 'Who Should Wear' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Benefits' },
    { key: 'types', field: 'types_html', title: () => 'Types' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'jewellery', field: 'jewellery_html', title: () => 'Jewellery' },
    { key: 'cleaning-care', field: 'cleaning_care_html', title: () => 'Cleaning & Care' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ];
}

const PROFILE_SECTIONS: Record<CategoryHubProfile, CategoryHubSectionDef[]> = {
  gem: gemSections(),
  rudraksha: gemSections(),
  idol: [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Worship Significance' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'Placement & Puja' },
    { key: 'types', field: 'types_html', title: () => 'Materials & Types' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ],
  jewelry: [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Why Choose Our Jewellery' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'Wearing Guide' },
    { key: 'who-should-wear', field: 'who_should_wear_html', title: () => 'Who Is It For' },
    { key: 'types', field: 'types_html', title: () => 'Styles & Designs' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'cleaning-care', field: 'cleaning_care_html', title: () => 'Care & Maintenance' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ],
  mala: [
    { key: 'about', field: 'about_html', title: () => 'About' },
    { key: 'benefits', field: 'benefits_html', title: () => 'Benefits of Japa Mala' },
    { key: 'how-to-wear', field: 'how_to_wear_html', title: () => 'How To Use Your Mala' },
    { key: 'who-should-wear', field: 'who_should_wear_html', title: () => 'Who Is It For' },
    { key: 'types', field: 'types_html', title: () => 'Mala Types' },
    { key: 'quality-price', field: 'quality_price_html', title: () => 'Quality & Price' },
    { key: 'cleaning-care', field: 'cleaning_care_html', title: () => 'Care & Storage' },
    { key: 'buyer-beware', field: 'buyer_beware_html', title: () => 'Buyer Beware' },
  ],
};

export function resolveCategoryHubProfile(productCategory: string): CategoryHubProfile {
  switch (productCategory) {
    case 'idol':
      return 'idol';
    case 'jewelry':
      return 'jewelry';
    case 'rudraksha':
      return 'rudraksha';
    case 'mala':
      return 'mala';
    default:
      return 'gem';
  }
}

export function getCategoryHubSectionDefs(productCategory: string): CategoryHubSectionDef[] {
  return PROFILE_SECTIONS[resolveCategoryHubProfile(productCategory)];
}

const BLUE_SAPPHIRE_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Cornflower Blue Sapphire Stone',
  'how-to-wear': 'How To Wear Natural Blue Sapphire Stone',
  'who-should-wear': 'Who Should Wear a Natural Blue Sapphire Stone',
  benefits: 'Benefits of Original Natural Blue Sapphire Stone',
  types: 'Types of Cornflower Blue Sapphire Stone',
  'quality-price': 'Blue Sapphire Price for Natural Blue Sapphire Stone',
  jewellery: 'Types of Natural Blue Sapphire Stone Jewellery',
  'cleaning-care': 'Cleaning and Care for Natural Blue Sapphire Stone',
  'buyer-beware': 'Buyer Beware Guidelines for Original Natural Blue Sapphire Stone',
  faqs: 'Frequently Asked Questions about Natural Blue Sapphire Stone',
};

const EMERALD_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Natural Emerald Stone',
  'how-to-wear': 'How To Wear Natural Emerald Stone',
  'who-should-wear': 'Who Should Wear a Natural Emerald Stone',
  benefits: 'Benefits of Natural Emerald Stone',
  types: 'Types of Natural Emerald Stone',
  'quality-price': 'Emerald Stone Price and Quality',
  jewellery: 'Natural Emerald Stone Jewellery',
  'cleaning-care': 'Cleaning and Care for Natural Emerald Stone',
  'buyer-beware': 'Buyer Beware for Real Emerald Stone',
  faqs: 'Frequently Asked Questions about Emerald Stone',
};

const RUBY_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Natural Ruby Gemstone',
  'how-to-wear': 'How To Wear a Natural Ruby Gemstone',
  'who-should-wear': 'Who Should Wear a Natural Ruby Gemstone',
  benefits: 'Benefits of Natural Ruby Gemstone',
  types: 'Types of Natural Ruby Gemstone',
  'quality-price': 'Ruby Gemstone Price and Quality',
  jewellery: 'Natural Ruby Gemstone Jewellery',
  'cleaning-care': 'Cleaning and Care for Natural Ruby Gemstone',
  'buyer-beware': 'Buyer Beware for Natural Ruby Gemstone',
  faqs: 'Frequently Asked Questions about Ruby Gemstone',
};

const YELLOW_SAPPHIRE_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Natural Yellow Sapphire',
  'how-to-wear': 'How To Wear Natural Yellow Sapphire',
  'who-should-wear': 'Who Should Wear Natural Yellow Sapphire',
  benefits: 'Benefits of Natural Yellow Sapphire',
  types: 'Types of Yellow Sapphire Stone',
  'quality-price': 'Yellow Sapphire Price and Quality',
  jewellery: 'Natural Yellow Sapphire Jewellery',
  'cleaning-care': 'Cleaning and Care for Natural Yellow Sapphire',
  'buyer-beware': 'Buyer Beware for Yellow Sapphires for Sale',
  faqs: 'Frequently Asked Questions about Yellow Sapphire',
};

const WHITE_SAPPHIRE_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Natural White Sapphire',
  'how-to-wear': 'How To Wear Natural White Sapphire',
  'who-should-wear': 'Who Should Wear Natural White Sapphire',
  benefits: 'Benefits of Natural White Sapphire',
  types: 'Types of White Sapphire Stone',
  'quality-price': 'Natural White Sapphire Quality',
  jewellery: 'White Sapphire Gemstone Jewellery',
  'cleaning-care': 'Cleaning and Care for White Sapphire',
  'buyer-beware': 'Buyer Beware for Ceylon White Sapphire',
  faqs: 'Frequently Asked Questions about White Sapphire',
};

const CATSEYE_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Natural Catseye Gemstone',
  'how-to-wear': 'How To Wear a Catseye Gemstone',
  'who-should-wear': 'Who Should Wear a Catseye Gemstone',
  benefits: 'Benefits of Catseye Gemstone',
  types: 'Types of Catseye Gemstone',
  'quality-price': 'Catseye Gemstone Price and Quality',
  jewellery: 'Catseye Gemstone Jewellery',
  'cleaning-care': 'Cleaning and Care for Catseye Gemstone',
  'buyer-beware': 'Buyer Beware for Original Catseye Gemstone',
  faqs: 'Frequently Asked Questions about Catseye Gemstone',
};

const OPAL_HEADINGS: Partial<Record<ShopCategorySectionKey, string>> = {
  about: 'About Natural Opal Gemstone',
  'how-to-wear': 'How To Wear an Opal Gemstone',
  'who-should-wear': 'Who Should Wear an Opal Gemstone',
  benefits: 'Benefits of Opal Gemstone',
  types: 'Types of Opal Gemstone and Fire Opal',
  'quality-price': 'Opal Gemstone Price and Quality',
  jewellery: 'Opal Gemstone Jewellery',
  'cleaning-care': 'Cleaning and Care for Opal Gemstone',
  'buyer-beware': 'Buyer Beware for Opal Gemstone Lots',
  faqs: 'Frequently Asked Questions about Opal Gemstone',
};

function phraseHeadings(phrase: string): Partial<Record<ShopCategorySectionKey, string>> {
  return {
    about: `About ${phrase}`,
    'how-to-wear': `How To Wear ${phrase}`,
    'who-should-wear': `Who Should Wear ${phrase}`,
    benefits: `Benefits of ${phrase}`,
    types: `Types of ${phrase}`,
    'quality-price': `${phrase} Price and Quality`,
    jewellery: `${phrase} Jewellery`,
    'cleaning-care': `Cleaning and Care for ${phrase}`,
    'buyer-beware': `Buyer Beware for ${phrase}`,
    faqs: `Frequently Asked Questions about ${phrase}`,
  };
}

const PEARL_HEADINGS = phraseHeadings('Natural Pearl Gemstone');
const RED_CORAL_HEADINGS = phraseHeadings('Natural Red Coral Stone');
const DIAMOND_HEADINGS = phraseHeadings('Natural Diamond Gemstone');
const HESSONITE_HEADINGS = phraseHeadings('Natural Hessonite Stone');
const PITAMBARI_HEADINGS = phraseHeadings('Natural Pitambari Sapphire');
const EXCLUSIVE_GEMS_HEADINGS = phraseHeadings('Exclusive Gems');

export function categoryHubSeoHeadings(slug: string) {
  const map: Record<string, Partial<Record<ShopCategorySectionKey, string>>> = {
    'blue-sapphire': BLUE_SAPPHIRE_HEADINGS,
    emerald: EMERALD_HEADINGS,
    ruby: RUBY_HEADINGS,
    'yellow-sapphire': YELLOW_SAPPHIRE_HEADINGS,
    'white-sapphire': WHITE_SAPPHIRE_HEADINGS,
    'cats-eye': CATSEYE_HEADINGS,
    opal: OPAL_HEADINGS,
    pearl: PEARL_HEADINGS,
    'red-coral': RED_CORAL_HEADINGS,
    diamond: DIAMOND_HEADINGS,
    hessonite: HESSONITE_HEADINGS,
    pitambari: PITAMBARI_HEADINGS,
    'exclusive-gems': EXCLUSIVE_GEMS_HEADINGS,
  };
  const special: Record<string, string> = {
    'gauri-shankar': 'Gauri Shankar Rudraksha',
    'ganesh-rudraksha': 'Ganesh Rudraksha',
    'nir-mukhi': 'Nir Mukhi Rudraksha',
    'garbh-gauri': 'Garbh Gauri Rudraksha',
    'sawar-rudraksha': 'Sawar Rudraksha',
  };
  if (isRudrakshaMukhiSlug(slug)) {
    return phraseHeadings(`${slug.split('-')[0]} Mukhi Rudraksha`);
  }
  if (special[slug]) return phraseHeadings(special[slug]);
  if (UPRATNA_STOREFRONT_SLUGS.has(slug)) {
    return map[slug] ?? phraseHeadings(`Natural ${slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Gemstone`);
  }
  return map[slug] ?? null;
}

export function buildCategoryHubSections(page: ShopCategoryPageContent, displayLabel: string) {
  const seoHeadings = categoryHubSeoHeadings(page.slug);
  return getCategoryHubSectionDefs(page.product_category).map(({ key, field, title }) => ({
    id: key,
    title: title(displayLabel),
    heading: seoHeadings?.[key],
    html: page[field] as string | null | undefined,
  }));
}

export function getHowToStructuredDataMeta(page: ShopCategoryPageContent, displayLabel: string) {
  const profile = resolveCategoryHubProfile(page.product_category);
  switch (profile) {
    case 'idol':
      return {
        name: `Placement guide for ${displayLabel}`,
        description: `Traditional placement and puja guidance for ${displayLabel}`,
      };
    case 'jewelry':
      return {
        name: `Wearing guide for ${displayLabel}`,
        description: `Vedic wearing guidance for ${displayLabel}`,
      };
    case 'mala':
      return {
        name: `How to use ${displayLabel}`,
        description: `Japa mala usage guide for ${displayLabel}`,
      };
    default:
      return {
        name: `How to wear ${displayLabel}`,
        description: `Vedic wearing guide for ${displayLabel}`,
      };
  }
}

export { SECTION_FIELDS };
