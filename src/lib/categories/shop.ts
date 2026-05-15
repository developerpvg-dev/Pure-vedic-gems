import { createOptionalPublicClient } from '@/lib/supabase/public';
import { getSeoLandingPageBySlug, SEO_LANDING_PAGES, type SeoLandingPage } from '@/lib/constants/seo-landing-pages';
import {
  catalogFamilyToStorefrontGroupSlug,
  normalizeStorefrontGroupSlug,
  storefrontGroupHref,
  storefrontSubcategoryHref,
  type CatalogFamily,
  type StorefrontCategoryGroupSlug,
} from '@/lib/categories/storefront';

export type BaseShopCategory = {
  category?: string;
  label: string;
  desc: string;
  canonicalPath: string;
  directorsPick?: boolean;
};

export const BASE_CATEGORY_MAP: Record<string, BaseShopCategory> = {
  gemstones: {
    category: 'gemstone',
    label: 'Gemstones',
    desc: 'Certified natural gemstones from premium origins worldwide. Each stone ethically sourced and laboratory verified.',
    canonicalPath: '/shop/gemstones',
  },
  navaratna: {
    category: 'navaratna',
    label: 'Navaratna - Sacred Nine Gems',
    desc: 'The nine sacred Navaratna gems aligned with the nine planets. Each carries unique cosmic energy for Vedic healing.',
    canonicalPath: '/shop/navaratna',
  },
  navratna: {
    category: 'navaratna',
    label: 'Navaratna - Sacred Nine Gems',
    desc: 'The nine sacred Navaratna gems aligned with the nine planets. Each carries unique cosmic energy for Vedic healing.',
    canonicalPath: '/shop/navaratna',
  },
  upratna: {
    category: 'upratna',
    label: 'Upratna - Semi-Precious Gems',
    desc: 'Semi-precious Vedic gemstones - affordable alternatives with powerful planetary benefits.',
    canonicalPath: '/shop/upratna',
  },
  rudraksha: {
    category: 'rudraksha',
    label: 'Rudraksha',
    desc: 'Sacred Rudraksha beads from Nepal and India. Each bead energized with Vedic mantras for maximum efficacy.',
    canonicalPath: '/shop/rudraksha',
  },
  jewelry: {
    category: 'jewelry',
    label: 'Jewelry',
    desc: 'Handcrafted gemstone jewelry in gold, silver and Panchdhatu. Custom settings available.',
    canonicalPath: '/shop/jewelry',
  },
  jewellery: {
    category: 'jewelry',
    label: 'Jewelry',
    desc: 'Handcrafted gemstone jewelry in gold, silver and Panchdhatu. Custom settings available.',
    canonicalPath: '/shop/jewelry',
  },
  malas: {
    category: 'mala',
    label: 'Malas',
    desc: 'Sacred malas of Rudraksha, crystals and gemstones for japa meditation and spiritual practice.',
    canonicalPath: '/shop/malas',
  },
  mala: {
    category: 'mala',
    label: 'Malas',
    desc: 'Sacred malas of Rudraksha, crystals and gemstones for japa meditation and spiritual practice.',
    canonicalPath: '/shop/malas',
  },
  idols: {
    category: 'idol',
    label: 'Spiritual Idols',
    desc: 'Handcrafted deities, Shree Yantras and temple accessories blessed by our priests.',
    canonicalPath: '/shop/idols',
  },
  idol: {
    category: 'idol',
    label: 'Spiritual Idols',
    desc: 'Handcrafted deities, Shree Yantras and temple accessories blessed by our priests.',
    canonicalPath: '/shop/idols',
  },
  'directors-pick': {
    label: "Director's Pick",
    desc: 'Curated gemstones and spiritual pieces selected by the PureVedicGems director for priority styling and consultation.',
    canonicalPath: '/shop/directors-pick',
    directorsPick: true,
  },
};

