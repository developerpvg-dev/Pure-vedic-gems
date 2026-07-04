import type { RichGemSections } from './helpers';
import { NAVARATNA_RICH_CONTENT } from './navaratna-content';
import { UPRATNA_RICH_CONTENT } from './upratna-content';
import { getCatalogRichContent } from './catalog-content';

export function getRichCategoryContent(
  slug: string,
  label: string,
  category: string,
): RichGemSections | null {
  if (NAVARATNA_RICH_CONTENT[slug]) {
    return NAVARATNA_RICH_CONTENT[slug];
  }
  if (UPRATNA_RICH_CONTENT[slug]) {
    return UPRATNA_RICH_CONTENT[slug];
  }
  const catalogCategory = category as 'rudraksha' | 'idol' | 'jewelry' | 'mala';
  if (['rudraksha', 'idol', 'jewelry', 'mala'].includes(category)) {
    return getCatalogRichContent(slug, label, catalogCategory);
  }
  return null;
}

export { NAVARATNA_RICH_CONTENT, UPRATNA_RICH_CONTENT, getCatalogRichContent };
