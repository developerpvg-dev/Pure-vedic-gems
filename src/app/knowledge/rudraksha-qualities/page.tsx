import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/utils/seo';
import { RudrakshaQualitiesContent } from '@/components/knowledge/RudrakshaQualitiesContent';

export const revalidate = 86400;

export const metadata: Metadata = {
  title:
    'Rudraksha Qualities – Genuine vs Fake, Mukhi Guide & FAQs | PureVedicGems',
  description:
    'Learn how to identify authentic Rudraksha beads. Compare High, Medium and Lower quality. Full table of mukhis (1–21), presiding deities, ruling planets and beej mantras. Trusted since 1937.',
  alternates: {
    canonical: absoluteUrl('/knowledge/rudraksha-qualities'),
  },
  openGraph: {
    title: 'Rudraksha Qualities | PureVedicGems',
    description:
      'How to identify genuine Rudraksha — quality grades, fake bead awareness, mukhi reference table and FAQs.',
    type: 'article',
    url: absoluteUrl('/knowledge/rudraksha-qualities'),
    images: [
      {
        url: absoluteUrl('/rudraksha-knowledge/rq-genuine.png'),
        width: 1200,
        height: 900,
        alt: 'Genuine Rudraksha',
      },
    ],
  },
};

export default function RudrakshaQualitiesPage() {
  return <RudrakshaQualitiesContent />;
}
