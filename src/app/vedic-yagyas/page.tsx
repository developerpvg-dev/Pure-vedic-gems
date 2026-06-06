import type { Metadata } from 'next';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { YagyaCard, type YagyaCardData } from '@/components/yagyas/YagyaCard';
import { buildMetadata } from '@/lib/utils/seo';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Vedic Yagyas & Poojas — Performed by Learned Pandits',
  description:
    'Authentic Vedic Yagyas and Poojas for the nine planets (Navagraha), MahaMrityunjay, Durga Saptashati and more — performed on your behalf on an auspicious muhurat.',
  path: '/vedic-yagyas',
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

async function getYagyas(): Promise<YagyaCardData[]> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('products')
    .select('id, slug, sku, name, short_desc, price, images, thumbnail_url, planet, in_stock, stock_quantity, availability_status, sold_individually, display_order')
    .eq('is_active', true)
    .eq('product_type', 'service')
    .eq('category', 'service')
    .order('display_order', { ascending: true });

  const rows = (data ?? []) as YagyaRow[];
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    short_desc: row.short_desc,
    price: Number(row.price),
    image_url: firstImage(row.images, row.thumbnail_url),
    planet: row.planet,
    in_stock: row.in_stock,
    stock_quantity: row.stock_quantity,
    availability_status: row.availability_status,
    sold_individually: row.sold_individually,
  }));
}

export default async function VedicYagyasPage() {
  const yagyas = await getYagyas();

  return (
    <main className="bg-gradient-to-b from-amber-50/40 to-white">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">Sacred Vedic Rituals</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">Vedic Yagyas &amp; Poojas</h1>
          <p className="mt-4 text-gray-600">
            Harmonise the energies of the nine planets (Navagraha) and invoke divine blessings through authentic Vedic
            fire rituals (havan), performed on your behalf by learned pandits on an auspicious muhurat.
          </p>
        </header>

        {yagyas.length === 0 ? (
          <p className="mt-16 text-center text-gray-500">Our Yagya catalogue is being updated. Please check back soon.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {yagyas.map((yagya) => (
              <YagyaCard key={yagya.id} yagya={yagya} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
