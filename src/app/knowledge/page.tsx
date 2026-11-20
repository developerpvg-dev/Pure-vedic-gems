import { KnowledgeHubPage } from '@/components/knowledge/KnowledgeHubPage';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata = buildMetadata({
  title: 'Certified Vedic Gemstones | Curated Gem Library',
  description:
    'Discover certified treasures from Pure Vedic Gems. Explore our collection and learn how to choose gemstones with confidence.',
  path: '/knowledge',
});

export const revalidate = 3600;

export default function KnowledgePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  return <KnowledgeHubPage siteUrl={siteUrl} />;
}
