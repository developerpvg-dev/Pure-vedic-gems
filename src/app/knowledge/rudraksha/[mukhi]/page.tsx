import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StaticGuideArticle } from '@/components/knowledge/StaticGuideArticle';
import { RUDRAKSHA_GUIDES, getRudrakshaGuide } from '@/lib/constants/static-knowledge-guides';

export const revalidate = 86400;

interface RudrakshaGuidePageProps {
  params: Promise<{ mukhi: string }>;
}

export function generateStaticParams() {
  return RUDRAKSHA_GUIDES.map((guide) => ({ mukhi: guide.slug }));
}

export async function generateMetadata({ params }: RudrakshaGuidePageProps): Promise<Metadata> {
  const { mukhi } = await params;
  const guide = getRudrakshaGuide(mukhi);
  if (!guide) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return {
    title: `${guide.title} | PureVedicGems`,
    description: guide.description,
    alternates: { canonical: `${siteUrl}/knowledge/rudraksha/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      url: `${siteUrl}/knowledge/rudraksha/${guide.slug}`,
      images: [{ url: `${siteUrl}${guide.heroImage}`, width: 1200, height: 900 }],
    },
  };
}

export default async function RudrakshaGuidePage({ params }: RudrakshaGuidePageProps) {
  const { mukhi } = await params;
  const guide = getRudrakshaGuide(mukhi);
  if (!guide) notFound();

  return <StaticGuideArticle guide={guide} pathname={`/knowledge/rudraksha/${guide.slug}`} />;
}