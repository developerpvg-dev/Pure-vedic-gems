import { navaratnaNavImage } from '@/lib/constants/navaratna-category-images';
import { rudrakshaMukhiImage } from '@/lib/constants/rudraksha-category-images';
import { upratnaNavImage } from '@/lib/constants/upratna-category-images';
import { toPublicAssetUrl } from '@/lib/site-static';

/** Prefer uploaded category images; local nav thumbnails are fallback only. */
export function resolveCategoryNavImage(slug: string, image?: string | null): string | null {
  if (image) return toPublicAssetUrl(image);
  const local = rudrakshaMukhiImage(slug) ?? navaratnaNavImage(slug) ?? upratnaNavImage(slug);
  return local ? toPublicAssetUrl(local) : null;
}

export function collectGemstoneNavImageUrls(
  groups: Array<{ slug: string; subcategories: Array<{ slug: string; image?: string | null }> }>,
): string[] {
  const urls = new Set<string>();
  for (const group of groups) {
    if (group.slug !== 'navaratna' && group.slug !== 'upratna') continue;
    for (const sub of group.subcategories) {
      const src = resolveCategoryNavImage(sub.slug, sub.image);
      if (src) urls.add(src);
    }
  }
  return [...urls];
}
