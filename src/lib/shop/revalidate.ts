import { revalidatePath } from 'next/cache';
import { productHref } from '@/lib/categories/storefront';

type ProductLike = {
  slug?: string | null;
  category?: string | null;
  sub_category?: string | null;
};

/**
 * On-demand ISR invalidation after admin product mutations, so storefront
 * pages update immediately even with long revalidate windows.
 */
export function revalidateProductSurfaces(product?: ProductLike | null) {
  try {
    revalidatePath('/shop');

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
