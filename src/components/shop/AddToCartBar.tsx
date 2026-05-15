'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, MessageCircle, Share2, Gem, Phone } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { WishlistButton } from '@/components/shop/WishlistButton';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/product';

interface AddToCartBarProps {
  product: Product;
}

function getImageSrc(product: Product): string {
  if (product.thumbnail_url) return product.thumbnail_url;
  const images = product.images;
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') {
    return images[0];
  }
  return 'https://images.unsplash.com/photo-1551122089-4e3e72477432?w=400&h=400&fit=crop&q=80';
}

export function AddToCartBar({ product }: AddToCartBarProps) {
  const { addItem, isInCart, getItemQty, updateQty } = useCart();
  const [localQty, setLocalQty] = useState(1);
  const inCart = isInCart(product.id);
  const cartQty = getItemQty(product.id);
  const stockQuantity = product.stock_quantity == null ? 99 : Math.max(0, Number(product.stock_quantity));
  const maxQuantity = product.sold_individually ? Math.min(1, stockQuantity) : stockQuantity;
  const isUnavailable =
    !product.in_stock || maxQuantity <= 0 || ['sold', 'reserved', 'out_of_stock', 'archived'].includes(product.availability_status ?? '');

  // When item is in cart, the counter mirrors the cart quantity directly.
  // When not yet in cart, the counter is a local "how many to add" state.
  const displayQty = inCart ? cartQty : localQty;

  const handleDecrease = () => {
    if (inCart) {
      // Enforce min 1 in cart via the quantity selector (user must remove from cart page to delete)
      if (cartQty > 1) updateQty(product.id, cartQty - 1);
    } else {
      setLocalQty((q) => Math.max(1, q - 1));
    }
  };

  const handleIncrease = () => {
    if (isUnavailable || displayQty >= maxQuantity) {
      toast.info(maxQuantity > 0 ? `Only ${maxQuantity} unit${maxQuantity > 1 ? 's' : ''} available` : 'This product is out of stock');
      return;
    }
    if (inCart) {
      updateQty(product.id, cartQty + 1);
    } else {
      setLocalQty((q) => Math.min(maxQuantity, q + 1));
    }
  };

  const handleAdd = useCallback(() => {
    if (isUnavailable) {
      toast.error('This product is currently unavailable', {
        description: 'Contact us and we can help source a similar item.',
      });
      return;
    }
    if (localQty > maxQuantity) {
      toast.error(`Only ${maxQuantity} unit${maxQuantity > 1 ? 's' : ''} available`);
      setLocalQty(Math.max(1, maxQuantity));
      return;
    }

    addItem({
      product_id: product.id,
      slug: product.slug,
      sku: product.sku,
      tag_number: product.tag_number ?? null,
      name: product.name,
      category: product.category,
      image_url: getImageSrc(product),
      price: product.price,
      quantity: localQty,
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
      source: 'product_detail',
    });
    setLocalQty(1); // reset local counter after adding
    toast.success(`${product.name} added to cart`, {
      description: `${localQty} item${localQty > 1 ? 's' : ''} added.`,
      action: { label: 'View Cart', onClick: () => (window.location.href = '/cart') },
    });
  }, [addItem, product, localQty, isUnavailable, maxQuantity]);

  const waLink = `https://wa.me/919871582404?text=${encodeURIComponent(
    `Hi, I'm interested in: ${product.name} (SKU: ${product.sku}). Please share more details.`
  )}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const configuratorEnabled = !!(product as Product & { configurator_enabled?: boolean }).configurator_enabled;

  return (
    <div className="space-y-4">
      {/* Stock status */}
      {!isUnavailable ? (
        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {product.availability_status === 'on_demand' ? 'Available on Demand' : 'In Stock'}
          {product.stock_quantity < 5 && (
            <span className="ml-1 text-amber-600">— Only {product.stock_quantity} left!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {product.availability_status === 'reserved' ? 'Reserved' : product.availability_status === 'sold' ? 'Sold' : 'Out of Stock'}
        </div>
      )}

      {/* Primary action row — quantity + main CTA */}
      <div className="flex gap-2">
        {/* Quantity selector */}
        <div className="flex items-center rounded-lg border border-[var(--pvg-border)] bg-brand-surface">
          <button
            onClick={handleDecrease}
            className="flex h-10 w-9 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)]"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-7 text-center text-[14px] font-semibold text-[var(--pvg-primary)]">
            {displayQty}
          </span>
          <button
            onClick={handleIncrease}
            disabled={isUnavailable || displayQty >= maxQuantity}
            className="flex h-10 w-9 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)]"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Main CTA: Buy Loose (if configurator) or Add to Cart */}
        <button
          onClick={inCart ? undefined : handleAdd}
          disabled={isUnavailable}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: inCart
              ? '#2e7d32'
              : configuratorEnabled
              ? '#7A1515'
              : '#7A1515',
            color: '#fff',
            cursor: inCart ? 'default' : 'pointer',
          }}
        >
          {configuratorEnabled ? (
            <><Gem className="h-4 w-4" />{isUnavailable ? 'Unavailable' : inCart ? 'In cart' : 'Buy loose'}</>
          ) : (
            <><ShoppingBag className="h-4 w-4" />{isUnavailable ? 'Unavailable' : inCart ? 'In cart' : 'Add to cart'}</>
          )}
        </button>

        <WishlistButton
          productId={product.id}
          productName={product.name}
          className="h-10 w-10"
          stopPropagation={false}
        />
        <button
          onClick={handleShare}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)]"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Configure in Jewelry — only shown when configurator is enabled */}
      {configuratorEnabled && (
        <Link
          href={`/configure/${product.id}`}
          onClick={() => trackStorefrontEvent('configurator_start', { product_id: product.id, source: 'product_detail' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{
            borderColor: '#7A1515',
            color: '#7A1515',
          }}
        >
          <Gem className="h-4 w-4" />
          Configure in jewellery
        </Link>
      )}

      {/* WhatsApp + Book Consultation */}
      <div className="flex gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-[11px] font-semibold transition hover:opacity-80"
          style={{ borderColor: '#25D366', color: '#25D366' }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
        <Link
          href="/contact?type=consultation"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--pvg-border)] px-3 py-2 text-[11px] font-semibold text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)]"
        >
          <Phone className="h-3.5 w-3.5" />
          Book Consultation
        </Link>
      </div>
    </div>
  );
}
