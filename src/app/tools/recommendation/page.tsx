import Link from 'next/link';
import type { Metadata } from 'next';
import { GemRecommendationTool } from '@/components/tools/GemRecommendationTool';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata, serviceJsonLd } from '@/lib/utils/seo';
import '../tools-page.css';

export const metadata: Metadata = buildMetadata({
  title: 'Gemstone Recommendation Tool | PureVedicGems',
  description: 'Get a preliminary Vedic gemstone shortlist using birth details, purpose, and budget before expert consultation.',
  path: '/tools/recommendation',
});

export default function RecommendationToolPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="recommendation-tool-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="pvg-tools-breadcrumb mb-6" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">Recommendation Tool</span>
          </nav>
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="recommendation-tool-heading">
              Gemstone Recommendation Tool
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Generate a careful starting shortlist from your purpose, budget, and birth details. Final wearing advice still belongs with a qualified consultation.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label="Recommendation tool">
        <GemRecommendationTool />
      </section>

      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Recommendation Tool', href: '/tools/recommendation' }]),
        serviceJsonLd({ name: 'Gemstone Recommendation Tool', description: 'A preliminary Vedic gemstone recommendation workflow before expert consultation.', path: '/tools/recommendation' }),
      ]} />
    </main>
  );
}
