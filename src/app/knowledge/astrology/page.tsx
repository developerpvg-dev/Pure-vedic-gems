import { KnowledgeCategoryListing, getKnowledgeCategoryMetadata } from '@/components/knowledge/KnowledgeCategoryListing';

export const metadata = getKnowledgeCategoryMetadata('astrology');
export const revalidate = 3600;

export default function AstrologyKnowledgePage() {
  return <KnowledgeCategoryListing categoryKey="astrology" />;
}