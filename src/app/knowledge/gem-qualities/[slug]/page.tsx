import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GemQualityContent } from '@/components/knowledge/GemQualityContent';
import { GEM_QUALITIES } from '@/lib/constants/gem-qualities';
import { absoluteUrl } from '@/lib/utils/seo';

export const revalidate = 86400;

export function generateStaticParams() {
  return GEM_QUALITIES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const gem = GEM_QUALITIES.find((g) => g.slug === slug);
  if (!gem) return { title: 'Gem Quality Guide | PureVedicGems' };

  const url = absoluteUrl(`/knowledge/gem-qualities/${gem.slug}`);
  const ogImage = absoluteUrl(gem.heroImage);
  return {
    title: `${gem.name} (${gem.hindiName}) Quality Guide – Natural vs Treated | PureVedicGems`,
    description: `Identify natural ${gem.name} (${gem.hindiName}). Quality grades, common fakes, sources, beej mantra and Vedic wearing ritual for the ${gem.planet} gem. Trusted since 1937.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${gem.name} — ${gem.hindiName} | PureVedicGems`,
      description: gem.intro,
      type: 'article',
      url,
      images: [{ url: ogImage, width: 1200, height: 900, alt: gem.name }],
    },
  };
}

export default async function GemQualityPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const gem = GEM_QUALITIES.find((g) => g.slug === slug);
  if (!gem) notFound();
  return <GemQualityContent slug={slug} />;
}
