import Link from 'next/link';
import Image from 'next/image';
import { fetchAllShopCategoryPages, toBrowseCard } from '@/lib/categories/shop-category-page';
import type { ShopCategoryBrowseCard } from '@/lib/types/shop-category-page';

const CATEGORY_TYPE_LABELS: Record<string, string> = {
  navaratna: 'Navaratna Gems',
  upratna: 'Upratna Gems',
  rudraksha: 'Rudraksha',
  idol: 'Spiritual Idols',
  jewelry: 'Vedic Jewellery',
  mala: 'Malas',
};

function CategoryCard({ card }: { card: ShopCategoryBrowseCard }) {
  return (
    <Link
      href={card.href}
      className="group flex flex-col overflow-hidden rounded-xl border border-brand-border bg-white shadow-[0_8px_30px_rgba(61,43,31,0.06)] transition hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-[0_16px_40px_rgba(61,43,31,0.1)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-bg-alt">
        {card.image ? (
          <Image
            src={card.image}
            alt={card.label}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#f5e6c8,#e8d4a8)] text-4xl">
            💎
          </div>
        )}
        {card.planet ? (
          <span className="absolute left-2 top-2 rounded-full bg-brand-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            {card.planet}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-heading text-[15px] leading-snug text-brand-primary group-hover:text-brand-accent">
          {card.label}
        </h3>
        {card.intro ? (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-brand-muted">{card.intro}</p>
        ) : null}
        <span className="mt-auto pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-accent">
          Shop Now →
        </span>
      </div>
    </Link>
  );
}

export async function ShopCategoryBrowse() {
  const pages = await fetchAllShopCategoryPages();
  const cards = pages.map(toBrowseCard);

  const grouped = cards.reduce<Record<string, ShopCategoryBrowseCard[]>>((acc, card) => {
    const key = card.product_category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(card);
    return acc;
  }, {});

  const groupOrder = ['navaratna', 'upratna', 'rudraksha', 'idol', 'jewelry', 'mala'];

  return (
    <section className="mb-10">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-accent">Browse by Category</p>
        <h2 className="mt-1 font-heading text-2xl text-brand-primary md:text-3xl">
          Certified Vedic Gemstones & Spiritual Products
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] leading-7 text-brand-muted">
          Explore dedicated collections for each gemstone, Rudraksha mukhi, idol, and jewellery type — with expert guides, certification, and Jyotish consultation support.
        </p>
      </div>

      {groupOrder.map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;
        return (
          <div key={type} className="mb-8">
            <h3 className="mb-4 border-b border-brand-border pb-2 font-heading text-lg text-brand-primary">
              {CATEGORY_TYPE_LABELS[type] ?? type}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((card) => (
                <CategoryCard key={card.slug} card={card} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
