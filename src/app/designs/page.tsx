import Link from 'next/link';
import type { Metadata } from 'next';
import {
  DESIGN_CATALOG_KINDS,
  DESIGN_CATALOG_META,
  listPublicDesigns,
} from '@/lib/designs/public';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/utils/seo';

export const revalidate = 1800;

export const metadata: Metadata = buildMetadata({
  title: 'Jewelry Designs | Rings, Pendants, Bracelets & Rudraksha',
  description:
    'Browse every Pure Vedic Gems jewelry design from the configurator — rings, pendants, bracelets, and Rudraksha mountings. Share any design link.',
  path: '/designs',
});

export default async function DesignsHubPage() {
  const counts = await Promise.all(
    DESIGN_CATALOG_KINDS.map(async (kind) => ({
      kind,
      count: (await listPublicDesigns(kind)).length,
    }))
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-6 pt-0 sm:px-6" aria-labelledby="designs-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-sm text-[#8a7a68]" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#6b3b23]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">Designs</span>
          </nav>
          <h1 className="section-title" id="designs-heading">
            Jewelry Designs
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-[#5a5043]">
            Every setting from the gem-to-jewelry configurator. Open a design, share the link, then
            configure it with your stone.
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
        {counts.map(({ kind, count }) => {
          const meta = DESIGN_CATALOG_META[kind];
          return (
            <Link
              key={kind}
              href={`/designs/${kind}`}
              className="group rounded-xl border border-[#e8dfd0] bg-white/80 p-5 transition hover:border-[#c4a574] hover:shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[#2c0404] group-hover:text-[#6b3b23]">
                {meta.plural}
              </h2>
              <p className="mt-1 text-sm text-[#5a5043]">{meta.blurb}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#8a7a68]">
                {count} design{count === 1 ? '' : 's'}
              </p>
            </Link>
          );
        })}
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', href: '/' },
          { name: 'Designs', href: '/designs' },
        ])}
      />
    </main>
  );
}
