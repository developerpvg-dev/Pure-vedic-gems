import {
  getHomeManagedCategories,
  type HomeManagedCategory,
} from '@/components/home/PvgManagedCategorySections';
import { resolveCategoryNavImage } from '@/lib/constants/category-nav-images';
import { NAVARATNA_HOME_GRID_LIMIT } from '@/lib/constants/navaratna-home-grid';
import { storefrontSubcategoryHref, productHref } from '@/lib/categories/storefront';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { resolveShopCategoryPath } from '@/lib/categories/shop';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import type { ProductCard } from '@/lib/types/product';

export type BlogGemTile = {
  id: string;
  name: string;
  href: string;
  image: string | null;
  color: string | null;
};

export type BlogRailKind = 'navaratna' | 'upratna' | 'rudraksha';

export type BlogGemRailCopy = {
  kind: BlogRailKind;
  title: string;
  href: string;
  productCategory: string;
};

export type BlogRelatedProduct = {
  id: string;
  name: string;
  href: string;
  thumbnailUrl: string | null;
  priceLabel: string;
};

const PRODUCT_CARD_SELECT = `
  id, sku, slug, name, category, sub_category, price, price_per_carat, compare_price,
  carat_weight, ratti_weight, origin, shape, certification, images, thumbnail_url,
  in_stock, stock_quantity, stock_status, sold_individually, featured, is_directors_pick,
  treatment, planet, created_at, configurator_enabled, product_type, tag_number,
  availability_status, price_mode, quality_label, certificate_lab, certificate_number
`;

export function railKindForCategory(categorySlug?: string): BlogRailKind {
  const slug = (categorySlug || '').toLowerCase();
  if (slug.includes('rudraksha')) return 'rudraksha';
  if (slug.includes('upratna') || slug.includes('semi')) return 'upratna';
  return 'navaratna';
}

const RAIL_COPY: Record<BlogRailKind, Omit<BlogGemRailCopy, 'kind'>> = {
  navaratna: {
    title: 'Shop Navaratna',
    href: '/gemstones/navaratna',
    productCategory: 'navaratna',
  },
  upratna: {
    title: 'Shop Upratna',
    href: '/gemstones/upratna',
    productCategory: 'upratna',
  },
  rudraksha: {
    title: 'Shop Rudraksha',
    href: '/rudraksha',
    productCategory: 'rudraksha',
  },
};

function gemHref(category: HomeManagedCategory) {
  const parent = category.type === 'upratna' ? 'upratna' : category.type === 'rudraksha' ? 'rudraksha' : 'navaratna';
  return storefrontSubcategoryHref(parent, category.slug);
}

function displayPrice(product: ProductCard) {
  const amount = product.price ?? product.price_per_carat;
  return typeof amount === 'number' && amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'View details';
}

export function toBlogRelatedProduct(product: ProductCard): BlogRelatedProduct {
  return {
    id: product.id,
    name: formatProductDisplayName(product.name),
    href: productHref(product),
    thumbnailUrl: product.thumbnail_url,
    priceLabel: displayPrice(product),
  };
}

/** Available to buy now — not reserved, sold, or out of stock. */
function sellableProductsQuery(supabase: NonNullable<ReturnType<typeof createOptionalPublicClient>>) {
  return supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT)
    .eq('is_active', true)
    .eq('in_stock', true)
    .eq('availability_status', 'in_stock');
}

function shuffleTake<T>(items: T[], count: number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

export async function getBlogGemRailData(categorySlug?: string) {
  const kind = railKindForCategory(categorySlug);
  const copy = { kind, ...RAIL_COPY[kind] };
  const buckets = await getHomeManagedCategories();
  const gems: BlogGemTile[] = buckets[kind]
    .slice(0, kind === 'navaratna' ? NAVARATNA_HOME_GRID_LIMIT : 10)
    .map((gem) => ({
      id: gem.id ?? gem.slug,
      name: gem.name,
      href: gemHref(gem),
      image: gem.image_url ?? resolveCategoryNavImage(gem.slug, null),
      color: gem.color,
    }));

  return { copy, gems };
}

export async function getBlogCategoryProducts(productCategory: string) {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [] as BlogRelatedProduct[];

  const { data } = await sellableProductsQuery(supabase)
    .eq('category', productCategory)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4);

  return ((data ?? []) as ProductCard[]).map(toBlogRelatedProduct);
}

/** Featured / directors picks when a post has no gem category match. */
export async function getBlogFallbackProducts(limit = 3) {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [] as BlogRelatedProduct[];

  const { data } = await sellableProductsQuery(supabase)
    .order('is_directors_pick', { ascending: false })
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(24);

  return shuffleTake((data ?? []) as ProductCard[], limit).map(toBlogRelatedProduct);
}

export async function getBlogRelatedProducts(href?: string): Promise<{
  products: BlogRelatedProduct[];
  usedFallback: boolean;
}> {
  const slug = href?.match(/^\/shop\/([^/?#]+)/)?.[1];
  if (!slug) {
    return { products: await getBlogFallbackProducts(3), usedFallback: true };
  }

  const [supabase, category] = await Promise.all([createOptionalPublicClient(), resolveShopCategoryPath(slug)]);
  if (!supabase || !category) {
    return { products: await getBlogFallbackProducts(3), usedFallback: true };
  }

  let query = sellableProductsQuery(supabase);
  if (category.sub_category) query = query.eq('sub_category', category.sub_category);
  else if (category.catalogSubcategories?.length) query = query.in('sub_category', category.catalogSubcategories);
  else if (category.category) query = query.eq('category', category.category);

  const { data } = await query.order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(3);
  const products = ((data ?? []) as ProductCard[]).map(toBlogRelatedProduct);
  if (products.length > 0) return { products, usedFallback: false };
  return { products: await getBlogFallbackProducts(3), usedFallback: true };
}
