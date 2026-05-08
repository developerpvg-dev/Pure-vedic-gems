import Link from 'next/link';
import type { Metadata } from 'next';
import { RingSizeGuide } from '@/components/tools/RingSizeGuide';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata, howToJsonLd } from '@/lib/utils/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Ring Size Guide | Indian, US, UK and EU Sizes',
  description: 'Compare Indian, US, UK, and EU ring sizes for gemstone rings and custom Vedic jewelry settings.',
  path: '/tools/ring-size-guide',
});

export default function RingSizeGuidePage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-32.5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-brand-muted">
          <Link href="/" className="hover:text-brand-accent">Home</Link>
          <span>/</span>
          <Link href="/tools/recommendation" className="hover:text-brand-accent">Tools</Link>
          <span>/</span>
          <span className="text-brand-primary">Ring Size Guide</span>
        </nav>
        <header className="mb-8 border-b border-brand-border pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-brand-accent">Jewelry Tool</p>
          <h1 className="font-heading text-brand-primary" style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1 }}>Ring Size Guide</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-brand-muted">Use the conversion chart before ordering custom gemstone rings, then confirm final fit and setting details with the team.</p>
        </header>
        <RingSizeGuide />
      </div>
      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Tools', href: '/tools/recommendation' }, { name: 'Ring Size Guide', href: '/tools/ring-size-guide' }]),
        howToJsonLd({ name: 'Choose a ring size', description: 'Measure and compare ring sizes for custom gemstone settings.', path: '/tools/ring-size-guide', steps: ['Measure inside diameter or compare an existing ring.', 'Match the measurement to Indian, US, UK, or EU sizing.', 'Confirm final size before custom jewelry production.'] }),
      ]} />
    </main>
  );
}