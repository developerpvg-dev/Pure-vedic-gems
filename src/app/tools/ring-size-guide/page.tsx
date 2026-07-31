import Link from 'next/link';
import type { Metadata } from 'next';
import { RingSizeGuide } from '@/components/tools/RingSizeGuide';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata, howToJsonLd } from '@/lib/utils/seo';
import '../tools-page.css';

export const metadata: Metadata = buildMetadata({
  title: 'Ring Size Guide | Indian, US, UK and EU Sizes',
  description: 'Compare Indian, US, UK, and EU ring sizes for gemstone rings and custom Vedic jewelry settings.',
  path: '/tools/ring-size-guide',
});

export default function RingSizeGuidePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-6 pt-0 sm:px-6" aria-labelledby="ring-size-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="pvg-tools-breadcrumb mb-3" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tools/recommendation">Tools</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">Ring Size Guide</span>
          </nav>
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="ring-size-heading">
              Ring Size Guide
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Use the conversion chart before ordering custom gemstone rings, then confirm final fit and setting details with the team.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Ring size conversion chart">
        <RingSizeGuide />
      </section>

      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Tools', href: '/tools/recommendation' }, { name: 'Ring Size Guide', href: '/tools/ring-size-guide' }]),
        howToJsonLd({ name: 'Choose a ring size', description: 'Measure and compare ring sizes for custom gemstone settings.', path: '/tools/ring-size-guide', steps: ['Measure inside diameter or compare an existing ring.', 'Match the measurement to Indian, US, UK, or EU sizing.', 'Confirm final size before custom jewelry production.'] }),
      ]} />
    </main>
  );
}
