'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils/format';
import { SHIPPING_METHODS, type ShippingMethodId } from '@/lib/validators/order';
import type { CartItem } from '@/lib/types/cart';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  shippingMethod: ShippingMethodId;
}

export function CheckoutOrderSummary({ items, shippingMethod }: CheckoutOrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.cost ?? 0;
  const gst = Math.round(subtotal * 0.03);
  const total = subtotal + shipping + gst;

  return (
    <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6">
      <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)] mb-4">
        Order Summary
      </h2>

      {/* Items */}
      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-3">
            <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]">
              <Image
                src={item.image_url || '/placeholder-gem.png'}
                alt={item.name}
                fill
                sizes="44px"
                className="object-cover"
              />
              {item.quantity > 1 && (
                <span className="absolute -top-1 -right-1 bg-[var(--pvg-accent)] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--pvg-text)] truncate">
                {item.name}
              </p>
              {item.carat_weight && (
                <p className="text-xs text-[var(--pvg-muted)]">
                  {item.carat_weight} ct
                  {item.origin ? ` · ${item.origin}` : ''}
                </p>
              )}
            </div>
            <p className="text-sm font-semibold text-[var(--pvg-primary)] whitespace-nowrap">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--pvg-border)] my-4" />

      {/* Breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--pvg-muted)]">
            Subtotal ({items.length} item{items.length > 1 ? 's' : ''})
          </span>
          <span className="text-[var(--pvg-text)]">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--pvg-muted)]">Shipping</span>
          <span className={shipping === 0 ? 'text-green-600 font-medium' : 'text-[var(--pvg-text)]'}>
            {shipping === 0 ? 'FREE' : formatPrice(shipping)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[var(--pvg-muted)]">GST (3%)</span>
          <span className="text-[var(--pvg-text)]">{formatPrice(gst)}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--pvg-border)] my-4" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="font-heading text-base font-bold text-[var(--pvg-primary)]">
          Total
        </span>
        <span className="font-heading text-xl font-bold text-[var(--pvg-accent)]">
          {formatPrice(total)}
        </span>
      </div>

      {/* EMI teaser */}
      {total >= 5000 && (
        <p className="text-xs text-[var(--pvg-muted)] mt-3 text-center">
          Or from {formatPrice(Math.ceil(total / 12))}/month × 12 with EMI
        </p>
      )}
    </div>
  );
}
