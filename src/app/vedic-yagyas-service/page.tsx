import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Flame, BookOpen, CreditCard } from 'lucide-react';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { buildMetadata, serviceJsonLd } from '@/lib/utils/seo';
import { formatPrice } from '@/lib/utils/format';

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

const HIGHLIGHTS = [
  {
    title: 'Authentic Vedic Rituals',
    text: 'Performed strictly as per the ancient scriptures with correct samagri, beej mantras and procedures.',
  },
  {
    title: 'As per your Gotra & Rashi',
    text: 'Sankalp taken in your name, gotra and rashi so the punya and benefits reach you directly.',
  },
  {
    title: 'Learned, Experienced Pandits',
    text: 'Conducted by our team of Vedic scholars at our in-house yagyashala with photos / recordings shared.',
  },
];

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
    <main className="bg-[#fbf7ef]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Intro / details first (as on the legacy site) */}
      <section className="mx-auto max-w-7xl px-4 pt-32 sm:px-6 lg:px-10 lg:pt-36">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[3px] text-[#7A1515]">Since 1937</p>
          <h1 className="mt-3 text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl">
            Our Vedic Pooja / Yagya Services
          </h1>
        </div>

        <div className="mx-auto mt-7 max-w-4xl">
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Every aspect of human life is affected by nine planets in our birth-chart / horoscope. Their positions,
              combustion, exaltation etc. adjudicate which planet is positive and needs to be strengthened and which
              planet is negative and needs to be weakened. Unfavorable positioning of these planets cause problems and
              create unexpected hurdles and bad times in one&apos;s life. One of the most effective remedies of Jyotish
              is &ldquo;Yagya&rdquo; for planets. They are supremely powerful in nature and have the potential to turn
              impossible into possible. Shanti Yagyas or Yagyas are done in order to reduce the effects of malefic
              planets or to gain the benefits from the already powerful planet in the horoscope. These Shanti Yagyas are
              different for different planets, but the principle and rules to conduct a Yagya do not vary with different
              planets in Navagraha.
            </p>
            <p>
              Badly placed planets may produce ill effects in life. To get rid of inauspicious results of planets,
              Shanti Yagya / Havan is a significant remedy. Items used in Havan are also very beneficial. These items
              make surroundings holy along with pacifying the planet. Havan materials contain several kinds of roots and
              herbs and due to this reason its ashes are also very beneficial and alleviate some diseases totally. Yagya
              includes offering auspicious havan items in the holy-fire along with Vedic Mantra chanting, Tarpan
              (pouring water), Havan and Brahmin Bhojan (giving food to Brahmins). Shanti Yagya will have effect for a
              long time, i.e. 10-15 years or more, based on the dosha we have. Yagya is a complete remedy for a planet or
              deity. This remedy is for those who want long-term relief from their problem caused by a planet or
              planetary doshas. Pure Vedic Gems is the oldest and most trusted name for Authentic Astro-Jyotish
              Gemstones, Genuine Rudrakshas, Vedic Yagyas &amp; Spiritual items (since 1937).
            </p>
          </div>
        </div>

        <ul className="mx-auto mt-6 max-w-4xl space-y-2 text-sm leading-7 text-slate-600">
          {HIGHLIGHTS.map((h) => (
            <li key={h.title} className="flex items-start gap-2">
              <span className="mt-0.5 text-[#7A1515]">—</span>
              <span><strong className="font-semibold text-slate-700">{h.title}:</strong> {h.text}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Yagya catalogue — 4 cards per row, image fills the frame */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl">Our Yagyas &amp; Poojas</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            Select a yagya to read its full details, then book and pay securely online.
          </p>
        </div>

        {yagyas.length === 0 ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-[#E2D3B6] bg-white px-6 py-12 text-center shadow-[0_18px_54px_rgba(68,35,12,0.06)]">
            <p className="font-semibold text-[#7A1515]">Our Yagya catalogue is being updated.</p>
            <p className="mt-2 text-sm text-slate-500">Please check back shortly or contact the PureVedicGems team.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {yagyas.map((yagya) => (
              <article
                key={yagya.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[#7A1515]/15 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link href={`/vedic-yagyas/${yagya.slug}`} className="relative block aspect-square w-full overflow-hidden bg-[#fff7eb]">
                  {yagya.image_url ? (
                    <Image
                      src={yagya.image_url}
                      alt={yagya.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition duration-300 hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <Flame className="h-10 w-10 text-[#7A1515]/40" />
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 shrink-0 text-[#7A1515]" />
                    <span className="truncate text-[10px] font-medium text-[#7A1515]">Vedic Yagya Service</span>
                  </div>

                  <h3 className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-4 text-slate-700">{yagya.name}</h3>

                  {yagya.price > 0 && (
                    <p className="mt-1 text-[13px] font-semibold text-[#7A1515]">{formatPrice(yagya.price)}</p>
                  )}

                  <div className="mt-2 flex flex-col gap-1 pt-1">
                    <Link
                      href={`/vedic-yagyas/${yagya.slug}/buy`}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-[#7A1515] bg-[#7A1515] px-2 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#5f1010]"
                    >
                      <CreditCard className="h-3 w-3" /> Book &amp; Pay
                    </Link>
                    <Link
                      href={`/vedic-yagyas/${yagya.slug}`}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-[#7A1515]/30 bg-white px-2 py-1.5 text-[11px] font-medium text-[#7A1515] transition hover:bg-[#fff7eb]"
                    >
                      <BookOpen className="h-3 w-3" /> See Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
