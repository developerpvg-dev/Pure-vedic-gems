import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  DESIGN_CATALOG_META,
  configureHrefForDesign,
  designHrefForKind,
  designSlug,
  getPublicDesignBySlug,
  isDesignCatalogKind,
  listPublicDesigns,
  type DesignCatalogKind,
} from '@/lib/designs/public';
import { DesignShareLink } from '@/components/designs/DesignShareLink';
import { DesignPricingDetails } from '@/components/designs/DesignPricingDetails';
import { getDesignConfiguratorNote } from '@/lib/utils/jewelry-design-fields';
import { designImageSrc } from '@/lib/utils/design-image';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata } from '@/lib/utils/seo';

export const revalidate = 1800;

type Props = { params: Promise<{ setting: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setting, slug } = await params;
  if (!isDesignCatalogKind(setting)) return {};
  const design = await getPublicDesignBySlug(setting, slug);
  if (!design) return {};
  const meta = DESIGN_CATALOG_META[setting];
  const path = designHrefForKind(setting, design.name);
  const note = getDesignConfiguratorNote(design);
  const description =
    note ||
    design.description?.trim() ||
    `${design.name} — ${meta.label.toLowerCase()} design from Pure Vedic Gems. Configure with your gemstone or Rudraksha.`;

  return buildMetadata({
    title: `${design.name} ${meta.label} Design | Pure Vedic Gems`,
    description,
    path,
    image: design.image_url,
  });
}

export async function generateStaticParams() {
  const kinds: DesignCatalogKind[] = ['ring', 'pendant', 'bracelet', 'rudraksha'];
  const out: { setting: string; slug: string }[] = [];
  for (const kind of kinds) {
    const designs = await listPublicDesigns(kind);
    for (const design of designs) {
      out.push({ setting: kind, slug: designSlug(design.name) });
    }
  }
  return out;
}

export default async function DesignDetailPage({ params }: Props) {
  const { setting, slug } = await params;
  if (!isDesignCatalogKind(setting)) notFound();

  const kind = setting as DesignCatalogKind;
  const design = await getPublicDesignBySlug(kind, slug);
  if (!design) notFound();

  const meta = DESIGN_CATALOG_META[kind];
  const path = designHrefForKind(kind, design.name)!;
  const bodyCopy = `Shareable ${meta.label.toLowerCase()} design from the Pure Vedic Gems configurator.`;

  return (
    <main className="min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav
          className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-[#8a7a68]"
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
          <Link href={`/designs/${kind}`} className="hover:text-[#6b3b23]">
            {meta.label}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#2c0404]">{design.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="overflow-hidden rounded-xl border border-[#e8dfd0] bg-white/80">
            <div className="relative aspect-square bg-[#faf8f5]">
              {design.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={designImageSrc(design.image_url)}
                  alt={design.name}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-[#c4a574]">◆</div>
              )}
            </div>
            {design.video_url ? (
              <div className="border-t border-[#f0e8dc] p-3">
                <a
                  href={design.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#6b3b23] underline-offset-2 hover:underline"
                >
                  Watch design video
                </a>
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a7a68]">
              {meta.label} design
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-[#2c0404]">{design.name}</h1>
            <p className="mt-3 text-[#5a5043]">{bodyCopy}</p>

            <DesignPricingDetails design={design} />

            <div className="mt-5">
              <DesignShareLink path={path} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={configureHrefForDesign(design.id, kind)}
                className="inline-flex items-center justify-center rounded-md bg-[#6b3b23] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5a3120]"
              >
                Configure this design
              </Link>
              <Link
                href={`/designs/${kind}`}
                className="inline-flex items-center justify-center rounded-md border border-[#d8bd75] px-4 py-2.5 text-sm font-semibold text-[#6b3b23] transition hover:bg-[#f0eadd]"
              >
                All {meta.plural.toLowerCase()}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Designs', href: '/designs' },
            { name: meta.plural, href: `/designs/${kind}` },
            { name: design.name, href: path },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: `${design.name} ${meta.label} Design`,
            description: bodyCopy,
            image: design.image_url ? absoluteUrl(designImageSrc(design.image_url)) : undefined,
            brand: { '@type': 'Brand', name: 'PureVedicGems' },
            url: absoluteUrl(path),
          },
        ]}
      />
    </main>
  );
}
