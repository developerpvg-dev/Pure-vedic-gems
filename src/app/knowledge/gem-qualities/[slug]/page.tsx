import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GemLegacyQualityContent } from '@/components/knowledge/GemLegacyQualityContent';
import { GemQualityContent } from '@/components/knowledge/GemQualityContent';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getGemLegacyGuide,
  isLegacyGemQualitySlug,
} from '@/lib/constants/gem-legacy-quality-data';
import { GEM_QUALITIES } from '@/lib/constants/gem-qualities';
import {
  GEO_BUY_KEYWORDS_BY_DEST,
  geoBuyInternalJsonLd,
  geoBuyShipCopy,
  geoBuyCityList,
} from '@/lib/constants/geo-buy-seo';
import { absoluteUrl, buildMetadata } from '@/lib/utils/seo';

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

  const path = `/knowledge/gem-qualities/${gem.slug}`;
  const legacyGuide = isLegacyGemQualitySlug(slug) ? getGemLegacyGuide(slug) : null;
  const ogImage = absoluteUrl(
    legacyGuide?.tiers[0]?.images[0]?.src ?? gem.heroImage,
  );
  const cities = geoBuyCityList(path);
  const title = legacyGuide
    ? `${legacyGuide.legacyH1} | PureVedicGems`
    : `${gem.name} (${gem.hindiName}) Quality Guide – Natural vs Treated | PureVedicGems`;
  const baseDescription = legacyGuide
    ? legacyGuide.certificationQuote
    : `Identify natural ${gem.name} (${gem.hindiName}). Quality grades, common fakes, sources, beej mantra and Vedic wearing ritual for the ${gem.planet} gem. Trusted since 1937.`;
  const description =
    cities.length > 0
      ? `${baseDescription} Also serves buyers looking for certified ${gem.name} in ${cities.join(', ')}.`
      : baseDescription;

  return {
    ...buildMetadata({
      title,
      description,
      path,
      image: ogImage,
      type: 'article',
    }),
    keywords: GEO_BUY_KEYWORDS_BY_DEST[path],
  };
}

export default async function GemQualityPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const gem = GEM_QUALITIES.find((g) => g.slug === slug);
  if (!gem) notFound();

  const path = `/knowledge/gem-qualities/${gem.slug}`;
  const legacyGuide = isLegacyGemQualitySlug(slug) ? getGemLegacyGuide(slug) : null;
  const pageName = legacyGuide ? legacyGuide.legacyH1 : `${gem.name} Quality Guide`;
  const pageDescription = legacyGuide
    ? legacyGuide.certificationQuote
    : gem.intro;
  const shipNote = geoBuyShipCopy(gem.name, geoBuyCityList(path));

  return (
    <>
      <JsonLd data={geoBuyInternalJsonLd(path, absoluteUrl, pageName, pageDescription)} />
      {isLegacyGemQualitySlug(slug) ? (
        <GemLegacyQualityContent slug={slug} shipNote={shipNote} />
      ) : (
        <GemQualityContent slug={slug} shipNote={shipNote} />
      )}
    </>
  );
}
