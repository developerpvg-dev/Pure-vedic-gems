import { RUDRAKSHA_MUKHI_IMAGE_BY_SLUG, rudrakshaMukhiImage } from '@/lib/constants/rudraksha-category-images';
import {
  RUDRAKSHA_STOREFRONT_SLUGS,
  rudrakshaSubcategoryLabel,
} from '@/lib/constants/rudraksha-subcategories';
import { NAVARATNA_NAV_IMAGE_BY_SLUG } from '@/lib/constants/navaratna-category-images';
import { UPRATNA_NAV_IMAGE_BY_SLUG } from '@/lib/constants/upratna-category-images';
import {
  canonicalGroupHref,
  canonicalSubcategoryHref,
  parentForMigratedSlug,
} from '@/lib/categories/canonical-storefront-path';

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
  if (slug === 'gemstones') return canonicalGroupHref('navaratna');
  if (slug === 'navaratna' || slug === 'upratna' || slug === 'rudraksha') return canonicalGroupHref(slug);
  return `/shop/${slug}`;
}

export function storefrontSubcategoryHref(parentSlug: StorefrontCategoryGroupSlug, subcategorySlug: string) {
  const migrated = canonicalSubcategoryHref(subcategorySlug);
  if (migrated) return migrated;
  if (parentSlug === 'navaratna' || parentSlug === 'upratna' || parentSlug === 'rudraksha') {
    return `${canonicalGroupHref(parentSlug)}/${subcategorySlug}`;
  }
  return `/shop/${subcategorySlug}`;
}

export function catalogFamilyToStorefrontGroupSlug(family: CatalogFamily | string | null | undefined) {
  if (!family) return null;
  return CATALOG_FAMILY_TO_GROUP[family as CatalogFamily] ?? null;
}

export function productCategoryToStorefrontGroupSlug(category: string | null | undefined) {
  if (!category) return null;
  return PRODUCT_CATEGORY_TO_GROUP[category.toLowerCase()] ?? category.toLowerCase();
}

export function internalShopProductHref(product: { category?: string | null; sub_category?: string | null; slug: string }) {
  if (product.sub_category) return `/shop/${product.sub_category}/${product.slug}`;
  const groupSlug = productCategoryToStorefrontGroupSlug(product.category) ?? product.category ?? 'navaratna';
  return `/shop/${groupSlug}/${product.slug}`;
}

