'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Eye, Settings2 } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { WishlistButton } from '@/components/shop/WishlistButton';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { formatPrice, formatCarats } from '@/lib/utils/format';
import { productHref } from '@/lib/categories/storefront';
import { toast } from 'sonner';
import type { ProductCard as ProductCardType } from '@/lib/types/product';

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
  const inCart = isInCart(product.id);
  const href = productHref(product);
  const imageSrc = getImageSrc(product);
  const stockQuantity = product.stock_quantity == null ? 99 : Math.max(0, Number(product.stock_quantity));
  const maxQuantity = product.sold_individually ? Math.min(1, stockQuantity) : stockQuantity;
  const isUnavailable =
    !product.in_stock || maxQuantity <= 0 || ['sold', 'reserved', 'out_of_stock', 'archived'].includes(product.availability_status ?? '');
  const unavailableLabel = product.availability_status === 'reserved'
    ? 'Reserved'
    : product.availability_status === 'sold'
    ? 'Sold'
    : 'Out of stock';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUnavailable) {
      toast.error('This product is currently unavailable', {
        description: 'Contact us and we can help source a similar item.',
      });
      return;
    }
    if (inCart) {
      toast.info('This product is already in your cart');
      return;
    }
    addItem({
      product_id: product.id,
      slug: product.slug,
      sku: product.sku,
      tag_number: product.tag_number ?? null,
      name: product.name,
      category: product.category,
      image_url: imageSrc,
      price: product.price,
      quantity: 1,
      stock_quantity: product.stock_quantity,
      stock_status: product.stock_status,
      availability_status: product.availability_status,
      in_stock: product.in_stock,
      sold_individually: product.sold_individually,
      carat_weight: product.carat_weight ?? null,
      origin: product.origin ?? null,
    });
    trackStorefrontEvent('add_to_cart', {
      product_id: product.id,
      sku: product.sku,
      category: product.category,
      source: 'product_card',
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
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-white transition-shadow duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]">
      {/* ── Image ── */}
      <div className="relative overflow-hidden bg-[#f2f2f2]" style={{ paddingBottom: '115%' }}>
        <Link href={href} className="absolute inset-0 block">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        </Link>

        {/* Wishlist heart — always visible top-right */}
        <div className="absolute right-2 top-2 z-10">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            className="h-8 w-8 rounded-full border-0 bg-white/90 shadow-sm hover:bg-white"
            iconClassName="h-4 w-4"
          />
        </div>

        {/* Right-side quick-action icons — slide in on hover */}
        <div className="absolute right-2 top-12 z-10 flex flex-col gap-1.5 translate-x-3 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            title="Quick view"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
          >
            <Eye className="h-4 w-4 text-gray-700" />
          </Link>
          {product.configurator_enabled && (
            <Link
              href={`/configure/${product.id}`}
              onClick={(e) => e.stopPropagation()}
              onClickCapture={() =>
                trackStorefrontEvent('configurator_start', { product_id: product.id, source: 'product_card' })
              }
              title="Configure jewelry"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
            >
              <Settings2 className="h-4 w-4 text-gray-700" />
            </Link>
          )}
        </div>

        {/* Add to cart — slides up from bottom on hover */}
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            disabled={isUnavailable || inCart}
            className="flex w-full items-center justify-center gap-2 py-3 text-[12px] font-medium text-white transition-colors disabled:cursor-not-allowed"
            style={{
              background: isUnavailable
                ? 'rgba(0,0,0,0.55)'
                : inCart
                ? '#2e7d32'
                : '#111111',
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            {isUnavailable ? unavailableLabel : inCart ? 'In cart' : 'Add to cart'}
          </button>
        </div>
      </div>

      {/* ── Info Strip ── */}
      <div className="flex flex-col px-3 pb-3 pt-2">
        {/* Name */}
        <Link
          href={href}
          className="line-clamp-1 text-[13px] font-semibold leading-snug text-gray-900 transition-colors hover:text-brand-accent"
        >
          {product.name}
        </Link>

        {/* Out of stock label */}
        {isUnavailable && (
          <p className="mt-0.5 text-[11px] font-medium text-red-500">{unavailableLabel}</p>
        )}

        {/* Price row */}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[14px] font-semibold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-[11px] text-gray-400 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
          {product.price_per_carat && (
            <span className="ml-auto text-[10px] text-brand-muted">
              {formatPrice(product.price_per_carat)}/ct
            </span>
          )}
        </div>

        {/* Carat · Origin · Shape */}
        {meta && (
          <p className="mt-0.5 truncate text-[10px] font-normal text-brand-muted">
            {meta}
          </p>
        )}
      </div>
    </div>
  );
}
