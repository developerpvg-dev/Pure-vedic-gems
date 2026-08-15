import { revalidatePath, revalidateTag } from 'next/cache';
import { productHref } from '@/lib/categories/storefront';
import { SHOP_FILTER_FACETS_CACHE_TAG } from '@/lib/shop/filters';

type ProductLike = {
  slug?: string | null;
  category?: string | null;
  sub_category?: string | null;
};

/**
 * On-demand ISR invalidation after catalog / inventory mutations, so
 * storefront pages update immediately even with long revalidate windows.
 */
export function revalidateProductSurfaces(product?: ProductLike | null) {
  try {
    revalidatePath('/');
    revalidatePath('/shop');
    // A product can appear in multiple catalog routes. Invalidate the route
    // patterns as well as the known path so stock and pricing changes cannot
    // wait for the ISR safety window on another category or product page.
    revalidatePath('/shop/[category]', 'page');
    revalidatePath('/shop/[category]/[slug]', 'page');
    revalidatePath('/merchant-feed.xml');
    revalidateTag(SHOP_FILTER_FACETS_CACHE_TAG, 'max');

    if (product?.category) revalidatePath(`/shop/${product.category}`);
    if (product?.sub_category) revalidatePath(`/shop/${product.sub_category}`);
    if (product?.slug) {
      revalidatePath(productHref({
        slug: product.slug,
        category: product.category ?? null,
        sub_category: product.sub_category ?? null,
      }));
    }
  } catch (error) {
    // Revalidation is best-effort; never fail the mutation because of it.
    console.warn('[revalidate] product surfaces failed:', error instanceof Error ? error.message : error);
  }
}
