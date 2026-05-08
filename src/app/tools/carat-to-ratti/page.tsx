import Link from 'next/link';
import type { Metadata } from 'next';
import { CaratRattiTool } from '@/components/tools/CaratRattiTool';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata, howToJsonLd } from '@/lib/utils/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Carat to Ratti Converter | PureVedicGems Tools',
  description: 'Convert gemstone carat weight to Indian ratti using 1 carat = 1.1 ratti, with buying guidance for certified Vedic gemstones.',
  path: '/tools/carat-to-ratti',
});

export default function CaratToRattiPage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-32.5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-brand-muted">
          <Link href="/" className="hover:text-brand-accent">Home</Link>
          <span>/</span>
          <Link href="/tools/recommendation" className="hover:text-brand-accent">Tools</Link>
          <span>/</span>
          <span className="text-brand-primary">Carat to Ratti</span>
        </nav>
        <header className="mb-8 border-b border-brand-border pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-brand-accent">Gemstone Tool</p>
          <h1 className="font-heading text-brand-primary" style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1 }}>Carat to Ratti Converter</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-brand-muted">Convert gemstone weight between international carat and traditional Indian ratti before comparing certified options.</p>
        </header>
        <CaratRattiTool />
      </div>
      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Tools', href: '/tools/recommendation' }, { name: 'Carat to Ratti', href: '/tools/carat-to-ratti' }]),
        howToJsonLd({ name: 'Convert carat to ratti', description: 'Use 1 carat = 1.1 ratti for gemstone weight conversion.', path: '/tools/carat-to-ratti', steps: ['Enter the gemstone weight in carats.', 'Review the automatically calculated ratti value.', 'Use the result alongside certificate, origin, treatment, and setting guidance.'] }),
      ]} />
    </main>
  );
}