export const KNOWN_GEM_SUBCATEGORIES: Record<string, { category: 'navaratna' | 'upratna'; label: string; desc: string }> = {
  ruby: { category: 'navaratna', label: 'Ruby (Manik)', desc: 'Natural Ruby gemstones for Surya, with certified options and expert Jyotish guidance.' },
  pearl: { category: 'navaratna', label: 'Pearl (Moti)', desc: 'Natural Pearl gemstones for Chandra, including traditional Vedic wearing support.' },
  'red-coral': { category: 'navaratna', label: 'Red Coral (Moonga)', desc: 'Natural Red Coral gemstones for Mangal, sourced and disclosed with care.' },
  emerald: { category: 'navaratna', label: 'Emerald (Panna)', desc: 'Certified Emerald gemstones for Budh, with origin and treatment transparency.' },
  'yellow-sapphire': { category: 'navaratna', label: 'Yellow Sapphire (Pukhraj)', desc: 'Certified Yellow Sapphire gemstones for Guru, curated for Jyotish suitability.' },
  diamond: { category: 'navaratna', label: 'Diamond (Heera)', desc: 'Diamond and Venus-aligned gemstone options from PureVedicGems.' },
  'blue-sapphire': { category: 'navaratna', label: 'Blue Sapphire (Neelam)', desc: 'Certified Blue Sapphire gemstones for Shani, with expert consultation recommended.' },
  hessonite: { category: 'navaratna', label: 'Hessonite (Gomed)', desc: 'Natural Hessonite gemstones for Rahu, with lab and origin disclosure where available.' },
  'cats-eye': { category: 'navaratna', label: "Cat's Eye (Lehsunia)", desc: 'Natural Cat Eye gemstones for Ketu, selected with careful Jyotish guidance.' },
  amethyst: { category: 'upratna', label: 'Amethyst', desc: 'Semi-precious Amethyst gemstones and Vedic alternatives.' },
  'lapis-lazuli': { category: 'upratna', label: 'Lapis Lazuli', desc: 'Semi-precious Lapis Lazuli gemstones and spiritual jewellery options.' },
  moonstone: { category: 'upratna', label: 'Moonstone', desc: 'Moonstone gemstones and Chandra-aligned semi-precious alternatives.' },
  peridot: { category: 'upratna', label: 'Peridot', desc: 'Natural Peridot semi-precious gemstones.' },
  'rose-quartz': { category: 'upratna', label: 'Rose Quartz', desc: 'Rose Quartz gemstones for gentle spiritual and jewellery use.' },
  citrine: { category: 'upratna', label: 'Citrine', desc: 'Citrine semi-precious gemstones and Jupiter-aligned alternatives.' },
  garnet: { category: 'upratna', label: 'Garnet', desc: 'Garnet semi-precious gemstones and traditional alternatives.' },
  turquoise: { category: 'upratna', label: 'Turquoise (Firoza)', desc: 'Turquoise semi-precious gemstones and Vedic jewellery options.' },
  aquamarine: { category: 'upratna', label: 'Aquamarine', desc: 'Aquamarine semi-precious gemstones.' },
  'tiger-eye': { category: 'upratna', label: 'Tiger Eye', desc: 'Tiger Eye semi-precious gemstones and bracelets.' },
  malachite: { category: 'upratna', label: 'Malachite', desc: 'Malachite semi-precious gemstones and spiritual accessories.' },
  opal: { category: 'upratna', label: 'Opal', desc: 'Opal semi-precious gemstones and Venus-aligned alternatives.' },
  'white-sapphire': { category: 'upratna', label: 'White Sapphire', desc: 'White Sapphire semi-precious alternatives and certified gemstone options.' },
  tanzanite: { category: 'upratna', label: 'Tanzanite', desc: 'Tanzanite semi-precious gemstones and Vedic alternatives.' },
};

