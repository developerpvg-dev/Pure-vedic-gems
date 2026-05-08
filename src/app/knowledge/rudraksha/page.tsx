import { KnowledgeCategoryListing, getKnowledgeCategoryMetadata } from '@/components/knowledge/KnowledgeCategoryListing';

export const metadata = getKnowledgeCategoryMetadata('rudraksha');
export const revalidate = 3600;

export default function RudrakshaKnowledgePage() {
  return <KnowledgeCategoryListing categoryKey="rudraksha" />;
}