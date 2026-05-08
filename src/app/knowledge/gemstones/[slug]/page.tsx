import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StaticGuideArticle } from '@/components/knowledge/StaticGuideArticle';
import { NAVARATNA_GUIDES, getNavaratnaGuide } from '@/lib/constants/static-knowledge-guides';

export const revalidate = 86400;

interface GemstoneGuidePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return NAVARATNA_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GemstoneGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getNavaratnaGuide(slug);
  if (!guide) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return {
    title: `${guide.title} | PureVedicGems`,
    description: guide.description,
    alternates: { canonical: `${siteUrl}/knowledge/gemstones/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
      url: `${siteUrl}/knowledge/gemstones/${guide.slug}`,
      images: [{ url: `${siteUrl}${guide.heroImage}`, width: 1200, height: 900 }],
    },
  };
}

export default async function GemstoneGuidePage({ params }: GemstoneGuidePageProps) {
  const { slug } = await params;
  const guide = getNavaratnaGuide(slug);
  if (!guide) notFound();

  return <StaticGuideArticle guide={guide} pathname={`/knowledge/gemstones/${guide.slug}`} />;
}