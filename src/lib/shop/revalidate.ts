import { revalidatePath, revalidateTag } from 'next/cache';
import { productHref, internalShopProductHref } from '@/lib/categories/storefront';
import { SHOP_FILTER_FACETS_CACHE_TAG } from '@/lib/shop/filters';
import { bumpWorkerEdgeCache } from '@/lib/cloudflare/bump-edge-cache';

type ProductLike = {
  slug?: string | null;
  category?: string | null;
  sub_category?: string | null;
};

/**
 * On-demand ISR invalidation after catalog / inventory mutations, so
 * storefront pages update immediately even with long revalidate windows.
 * Also bumps Worker edge-cache generation so the 15m Cache API layer drops stale HTML/RSC.
 */
export function revalidateProductSurfaces(product?: ProductLike | null) {
  try {
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/merchant-feed.xml');
    revalidateTag(SHOP_FILTER_FACETS_CACHE_TAG, 'max');

    if (product?.category) revalidatePath(`/shop/${product.category}`);
    if (product?.sub_category) revalidatePath(`/shop/${product.sub_category}`);
    if (product?.slug) {
      const row = {
        slug: product.slug,
        category: product.category ?? null,
        sub_category: product.sub_category ?? null,
      };
      revalidatePath(internalShopProductHref(row));
      revalidatePath(productHref(row));
    } else {
      // Bulk inventory / unknown product: invalidate every catalog route pattern once.
      revalidatePath('/shop/[category]', 'page');
      revalidatePath('/shop/[category]/[slug]', 'page');
    }
  } catch (error) {
    // Revalidation is best-effort; never fail the mutation because of it.
    console.warn('[revalidate] product surfaces failed:', error instanceof Error ? error.message : error);
  }

  void bumpWorkerEdgeCache();
}
