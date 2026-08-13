import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  DESIGN_CATALOG_META,
  designHrefForKind,
  designSlug,
  isDesignCatalogKind,
  listPublicDesigns,
  type DesignCatalogKind,
} from '@/lib/designs/public';
import { designImageSrc } from '@/lib/utils/design-image';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, buildMetadata } from '@/lib/utils/seo';

export const revalidate = 1800;

type Props = { params: Promise<{ setting: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setting } = await params;
  if (!isDesignCatalogKind(setting)) return {};
  const meta = DESIGN_CATALOG_META[setting];
  return buildMetadata({
    title: `${meta.plural} | Pure Vedic Gems`,
    description: meta.blurb,
    path: `/designs/${setting}`,
  });
}

export async function generateStaticParams() {
  return [
    { setting: 'ring' },
    { setting: 'pendant' },
    { setting: 'bracelet' },
    { setting: 'rudraksha' },
  ];
}

export default async function DesignGalleryPage({ params }: Props) {
  const { setting } = await params;
  if (!isDesignCatalogKind(setting)) notFound();

  const kind = setting as DesignCatalogKind;
  const meta = DESIGN_CATALOG_META[kind];
  const designs = await listPublicDesigns(kind);

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-6 pt-0 sm:px-6" aria-labelledby="design-gallery-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav
            className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-sm text-[#8a7a68]"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-[#6b3b23]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/designs" className="hover:text-[#6b3b23]">
              Designs
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">{meta.label}</span>
          </nav>
          <h1 className="section-title" id="design-gallery-heading">
            {meta.plural}
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-[#5a5043]">{meta.blurb}</p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" aria-label={meta.plural}>
        {designs.length === 0 ? (
          <p className="text-center text-sm text-[#5a5043]">No designs published yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {designs.map((design) => {
              const href = designHrefForKind(kind, design.name);
              return (
                <li key={design.id}>
                  <Link
                    href={href}
                    className="group block overflow-hidden rounded-lg border border-[#e8dfd0] bg-white/80 transition hover:border-[#c4a574] hover:shadow-sm"
                  >
                    <div className="relative aspect-square bg-[#faf8f5]">
                      {design.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- design assets are Excel embeds / storage URLs
                        <img
                          src={designImageSrc(design.image_url)}
                          alt={design.name}
                          className="h-full w-full object-contain p-2"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl text-[#c4a574]">
                          ◆
                        </div>
                      )}
                    </div>
                    <div className="border-t border-[#f0e8dc] px-2 py-2">
                      <p className="truncate text-xs font-medium text-[#2c0404] group-hover:text-[#6b3b23]">
                        {design.name}
                      </p>
                      <p className="truncate text-[10px] text-[#8a7a68]">
                        /designs/{kind}/{designSlug(design.name)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', href: '/' },
          { name: 'Designs', href: '/designs' },
          { name: meta.plural, href: `/designs/${kind}` },
        ])}
      />
    </main>
  );
}
