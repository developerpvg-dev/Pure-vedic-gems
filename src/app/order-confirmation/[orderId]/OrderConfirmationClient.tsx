'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  MessageCircle,
  ShoppingBag,
  UserPlus,
  Copy,
  Check,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';

interface OrderData {
  id: string;
  order_number: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    image_url?: string;
    carat_weight?: number;
    origin?: string;
  }>;
  subtotal: number;
  shipping_cost: number;
  gst_amount: number;
  total: number;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  payment_status: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  customer_id: string | null;
  created_at: string;
}

interface Props {
  order: OrderData;
  isLoggedIn: boolean;
}

export function OrderConfirmationClient({ order, isLoggedIn }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);

  // Trigger confetti animation on mount
  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappMessage = `Hi, I just placed order ${order.order_number} on PureVedicGems. Looking forward to receiving my gems! ✨`;
  const whatsappUrl = `https://wa.me/919871582404?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const isPaid = order.payment_status === 'completed';

  return (
    <div className="min-h-screen bg-[var(--pvg-bg)]">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: ['#C9A84C', '#3D2B1F', '#E0A830', '#50C878', '#FF6B6B', '#4ECDC4'][
                    Math.floor(Math.random() * 6)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[var(--pvg-primary)] mb-3">
            {isPaid ? 'Thank You!' : 'Order Created'}
          </h1>
          <p className="text-[var(--pvg-muted)] text-lg max-w-md mx-auto">
            {isPaid
              ? 'Your payment was successful. We\'re preparing your order with utmost care.'
              : 'Your order has been created. We\'re confirming your payment.'}
          </p>
        </div>

        {/* Order Number Card */}
        <div className="bg-[var(--pvg-surface)] rounded-2xl border border-[var(--pvg-border)] p-8 mb-6 text-center">
          <p className="text-xs text-[var(--pvg-muted)] uppercase tracking-[3px] mb-2">
            Order Number
          </p>
          <div className="flex items-center justify-center gap-3">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[var(--pvg-primary)]">
              {order.order_number}
            </h2>
            <button
              onClick={handleCopyOrderNumber}
              className="p-1.5 rounded-md hover:bg-[var(--pvg-bg-alt)] transition-colors"
              title="Copy order number"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-[var(--pvg-muted)]" />
              )}
            </button>
          </div>
          <p className="text-sm text-[var(--pvg-muted)] mt-2">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>

          {/* Status badge */}
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isPaid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPaid ? 'bg-green-500' : 'bg-amber-500'
                }`}
              />
              {isPaid ? 'Payment Confirmed' : 'Confirming Payment...'}
            </span>
          </div>
        </div>

        {/* Items Summary */}
        <div className="bg-[var(--pvg-surface)] rounded-2xl border border-[var(--pvg-border)] p-6 mb-6">
          <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-4">
            Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[var(--pvg-muted)]">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--pvg-text)] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--pvg-muted)]">
                    Qty: {item.quantity}
                    {item.carat_weight ? ` · ${item.carat_weight} ct` : ''}
                    {item.origin ? ` · ${item.origin}` : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--pvg-primary)]">
                  {formatPrice(item.line_total)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-[var(--pvg-border)] mt-4 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--pvg-muted)]">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--pvg-muted)]">Shipping</span>
              <span className={order.shipping_cost === 0 ? 'text-green-600' : ''}>
                {order.shipping_cost === 0 ? 'FREE' : formatPrice(order.shipping_cost)}
              </span>
            </div>
            {order.gst_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--pvg-muted)]">GST (3%)</span>
                <span>{formatPrice(order.gst_amount)}</span>
              </div>
            )}
            <div className="border-t border-[var(--pvg-border)] pt-2 flex justify-between font-semibold">
              <span className="text-[var(--pvg-primary)]">Total</span>
              <span className="text-[var(--pvg-accent)] text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-[var(--pvg-surface)] rounded-2xl border border-[var(--pvg-border)] p-6 mb-8">
          <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-3">
            Shipping To
          </h3>
          <p className="text-sm text-[var(--pvg-text)]">
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}
          </p>
          <p className="text-sm text-[var(--pvg-muted)]">
            {order.shipping_address.city}, {order.shipping_address.state} -{' '}
            {order.shipping_address.pincode}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <Link
            href="/account/orders"
            className="flex items-center justify-center gap-2 bg-[var(--pvg-primary)] text-white py-3.5 px-6 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Package className="h-4 w-4" />
            Track Order
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 text-white py-3.5 px-6 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </a>
        </div>

        {/* Guest CTA */}
        {!isLoggedIn && order.guest_email && (
          <div className="bg-[var(--pvg-gold-light)] rounded-2xl border border-[var(--pvg-accent)]/30 p-6 mb-8 text-center">
            <UserPlus className="h-8 w-8 text-[var(--pvg-accent)] mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-2">
              Create an account to track future orders
            </h3>
            <p className="text-sm text-[var(--pvg-muted)] mb-4">
              Get order updates, save favorites, and enjoy faster checkout.
            </p>
            <Link
              href="/?auth=login"
              className="inline-flex items-center gap-2 bg-[var(--pvg-accent)] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Create Account
            </Link>
          </div>
        )}

        {/* Continue Shopping */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-[var(--pvg-accent)] hover:underline font-medium"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Confetti animation keyframes */}
      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}
