'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, MessageCircle, Share2, Gem, Phone } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { WishlistButton } from '@/components/shop/WishlistButton';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/product';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import {
  isProductPriceOnRequest,
  isProductStockUnavailable,
  resolveProductCartPrice,
} from '@/lib/shop/product-pricing';

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
  const { addItem, isInCart, getItemQty, updateQty, getItemKey } = useCart();
  const displayName = formatProductDisplayName(product.name);
  const inCart = isInCart(product.id);
  const cartQty = getItemQty(product.id);
  const cartItemKey = getItemKey(product.id);
  const stockQuantity = product.stock_quantity == null ? 99 : Math.max(0, Number(product.stock_quantity));
  const maxQuantity = product.sold_individually ? Math.min(1, stockQuantity) : stockQuantity;
  const isOnRequest = isProductPriceOnRequest(product);
  const isUnavailable = isProductStockUnavailable(product);
  const cartPrice = resolveProductCartPrice(product);
  const canAdjustQuantity = maxQuantity > 1 && !product.sold_individually;
  const showQuantityStepper = !isUnavailable && inCart && canAdjustQuantity;

  const displayQty = cartQty;

  const handleDecrease = () => {
    if (!inCart || !cartItemKey) return;
    if (cartQty > 1) updateQty(cartItemKey, cartQty - 1);
  };

  const handleIncrease = () => {
    if (!inCart || !cartItemKey) return;
    if (displayQty >= maxQuantity) {
      toast.info(`Only ${maxQuantity} unit${maxQuantity > 1 ? 's' : ''} available`);
      return;
    }
    updateQty(cartItemKey, cartQty + 1);
  };

  const handleAdd = useCallback(() => {
    if (isUnavailable) {
      toast.error('This product is currently unavailable', {
        description: 'Contact us and we can help source a similar item.',
      });
      return;
    }

    const quantityToAdd = 1;
    addItem({
      product_id: product.id,
      slug: product.slug,
      sku: product.sku,
      tag_number: product.tag_number ?? null,
      name: displayName,
      category: product.category,
      image_url: getImageSrc(product),
      price: cartPrice,
      quantity: quantityToAdd,
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
    toast.success(`${displayName} added to cart`, {
      description: 'View your cart to proceed to checkout.',
      action: { label: 'View Cart', onClick: () => (window.location.href = '/cart') },
    });
  }, [addItem, cartPrice, displayName, isUnavailable, product]);

  const waLink = `https://wa.me/919871582404?text=${encodeURIComponent(
    `Hi, I'm interested in: ${displayName} (SKU: ${product.sku}). Please share more details.`
  )}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: displayName, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const configuratorEnabled = isGemConfiguratorEnabled(
    product.category,
    (product as Product & { configurator_enabled?: boolean }).configurator_enabled,
  );

  return (
    <div className="product-cart-bar space-y-2 lg:space-y-4">
      {/* Stock status */}
      {isOnRequest ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#7A1515] sm:gap-2 sm:text-sm">
          <span className="h-2 w-2 rounded-full bg-[#7A1515]" />
          Available on Request
        </div>
      ) : !isUnavailable ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 lg:gap-2 lg:text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 lg:h-2 lg:w-2" />
          {product.availability_status === 'on_demand' ? 'Available on Demand' : 'In Stock'}
          {product.stock_quantity < 5 && (
            <span className="text-amber-600">— Only {product.stock_quantity} left!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 sm:gap-2 sm:text-sm">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          {product.availability_status === 'reserved' ? 'Reserved' : product.availability_status === 'sold' ? 'Sold' : 'Out of Stock'}
        </div>
      )}

      {isOnRequest ? (
        <div className="flex flex-col gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
            style={{ background: '#25D366' }}
          >
            <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Enquire on WhatsApp
          </a>
          <Link
            href="/contact?type=enquiry"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 py-2.5 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-2 sm:py-3 sm:text-sm"
            style={{ borderColor: '#7A1515', color: '#7A1515' }}
          >
            <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Request a Quote
          </Link>
        </div>
      ) : (
      <>
      {/* Primary action row — compact single line on mobile */}
      <div className="flex items-stretch gap-1.5 lg:gap-2">
        {showQuantityStepper ? (
          <div className="flex shrink-0 items-center rounded-md border border-[var(--pvg-border)] bg-brand-surface lg:rounded-lg">
            <button
              onClick={handleDecrease}
              className="flex h-9 w-7 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)] lg:h-10 lg:w-9"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-[13px] font-semibold text-[var(--pvg-primary)] lg:w-7 lg:text-[14px]">
              {displayQty}
            </span>
            <button
              onClick={handleIncrease}
              disabled={displayQty >= maxQuantity}
              className="flex h-9 w-7 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)] disabled:cursor-not-allowed disabled:opacity-40 lg:h-10 lg:w-9"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : null}

        <button
          onClick={inCart ? undefined : handleAdd}
          disabled={isUnavailable}
          className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 lg:gap-2 lg:rounded-lg lg:px-5 lg:py-3 lg:text-sm"
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
            <><Gem className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" /><span className="truncate">{isUnavailable ? 'Unavailable' : inCart ? 'In cart' : 'Buy loose'}</span></>
          ) : (
            <><ShoppingBag className="h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" /><span className="truncate">{isUnavailable ? 'Unavailable' : inCart ? 'In cart' : 'Add to cart'}</span></>
          )}
        </button>

        <WishlistButton
          productId={product.id}
          productName={displayName}
          className="h-9 w-9 shrink-0 lg:h-10 lg:w-10"
          stopPropagation={false}
        />
        <button
          onClick={handleShare}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)] lg:rounded-lg lg:h-10 lg:w-10"
          aria-label="Share"
        >
          <Share2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
        </button>
      </div>

      {/* Configure in Jewelry — only shown when configurator is enabled */}
      {configuratorEnabled && (
        <Link
          href={`/configure/${product.id}`}
          onClick={() => trackStorefrontEvent('configurator_start', { product_id: product.id, source: 'product_detail' })}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border-2 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md lg:gap-2 lg:rounded-lg lg:py-3 lg:text-sm"
          style={{
            borderColor: '#7A1515',
            color: '#7A1515',
          }}
        >
          <Gem className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          Configure in jewellery
        </Link>
      )}
      </>
      )}

      {/* WhatsApp + Book Consultation */}
      <div className="grid grid-cols-2 gap-1.5 lg:flex lg:gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold transition hover:opacity-80 sm:rounded-lg sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[11px]"
          style={{ borderColor: '#25D366', color: '#25D366' }}
        >
          <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          WhatsApp
        </a>
        <Link
          href="/contact?type=consultation"
          className="flex items-center justify-center gap-1 rounded-md border border-[var(--pvg-border)] px-2 py-1.5 text-[10px] font-semibold text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)] sm:gap-1.5 sm:px-3 sm:py-2 sm:text-[11px]"
        >
          <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="truncate">Book Consultation</span>
        </Link>
      </div>
    </div>
  );
}
