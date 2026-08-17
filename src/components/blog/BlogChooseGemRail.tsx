import Image from 'next/image';
import Link from 'next/link';
import { getBlogCategoryProducts, getBlogGemRailData } from '@/lib/blog/blog-rail-data';
import { BlogShopPopup } from './BlogShopPopup';

export async function BlogChooseGemRail({ categorySlug }: { categorySlug?: string }) {
  const { copy, gems } = await getBlogGemRailData(categorySlug);
  const products = await getBlogCategoryProducts(copy.productCategory);

  return (
    <>
      <aside className="pvg-blog-rail-stack" aria-label={copy.title}>
        <section className="pvg-blog-gem-card">
          <header className="pvg-blog-gem-head">
            <h2>{copy.title}</h2>
          </header>

          <div className="pvg-blog-gem-grid">
            {gems.map((gem) => (
              <Link key={gem.id} href={gem.href} className="pvg-blog-gem-item">
                <span className="pvg-blog-gem-thumb">
                  {gem.image ? (
                    <Image src={gem.image} alt={gem.name} fill sizes="72px" className="object-contain" />
                  ) : (
                    <span
                      className="pvg-blog-gem-thumb-fallback"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, ${gem.color ?? '#B8861E'}, #6B4800 55%, #2A1800 100%)`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="pvg-blog-gem-name">{gem.name}</span>
              </Link>
            ))}
          </div>

          <Link href={copy.href} className="pvg-blog-gem-cta">
            View Full Collection
          </Link>
        </section>

        {products.length > 0 ? (
          <section className="pvg-blog-gem-card" aria-labelledby="rail-products-heading">
            <header className="pvg-blog-gem-head">
              <h2 id="rail-products-heading">Featured Pieces</h2>
            </header>

            <div className="pvg-blog-rail-products">
              {products.map((product) => (
                <Link key={product.id} href={product.href} className="pvg-blog-rail-product">
                  <span className="pvg-blog-rail-product-thumb">
                    {product.thumbnailUrl ? (
                      <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="pvg-blog-rail-product-body">
                    <strong>{product.name}</strong>
                    <small>{product.priceLabel}</small>
                  </span>
                </Link>
              ))}
            </div>

            <Link href={copy.href} className="pvg-blog-gem-cta">
              Shop More Pieces
            </Link>
          </section>
        ) : null}
      </aside>

      <BlogShopPopup kind={copy.kind} title={copy.title} href={copy.href} gems={gems} />
    </>
  );
}
