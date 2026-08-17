import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/utils/seo';

// Tool is paused — all SEO equity points at the expert recommendation page.
export const metadata: Metadata = buildMetadata({
  title: 'Gemstone Recommendation | PureVedicGems',
  description:
    'Get an expert Vedic gemstone and Rudraksha recommendation by birth chart. Book your Kundli review online.',
  path: '/gems-recommendations',
  noIndex: true,
});

export default function RecommendationToolPage() {
  permanentRedirect('/gems-recommendations');
}
