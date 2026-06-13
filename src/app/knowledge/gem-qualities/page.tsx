import type { Metadata } from 'next';
import { getHomeManagedCategories } from '@/components/home/PvgManagedCategorySections';
import { GemsQualitiesIndexContent } from '@/components/knowledge/GemsQualitiesIndexContent';
import { gemQualityCardImage } from '@/lib/categories/gem-quality-images';
import { GEM_QUALITIES } from '@/lib/constants/gem-qualities';
import { absoluteUrl } from '@/lib/utils/seo';

export const revalidate = 3600;

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
      'Identify natural Ruby, Emerald, Blue & Yellow Sapphire, Red Coral, Hessonite, Cat’s Eye, White Sapphire, Pearl and Opal — Vedic authenticity guide.',
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

export default async function GemQualitiesIndexPage() {
  const managedCategories = await getHomeManagedCategories();
  const gems = GEM_QUALITIES.map((gem) => ({
    ...gem,
    cardImage: gemQualityCardImage(
      gem.slug,
      managedCategories.navaratna,
      gem.heroImage,
      managedCategories.upratna,
    ),
  }));

  return <GemsQualitiesIndexContent gems={gems} />;
}
