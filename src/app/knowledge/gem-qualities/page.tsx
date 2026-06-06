import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/utils/seo';
import { GemsQualitiesIndexContent } from '@/components/knowledge/GemsQualitiesIndexContent';

export const revalidate = 86400;

export const metadata: Metadata = {
  title:
    'Gem Qualities – Identify Natural Ruby, Emerald, Sapphire & More | PureVedicGems',
  description:
    'The complete Vedic identification library for the nine planetary gemstones. Compare natural vs treated, quality grades, fake awareness and wearing rituals. Trusted since 1937.',
  alternates: {
    canonical: absoluteUrl('/knowledge/gem-qualities'),
  },
  openGraph: {
    title: 'Gem Qualities Library | PureVedicGems',
    description:
      'Identify natural Ruby, Emerald, Blue & Yellow Sapphire, Red Coral, Hessonite, Cat’s Eye, White Sapphire and Opal — Vedic authenticity guide.',
    type: 'website',
    url: absoluteUrl('/knowledge/gem-qualities'),
    images: [
      {
        url: absoluteUrl('/gems-knowledge/ruby.jpg'),
        width: 1200,
        height: 900,
        alt: 'Natural Ruby',
      },
    ],
  },
};

export default function GemQualitiesIndexPage() {
  return <GemsQualitiesIndexContent />;
}
