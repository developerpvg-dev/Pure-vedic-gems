'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Share2, Gem, Phone, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useCurrencySubscription } from '@/lib/hooks/useCurrency';
import { WishlistButton } from '@/components/shop/WishlistButton';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { toast } from 'sonner';
import type { Product } from '@/lib/types/product';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import {
  formatProductListPrice,
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

const BURGUNDY = '#7A1515';
const FOREST = '#1D5335';
const PHONE_TEL = 'tel:+919871582404';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.139-1.633-.807-1.886-.9-.253-.093-.437-.139-.62.14-.183.278-.71.9-.87 1.085-.16.185-.32.208-.592.07-.272-.139-1.15-.424-2.19-1.352-.81-.722-1.357-1.613-1.516-1.886-.16-.272-.017-.42.122-.558.125-.124.278-.323.417-.484.139-.161.185-.278.278-.463.093-.185.047-.347-.023-.485-.07-.139-.62-1.494-.85-2.047-.223-.538-.45-.465-.62-.473l-.528-.01c-.185 0-.485.07-.737.347-.253.278-.967.945-.967 2.304 0 1.36.99 2.672 1.127 2.857.139.185 1.95 2.98 4.727 4.178.661.286 1.177.457 1.579.585.663.212 1.266.182 1.742.11.532-.08 1.633-.668 1.864-1.313.23-.645.23-1.198.16-1.313-.07-.114-.253-.185-.53-.324z" />
      <path d="M12.04 2C6.53 2 2.05 6.48 2.05 12c0 1.77.46 3.45 1.28 4.92L2 22l5.23-1.37A9.95 9.95 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2zm0 18.15c-1.62 0-3.17-.44-4.5-1.22l-.32-.19-3.1.81.83-3.02-.21-.33a8.13 8.13 0 0 1-1.25-4.2c0-4.5 3.66-8.16 8.15-8.16 4.5 0 8.15 3.66 8.15 8.16 0 4.49-3.66 8.15-8.15 8.15z" />
    </svg>
  );
}

