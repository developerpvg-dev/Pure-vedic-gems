import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GemLegacyQualityContent } from '@/components/knowledge/GemLegacyQualityContent';
import { GemQualityContent } from '@/components/knowledge/GemQualityContent';
import {
  getGemLegacyGuide,
  isLegacyGemQualitySlug,
} from '@/lib/constants/gem-legacy-quality-data';
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
  const legacyGuide = isLegacyGemQualitySlug(slug) ? getGemLegacyGuide(slug) : null;
  const ogImage = absoluteUrl(
    legacyGuide?.tiers[0]?.images[0]?.src ?? gem.heroImage,
  );
  const title = legacyGuide
    ? `${legacyGuide.legacyH1} | PureVedicGems`
    : `${gem.name} (${gem.hindiName}) Quality Guide – Natural vs Treated | PureVedicGems`;
  const description = legacyGuide
    ? legacyGuide.certificationQuote
    : `Identify natural ${gem.name} (${gem.hindiName}). Quality grades, common fakes, sources, beej mantra and Vedic wearing ritual for the ${gem.planet} gem. Trusted since 1937.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: legacyGuide ? legacyGuide.legacyH1 : `${gem.name} — ${gem.hindiName} | PureVedicGems`,
      description: legacyGuide ? legacyGuide.aboutParagraphs[0] ?? description : gem.intro,
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
  if (isLegacyGemQualitySlug(slug)) {
    return <GemLegacyQualityContent slug={slug} />;
  }
  return <GemQualityContent slug={slug} />;
}
