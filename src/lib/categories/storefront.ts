export type StorefrontCategoryGroupSlug = 'navaratna' | 'upratna' | 'rudraksha' | 'idols' | 'jewelry' | 'malas';

export type CatalogFamily = 'idol' | 'jewelry' | 'mala' | 'rudraksha';

const STOREFRONT_GROUP_ALIASES: Record<string, StorefrontCategoryGroupSlug> = {
  navratna: 'navaratna',
  navaratna: 'navaratna',
  upratna: 'upratna',
  uparatna: 'upratna',
  rudraksha: 'rudraksha',
  rudrakhas: 'rudraksha',
  idol: 'idols',
  idols: 'idols',
  'spiritual-idols': 'idols',
  jewelry: 'jewelry',
  jewellery: 'jewelry',
  'vedic-jewelry': 'jewelry',
  'vedic-jewellery': 'jewelry',
  mala: 'malas',
  malas: 'malas',
};

const CATALOG_FAMILY_TO_GROUP: Record<CatalogFamily, StorefrontCategoryGroupSlug> = {
  idol: 'idols',
  jewelry: 'jewelry',
  mala: 'malas',
  rudraksha: 'rudraksha',
};

const PRODUCT_CATEGORY_TO_GROUP: Record<string, StorefrontCategoryGroupSlug | 'gemstones'> = {
  gemstone: 'gemstones',
  navratna: 'navaratna',
  navaratna: 'navaratna',
  upratna: 'upratna',
  uparatna: 'upratna',
  rudraksha: 'rudraksha',
  idol: 'idols',
  idols: 'idols',
  jewelry: 'jewelry',
  jewellery: 'jewelry',
  mala: 'malas',
  malas: 'malas',
};

export function normalizeStorefrontGroupSlug(value: string | null | undefined): StorefrontCategoryGroupSlug | null {
  if (!value) return null;
  return STOREFRONT_GROUP_ALIASES[value.toLowerCase()] ?? null;
}

export function storefrontGroupHref(slug: StorefrontCategoryGroupSlug | 'gemstones') {
  return `/shop/${slug}`;
}

export function storefrontSubcategoryHref(parentSlug: StorefrontCategoryGroupSlug, subcategorySlug: string) {
  return `${storefrontGroupHref(parentSlug)}/${subcategorySlug}`;
}

export function catalogFamilyToStorefrontGroupSlug(family: CatalogFamily | string | null | undefined) {
  if (!family) return null;
  return CATALOG_FAMILY_TO_GROUP[family as CatalogFamily] ?? null;
}

export function productCategoryToStorefrontGroupSlug(category: string | null | undefined) {
  if (!category) return null;
  return PRODUCT_CATEGORY_TO_GROUP[category.toLowerCase()] ?? category.toLowerCase();
}

export function productHref(product: { category?: string | null; slug: string }) {
  const groupSlug = productCategoryToStorefrontGroupSlug(product.category) ?? product.category ?? 'gemstones';
  return `/shop/${groupSlug}/${product.slug}`;
}

export interface StorefrontSubCategory {
  slug: string;
  label: string;
  href: string;
  swatch?: string | null;
  image?: string | null;
  meta?: string | null;
}

export interface StorefrontCategoryGroup {
  slug: StorefrontCategoryGroupSlug;
  label: string;
  href: string;
  subcategories: StorefrontSubCategory[];
}

function withResolvedStorefrontHrefs(groups: StorefrontCategoryGroup[]): StorefrontCategoryGroup[] {
  return groups.map((group) => ({
    ...group,
    href: storefrontGroupHref(group.slug),
    subcategories: group.subcategories.map((subcategory) => ({
      ...subcategory,
      href: storefrontSubcategoryHref(group.slug, subcategory.slug),
    })),
  }));
}

