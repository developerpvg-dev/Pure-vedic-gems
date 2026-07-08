import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, BookOpen, CreditCard } from 'lucide-react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { buildMetadata, serviceJsonLd } from '@/lib/utils/seo';
import { formatPrice } from '@/lib/utils/format';
import { YagyaServiceIntro } from '@/components/yagyas/YagyaServiceIntro';
import '@/app/consultation/consultation-page.css';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Vedic Pooja / Yagya Services — Authentic Havan by Learned Pandits',
  description:
    'Have authentic Vedic Yagyas and Poojas (Navagraha, MahaMrityunjay, Durga Saptashati and more) performed on your behalf as per your gotra and rashi. See the details and book your yagya with our learned pandits.',
  path: '/vedic-yagyas-service',
});

type YagyaRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  short_desc: string | null;
  price: number;
  images: unknown;
  thumbnail_url: string | null;
  planet: string | null;
  in_stock: boolean | null;
  stock_quantity: number | null;
  availability_status: string | null;
  sold_individually: boolean | null;
  display_order: number | null;
};

type YagyaServiceItem = {
  id: string;
  slug: string;
  name: string;
  short_desc: string | null;
  price: number;
  image_url: string | null;
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

async function getYagyas(): Promise<YagyaServiceItem[]> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('products')
    .select(
      'id, slug, sku, name, short_desc, price, images, thumbnail_url, planet, in_stock, stock_quantity, availability_status, sold_individually, display_order',
    )
    .eq('is_active', true)
    .eq('product_type', 'service')
    .eq('category', 'service')
    .order('display_order', { ascending: true });

  const rows = (data ?? []) as YagyaRow[];
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    short_desc: row.short_desc,
    price: Number(row.price),
    image_url: firstImage(row.images, row.thumbnail_url),
  }));
}

export default async function VedicYagyasServicePage() {
  const yagyas = await getYagyas();

  const jsonLd = serviceJsonLd({
    name: 'Vedic Pooja / Yagya Services',
    description:
      'Authentic Vedic Yagyas and Poojas performed on your behalf by learned pandits as per your gotra and rashi.',
    path: '/vedic-yagyas-service',
    provider: 'PureVedicGems',
  });

  return (
    <main className="pvg-consultation-page pvg-yagya-service-page px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl">
        <header className="yagya-service-hero mx-auto max-w-4xl scroll-mt-28 text-center" aria-labelledby="yagya-service-heading">
          <h1 className="section-title !mb-2" id="yagya-service-heading">
            Our Vedic Pooja / Yagya Services
          </h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.5rem auto 0', maxWidth: '36rem' }}>
            Select a yagya to read its full details, then book and pay securely online with our learned pandits.
          </p>
          <div className="section-rule-center" style={{ margin: '12px auto 0' }} aria-hidden="true" />
        </header>

        <YagyaServiceIntro />

        {yagyas.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-[#ede6d5] bg-white px-5 py-12 text-center shadow-[0_10px_32px_rgba(44,4,4,0.06)] sm:px-6">
            <p className="font-semibold text-[#2c0404]">Our Yagya catalogue is being updated.</p>
            <p className="mt-2 text-sm text-[#5a5043]">Please check back shortly or contact the PureVedicGems team.</p>
          </div>
        ) : (
          <section className="pvg-consultation-plans mt-6 pb-8 sm:mt-8" aria-label="Yagya services">
            {yagyas.map((yagya) => (
              <article
                key={yagya.id}
                className="relative flex flex-col rounded-xl border border-[#7A1515]/15 bg-white p-3 shadow-sm transition hover:shadow-md"
              >
                <Link href={`/vedic-yagyas/${yagya.slug}`} className="relative block aspect-square w-full overflow-hidden rounded-lg bg-[#fff7eb]">
                  {yagya.image_url ? (
                    <Image
                      src={yagya.image_url}
                      alt={yagya.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-contain p-2 transition duration-300 hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Flame className="h-10 w-10 text-[#7A1515]/40" />
                    </span>
                  )}
                </Link>

                <div className="mt-2 flex items-center gap-1">
                  <Flame className="h-3 w-3 shrink-0 text-[#7A1515]" />
                  <span className="truncate text-[10px] font-medium text-[#7A1515]">Vedic Yagya Service</span>
                </div>

                <h2 className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-4 text-slate-700">{yagya.name}</h2>

                {yagya.price > 0 ? (
                  <p className="mt-1 text-[13px] font-semibold text-[#7A1515]">{formatPrice(yagya.price)}</p>
                ) : null}

                <div className="mt-2 flex flex-col gap-1">
                  <Link
                    href={`/vedic-yagyas/${yagya.slug}/buy`}
                    className="w-full rounded-md border border-[#7A1515] bg-[#7A1515] px-2 py-1 text-[11px] font-medium text-white transition hover:bg-[#5f1010]"
                  >
                    <span className="inline-flex w-full items-center justify-center gap-1">
                      <CreditCard className="h-3 w-3" /> Book &amp; Pay
                    </span>
                  </Link>
                  <Link
                    href={`/vedic-yagyas/${yagya.slug}`}
                    className="w-full rounded-md border border-[#7A1515]/30 bg-white px-2 py-1 text-[11px] font-medium text-[#7A1515] transition hover:bg-[#fff7eb]"
                  >
                    <span className="inline-flex w-full items-center justify-center gap-1">
                      <BookOpen className="h-3 w-3" /> See Details
                    </span>
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
