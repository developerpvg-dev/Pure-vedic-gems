import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, CreditCard, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { formatPrice } from '@/lib/utils/format';
import { buildMetadata, serviceJsonLd } from '@/lib/utils/seo';

export const revalidate = 300;

type YagyaDetailRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  short_desc: string | null;
  description: string | null;
  benefits: unknown;
  price: number;
  images: unknown;
  thumbnail_url: string | null;
  planet: string | null;
  service_duration: string | null;
  service_delivery_mode: string | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  availability_status: string | null;
  sold_individually: boolean | null;
};

function firstImage(images: unknown, thumbnail: string | null): string | null {
  if (thumbnail) return thumbnail;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first && typeof (first as { url: unknown }).url === 'string') {
      return (first as { url: string }).url;
    }
  }
  return null;
}

function benefitList(benefits: unknown): string[] {
  if (!Array.isArray(benefits)) return [];
  return benefits.filter((b): b is string => typeof b === 'string');
}

async function getYagya(slug: string): Promise<YagyaDetailRow | null> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('products')
    .select('id, slug, sku, name, short_desc, description, benefits, price, images, thumbnail_url, planet, service_duration, service_delivery_mode, in_stock, stock_quantity, availability_status, sold_individually')
    .eq('slug', slug)
    .eq('product_type', 'service')
    .eq('is_active', true)
    .maybeSingle();
  return data ? (data as unknown as YagyaDetailRow) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const yagya = await getYagya(slug);
  if (!yagya) return buildMetadata({ title: 'Yagya not found', description: '', path: `/vedic-yagyas/${slug}`, noIndex: true });
  return buildMetadata({
    title: `${yagya.name} — Vedic Yagya`,
    description: yagya.short_desc ?? `Book the ${yagya.name} performed by learned pandits.`,
    path: `/vedic-yagyas/${yagya.slug}`,
  });
}

export default async function YagyaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const yagya = await getYagya(slug);
  if (!yagya) notFound();

  const imageUrl = firstImage(yagya.images, yagya.thumbnail_url);
  const benefits = benefitList(yagya.benefits);

  const jsonLd = serviceJsonLd({
    name: yagya.name,
    description: yagya.short_desc ?? yagya.name,
    path: `/vedic-yagyas/${yagya.slug}`,
    provider: 'PureVedicGems',
  });

  return (
    <main className="bg-[#fbf7ef]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pt-36">

        {/* breadcrumb */}
        <nav className="mb-8 text-sm text-slate-400">
          <Link href="/vedic-yagyas-service" className="hover:text-[#7A1515]">Vedic Yagyas</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-600">{yagya.name}</span>
        </nav>

        {/* hero grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#7A1515]/15 bg-[#fff7eb]">
            {imageUrl ? (
              <Image src={imageUrl} alt={yagya.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Flame className="h-24 w-24 text-[#7A1515]/30" />
              </span>
            )}
          </div>

          {/* right panel */}
          <div className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#7A1515]">Vedic Yagya Service</p>
            <h1 className="mt-2 text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl">{yagya.name}</h1>
            {yagya.short_desc && <p className="mt-2 text-sm leading-7 text-slate-500">{yagya.short_desc}</p>}

            {Number(yagya.price) > 0 && (
              <div className="mt-4">
                <p className="text-2xl font-bold text-[#7A1515]">{formatPrice(Number(yagya.price))}</p>
                <p className="mt-1 text-xs text-slate-400">Suggested offering · Final amount confirmed with you</p>
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/vedic-yagyas/${yagya.slug}/buy`}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#7A1515] bg-[#7A1515] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f1010]"
              >
                <CreditCard className="h-4 w-4" />
                Book &amp; Pay
              </Link>
              <a
                href="#enquire"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#7A1515]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#7A1515] transition hover:bg-[#fff7eb]"
              >
                <Flame className="h-4 w-4" />
                Enquire First
              </a>
            </div>

            {/* meta badges */}
            {(yagya.service_duration || yagya.service_delivery_mode) && (
              <dl className="mt-6 grid grid-cols-2 gap-3">
                {yagya.service_duration && (
                  <div className="rounded-lg border border-[#7A1515]/15 bg-white p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Muhurat</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-700">{yagya.service_duration}</dd>
                  </div>
                )}
                {yagya.service_delivery_mode && (
                  <div className="rounded-lg border border-[#7A1515]/15 bg-white p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-700">{yagya.service_delivery_mode}</dd>
                  </div>
                )}
              </dl>
            )}

            {/* benefits */}
            {benefits.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[#7A1515]">Benefits</h2>
                <ul className="mt-3 space-y-2">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1515]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* full description */}
        {yagya.description && (
          <section className="mt-12 border-t border-[#7A1515]/10 pt-10">
            <h2 className="mb-4 text-lg font-semibold text-[#7A1515]">About this Yagya</h2>
            <div className="prose prose-sm max-w-none text-slate-600 [&_h2]:text-[#7A1515] [&_h3]:text-[#7A1515] [&_a]:text-[#7A1515]" dangerouslySetInnerHTML={{ __html: yagya.description }} />
          </section>
        )}

        {/* contact for enquiry */}
        <section id="enquire" className="mt-12 scroll-mt-24 border-t border-[#7A1515]/10 pt-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Enquire About This Yagya</h2>
          <p className="mb-5 text-sm leading-7 text-slate-500">
            Have questions about the ritual process, samagri, or muhurat? Reach out to our Vedic team directly — we will guide you through every step before and after booking.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="tel:+911141001000"
              className="inline-flex items-center gap-2 rounded-md border border-[#7A1515]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#7A1515] transition hover:bg-[#fff7eb]"
            >
              <Phone className="h-4 w-4" />
              Call Us: +91-11-4100-1000
            </a>
            <a
              href="https://wa.me/919810190140?text=I%20want%20to%20enquire%20about%20the%20Yagya%20service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-[#7A1515] bg-[#7A1515] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f1010]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp: +91-98101-90140
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
