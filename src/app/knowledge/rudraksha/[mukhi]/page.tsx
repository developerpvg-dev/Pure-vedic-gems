import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RudrakshaGuideArticle } from '@/components/knowledge/RudrakshaGuideArticle';
import { RudrakshaLegacyGuideArticle } from '@/components/knowledge/RudrakshaLegacyGuideArticle';
import {
  RUDRAKSHA_RICH_GUIDES,
  getRichRudrakshaGuide,
} from '@/lib/constants/rudraksha-rich-content';

export const revalidate = 86400;

interface RudrakshaGuidePageProps {
  params: Promise<{ mukhi: string }>;
}

export function generateStaticParams() {
  return RUDRAKSHA_RICH_GUIDES.map((guide) => ({ mukhi: guide.slug }));
}

export async function generateMetadata({
  params,
}: RudrakshaGuidePageProps): Promise<Metadata> {
  const { mukhi } = await params;
  const guide = getRichRudrakshaGuide(mukhi);
  if (!guide) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';
  const description = `${guide.shortTitle} – Presiding Deity: ${guide.deity}. Ruling Planet: ${guide.planet}. Authentic, lab-certified, energised Rudrakshas direct from origin since 1937.`;

  return {
    title: `${guide.title} – Benefits, Mantra & How to Wear | PureVedicGems`,
    description,
    alternates: {
      canonical: `${siteUrl}/knowledge/rudraksha/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description,
      type: 'article',
      url: `${siteUrl}/knowledge/rudraksha/${guide.slug}`,
      images: [
        {
          url: `${siteUrl}${guide.heroImage}`,
          width: 1200,
          height: 900,
          alt: guide.title,
        },
      ],
    },
  };
}

export default async function RudrakshaGuidePage({
  params,
}: RudrakshaGuidePageProps) {
  const { mukhi } = await params;
  const guide = getRichRudrakshaGuide(mukhi);
  if (!guide) notFound();

  const pathname = `/knowledge/rudraksha/${guide.slug}`;
  const Article =
    guide.mukhi >= 15 ? RudrakshaLegacyGuideArticle : RudrakshaGuideArticle;

  return <Article guide={guide} pathname={pathname} />;
}