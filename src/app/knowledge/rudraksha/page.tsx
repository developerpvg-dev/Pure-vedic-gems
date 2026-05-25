import { getKnowledgeCategoryMetadata } from '@/components/knowledge/KnowledgeCategoryListing';
import { RudrakshaIndexContent } from '@/components/knowledge/RudrakshaIndexContent';

export const metadata = getKnowledgeCategoryMetadata('rudraksha');
export const revalidate = 3600;

export default function RudrakshaKnowledgePage() {
  return <RudrakshaIndexContent />;
}