export function productHref(product: { category?: string | null; sub_category?: string | null; slug: string }) {
  if (product.sub_category) {
    const hinted = productCategoryToStorefrontGroupSlug(product.category);
    const parent = (
      hinted && hinted !== 'gemstones'
        ? hinted
        : (parentForMigratedSlug(product.sub_category) ?? 'navaratna')
    ) as StorefrontCategoryGroupSlug;
    return `${storefrontSubcategoryHref(parent, product.sub_category)}/${product.slug}`;
  }
  const groupSlug = productCategoryToStorefrontGroupSlug(product.category) ?? product.category ?? 'navaratna';
  if (groupSlug === 'gemstones') return `${canonicalGroupHref('navaratna')}/${product.slug}`;
  return `${storefrontGroupHref(groupSlug as StorefrontCategoryGroupSlug)}/${product.slug}`;
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
      { slug: 'ruby', label: 'Ruby (Manik)', href: '/shop/ruby', swatch: '#c9142f', image: NAVARATNA_NAV_IMAGE_BY_SLUG.ruby, meta: 'Sun' },
      { slug: 'pearl', label: 'Pearl (Moti)', href: '/shop/pearl', swatch: '#f5f5f4', image: NAVARATNA_NAV_IMAGE_BY_SLUG.pearl, meta: 'Moon' },
      { slug: 'red-coral', label: 'Red Coral (Moonga)', href: '/shop/red-coral', swatch: '#e15b3c', image: NAVARATNA_NAV_IMAGE_BY_SLUG['red-coral'], meta: 'Mars' },
      { slug: 'emerald', label: 'Emerald (Panna)', href: '/shop/emerald', swatch: '#2e8b57', image: NAVARATNA_NAV_IMAGE_BY_SLUG.emerald, meta: 'Mercury' },
      { slug: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)', href: '/shop/yellow-sapphire', swatch: '#d4a017', image: NAVARATNA_NAV_IMAGE_BY_SLUG['yellow-sapphire'], meta: 'Jupiter' },
      { slug: 'diamond', label: 'Diamond (Heera)', href: '/shop/diamond', swatch: '#d8d8d8', image: NAVARATNA_NAV_IMAGE_BY_SLUG.diamond, meta: 'Venus' },
      { slug: 'blue-sapphire', label: 'Blue Sapphire (Neelam)', href: '/shop/blue-sapphire', swatch: '#1e4f9d', image: NAVARATNA_NAV_IMAGE_BY_SLUG['blue-sapphire'], meta: 'Saturn' },
      { slug: 'hessonite', label: 'Hessonite (Gomed)', href: '/shop/hessonite', swatch: '#b7682c', image: NAVARATNA_NAV_IMAGE_BY_SLUG.hessonite, meta: 'Rahu' },
      { slug: 'cats-eye', label: "Cat's Eye (Lehsunia)", href: '/shop/cats-eye', swatch: '#9c8b68', image: NAVARATNA_NAV_IMAGE_BY_SLUG['cats-eye'], meta: 'Ketu' },
      { slug: 'pitambari', label: 'Pitambari', href: '/shop/pitambari', swatch: '#E0B84C', image: UPRATNA_NAV_IMAGE_BY_SLUG.pitambari, meta: 'Jupiter & Saturn' },
      { slug: 'exclusive-gems', label: 'Exclusive Gems', href: '/shop/exclusive-gems', swatch: '#7A1515', meta: 'On Request' },
    ],
  },
  {
    slug: 'upratna',
    label: 'Upratna Gems',
    href: '/shop/upratna',
    subcategories: [
      { slug: 'opal', label: 'Opal', href: '/shop/opal', swatch: '#FBBFB4', image: UPRATNA_NAV_IMAGE_BY_SLUG.opal },
      { slug: 'turquoise', label: 'Turquoise (Firoza)', href: '/shop/turquoise', swatch: '#3CB2B2', image: UPRATNA_NAV_IMAGE_BY_SLUG.turquoise },
      { slug: 'amethyst', label: 'Amethyst', href: '/shop/amethyst', swatch: '#9B59B6', image: UPRATNA_NAV_IMAGE_BY_SLUG.amethyst },
      { slug: 'moonstone', label: 'Moonstone', href: '/shop/moonstone', swatch: '#C8D8E8', image: UPRATNA_NAV_IMAGE_BY_SLUG.moonstone },
      { slug: 'garnet', label: 'Garnet', href: '/shop/garnet', swatch: '#C0392B', image: UPRATNA_NAV_IMAGE_BY_SLUG.garnet },
      { slug: 'peridot', label: 'Peridot', href: '/shop/peridot', swatch: '#7EC850', image: UPRATNA_NAV_IMAGE_BY_SLUG.peridot },
      { slug: 'tanzanite', label: 'Tanzanite', href: '/shop/tanzanite', swatch: '#3B5998', image: UPRATNA_NAV_IMAGE_BY_SLUG.tanzanite },
      { slug: 'lapis-lazuli', label: 'Lapis Lazuli', href: '/shop/lapis-lazuli', swatch: '#1F3A8C', image: UPRATNA_NAV_IMAGE_BY_SLUG['lapis-lazuli'] },
      { slug: 'citrine', label: 'Citrine', href: '/shop/citrine', swatch: '#F39C12', image: UPRATNA_NAV_IMAGE_BY_SLUG.citrine },
      { slug: 'aquamarine', label: 'Aquamarine', href: '/shop/aquamarine', swatch: '#5DADE2', image: UPRATNA_NAV_IMAGE_BY_SLUG.aquamarine },
    ],
  },
  {
    slug: 'rudraksha',
    label: 'Rudraksha',
    href: '/shop/rudraksha',
    subcategories: RUDRAKSHA_STOREFRONT_SLUGS.map((slug) => ({
      slug,
      label: rudrakshaSubcategoryLabel(slug),
      href: `/shop/${slug}`,
      image: rudrakshaMukhiImage(slug) ?? undefined,
    })),
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
      { slug: 'bracelets', label: 'Bracelets', href: '/shop/bracelets' },
      { slug: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas', href: '/shop/exclusive-rudraksha-malas' },
      { slug: 'ready-rudraksha-jewelry-stock', label: 'Ready (Rudraksha Jewelry) Stock', href: '/shop/ready-rudraksha-jewelry-stock' },
      { slug: 'diamond-jewellery', label: 'Diamond-Jewellery', href: '/shop/diamond-jewellery' },
      { slug: 'malas', label: 'Malas', href: '/shop/malas' },
      { slug: 'astro-gems-stock', label: 'Ready (Astro-Gems) Stock', href: '/shop/astro-gems-stock' },
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
          .filter((sub): sub is StorefrontSubCategory => Boolean(sub?.slug && sub?.label && sub?.href))
          .map((sub) => ({
            slug: sub.slug,
            label: sub.label,
            href: sub.href,
            swatch: sub.swatch ?? null,
            image: sub.image ?? null,
            meta: item.slug === 'upratna' ? null : sub.meta ?? null,
          })),
      };
    })
    .filter((group): group is StorefrontCategoryGroup => Boolean(group));

  return normalized.length ? withResolvedStorefrontHrefs(normalized) : STORE_CATEGORY_GROUPS_FALLBACK;
}

export function findStorefrontGroup(groups: StorefrontCategoryGroup[], slug: StorefrontCategoryGroupSlug) {
  return groups.find((group) => group.slug === slug) ?? STORE_CATEGORY_GROUPS_FALLBACK.find((group) => group.slug === slug)!;
}