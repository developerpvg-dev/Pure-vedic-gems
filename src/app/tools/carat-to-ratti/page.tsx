import Link from 'next/link';
import type { Metadata } from 'next';
import { CaratRattiTool } from '@/components/tools/CaratRattiTool';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata, howToJsonLd } from '@/lib/utils/seo';
import '../tools-page.css';

export const metadata: Metadata = buildMetadata({
  title: 'Carat to Ratti Converter | PureVedicGems Tools',
  description: 'Convert gemstone carat weight to Indian ratti using 1 carat = 1.1 ratti, with buying guidance for certified Vedic gemstones.',
  path: '/tools/carat-to-ratti',
});

export default function CaratToRattiPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="carat-ratti-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="pvg-tools-breadcrumb mb-6" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/tools/recommendation">Tools</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">Carat to Ratti</span>
          </nav>
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="carat-ratti-heading">
              Carat to Ratti Converter
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Convert gemstone weight between international carat and traditional Indian ratti before comparing certified options.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Carat to ratti converter">
        <CaratRattiTool />
      </section>

      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Tools', href: '/tools/recommendation' }, { name: 'Carat to Ratti', href: '/tools/carat-to-ratti' }]),
        howToJsonLd({ name: 'Convert carat to ratti', description: 'Use 1 carat = 1.1 ratti for gemstone weight conversion.', path: '/tools/carat-to-ratti', steps: ['Enter the gemstone weight in carats.', 'Review the automatically calculated ratti value.', 'Use the result alongside certificate, origin, treatment, and setting guidance.'] }),
      ]} />
    </main>
  );
}
