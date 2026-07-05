import type { GemCategoryOption } from '@/lib/types/configurator';
import { resolveRudrakshaNavImage } from '@/lib/constants/rudraksha-category-images';
import {
  RUDRAKSHA_STOREFRONT_SLUGS,
  rudrakshaStorefrontSortOrder,
  rudrakshaSubcategoryLabel,
} from '@/lib/constants/rudraksha-subcategories';

export interface RudrakshaCategoryTile extends GemCategoryOption {
  image_url?: string;
  type: 'rudraksha';
}

type ApiRudrakshaCategory = {
  id: string;
  name: string;
  image_url?: string;
};

/** Canonical Rudraksha tiles — local mukhi images with optional admin overrides. */
export function buildRudrakshaCategoryTiles(
  apiCategories: ApiRudrakshaCategory[] = []
): RudrakshaCategoryTile[] {
  const bySlug = new Map(apiCategories.map((row) => [row.id, row]));

  return [...RUDRAKSHA_STOREFRONT_SLUGS]
    .sort((a, b) => rudrakshaStorefrontSortOrder(a) - rudrakshaStorefrontSortOrder(b))
    .map((slug) => {
      const api = bySlug.get(slug);
      return {
        id: slug,
        name: api?.name ?? rudrakshaSubcategoryLabel(slug),
        sanskrit: '',
        planet: '',
        color: '#5C4A2A',
        type: 'rudraksha' as const,
        image_url: resolveRudrakshaNavImage(slug, api?.image_url) ?? undefined,
      };
    });
}
