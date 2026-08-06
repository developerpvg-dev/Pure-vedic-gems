import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GeoGemLandingView } from '@/components/geo/GeoGemLandingView';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  getAllGeoGemLandingSlugs,
  getGeoGemLanding,
  geoGemLandingJsonLd,
} from '@/lib/constants/geo-gem-landings';
import { absoluteUrl, buildMetadata } from '@/lib/utils/seo';
import '../geo-gem-landing.css';

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return getAllGeoGemLandingSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getGeoGemLanding(slug);
  if (!page) return { title: 'Gemstone Guide | PureVedicGems' };

  const base = buildMetadata({
    title: page.title.includes('PureVedic') ? page.title : `${page.title} | PureVedicGems`,
    description: page.description,
    path: page.path,
    image: page.ogImage,
    type: 'article',
  });

  return {
    ...base,
    keywords: page.keywords,
    openGraph: {
      ...base.openGraph,
      locale: page.locale,
      alternateLocale: ['en_IN', 'en_US', 'en_GB', 'en_AE', 'en_AU', 'en_CA', 'en_PH', 'en_CH'],
    },
    other: {
      'geo.region': page.region,
      'geo.placename': page.region,
    },
  };
}

export default async function GeoGemLandingSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getGeoGemLanding(slug);
  if (!page) notFound();

  const schemas = geoGemLandingJsonLd(page, absoluteUrl);

  return (
    <>
      {schemas.map((data, i) => (
        <JsonLd key={i} data={data as Record<string, unknown>} />
      ))}
      <GeoGemLandingView page={page} />
    </>
  );
}
