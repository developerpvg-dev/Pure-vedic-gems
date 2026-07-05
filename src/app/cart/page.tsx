'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Lock, Package, Settings2 } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { canIncreaseQuantity, getMaxAvailableQuantity } from '@/lib/cart/client';
import { RUDRAKSHA_CONFIGURATOR_ENABLED } from '@/lib/utils/rudraksha-configurator';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';
import { productHref } from '@/lib/categories/storefront';
import { formatPrice } from '@/lib/utils/format';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';

// ─── Cart item row ────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onRemove,
  onUpdate,
}: {
  item: ReturnType<typeof useCart>['cart']['items'][number];
  onRemove: (key: string) => void;
  onUpdate: (key: string, qty: number) => void;
}) {
  const itemHref = productHref({ category: item.category, slug: item.slug ?? item.product_id });
  const maxQuantity = getMaxAvailableQuantity(item);
  const canIncrease = canIncreaseQuantity(item);

  return (
    <div className="flex items-start gap-4 border-b border-[var(--pvg-border)] py-6 last:border-0">
      {/* Thumbnail */}
      <Link
        href={itemHref}
        className="relative h-[90px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-[var(--pvg-border)] bg-brand-bg-alt"
      >
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          sizes="72px"
          className="object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={itemHref}
          className="font-heading text-[15px] font-semibold leading-snug text-[var(--pvg-primary)] transition hover:text-[var(--pvg-accent)]"
        >
          {item.name}
        </Link>
        {item.carat_weight && (
          <p className="text-[12px] text-[var(--pvg-muted)]">
            {item.carat_weight.toFixed(2)} ct
            {item.origin ? ` · ${item.origin}` : ''}
          </p>
        )}
        {(item.configuration_summary || item.configuration_snapshot) && (
          <div className="mt-1 space-y-1">
            <ConfigurationDetailsDisplay
              snapshot={item.configuration_snapshot}
              summary={item.configuration_summary}
              deliveryEtaLabel={item.delivery_eta_label}
              variant="compact"
            />
            <Link
              href={item.configuration_edit_url ?? `/configure/${item.product_id}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--pvg-accent)] transition hover:underline"
            >
              <Settings2 className="h-3 w-3" />
              Edit Configuration
            </Link>
          </div>
        )}
        {RUDRAKSHA_CONFIGURATOR_ENABLED && !item.configuration_id && item.category === 'rudraksha' && (
          <Link
            href={`/configure/${item.product_id}`}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[var(--pvg-accent)]/30 bg-brand-gold-light px-2.5 py-1 text-[11px] font-semibold text-[var(--pvg-accent)] transition hover:bg-brand-gold-light/80"
          >
            <Settings2 className="h-3 w-3" />
            Configure Pendant
          </Link>
        )}

        {/* Qty + price row */}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-center rounded-lg border border-[var(--pvg-border)]">
              <button
                onClick={() => onUpdate(item.key, item.quantity - 1)}
                className="flex h-8 w-8 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)]"
                aria-label="Decrease"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-[13px] font-semibold text-[var(--pvg-primary)]">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdate(item.key, item.quantity + 1)}
                disabled={!canIncrease}
                className="flex h-8 w-8 items-center justify-center text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {maxQuantity > 0 && item.quantity >= maxQuantity && (
              <p className="mt-1 text-[11px] font-medium text-amber-700">
                {item.sold_individually ? 'Limited to 1 per order' : `Maximum available: ${maxQuantity}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <p className="text-[16px] font-bold text-[var(--pvg-primary)]">
              {formatPrice(item.price * item.quantity)}
            </p>
            <button
              onClick={() => onRemove(item.key)}
              className="rounded-lg p-1.5 text-[var(--pvg-muted)] transition hover:bg-red-50 hover:text-red-500"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Summary ────────────────────────────────────────────────────────────

function OrderSummary({ subtotal }: { subtotal: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');
  const shipping = subtotal === 0 ? 0 : subtotal >= 50000 ? 0 : 500;
  const total = subtotal + shipping;

  return (
    <div className="sticky pvg-sticky-below-header rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-6">
      <h2 className="font-heading mb-6 text-lg font-semibold text-[var(--pvg-primary)]">
        Order Summary
      </h2>

      <div className="space-y-3 text-[14px]">
        <div className="flex justify-between text-[var(--pvg-text)]">
          <span>Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--pvg-muted)]">Shipping</span>
          <span className={shipping === 0 ? 'font-semibold text-green-600' : 'font-semibold text-[var(--pvg-text)]'}>
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </span>
        </div>
        {shipping > 0 && (
          <p className="text-[11px] text-[var(--pvg-muted)]">
            Free shipping on orders above ₹50,000
          </p>
        )}
        <div className="my-3 border-t border-[var(--pvg-border)]" />
        <div className="flex justify-between">
          <span className="font-bold text-[var(--pvg-primary)]">Estimated Total</span>
          <span className="text-xl font-bold text-[var(--pvg-primary)]">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      {!user && (
        <div className="mt-6 rounded-xl border border-[var(--pvg-border)] bg-brand-bg-alt p-4">
          <p className="text-sm font-semibold text-[var(--pvg-primary)]">
            Checkout as a guest or create an account
          </p>
          <p className="mt-1 text-xs text-[var(--pvg-muted)]">
            Guest checkout is available. An account helps you track order status, delivery updates, invoices, and future gemstone purchases.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={() => {
                setAuthView('register');
                setAuthModalOpen(true);
              }}
              className="rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Create Account
            </button>
            <button
              onClick={() => {
                setAuthView('login');
                setAuthModalOpen(true);
              }}
              className="rounded-lg border border-[var(--pvg-border)] px-4 py-2.5 text-sm font-semibold text-[var(--pvg-primary)] transition hover:bg-brand-gold-light"
            >
              I Already Have an Account
            </button>
          </div>
        </div>
      )}

      <Link
        href="/checkout"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: 'var(--pvg-primary)' }}
      >
        Proceed to Checkout
        <ArrowRight className="h-4 w-4" />
      </Link>

      <LoginModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authView}
        onSuccess={() => {
          setAuthModalOpen(false);
          router.push('/checkout');
        }}
      />

      {/* Trust signals */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[11px] text-[var(--pvg-muted)]">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--pvg-accent)]" />
          Secure checkout — 256-bit SSL encryption
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--pvg-muted)]">
          <Package className="h-3.5 w-3.5 shrink-0 text-[var(--pvg-accent)]" />
          Fully insured shipping worldwide
        </div>
      </div>

      {/* Policy links */}
      <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--pvg-border)] pt-4 text-[11px] text-[var(--pvg-muted)]">
        <Link href="/policies/returns" className="hover:text-[var(--pvg-accent)]">Returns Policy</Link>
        <span>·</span>
        <Link href="/policies/shipping" className="hover:text-[var(--pvg-accent)]">Shipping Info</Link>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-gold-light">
        <ShoppingBag className="h-10 w-10 text-[var(--pvg-accent)]" />
      </div>
      <h2 className="font-heading mb-2 text-2xl text-[var(--pvg-primary)]">
        Your cart is empty
      </h2>
      <p className="mb-8 max-w-xs text-[var(--pvg-muted)]">
        Explore our curated collection of certified Vedic gemstones and accessories.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-[13px] font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] transition hover:-translate-y-0.5 hover:shadow-lg"
        style={{ background: 'var(--pvg-primary)' }}
      >
        Browse Gemstones
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { cart, removeItem, updateQty } = useCart();
  const { items, subtotal, item_count } = cart;
  const rudrakshaWithoutConfig = RUDRAKSHA_CONFIGURATOR_ENABLED
    ? items.filter((item) => item.category === 'rudraksha' && !item.configuration_id)
    : [];
  const comboConfigureHref =
    rudrakshaWithoutConfig.length >= 2
      ? `/configure/${rudrakshaWithoutConfig[0].product_id}?combo=${rudrakshaWithoutConfig
          .map((item) => item.product_id)
          .join(',')}`
      : null;

  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-24 md:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-8 flex items-baseline justify-between">
          <h1 className="font-heading text-[28px] font-bold text-[var(--pvg-primary)] md:text-[36px]">
            Shopping Cart
          </h1>
          {item_count > 0 && (
            <p className="text-[13px] text-[var(--pvg-muted)]">
              {item_count} item{item_count !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* ── Items ── */}
            <div>
              {comboConfigureHref && (
                <div className="mb-4 rounded-2xl border border-[var(--pvg-accent)]/25 bg-brand-gold-light px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--pvg-primary)]">
                    Design a multi-bead Rudraksha pendant
                  </p>
                  <p className="mt-1 text-xs text-[var(--pvg-muted)]">
                    You have {rudrakshaWithoutConfig.length} Rudraksha beads in your cart. Configure a
                    pendant that combines them.
                  </p>
                  <Link
                    href={comboConfigureHref}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[var(--pvg-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Configure Multi-Bead Pendant
                  </Link>
                </div>
              )}
              <div className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface px-5 py-2">
                {items.map((item) => (
                  <CartItemRow
                    key={item.key}
                    item={item}
                    onRemove={removeItem}
                    onUpdate={updateQty}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Link
                  href="/shop"
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)]"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div>
              <OrderSummary subtotal={subtotal} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
