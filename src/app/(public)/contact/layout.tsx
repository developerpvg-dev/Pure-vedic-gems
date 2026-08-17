import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Contact PureVedicGems | Expert Gemstone Help',
  description:
    'Contact Pure Vedic Gems Pvt. Ltd. — Saket showroom, Sultanpur Vedic Research Centre, and UK office. Call, email, or visit for certified gemstone guidance.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
