import { KnowledgeHubPage } from '@/components/knowledge/KnowledgeHubPage';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata = buildMetadata({
  title: 'The Vedic Gem Library | PureVedicGems',
  description:
    'Vedic knowledge library — Navaratna guides, Rudraksha, gem qualities, treatments, energization, care, astrology, and buying safety from Pure Vedic Gems.',
  path: '/knowledge',
});

export const revalidate = 3600;

export default function KnowledgePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  return <KnowledgeHubPage siteUrl={siteUrl} />;
}