/** Compact pill CTA — matches product-page action strip */
const primaryPill =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold tracking-[0.01em] transition duration-150 sm:h-9 sm:px-4 sm:text-[13px]';
const iconPill =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(122,21,21,0.14)] bg-white text-[#7A6250] transition hover:border-[#7A1515]/35 hover:text-[#7A1515] sm:h-9 sm:w-9';
const secondaryPill =
  'inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-full px-2 text-[10px] font-semibold tracking-[0.01em] transition duration-150 sm:h-9 sm:gap-1.5 sm:px-3 sm:text-[13px]';
const stickyPill =
  'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-semibold tracking-[0.01em] transition duration-150 sm:h-11 sm:px-4 sm:text-[13px]';

export function AddToCartBar({ product }: AddToCartBarProps) {
  useCurrencySubscription();
  const { addItem, isInCart, getCartItem } = useCart();
  const displayName = formatProductDisplayName(product.name);
  const inCart = isInCart(product.id);
  const cartItem = getCartItem(product.id);
  const configuredInCart = Boolean(cartItem?.configuration_id);
  const configureHref =
    cartItem?.configuration_edit_url ?? `/configure/${product.id}`;
  const isOnRequest = isProductPriceOnRequest(product);
  const isUnavailable = isProductStockUnavailable(product);
  const cartPrice = resolveProductCartPrice(product);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -8px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleAdd = useCallback(() => {
    if (isUnavailable) {
      toast.error('This product is currently unavailable', {
        description: 'Contact us and we can help source a similar item.',
      });
      return;
    }

    if (inCart) {
      toast.info('This piece is already in your cart');
      return;
    }

    addItem({
      product_id: product.id,
      slug: product.slug,
      sku: product.sku,
      tag_number: product.tag_number ?? null,
      name: displayName,
      category: product.category,
      image_url: getImageSrc(product),
      price: cartPrice,
      quantity: 1,
      stock_quantity: product.stock_quantity,
      stock_status: product.stock_status,
      availability_status: product.availability_status,
      in_stock: product.in_stock,
      sold_individually: true,
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
  }, [addItem, cartPrice, displayName, inCart, isUnavailable, product]);

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

  const primaryLabel = isUnavailable
    ? 'Unavailable'
    : inCart
      ? 'In cart'
      : configuratorEnabled
        ? 'Buy loose'
        : 'Add to cart';

  const row2 = (
    <div className="flex w-full items-center gap-1 sm:gap-1.5">
      <Link
        href="/gems-recommendations"
        className={`${secondaryPill} min-w-0 flex-1 bg-white text-[#7A1515] shadow-[0_2px_8px_rgba(122,21,21,0.12)] hover:bg-[#FFF5F3]`}
      >
        <Sparkles className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
        <span className="truncate">
          <span className="sm:hidden">Remedies</span>
          <span className="hidden sm:inline">Remedies recommendation</span>
        </span>
      </Link>
      <a
        href={PHONE_TEL}
        className={`${secondaryPill} min-w-0 flex-1 bg-[#F0C14B] text-[#2A1810] shadow-[0_2px_8px_rgba(240,193,75,0.28)] hover:bg-[#E5B33A]`}
      >
        <Phone className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
        <span className="truncate">
          <span className="sm:hidden">Call</span>
          <span className="hidden sm:inline">Call us</span>
        </span>
      </a>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className={`${secondaryPill} min-w-0 flex-1 bg-[#25D366] text-white shadow-[0_2px_8px_rgba(37,211,102,0.32)] hover:bg-[#1EBE57]`}
      >
        <WhatsAppIcon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
        <span className="truncate">
          <span className="sm:hidden">WhatsApp</span>
          <span className="hidden sm:inline">Chat with an expert</span>
        </span>
      </a>
      <button type="button" onClick={handleShare} className={iconPill} aria-label="Share">
        <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );

  const stickyDock = (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[915] transition duration-300 ease-out ${
        stickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      aria-hidden={!stickyVisible}
    >
      <div
        className="pointer-events-auto border-t border-[#E8E2D8] bg-white/95 px-3 pt-2.5 shadow-[0_-8px_28px_rgba(61,43,31,0.12)] backdrop-blur-md sm:px-5 sm:pt-3"
        style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#F4EDE3] sm:h-12 sm:w-12">
              <Image
                src={getImageSrc(product)}
                alt={displayName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-snug text-[#3D2B1F] sm:text-[13px]">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-[12px] font-bold text-[#7A1515] sm:text-[13px]">
                {isOnRequest ? 'Price on request' : formatProductListPrice(product).label}
              </p>
              {product.sku ? (
                <p className="mt-0.5 hidden truncate text-[10px] tracking-wide text-[#7A6250] sm:block">
                  SKU: {product.sku}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 lg:gap-3">
            {!isOnRequest && (
              <button
                type="button"
                onClick={inCart ? undefined : handleAdd}
                disabled={isUnavailable || !stickyVisible}
                tabIndex={stickyVisible ? 0 : -1}
                className={`${stickyPill} min-w-[7.25rem] text-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[9.5rem] lg:min-w-[11.5rem] lg:px-6`}
                style={{
                  background: inCart ? FOREST : BURGUNDY,
                  cursor: inCart ? 'default' : 'pointer',
                }}
              >
                {configuratorEnabled ? (
                  <Gem className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                ) : (
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                )}
                <span className="truncate">{primaryLabel}</span>
              </button>
            )}
            {isOnRequest && (
              <Link
                href="/gems-recommendations"
                tabIndex={stickyVisible ? 0 : -1}
                className={`${stickyPill} min-w-[7.25rem] bg-white text-[#7A1515] shadow-[0_2px_8px_rgba(122,21,21,0.12)] sm:min-w-[9.5rem] lg:min-w-[11.5rem] lg:px-6`}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">Remedies</span>
              </Link>
            )}
            <a
              href={PHONE_TEL}
              tabIndex={stickyVisible ? 0 : -1}
              className={`${stickyPill} !flex-none w-10 bg-[#F0C14B] px-0 text-[#2A1810] sm:w-auto sm:min-w-[6.5rem] sm:px-4 lg:min-w-[8.5rem] lg:px-6`}
              aria-label="Call us"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span className="hidden truncate sm:inline">Call</span>
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={stickyVisible ? 0 : -1}
              className={`${stickyPill} !flex-none w-10 bg-[#25D366] px-0 text-white sm:w-auto sm:min-w-[7.5rem] sm:px-4 lg:min-w-[9.5rem] lg:px-6`}
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden truncate sm:inline">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="product-cart-bar space-y-1.5">
        <div ref={sentinelRef} className="h-px w-full" aria-hidden />

        {isOnRequest ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#7A1515]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7A1515]" />
            Available on request
          </div>
        ) : isUnavailable ? (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            {product.availability_status === 'reserved'
              ? 'Reserved'
              : product.availability_status === 'sold'
                ? 'Sold'
                : 'Out of stock'}
          </div>
        ) : null}

        {isOnRequest ? (
          row2
        ) : (
          <>
            <div className="flex w-full items-center gap-1.5">
              <button
                type="button"
                onClick={inCart ? undefined : handleAdd}
                disabled={isUnavailable}
                className={`${primaryPill} min-w-0 flex-1 text-white disabled:cursor-not-allowed disabled:opacity-50`}
                style={{
                  background: inCart ? FOREST : BURGUNDY,
                  cursor: inCart ? 'default' : 'pointer',
                }}
              >
                {configuratorEnabled ? (
                  <Gem className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
                ) : (
                  <ShoppingBag className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
                )}
                <span className="truncate">{primaryLabel}</span>
              </button>

              {configuratorEnabled && (
                <Link
                  href={configureHref}
                  onClick={() =>
                    trackStorefrontEvent(configuredInCart ? 'configurator_edit' : 'configurator_start', {
                      product_id: product.id,
                      source: 'product_detail',
                    })
                  }
                  className={`${primaryPill} min-w-0 flex-1 bg-[#F4EDE3] text-[#7A1515] hover:bg-[#EDE4D6]`}
                >
                  <Gem className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={1.75} />
                  <span className="truncate">
                    <span className="sm:hidden">{configuredInCart ? 'Edit config' : 'Configure'}</span>
                    <span className="hidden sm:inline">
                      {configuredInCart ? 'Edit configuration' : 'Configure in jewellery'}
                    </span>
                  </span>
                </Link>
              )}

              <WishlistButton
                productId={product.id}
                productName={displayName}
                className={iconPill}
                stopPropagation={false}
              />
            </div>

            {row2}
          </>
        )}
      </div>

      {stickyDock}
    </>
  );
}