export const STORE_CATEGORY_GROUPS_FALLBACK: StorefrontCategoryGroup[] = withResolvedStorefrontHrefs([
  {
    slug: 'navaratna',
    label: 'Navaratna Gems',
    href: '/shop/navaratna',
    subcategories: [
      { slug: 'ruby', label: 'Ruby (Manik)', href: '/shop/ruby', swatch: '#c9142f', image: '/home/navratnaimg/stone1.webp', meta: 'Sun' },
      { slug: 'pearl', label: 'Pearl (Moti)', href: '/shop/pearl', swatch: '#f5f5f4', image: '/home/navratnaimg/stone2.webp', meta: 'Moon' },
      { slug: 'red-coral', label: 'Red Coral (Moonga)', href: '/shop/red-coral', swatch: '#e15b3c', image: '/home/navratnaimg/stone7.webp', meta: 'Mars' },
      { slug: 'emerald', label: 'Emerald (Panna)', href: '/shop/emerald', swatch: '#2e8b57', image: '/home/navratnaimg/stone4.webp', meta: 'Mercury' },
      { slug: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)', href: '/shop/yellow-sapphire', swatch: '#d4a017', image: '/home/navratnaimg/stone5.webp', meta: 'Jupiter' },
      { slug: 'diamond', label: 'Diamond (Heera)', href: '/shop/diamond', swatch: '#d8d8d8', image: '/home/navratnaimg/stone6.webp', meta: 'Venus' },
      { slug: 'blue-sapphire', label: 'Blue Sapphire (Neelam)', href: '/shop/blue-sapphire', swatch: '#1e4f9d', image: '/home/navratnaimg/stone3.webp', meta: 'Saturn' },
      { slug: 'hessonite', label: 'Hessonite (Gomed)', href: '/shop/hessonite', swatch: '#b7682c', image: '/home/navratnaimg/stone8.webp', meta: 'Rahu' },
      { slug: 'cats-eye', label: "Cat's Eye (Lehsunia)", href: '/shop/cats-eye', swatch: '#9c8b68', image: '/home/navratnaimg/stone9.webp', meta: 'Ketu' },
    ],
  },
  {
    slug: 'upratna',
    label: 'Upratna Gems',
    href: '/shop/upratna',
    subcategories: [
      { slug: 'opal', label: 'Opal', href: '/shop/opal', swatch: '#FBBFB4' },
      { slug: 'turquoise', label: 'Turquoise (Firoza)', href: '/shop/turquoise', swatch: '#3CB2B2' },
      { slug: 'amethyst', label: 'Amethyst', href: '/shop/amethyst', swatch: '#9B59B6' },
      { slug: 'moonstone', label: 'Moonstone', href: '/shop/moonstone', swatch: '#C8D8E8' },
      { slug: 'garnet', label: 'Garnet', href: '/shop/garnet', swatch: '#C0392B' },
      { slug: 'peridot', label: 'Peridot', href: '/shop/peridot', swatch: '#7EC850' },
      { slug: 'tanzanite', label: 'Tanzanite', href: '/shop/tanzanite', swatch: '#3B5998' },
      { slug: 'lapis-lazuli', label: 'Lapis Lazuli', href: '/shop/lapis-lazuli', swatch: '#1F3A8C' },
      { slug: 'citrine', label: 'Citrine', href: '/shop/citrine', swatch: '#F39C12' },
      { slug: 'aquamarine', label: 'Aquamarine', href: '/shop/aquamarine', swatch: '#5DADE2' },
    ],
  },
  {
    slug: 'rudraksha',
    label: 'Rudraksha',
    href: '/shop/rudraksha',
    subcategories: [
      { slug: '1-mukhi', label: '1 Mukhi', href: '/shop/1-mukhi', image: '/home/rudrakhshas images/1Mukhi-150x150.webp' },
      { slug: '2-mukhi', label: '2 Mukhi', href: '/shop/2-mukhi', image: '/home/rudrakhshas images/2Mukhi-150x150.webp' },
      { slug: '3-mukhi', label: '3 Mukhi', href: '/shop/3-mukhi', image: '/home/rudrakhshas images/3Mukhi-150x150.webp' },
      { slug: '4-mukhi', label: '4 Mukhi', href: '/shop/4-mukhi', image: '/home/rudrakhshas images/4Mukhi-150x150.webp' },
      { slug: '5-mukhi', label: '5 Mukhi', href: '/shop/5-mukhi', image: '/home/rudrakhshas images/5Mukhi-150x150.webp' },
      { slug: '6-mukhi', label: '6 Mukhi', href: '/shop/6-mukhi', image: '/home/rudrakhshas images/6Mukhi-150x150.webp' },
      { slug: '7-mukhi', label: '7 Mukhi', href: '/shop/7-mukhi', image: '/home/rudrakhshas images/7Mukhi-150x150.webp' },
      { slug: '8-mukhi', label: '8 Mukhi', href: '/shop/8-mukhi', image: '/home/rudrakhshas images/8Mukhi-150x150.webp' },
      { slug: '9-mukhi', label: '9 Mukhi', href: '/shop/9-mukhi', image: '/home/rudrakhshas images/9Mukhi-150x150.webp' },
      { slug: '10-mukhi', label: '10 Mukhi', href: '/shop/10-mukhi', image: '/home/rudrakhshas images/10Mukhi-150x150.webp' },
      { slug: '11-mukhi', label: '11 Mukhi', href: '/shop/11-mukhi', image: '/home/rudrakhshas images/11Mukhi-150x150.webp' },
      { slug: '12-mukhi', label: '12 Mukhi', href: '/shop/12-mukhi', image: '/home/rudrakhshas images/12Mukhi-150x150.webp' },
      { slug: '13-mukhi', label: '13 Mukhi', href: '/shop/13-mukhi', image: '/home/rudrakhshas images/13Mukhi-150x150.webp' },
      { slug: '14-mukhi', label: '14 Mukhi', href: '/shop/14-mukhi', image: '/home/rudrakhshas images/14Mukhi-150x150.webp' },
    ],
  },
  {
    slug: 'idols',
    label: 'Spiritual Idols',
    href: '/shop/idols',
    subcategories: [
      { slug: 'shree-yantra', label: 'Shree Yantra', href: '/shop/shree-yantra' },
      { slug: 'durga-devi', label: 'Durga Devi', href: '/shop/durga-devi' },
      { slug: 'hanuman', label: 'Hanuman', href: '/shop/hanuman' },
      { slug: 'shiv-ji', label: 'Shiv Ji', href: '/shop/shiv-ji' },
      { slug: 'shivling', label: 'Shivling', href: '/shop/shivling' },
      { slug: 'ganesha', label: 'Ganesha', href: '/shop/ganesha' },
      { slug: 'lakshmi', label: 'Lakshmi', href: '/shop/lakshmi' },
      { slug: 'nandi', label: 'Nandi', href: '/shop/nandi' },
    ],
  },
  {
    slug: 'jewelry',
    label: 'Vedic Jewellery',
    href: '/shop/jewelry',
    subcategories: [
      { slug: 'ring', label: 'Rings', href: '/shop/ring' },
      { slug: 'pendant', label: 'Pendants', href: '/shop/pendant' },
      { slug: 'bracelets', label: 'Bracelets', href: '/shop/bracelets' },
      { slug: 'diamond-jewellery', label: 'Diamond Jewellery', href: '/shop/diamond-jewellery' },
      { slug: 'rudraksha-jewelry', label: 'Rudraksha Jewelry', href: '/shop/rudraksha-jewelry' },
      { slug: 'astro-gems-stock', label: 'Astro-Gems Stock', href: '/shop/astro-gems-stock' },
    ],
  },
  {
    slug: 'malas',
    label: 'Malas',
    href: '/shop/malas',
    subcategories: [
      { slug: 'malas', label: 'Rudraksha Malas', href: '/shop/malas' },
      { slug: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas', href: '/shop/exclusive-rudraksha-malas' },
    ],
  },
]);

export function normalizeStorefrontGroups(input: unknown): StorefrontCategoryGroup[] {
  if (!input || typeof input !== 'object' || !('groups' in input)) return STORE_CATEGORY_GROUPS_FALLBACK;
  const groups = (input as { groups?: unknown }).groups;
  if (!Array.isArray(groups) || groups.length === 0) return STORE_CATEGORY_GROUPS_FALLBACK;

  const normalized = groups
    .map((group): StorefrontCategoryGroup | null => {
      if (!group || typeof group !== 'object') return null;
      const item = group as Partial<StorefrontCategoryGroup>;
      if (!item.slug || !item.label || !item.href || !Array.isArray(item.subcategories)) return null;
      return {
        slug: item.slug,
        label: item.label,
        href: storefrontGroupHref(item.slug),
        subcategories: item.subcategories
          .filter((sub): sub is StorefrontSubCategory => Boolean(sub?.slug && sub?.label && sub?.href)),
      };
    })
    .filter((group): group is StorefrontCategoryGroup => Boolean(group));

  return normalized.length ? withResolvedStorefrontHrefs(normalized) : STORE_CATEGORY_GROUPS_FALLBACK;
}

export function findStorefrontGroup(groups: StorefrontCategoryGroup[], slug: StorefrontCategoryGroupSlug) {
  return groups.find((group) => group.slug === slug) ?? STORE_CATEGORY_GROUPS_FALLBACK.find((group) => group.slug === slug)!;
}