import { KnowledgeCategoryListing, getKnowledgeCategoryMetadata } from '@/components/knowledge/KnowledgeCategoryListing';

export const metadata = getKnowledgeCategoryMetadata('buying-guides');
export const revalidate = 3600;

export default function BuyingGuidesKnowledgePage() {
  return <KnowledgeCategoryListing categoryKey="buying-guides" />;
}