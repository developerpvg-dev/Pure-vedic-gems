import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/utils/seo';
import { RudrakshaQualitiesContent } from '@/components/knowledge/RudrakshaQualitiesContent';

export const revalidate = 86400;

export const metadata: Metadata = {
  title:
    'Buy Certified Natural Rudraksha Beads in Delhi NCR/India | Buy Astrological Rudrakshas Online | Lab Certified Rudraksha Delhi NCR, India: Purevedicgems',
  description:
    'Oldest & most trusted genuine Rudraksha seller in India. Learn how to identify authentic Rudraksha quality, compare genuine vs fake beads, mukhi types, ruling deities, planets, mantras and FAQs. Certified since 1937.',
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
