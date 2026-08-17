import type { RichGemSections } from './helpers';
import { NAVARATNA_HUB_CONTENT, NAVARATNA_RICH_CONTENT } from './navaratna-content';
import { RUDRAKSHA_HUB_CONTENT } from './rudraksha-content';
import { UPRATNA_HUB_CONTENT, UPRATNA_RICH_CONTENT } from './upratna-content';
import { getCatalogRichContent } from './catalog-content';

export function getRichCategoryContent(
  slug: string,
  label: string,
  category: string,
): RichGemSections | null {
  if (slug === 'navaratna' || slug === 'navratna') {
    return NAVARATNA_HUB_CONTENT;
  }
  if (slug === 'rudraksha') {
    return RUDRAKSHA_HUB_CONTENT;
  }
  if (slug === 'upratna') {
    return UPRATNA_HUB_CONTENT;
  }
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

export { NAVARATNA_RICH_CONTENT, UPRATNA_HUB_CONTENT, UPRATNA_RICH_CONTENT, RUDRAKSHA_HUB_CONTENT, getCatalogRichContent };
