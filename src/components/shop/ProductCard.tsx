'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Eye, Heart, Settings2 } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice, formatCarats } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { ProductCard as ProductCardType } from '@/lib/types/product';

// ─── Badge resolver ──────────────────────────────────────────────────────────

type Badge = { label: string; bg: string; text: string };

function resolveBadge(product: ProductCardType): Badge | null {
  if (product.is_directors_pick) {
    return { label: "Director's Pick", bg: 'var(--pvg-primary)', text: 'var(--pvg-bg)' };
  }
  if (product.featured) {
    return { label: 'Featured', bg: 'var(--pvg-accent)', text: '#fff' };
  }
  if (product.created_at) {
    const created = new Date(product.created_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    if (created > cutoff) {
      return { label: 'New', bg: '#2e7d32', text: '#fff' };
    }
  }
  const treatment = product.treatment;
  if (treatment && treatment !== 'none') {
    const label =
      treatment === 'unheated' ? 'Unheated' :
      treatment === 'no_oil' ? 'No Oil' :
      treatment === 'minor_oil' ? 'Minor Oil' : treatment;
    return { label, bg: 'var(--pvg-muted)', text: '#fff' };
  }
  return null;
}

function getImageSrc(product: ProductCardType): string {
  if (product.thumbnail_url) return product.thumbnail_url;
  const images = product.images;
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') {
    return images[0];
  }
  // Fallback per category
  const fallbacks: Record<string, string> = {
    gemstone:
      'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=600&h=900&fit=crop&q=80',
    rudraksha:
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=900&fit=crop&q=80',
    jewelry:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=900&fit=crop&q=80',
    mala:
      'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&h=900&fit=crop&q=80',
    idol:
      'https://images.unsplash.com/photo-1624927637280-f033784c1279?w=600&h=900&fit=crop&q=80',
  };
  return fallbacks[product.category] ?? fallbacks.gemstone;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductCardType;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const badge = resolveBadge(product);
  const inCart = isInCart(product.id);
  const href = `/shop/${product.category}/${product.slug}`;
  const imageSrc = getImageSrc(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      product_id: product.id,
      sku: product.slug,
      name: product.name,
      category: product.category,
      image_url: imageSrc,
      price: product.price,
      quantity: 1,
      carat_weight: product.carat_weight ?? null,
      origin: product.origin ?? null,
    });
    toast.success(`${product.name} added to cart`, {
      description: 'View your cart to proceed to checkout.',
      action: { label: 'View Cart', onClick: () => (window.location.href = '/cart') },
    });
  };

  const meta = [
    product.carat_weight ? formatCarats(product.carat_weight) : null,
    product.origin,
    product.shape,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(61,43,31,0.14)]">
      {/* ── Image (5:6 portrait — compact) ── */}
      <Link href={href} className="relative block overflow-hidden" style={{ paddingBottom: '120%' }}>
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-107"
          sizes="(min-width: 1536px) 17vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />

        {/* Bottom gradient for text legibility on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Action buttons — hover only (desktop), always hidden on mobile touch screens */}
        <div className="absolute inset-x-0 bottom-0 hidden flex-col gap-2 p-3 opacity-0 md:flex md:translate-y-3 md:transition-all md:duration-300 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <button
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: inCart ? '#2e7d32' : 'var(--pvg-accent)' }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {inCart ? 'In Cart ✓' : 'Add to Cart'}
          </button>
          {product.configurator_enabled && (
            <Link
              href={`/configure/${product.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--pvg-accent)] py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--pvg-accent)]"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configure Jewelry
            </Link>
          )}
          <div className="flex gap-2">
            <Link
              href={href}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/15 py-2 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Eye className="h-3 w-3" />
              Quick View
            </Link>
            <button
              aria-label="Wishlist"
              className="flex items-center justify-center rounded-lg border border-white/40 bg-white/15 px-3 py-2 text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Category badge (top-left) */}
        {badge && (
          <span
            className="absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ background: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
        )}

        {/* Certification badge (top-right) */}
        {product.certification && (
          <span className="absolute right-3 top-3 z-10 rounded border border-white/30 bg-white/90 px-2 py-0.5 text-[9px] font-black tracking-widest text-[var(--pvg-primary)] backdrop-blur-sm">
            {product.certification}
          </span>
        )}
      </Link>

      {/* ── Card Info ── */}
      <div className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
        {/* Origin · Weight · Shape */}
        {meta && (
          <p className="truncate text-[9px] font-semibold uppercase tracking-[1.8px] text-[var(--pvg-accent)]">
            {meta}
          </p>
        )}

        {/* Name */}
        <Link
          href={href}
          className="line-clamp-2 text-[12px] font-semibold leading-snug text-[var(--pvg-primary)] transition-colors hover:text-[var(--pvg-accent)] lg:text-[13px]"
        >
          {product.name}
        </Link>

        {/* Price Row */}
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            <p className="text-[13px] font-bold leading-none text-[var(--pvg-primary)] lg:text-[15px]">
              {formatPrice(product.price)}
            </p>
            {product.price_per_carat && (
              <p className="mt-0.5 text-[9px] text-[var(--pvg-muted)]">
                {formatPrice(product.price_per_carat)}/ct
              </p>
            )}
          </div>
          {product.compare_price && product.compare_price > product.price && (
            <p className="text-[10px] text-[var(--pvg-muted)] line-through">
              {formatPrice(product.compare_price)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
