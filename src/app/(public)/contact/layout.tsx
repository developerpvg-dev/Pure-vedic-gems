import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with PureVedicGems — visit our showrooms in Delhi and London, call us, or send a message. Expert Vedic gemstone guidance available.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
