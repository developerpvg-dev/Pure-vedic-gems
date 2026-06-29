import type { ProductCard } from '@/lib/types/product';
import { RUDRAKSHA_CONFIGURATOR_ENABLED } from '@/lib/utils/rudraksha-configurator';

export const RUDRAKSHA_DESIGN_CATEGORIES = {
  one_mukhi: {
    label: 'One Mukhi',
    description: 'Mounting for One Mukhi Rudraksha beads',
  },
  standard_mukhi: {
    label: '2–17 Mukhi, Ganesh & Gauri Shankar',
    description: 'Round & oval bead cap mountings',
  },
  multiple_beads: {
    label: 'Multiple Rudraksha (3+ beads)',
    description: 'Mountings for combinations of three or more beads',
  },
} as const;

export type RudrakshaDesignCategory = keyof typeof RUDRAKSHA_DESIGN_CATEGORIES;

const MULTI_BEAD_SUBCATEGORIES = new Set([
  'rudraksha-mala',
  'siddha-mala',
  'indrakshi-mala',
  'trijuti-rudraksha',
]);

const STANDARD_SUBCATEGORIES = new Set([
  'ganesh-rudraksha',
  'gauri-shankar',
  'garbh-gauri',
  'nir-mukhi',
  'sawar-rudraksha',
]);

function parseMukhiNumber(subCategory: string): number | null {
  const match = subCategory.match(/^(\d+)-mukhi$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function isRudrakshaConfiguratorContext(
  gemCategory: string | null,
  product: Pick<ProductCard, 'category' | 'sub_category' | 'product_type'> | null
): boolean {
  if (!RUDRAKSHA_CONFIGURATOR_ENABLED) return false;
  if (gemCategory === 'rudraksha') return true;
  if (product?.category === 'rudraksha') return true;
  if (product?.product_type === 'rudraksha') return true;
  return false;
}

/** Which rudraksha mounting categories apply to this product. */
export function getRudrakshaDesignCategoriesForProduct(
  product: Pick<ProductCard, 'category' | 'sub_category' | 'product_type' | 'name' | 'slug'> | null
): RudrakshaDesignCategory[] {
  if (!product) return [];

  const sub = (product.sub_category ?? '').toLowerCase().trim();
  if (!sub) return ['standard_mukhi'];

  if (sub === '1-mukhi') return ['one_mukhi'];

  if (MULTI_BEAD_SUBCATEGORIES.has(sub)) return ['multiple_beads'];

  if (STANDARD_SUBCATEGORIES.has(sub)) return ['standard_mukhi'];

  const mukhi = parseMukhiNumber(sub);
  if (mukhi !== null) {
    if (mukhi === 1) return ['one_mukhi'];
    if (mukhi >= 2 && mukhi <= 17) return ['standard_mukhi'];
    if (mukhi >= 18) return ['standard_mukhi'];
  }

  const haystack = `${product.slug ?? ''} ${product.name ?? ''}`.toLowerCase();
  if (/mala|108|siddha|indrakshi|trijuti|3\s*mukhi|three\s*mukhi/.test(haystack)) {
    return ['multiple_beads'];
  }

  return ['standard_mukhi'];
}

export function designMatchesRudrakshaProduct(
  designCategory: string | null | undefined,
  product: Pick<ProductCard, 'category' | 'sub_category' | 'product_type' | 'name' | 'slug'> | null
): boolean {
  if (!designCategory) return false;
  const allowed = getRudrakshaDesignCategoriesForProduct(product);
  return allowed.includes(designCategory as RudrakshaDesignCategory);
}

/** Total bead count when building a multi-rudraksha pendant. */
export function countRudrakshaBeadsInSelection(
  primary: { id?: string } | null,
  combo: { id?: string }[] = []
): number {
  const ids = new Set<string>();
  if (primary?.id) ids.add(primary.id);
  for (const item of combo) {
    if (item?.id) ids.add(item.id);
  }
  return ids.size;
}

/** Design categories allowed for a primary bead plus optional combo beads. */
export function getRudrakshaDesignCategoriesForSelection(
  primary: (Pick<ProductCard, 'category' | 'sub_category' | 'product_type' | 'name' | 'slug'> & {
    id?: string;
  }) | null,
  combo: (Pick<ProductCard, 'category' | 'sub_category' | 'product_type' | 'name' | 'slug'> & {
    id?: string;
  })[] = []
): RudrakshaDesignCategory[] {
  const beadCount = countRudrakshaBeadsInSelection(primary, combo);

  if (beadCount >= 3) return ['multiple_beads'];

  return getRudrakshaDesignCategoriesForProduct(primary);
}

export function designMatchesRudrakshaSelection(
  designCategory: string | null | undefined,
  primary: Pick<ProductCard, 'category' | 'sub_category' | 'product_type' | 'name' | 'slug'> & {
    id?: string;
  } | null,
  combo: (Pick<ProductCard, 'category' | 'sub_category' | 'product_type' | 'name' | 'slug'> & {
    id?: string;
  })[] = []
): boolean {
  if (!designCategory) return false;
  const allowed = getRudrakshaDesignCategoriesForSelection(primary, combo);
  return allowed.includes(designCategory as RudrakshaDesignCategory);
}
