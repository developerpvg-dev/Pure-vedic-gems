import { getHomeManagedCategories } from '@/components/home/PvgManagedCategorySections';
import { GemsQualitiesIndexContent } from '@/components/knowledge/GemsQualitiesIndexContent';
import { gemQualityCardImage } from '@/lib/categories/gem-quality-images';
import { GEM_QUALITIES } from '@/lib/constants/gem-qualities';
import { buildMetadata } from '@/lib/utils/seo';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: 'Gem Qualities – Identify Natural Ruby, Emerald, Sapphire',
  description:
    'The complete Vedic identification library for the nine planetary gemstones. Compare natural vs treated, quality grades, fake awareness and wearing rituals. Trusted since 1937.',
  path: '/knowledge/gem-qualities',
  image: '/gems-knowledge/ruby.jpg',
});

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