export const KNOWN_CATALOG_SUBCATEGORIES: Record<string, { category: 'rudraksha' | 'idol' | 'jewelry' | 'mala'; label: string }> = {
  '1-mukhi': { category: 'rudraksha', label: '1 Mukhi Rudraksha' },
  '2-mukhi': { category: 'rudraksha', label: '2 Mukhi Rudraksha' },
  '3-mukhi': { category: 'rudraksha', label: '3 Mukhi Rudraksha' },
  '4-mukhi': { category: 'rudraksha', label: '4 Mukhi Rudraksha' },
  '5-mukhi': { category: 'rudraksha', label: '5 Mukhi Rudraksha' },
  '6-mukhi': { category: 'rudraksha', label: '6 Mukhi Rudraksha' },
  '7-mukhi': { category: 'rudraksha', label: '7 Mukhi Rudraksha' },
  '8-mukhi': { category: 'rudraksha', label: '8 Mukhi Rudraksha' },
  '9-mukhi': { category: 'rudraksha', label: '9 Mukhi Rudraksha' },
  '10-mukhi': { category: 'rudraksha', label: '10 Mukhi Rudraksha' },
  '11-mukhi': { category: 'rudraksha', label: '11 Mukhi Rudraksha' },
  '12-mukhi': { category: 'rudraksha', label: '12 Mukhi Rudraksha' },
  '13-mukhi': { category: 'rudraksha', label: '13 Mukhi Rudraksha' },
  '14-mukhi': { category: 'rudraksha', label: '14 Mukhi Rudraksha' },
  '15-mukhi': { category: 'rudraksha', label: '15 Mukhi Rudraksha' },
  '16-mukhi': { category: 'rudraksha', label: '16 Mukhi Rudraksha' },
  '17-mukhi': { category: 'rudraksha', label: '17 Mukhi Rudraksha' },
  '18-mukhi': { category: 'rudraksha', label: '18 Mukhi Rudraksha' },
  '19-mukhi': { category: 'rudraksha', label: '19 Mukhi Rudraksha' },
  '20-mukhi': { category: 'rudraksha', label: '20 Mukhi Rudraksha' },
  '21-mukhi': { category: 'rudraksha', label: '21 Mukhi Rudraksha' },
  'gauri-shankar': { category: 'rudraksha', label: 'Gauri Shankar Rudraksha' },
  'ganesh-rudraksha': { category: 'rudraksha', label: 'Ganesh Rudraksha' },
  'shree-yantra': { category: 'idol', label: 'Shree Yantra' },
  'durga-devi': { category: 'idol', label: 'Durga Devi' },
  hanuman: { category: 'idol', label: 'Hanuman' },
  'shiv-ji': { category: 'idol', label: 'Shiv Ji' },
  shivling: { category: 'idol', label: 'Shivling' },
  ganesha: { category: 'idol', label: 'Ganesha' },
  lakshmi: { category: 'idol', label: 'Lakshmi' },
  nandi: { category: 'idol', label: 'Nandi' },
  saraswati: { category: 'idol', label: 'Saraswati' },
  vishnu: { category: 'idol', label: 'Vishnu' },
  bracelets: { category: 'jewelry', label: 'Bracelets' },
  'rudraksha-jewelry': { category: 'jewelry', label: 'Ready Rudraksha Jewelry' },
  'diamond-jewellery': { category: 'jewelry', label: 'Diamond Jewellery' },
  'astro-gems-stock': { category: 'jewelry', label: 'Ready Astro-Gems Stock' },
  ring: { category: 'jewelry', label: 'Rings' },
  pendant: { category: 'jewelry', label: 'Pendants' },
  necklace: { category: 'jewelry', label: 'Necklaces' },
  earring: { category: 'jewelry', label: 'Earrings' },
  malas: { category: 'mala', label: 'Rudraksha Malas' },
  'exclusive-rudraksha-malas': { category: 'mala', label: 'Exclusive Rudraksha Malas' },
};

export type ResolvedShopCategory = {
  category?: string;
  sub_category?: string;
  parentSlug?: StorefrontCategoryGroupSlug | 'gemstones';
  label: string;
  desc: string;
  canonicalPath: string;
  directorsPick?: boolean;
  seoLanding?: SeoLandingPage;
};

type GemCategoryRow = {
  name: string;
  slug: string;
  type: 'navaratna' | 'upratna' | 'rudraksha';
  sanskrit_name: string | null;
  description: string | null;
};

type ProductCategoryRow = {
  name: string;
  slug: string;
  family: CatalogFamily;
  description: string | null;
  parent_id: string | null;
};

const GROUP_TO_GEM_TYPE: Partial<Record<StorefrontCategoryGroupSlug, GemCategoryRow['type']>> = {
  navaratna: 'navaratna',
  upratna: 'upratna',
  rudraksha: 'rudraksha',
};

const GROUP_TO_CATALOG_FAMILIES: Partial<Record<StorefrontCategoryGroupSlug, CatalogFamily[]>> = {
  rudraksha: ['rudraksha'],
  idols: ['idol'],
  jewelry: ['jewelry'],
  malas: ['mala'],
};

const CATALOG_FAMILY_TO_PRODUCT_CATEGORY: Record<CatalogFamily, string> = {
  idol: 'idol',
  jewelry: 'jewelry',
  mala: 'mala',
  rudraksha: 'rudraksha',
};

function gemParentSlug(type: GemCategoryRow['type']) {
  return type === 'upratna' ? 'upratna' : type === 'rudraksha' ? 'rudraksha' : 'navaratna';
}

function gemLabel(category: GemCategoryRow) {
  return category.sanskrit_name ? `${category.name} (${category.sanskrit_name})` : category.name;
}

function resolvedGemCategory(category: GemCategoryRow): ResolvedShopCategory {
  const parentSlug = gemParentSlug(category.type);
  return {
    category: category.type,
    sub_category: category.slug,
    parentSlug,
    label: gemLabel(category),
    desc: category.description || `Explore our collection of natural ${category.name} gemstones.`,
    canonicalPath: storefrontSubcategoryHref(parentSlug, category.slug),
  };
}

