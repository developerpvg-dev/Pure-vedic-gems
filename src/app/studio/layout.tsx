import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'CMS',
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fixed inset-0 z-50 overflow-hidden bg-white">{children}</div>;
}
