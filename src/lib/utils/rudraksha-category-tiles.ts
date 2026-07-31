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

/** Canonical Rudraksha tiles — admin image, then sample product thumb, then local mukhi card. */
export function buildRudrakshaCategoryTiles(
  apiCategories: ApiRudrakshaCategory[] = [],
  sampleThumbs: ReadonlyMap<string, string> | Record<string, string> = {},
): RudrakshaCategoryTile[] {
  const bySlug = new Map(apiCategories.map((row) => [row.id, row]));
  const thumbs =
    sampleThumbs instanceof Map
      ? sampleThumbs
      : new Map(Object.entries(sampleThumbs));

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
        image_url: resolveRudrakshaNavImage(slug, api?.image_url, thumbs.get(slug)) ?? undefined,
      };
    });
}