function resolvedProductCategory(category: ProductCategoryRow): ResolvedShopCategory {
  const parentSlug = catalogFamilyToStorefrontGroupSlug(category.family) ?? category.family;
  return {
    category: CATALOG_FAMILY_TO_PRODUCT_CATEGORY[category.family] ?? category.family,
    sub_category: category.parent_id ? category.slug : undefined,
    parentSlug: parentSlug as StorefrontCategoryGroupSlug,
    label: category.name,
    desc: category.description || `Explore our collection of ${category.name}.`,
    canonicalPath: category.parent_id
      ? storefrontSubcategoryHref(parentSlug as StorefrontCategoryGroupSlug, category.slug)
      : storefrontGroupHref(parentSlug as StorefrontCategoryGroupSlug),
  };
}

function knownGemCategory(slug: string, expectedType?: GemCategoryRow['type']): ResolvedShopCategory | null {
  const known = KNOWN_GEM_SUBCATEGORIES[slug];
  if (!known || (expectedType && known.category !== expectedType)) return null;
  const parentSlug = known.category === 'upratna' ? 'upratna' : 'navaratna';
  return {
    category: known.category,
    sub_category: slug,
    parentSlug,
    label: known.label,
    desc: known.desc,
    canonicalPath: storefrontSubcategoryHref(parentSlug, slug),
  };
}

function knownCatalogCategory(slug: string, expectedFamilies?: CatalogFamily[]): ResolvedShopCategory | null {
  const known = KNOWN_CATALOG_SUBCATEGORIES[slug];
  if (!known || (expectedFamilies && !expectedFamilies.includes(known.category as CatalogFamily))) return null;
  const parentSlug = catalogFamilyToStorefrontGroupSlug(known.category) ?? 'jewelry';
  return {
    category: known.category,
    sub_category: slug,
    parentSlug,
    label: known.label,
    desc: `Explore our collection of ${known.label}.`,
    canonicalPath: storefrontSubcategoryHref(parentSlug, slug),
  };
}

export function knownSubcategoryHref(slug: string) {
  return knownGemCategory(slug)?.canonicalPath ?? knownCatalogCategory(slug)?.canonicalPath ?? `/shop/${slug}`;
}

async function findGemCategory(slug: string, expectedType?: GemCategoryRow['type']) {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;

  let query = supabase
    .from('gem_categories')
    .select('name, slug, type, sanskrit_name, description')
    .eq('slug', slug)
    .eq('is_active', true);

  if (expectedType) query = query.eq('type', expectedType);

  const { data } = await query.maybeSingle();
  return data ? resolvedGemCategory(data as GemCategoryRow) : null;
}

async function findProductCategory(slug: string, expectedFamilies?: CatalogFamily[]) {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;

  let query = supabase
    .from('product_categories')
    .select('name, slug, family, description, parent_id')
    .eq('slug', slug)
    .eq('is_active', true);

  if (expectedFamilies?.length) query = query.in('family', expectedFamilies);

  const { data } = await query.maybeSingle();
  return data ? resolvedProductCategory(data as ProductCategoryRow) : null;
}

export async function resolveShopCategoryPath(parentOrSlug: string, childSlug?: string): Promise<ResolvedShopCategory | null> {
  if (childSlug) {
    const parentSlug = normalizeStorefrontGroupSlug(parentOrSlug);
    if (!parentSlug) return null;

    const expectedGemType = GROUP_TO_GEM_TYPE[parentSlug];
    if (expectedGemType) {
      const gemCategory = (
        await findGemCategory(childSlug, expectedGemType)
      ) ?? knownGemCategory(childSlug, expectedGemType) ?? null;
      if (gemCategory) return gemCategory;

      if (!GROUP_TO_CATALOG_FAMILIES[parentSlug]) return null;
    }

    const expectedFamilies = GROUP_TO_CATALOG_FAMILIES[parentSlug];
    return (
      await findProductCategory(childSlug, expectedFamilies)
    ) ?? knownCatalogCategory(childSlug, expectedFamilies) ?? null;
  }

  const seoLanding = getSeoLandingPageBySlug(parentOrSlug);
  if (seoLanding) {
    return {
      label: seoLanding.title,
      desc: seoLanding.description,
      canonicalPath: seoLanding.href,
      seoLanding,
    };
  }

  const base = BASE_CATEGORY_MAP[parentOrSlug];
  if (base) return base;

  return (
    await findGemCategory(parentOrSlug)
  ) ?? (
    await findProductCategory(parentOrSlug)
  ) ?? knownGemCategory(parentOrSlug) ?? knownCatalogCategory(parentOrSlug) ?? null;
}

export function staticShopCategoryParams() {
  const staticSlugs = Object.keys(BASE_CATEGORY_MAP);
  const gemSlugs = Object.keys(KNOWN_GEM_SUBCATEGORIES);
  const catalogSlugs = Object.keys(KNOWN_CATALOG_SUBCATEGORIES);
  return [...new Set([...staticSlugs, ...gemSlugs, ...catalogSlugs, ...SEO_LANDING_PAGES.map((page) => page.slug)])];
}
