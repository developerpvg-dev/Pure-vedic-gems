import Link from 'next/link';
import Image from 'next/image';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import {
  collectRudrakshaSampleThumbs,
  resolveRudrakshaNavImage,
  rudrakshaMukhiImage,
} from '@/lib/constants/rudraksha-category-images';
import {
  RUDRAKSHA_STOREFRONT_SLUGS,
  rudrakshaSubcategoryLabel,
} from '@/lib/constants/rudraksha-subcategories';
import { storefrontSubcategoryHref } from '@/lib/categories/storefront';

type GridItem = {
  slug: string;
  label: string;
  href: string;
  imageUrl: string | null;
  count: number;
};

async function loadRudrakshaGridItems(): Promise<GridItem[]> {
  const supabase = createOptionalPublicClient();
  if (!supabase) {
    return RUDRAKSHA_STOREFRONT_SLUGS.map((slug) => ({
      slug,
      label: rudrakshaSubcategoryLabel(slug),
      href: storefrontSubcategoryHref('rudraksha', slug),
      imageUrl: rudrakshaMukhiImage(slug),
      count: 0,
    }));
  }

  const [categoriesResult, countsResult, samplesResult] = await Promise.all([
    supabase
      .from('gem_categories')
      .select('slug, name, image_url')
      .eq('type', 'rudraksha')
      .eq('is_active', true),
    supabase
      .from('products')
      .select('sub_category')
      .eq('category', 'rudraksha')
      .eq('is_active', true),
    supabase
      .from('products')
      .select('sub_category, thumbnail_url')
      .eq('category', 'rudraksha')
      .eq('is_active', true)
      .not('thumbnail_url', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  const bySlug = new Map(
    (categoriesResult.data ?? []).map((row) => [String(row.slug), row]),
  );

  const counts = new Map<string, number>();
  for (const row of countsResult.data ?? []) {
    const slug = String(row.sub_category ?? '');
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  const sampleThumb = collectRudrakshaSampleThumbs(samplesResult.data ?? []);

  return RUDRAKSHA_STOREFRONT_SLUGS.map((slug) => {
    const row = bySlug.get(slug);
    const imageUrl = resolveRudrakshaNavImage(
      slug,
      row?.image_url ? String(row.image_url) : null,
      sampleThumb.get(slug),
    );
    return {
      slug,
      label: row?.name ? String(row.name) : rudrakshaSubcategoryLabel(slug),
      href: storefrontSubcategoryHref('rudraksha', slug),
      imageUrl,
      count: counts.get(slug) ?? 0,
    };
  });
}

export async function RudrakshaCategoryGrid() {
  const items = await loadRudrakshaGridItems();

  return (
    <section className="mb-8" aria-label="Browse Rudraksha by type">
      <h2 className="mb-4 font-heading text-lg text-brand-primary md:text-xl">Browse by Rudraksha Type</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className="group flex flex-col overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm transition hover:border-brand-accent hover:shadow-md"
          >
            <div className="relative aspect-square bg-[#faf7ef] p-3">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.label}
                  fill
                  className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-brand-muted">No image</div>
              )}
            </div>
            <div className="border-t border-brand-border px-2 py-2 text-center">
              <p className="text-[11px] font-semibold leading-snug text-brand-primary sm:text-xs">{item.label}</p>
              {item.count > 0 ? (
                <p className="mt-0.5 text-[10px] text-brand-muted">{item.count} item{item.count === 1 ? '' : 's'}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
