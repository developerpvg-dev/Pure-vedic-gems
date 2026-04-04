'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, MessageCircle, Share2, ShieldCheck, Package, Zap, BadgeCheck, Gem, Phone } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
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
    if (inCart) {
      updateQty(product.id, cartQty + 1);
    } else {
      setLocalQty((q) => q + 1);
    }
  };

  const handleAdd = useCallback(() => {
    addItem({
      product_id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      image_url: getImageSrc(product),
      price: product.price,
      quantity: localQty,
      carat_weight: product.carat_weight ?? null,
      origin: product.origin ?? null,
    });
    setLocalQty(1); // reset local counter after adding
    toast.success(`${product.name} added to cart`, {
      description: `${localQty} item${localQty > 1 ? 's' : ''} added.`,
      action: { label: 'View Cart', onClick: () => (window.location.href = '/cart') },
    });
  }, [addItem, product, localQty]);

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

  // Reset localQty to 1 when item is removed from cart (inCart goes from true to false)
  useEffect(() => {
    if (!inCart && localQty > 1) {
      setLocalQty(1);
    }
  }, [inCart, localQty]);

  return (
    <div className="space-y-3">
      {/* Stock status */}
      {product.in_stock ? (
        <div className="flex items-center gap-2 text-[12px] font-semibold text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          In Stock
          {product.stock_quantity <= product.low_stock_threshold && (
            <span className="ml-1 text-amber-600">— Only {product.stock_quantity} left!</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[12px] font-semibold text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Out of Stock
        </div>
      )}

      {/* Primary action row — quantity + main CTA */}
      <div className="flex gap-2">
        {/* Quantity selector */}
        <div className="flex items-center rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
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
            className="flex h-10 w-9 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)]"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Main CTA: Buy Loose (if configurator) or Add to Cart */}
        <button
          onClick={inCart ? undefined : handleAdd}
          disabled={!product.in_stock}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-[12px] font-bold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: inCart
              ? '#2e7d32'
              : configuratorEnabled
              ? 'var(--pvg-accent)'
              : 'var(--pvg-primary)',
            color: 'var(--pvg-bg)',
            cursor: inCart ? 'default' : 'pointer',
          }}
        >
          {configuratorEnabled ? (
            <><Gem className="h-4 w-4" />{inCart ? 'In Cart ✓' : 'Buy Loose'}</>
          ) : (
            <><ShoppingBag className="h-4 w-4" />{inCart ? 'In Cart ✓' : 'Add to Cart'}</>
          )}
        </button>

        {/* Icon buttons — wishlist + share (non-configurator layout) */}
        {!configuratorEnabled && (
          <>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
              aria-label="Add to Wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              onClick={handleShare}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)]"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Configure in Jewelry — only shown when configurator is enabled */}
      {configuratorEnabled && (
        <Link
          href={`/configure/${product.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 py-2.5 text-[12px] font-bold uppercase tracking-[1.5px] transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{
            borderColor: 'var(--pvg-primary)',
            color: 'var(--pvg-primary)',
          }}
        >
          <Gem className="h-4 w-4" />
          Configure in Jewelry
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
        {/* Share — shown in configurator layout only */}
        {configuratorEnabled && (
          <button
            onClick={handleShare}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)]"
            aria-label="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Trust badges — compact 4-column row */}
      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
        {[
          { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: 'Lab Certified' },
          { icon: <Package className="h-3.5 w-3.5" />, label: '100% Genuine' },
          { icon: <Zap className="h-3.5 w-3.5" />, label: 'Vedic Energized' },
          { icon: <BadgeCheck className="h-3.5 w-3.5" />, label: 'Since 1937' },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex flex-col items-center gap-1 rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-surface)] px-1.5 py-2 text-center"
          >
            <span className="text-[var(--pvg-accent)]">{badge.icon}</span>
            <span className="text-[9px] font-semibold uppercase leading-tight tracking-[0.5px] text-[var(--pvg-muted)]">
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
