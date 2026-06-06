import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import type { Metadata } from 'next';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { YagyaBuyForm } from '@/components/yagyas/YagyaBuyForm';
import { buildMetadata } from '@/lib/utils/seo';

export const revalidate = 300;

type YagyaBuyRow = {
  id: string;
  slug: string;
  name: string;
  short_desc: string | null;
  price: number;
  images: unknown;
  thumbnail_url: string | null;
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

async function getYagya(slug: string): Promise<YagyaBuyRow | null> {
  const supabase = createOptionalPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('products')
    .select('id, slug, name, short_desc, price, images, thumbnail_url')
    .eq('slug', slug)
    .eq('product_type', 'service')
    .eq('is_active', true)
    .maybeSingle();
  return data ? (data as unknown as YagyaBuyRow) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const yagya = await getYagya(slug);
  if (!yagya) return buildMetadata({ title: 'Yagya not found', description: '', path: `/vedic-yagyas/${slug}/buy`, noIndex: true });
  return buildMetadata({
    title: `Book ${yagya.name} — Secure Payment`,
    description: yagya.short_desc ?? `Book and pay for the ${yagya.name}.`,
    path: `/vedic-yagyas/${yagya.slug}/buy`,
    noIndex: true,
  });
}

export default async function YagyaBuyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const yagya = await getYagya(slug);
  if (!yagya) notFound();

  const imageUrl = firstImage(yagya.images, yagya.thumbnail_url);

  return (
    <main className="bg-[#fbf7ef]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pt-36">
        <nav className="mb-8 text-sm text-slate-400">
          <Link href="/vedic-yagyas-service" className="hover:text-[#7A1515]">Vedic Yagyas</Link>
          <span className="mx-2">/</span>
          <Link href={`/vedic-yagyas/${yagya.slug}`} className="hover:text-[#7A1515]">{yagya.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-600">Book &amp; Pay</span>
        </nav>

        <div className="mb-8 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#7A1515]/15 bg-[#fff7eb]">
            {imageUrl ? (
              <Image src={imageUrl} alt={yagya.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Flame className="h-8 w-8 text-[#7A1515]/40" />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[3px] text-[#7A1515]">Vedic Yagya Service</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-800 sm:text-3xl">Book {yagya.name}</h1>
            <p className="mt-1 text-sm text-slate-500">Add your sankalp details and complete the secure payment.</p>
          </div>
        </div>

        <YagyaBuyForm
          yagya={{
            id: yagya.id,
            name: yagya.name,
            slug: yagya.slug,
            price: Number(yagya.price),
            image_url: imageUrl,
            short_desc: yagya.short_desc,
          }}
        />
      </div>
    </main>
  );
}
