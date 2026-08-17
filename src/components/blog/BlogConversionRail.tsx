import Image from 'next/image';
import Link from 'next/link';
import { getBlogRelatedProducts } from '@/lib/blog/blog-rail-data';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import type { LibraryVideo } from '@/lib/types/database';
import { VideoCard } from '@/components/videos/VideoCard';

async function getVideos() {
  const supabase = createOptionalPublicClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(2);
  return (data ?? []) as LibraryVideo[];
}

export async function BlogConversionRail({
  relatedProductCategoryHref,
  relatedProductCategoryLabel,
}: {
  relatedProductCategoryHref?: string;
  relatedProductCategoryLabel?: string;
}) {
  const [relatedResult, videos] = await Promise.all([
    getBlogRelatedProducts(relatedProductCategoryHref),
    getVideos(),
  ]);
  const products = relatedResult.products;
  const productHrefLink = relatedResult.usedFallback ? '/shop' : relatedProductCategoryHref;
  const productLabel = relatedResult.usedFallback ? 'Featured Pieces' : relatedProductCategoryLabel;

  if (products.length === 0 && videos.length === 0) return null;

  return (
    <aside className="pvg-blog-rail" aria-label="Article resources">
      {products.length > 0 && productHrefLink && productLabel ? (
        <section className="pvg-blog-rail-card" aria-labelledby="rail-products-heading">
          <div className="pvg-blog-rail-heading">
            <div>
              <p className="pvg-blog-section-eyebrow">Shop the guide</p>
              <h2 id="rail-products-heading">{productLabel}</h2>
            </div>
          </div>
          <div className="pvg-blog-mini-products">
            {products.map((product) => (
              <Link key={product.id} href={product.href} className="pvg-blog-mini-product">
                <div className="pvg-blog-mini-product-image">
                  {product.thumbnailUrl ? (
                    <Image src={product.thumbnailUrl} alt={product.name} fill sizes="88px" className="object-cover" />
                  ) : null}
                </div>
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.priceLabel}</small>
                </span>
              </Link>
            ))}
          </div>
          <Link href={productHrefLink} className="pvg-blog-rail-text-link">
            View all {productLabel}
          </Link>
        </section>
      ) : null}

      {videos.length > 0 ? (
        <section className="pvg-blog-rail-card" aria-labelledby="rail-videos-heading">
          <p className="pvg-blog-section-eyebrow">Watch & learn</p>
          <h2 id="rail-videos-heading">Gemstone Video Guides</h2>
          <div className="pvg-blog-rail-videos">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          <Link href="/videos" className="pvg-blog-rail-text-link">
            Browse all videos
          </Link>
        </section>
      ) : null}
    </aside>
  );
}
