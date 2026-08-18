'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag, ArrowRight, Lock, Package, Settings2, UserPlus, LogIn, Gem } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { RUDRAKSHA_CONFIGURATOR_ENABLED } from '@/lib/utils/rudraksha-configurator';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';
import { productHref } from '@/lib/categories/storefront';
import { formatPrice } from '@/lib/utils/format';
import { useCurrencySubscription } from '@/lib/hooks/useCurrency';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';
import { CartItemPriceBreakdown } from '@/components/cart/CartItemPriceBreakdown';
import { buildCartItemPriceBreakdown } from '@/lib/cart/price-breakdown';
import { estimateClientTax } from '@/lib/utils/tax';

// ─── Cart item row ────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onRemove,
}: {
  item: ReturnType<typeof useCart>['cart']['items'][number];
  onRemove: (key: string) => void;
}) {
  const itemHref = productHref({ category: item.category, slug: item.slug ?? item.product_id });
  const breakdown = useMemo(() => buildCartItemPriceBreakdown(item), [item]);
  const pieceTotal = breakdown.preGstSubtotal + breakdown.estimatedGst;

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
        {Boolean(item.configuration_summary || item.configuration_snapshot) && (
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
        {isGemConfiguratorEnabled(item.category) && !item.configuration_id && (
          <div className="mt-3 flex gap-3 rounded-xl bg-[var(--pvg-accent)]/[0.06] px-3.5 py-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'color-mix(in srgb, var(--pvg-accent) 14%, transparent)' }}
              aria-hidden
            >
              <Gem className="h-3.5 w-3.5 text-[var(--pvg-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[13px] font-semibold leading-snug text-[var(--pvg-primary)]">
                {item.category === 'rudraksha'
                  ? 'Want this as a pendant?'
                  : 'Want this set in jewellery?'}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--pvg-muted)]">
                {item.category === 'rudraksha'
                  ? 'Pick metal, arrangement and finish — we will craft it for you.'
                  : 'Pick metal, setting and size — we will craft it for you.'}
              </p>
              <Link
                href={`/configure/${item.product_id}`}
                className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--pvg-accent)] transition hover:gap-2.5"
              >
                Configure this piece
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        <CartItemPriceBreakdown item={item} />

        {/* Price + remove — each piece is unique (qty always 1) */}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[12px] text-[var(--pvg-muted)]">Unique piece total</p>
          <div className="flex items-center gap-4">
            <p className="text-[16px] font-bold text-[var(--pvg-primary)]">
              {formatPrice(pieceTotal)}
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

function OrderSummary({
  subtotal,
  estimatedGst,
}: {
  subtotal: number;
  estimatedGst: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');
  const itemsTotal = subtotal + estimatedGst;

  return (
    <div className="sticky pvg-sticky-below-header rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-6">
      <h2 className="font-heading mb-6 text-lg font-semibold text-[var(--pvg-primary)]">
        Order Summary
      </h2>

      <div className="space-y-3 text-[14px]">
        <div className="flex justify-between text-[var(--pvg-text)]">
          <span>Subtotal</span>
          <span className="font-semibold">{formatPrice(itemsTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--pvg-muted)]">Shipping</span>
          <span className="text-[13px] font-medium text-[var(--pvg-muted)]">
            Calculated at checkout
          </span>
        </div>
        <div className="my-3 border-t border-[var(--pvg-border)]" />
        <div className="flex justify-between">
          <span className="font-bold text-[var(--pvg-primary)]">Items Total</span>
          <span className="text-xl font-bold text-[var(--pvg-primary)]">
            {formatPrice(itemsTotal)}
          </span>
        </div>
      </div>

      {!user && (
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-brand-gold-light">
          <div className="border-b border-[var(--pvg-accent)]/20 px-4 py-3.5">
            <p className="font-heading text-[15px] font-semibold tracking-tight text-[var(--pvg-primary)]">
              Save your purchase journey
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--pvg-muted)]">
              Create an account to track orders, invoices, and delivery updates — or continue as a guest below.
            </p>
          </div>
          <div className="space-y-3 px-4 py-4">
            <ul className="space-y-1.5 text-[11px] text-[var(--pvg-muted)]">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--pvg-accent)]" />
                Order status &amp; insured delivery updates
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--pvg-accent)]" />
                Invoices and gemstone purchase history
              </li>
            </ul>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthView('register');
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'var(--pvg-primary)' }}
              >
                <UserPlus className="h-4 w-4" />
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthView('login');
                  setAuthModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--pvg-accent)]/40 bg-brand-surface px-4 py-2.5 text-sm font-semibold text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)] hover:bg-white"
              >
                <LogIn className="h-4 w-4" />
                I Already Have an Account
              </button>
            </div>
            <p className="text-center text-[11px] text-[var(--pvg-muted)]">
              Prefer guest? Use Proceed to Checkout — no account required.
            </p>
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
        href="/gemstones"
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
  useCurrencySubscription();
  const { cart, removeItem } = useCart();
  const { items, subtotal, item_count } = cart;
  const estimatedGst = useMemo(
    () =>
      estimateClientTax(
        items.map((item) => ({
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          configuration_snapshot: item.configuration_snapshot,
        })),
        0,
      ),
    [items],
  );
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
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Link
                  href="/gemstones"
                  className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--pvg-muted)] transition hover:text-[var(--pvg-primary)]"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div>
              <OrderSummary subtotal={subtotal} estimatedGst={estimatedGst} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
