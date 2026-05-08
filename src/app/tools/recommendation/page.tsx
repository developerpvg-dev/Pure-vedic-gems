import Link from 'next/link';
import type { Metadata } from 'next';
import { GemRecommendationTool } from '@/components/tools/GemRecommendationTool';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata, serviceJsonLd } from '@/lib/utils/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Gemstone Recommendation Tool | PureVedicGems',
  description: 'Get a preliminary Vedic gemstone shortlist using birth details, purpose, and budget before expert consultation.',
  path: '/tools/recommendation',
});

export default function RecommendationToolPage() {
  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-32.5 md:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-brand-muted">
          <Link href="/" className="hover:text-brand-accent">Home</Link>
          <span>/</span>
          <span className="text-brand-primary">Recommendation Tool</span>
        </nav>
        <header className="mb-8 border-b border-brand-border pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-brand-accent">Vedic Tool</p>
          <h1 className="font-heading text-brand-primary" style={{ fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1 }}>Gemstone Recommendation Tool</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-brand-muted">Generate a careful starting shortlist from your purpose, budget, and birth details. Final wearing advice still belongs with a qualified consultation.</p>
        </header>
        <GemRecommendationTool />
      </div>
      <JsonLd data={[
        breadcrumbJsonLd([{ name: 'Home', href: '/' }, { name: 'Recommendation Tool', href: '/tools/recommendation' }]),
        serviceJsonLd({ name: 'Gemstone Recommendation Tool', description: 'A preliminary Vedic gemstone recommendation workflow before expert consultation.', path: '/tools/recommendation' }),
      ]} />
    </main>
  );
}