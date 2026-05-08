import { KnowledgeCategoryListing, getKnowledgeCategoryMetadata } from '@/components/knowledge/KnowledgeCategoryListing';

export const metadata = getKnowledgeCategoryMetadata('gemstones');
export const revalidate = 3600;

export default function GemstoneKnowledgePage() {
  return <KnowledgeCategoryListing categoryKey="gemstones" />;
}