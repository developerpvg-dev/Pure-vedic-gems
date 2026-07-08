import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact Pure Vedic Gems Pvt. Ltd. — Saket showroom, Sultanpur Vedic Research Centre, and UK office. Call, email, or visit for certified gemstone guidance.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
