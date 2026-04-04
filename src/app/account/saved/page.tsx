import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ChevronLeft, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const revalidate = 60;

export const metadata = {
  title: 'Saved Gems | PureVedicGems',
};

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/?auth=login');

  // Fetch saved items with product details
  const { data: savedItems } = await supabase
    .from('saved_items')
    .select(
      `
      id,
      created_at,
      products (
        id, name, slug, category, price, compare_price,
        thumbnail_url, images, carat_weight, origin, certification,
        in_stock
      )
    `
    )
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  type SavedProduct = {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: number;
    compare_price: number | null;
    thumbnail_url: string | null;
    images: unknown;
    carat_weight: number | null;
    origin: string | null;
    certification: string | null;
    in_stock: boolean;
  };

  const items =
    (savedItems as Array<{ id: string; created_at: string; products: SavedProduct | null }>) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/account"
          className="mb-4 inline-flex items-center gap-1 text-sm hover:underline"
          style={{ color: 'var(--pvg-muted)' }}
        >
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1
          className="font-heading text-3xl md:text-4xl"
          style={{ color: 'var(--pvg-primary)' }}
        >
          Saved Gems
        </h1>
        <OrnamentalDivider className="mt-4 max-w-[200px]" />
      </div>

      {items.length === 0 ? (
        <div
          className="rounded-2xl border py-20 text-center"
          style={{ borderColor: 'var(--pvg-border)', background: 'var(--pvg-surface)' }}
        >
          <Heart
            className="mx-auto mb-4 h-14 w-14"
            style={{ color: 'var(--pvg-muted)', opacity: 0.35 }}
          />
          <h2
            className="font-heading text-xl"
            style={{ color: 'var(--pvg-primary)' }}
          >
            No saved gems yet
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--pvg-muted)' }}>
            Tap the heart icon on any gemstone to save it here.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-lg px-7 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
          >
            Browse Gemstones
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const product = item.products;
            if (!product) return null;

            const images = Array.isArray(product.images)
              ? (product.images as string[])
              : [];
            const imgSrc = product.thumbnail_url ?? images[0] ?? null;
            const discount = product.compare_price
              ? Math.round(
                  ((product.compare_price - product.price) /
                    product.compare_price) *
                    100
                )
              : null;

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  borderColor: 'var(--pvg-border)',
                  background: 'var(--pvg-surface)',
                }}
              >
                {/* Image */}
                <Link
                  href={`/shop/${product.category}/${product.slug}`}
                  className="block"
                >
                  <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: '2/3' }}
                  >
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: 'var(--pvg-bg-alt)' }}
                      >
                        <ShoppingBag
                          className="h-10 w-10"
                          style={{ color: 'var(--pvg-muted)', opacity: 0.4 }}
                        />
                      </div>
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-700">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                    {discount && discount > 0 && (
                      <div
                        className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase"
                        style={{
                          background: 'var(--pvg-accent)',
                          color: 'white',
                        }}
                      >
                        -{discount}%
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3">
                  <Link href={`/shop/${product.category}/${product.slug}`}>
                    <h3
                      className="line-clamp-2 text-sm font-semibold leading-snug hover:text-[var(--pvg-accent)]"
                      style={{ color: 'var(--pvg-primary)' }}
                    >
                      {product.name}
                    </h3>
                  </Link>
                  {(product.carat_weight || product.origin) && (
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: 'var(--pvg-muted)' }}
                    >
                      {[
                        product.carat_weight &&
                          `${product.carat_weight} ct`,
                        product.origin,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="font-heading text-base font-semibold"
                      style={{ color: 'var(--pvg-primary)' }}
                    >
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.compare_price && (
                      <span
                        className="text-xs line-through"
                        style={{ color: 'var(--pvg-muted)' }}
                      >
                        ₹{product.compare_price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/shop/${product.category}/${product.slug}`}
                    className="mt-3 flex w-full items-center justify-center rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                    style={{
                      background: product.in_stock
                        ? 'var(--pvg-primary)'
                        : 'var(--pvg-bg-alt)',
                      color: product.in_stock
                        ? 'var(--pvg-bg)'
                        : 'var(--pvg-muted)',
                    }}
                  >
                    {product.in_stock ? 'View & Buy' : 'Notify Me'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
