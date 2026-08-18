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
import {
  formatOrderMoney,
  type OrderChargeContext,
} from '@/lib/currency/format-charged';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';
import { isPaidPaymentStatus } from '@/lib/constants/order-status';
import {
  buildOrderPriceLines,
  orderItemMerchandiseTotal,
} from '@/lib/orders/price-breakdown-lines';
import {
  canCustomerResubmitBankTransfer,
  parseBankTransferProof,
} from '@/lib/orders/bank-transfer-proof';
import { BankTransferResubmitForm } from '@/components/orders/BankTransferResubmitForm';
import { trackEcommerceEvent } from '@/lib/utils/analytics';

const CONFETTI_COLORS = ['#C9A84C', '#3D2B1F', '#E0A830', '#50C878', '#FF6B6B', '#4ECDC4'];
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  animationDelay: `${((i * 13) % 20) / 10}s`,
  animationDuration: `${2 + ((i * 7) % 30) / 10}s`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotation: `rotate(${(i * 29) % 360}deg)`,
}));

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
    configuration_summary?: string;
    configuration_snapshot?: unknown;
    delivery_eta_label?: string;
  }>;
  subtotal: number;
  jewelry_charges: number;
  metal_charges: number;
  certification_charges: number;
  energization_charges: number;
  shipping_cost: number;
  discount: number;
  coupon_discount: number;
  coupon_code: string | null;
  reward_discount: number;
  reward_points_redeemed: number;
  gst_amount: number;
  tax_breakdown?: unknown;
  total: number;
  amount_paid?: number | null;
  amount_due?: number | null;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  payment_status: string;
  payment_method?: string | null;
  payment_review_reason?: string | null;
  compliance_flags?: unknown;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  customer_id: string | null;
  created_at: string;
  chargeContext?: OrderChargeContext | null;
}

interface Props {
  order: OrderData;
  isLoggedIn: boolean;
}

export function OrderConfirmationClient({ order, isLoggedIn }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const priceLines = buildOrderPriceLines(order);
  const money = (n: number) => formatOrderMoney(n, order.chargeContext);

  // An advance confirms the order just like a full payment — only the balance differs.
  const balanceDue = Number(order.amount_due ?? 0);
  const isAdvance = order.payment_status === 'partial' && balanceDue > 0.009;
  const isPaid = isPaidPaymentStatus(order.payment_status) || isAdvance;
  const isPaymentReview = order.payment_status === 'amount_mismatch' || order.status === 'payment_review';
  const isFailed = order.payment_status === 'failed' || order.payment_status === 'cancelled';
  const bankProof = parseBankTransferProof(order.compliance_flags);
  const isBankTransfer =
    order.payment_method === 'bank_transfer' || Boolean(bankProof);
  const isBankRejected = bankProof?.status === 'rejected';
  const isBankTransferPending =
    isBankTransfer &&
    !isPaid &&
    (isPaymentReview || order.status === 'pending_payment');
  const canResubmit = canCustomerResubmitBankTransfer(
    bankProof,
    order.status,
    order.payment_status,
  );

  useEffect(() => {
    if (!isPaid) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [isPaid]);

  useEffect(() => {
    if (!isPaid) return;
    const key = `pvg_meta_purchase_${order.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // private mode / blocked storage — still fire once this mount
    }
    trackEcommerceEvent('purchase', {
      value: Number(order.amount_paid ?? order.total ?? 0),
      currency: 'INR',
      transaction_id: order.order_number,
      num_items: order.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
  }, [isPaid, order.amount_paid, order.id, order.items, order.order_number, order.total]);

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

  const statusTitle = isAdvance
    ? 'Advance Received — Order Confirmed'
    : isPaid
    ? 'Thank You!'
    : isBankRejected
      ? 'Payment Proof Needs an Update'
    : isBankTransferPending
      ? 'We Got Your Transfer'
    : isPaymentReview
      ? 'Payment Under Review'
      : isFailed
        ? 'Payment Not Completed'
        : 'Order Created';
  const statusMessage = isAdvance
    ? `We received your advance of ${money(Number(order.amount_paid ?? 0))}. Your order is confirmed — the remaining ${money(balanceDue)} is payable once it is ready, and we will notify you by email.`
    : isPaid
    ? 'Your payment was successful. We\'re preparing your order with utmost care.'
    : isBankRejected
      ? bankProof?.reject_reason ||
        order.payment_review_reason ||
        'We could not match your bank transfer. Please update the details below and resubmit.'
    : isBankTransferPending
      ? 'Thanks for submitting your bank transfer proof. We will review your payment and confirm the order within 24 hours.'
    : isPaymentReview
      ? 'We received a payment update that needs manual review. Our team will contact you before processing the order.'
      : isFailed
        ? 'Your order was created, but the payment was not completed. You can retry checkout or contact support with this order number.'
        : 'Your order has been created. We\'re confirming your payment.';
  const badgeClass = isPaid
    ? 'bg-green-100 text-green-700'
    : isBankRejected
      ? 'bg-red-100 text-red-700'
    : isPaymentReview || isFailed || isBankTransferPending
      ? 'bg-amber-100 text-amber-800'
      : 'bg-amber-100 text-amber-700';
  const badgeDotClass = isPaid
    ? 'bg-green-500'
    : isBankRejected
      ? 'bg-red-500'
    : 'bg-amber-500';
  const badgeText = isPaid
    ? 'Payment Confirmed'
    : isBankRejected
      ? 'Proof Rejected'
    : isBankTransferPending
      ? 'Review within 24 hours'
    : isPaymentReview
      ? 'Payment Under Review'
      : isFailed
        ? 'Payment Failed'
        : 'Confirming Payment...';

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {CONFETTI_PIECES.map((piece, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: piece.left,
                top: '-10px',
                animationDelay: piece.animationDelay,
                animationDuration: piece.animationDuration,
              }}
            >
              <div
                className="w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: piece.color,
                  transform: piece.rotation,
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
            {statusTitle}
          </h1>
          <p className="text-[var(--pvg-muted)] text-lg max-w-md mx-auto">
            {statusMessage}
          </p>
        </div>

        {/* Order Number Card */}
        <div className="bg-brand-surface rounded-2xl border border-[var(--pvg-border)] p-8 mb-6 text-center">
          <p className="text-xs text-[var(--pvg-muted)] uppercase tracking-[3px] mb-2">
            Order Number
          </p>
          <div className="flex items-center justify-center gap-3">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-[var(--pvg-primary)]">
              {order.order_number}
            </h2>
            <button
              onClick={handleCopyOrderNumber}
              className="p-1.5 rounded-md hover:bg-brand-bg-alt transition-colors"
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
          <div className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-sm font-medium ${badgeClass}`}>
            <span className={`h-2 w-2 rounded-full ${badgeDotClass}`} />
            {badgeText}
          </div>
        </div>

        {isBankTransfer && !isPaid ? (
          <div className="mb-6 space-y-4">
            {isBankTransferPending && !isBankRejected ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
                <p className="font-semibold">We will review and confirm within 24 hours</p>
                <p className="mt-1 text-amber-900/85">
                  Your bank transfer details are with our team. You will get an email once the payment
                  is verified and the order is confirmed.
                </p>
              </div>
            ) : null}
            {bankProof && bankProof.status !== 'rejected' ? (
              <div className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pvg-muted)]">
                  Submitted transfer
                </p>
                <p className="mt-2 font-medium text-[var(--pvg-text)]">
                  {bankProof.bank_label} · {bankProof.reference}
                </p>
                {bankProof.notes ? (
                  <p className="mt-1 text-[var(--pvg-muted)]">{bankProof.notes}</p>
                ) : null}
              </div>
            ) : null}
            {canResubmit ? (
              <BankTransferResubmitForm
                orderId={order.id}
                orderTotalLabel={money(order.total)}
                amountLabel={money(order.total)}
                currency={order.chargeContext?.currency}
                existing={bankProof}
                onSubmitted={() => window.location.reload()}
              />
            ) : null}
          </div>
        ) : null}

        {/* Items Summary */}
        <div className="bg-brand-surface rounded-2xl border border-[var(--pvg-border)] p-6 mb-6">
          <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-4">
            Items Ordered
          </h3>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md border border-[var(--pvg-border)] bg-brand-bg-alt">
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
                  {Boolean(item.configuration_summary || item.configuration_snapshot) && (
                    <div className="mt-1">
                      <ConfigurationDetailsDisplay
                        snapshot={item.configuration_snapshot}
                        summary={item.configuration_summary}
                        deliveryEtaLabel={item.delivery_eta_label}
                        variant="compact"
                      />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--pvg-primary)]">
                  {money(orderItemMerchandiseTotal(item))}
                </p>
              </div>
            ))}
          </div>

          {/* Totals — same charge lines as account / admin / email */}
          <div className="border-t border-[var(--pvg-border)] mt-4 pt-4 space-y-1.5 text-sm">
            {priceLines.map((line) => (
              <div key={line.key} className="flex justify-between gap-3">
                <span className="text-[var(--pvg-muted)]">{line.label}</span>
                <span className={line.sign < 0 ? 'text-green-700' : undefined}>
                  {line.sign < 0 ? '−' : ''}
                  {money(line.amount)}
                </span>
              </div>
            ))}
            <div className="border-t border-[var(--pvg-border)] pt-2 flex justify-between font-semibold">
              <span className="text-[var(--pvg-primary)]">Total</span>
              <span className="text-[var(--pvg-accent)] text-lg">{money(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-brand-surface rounded-2xl border border-[var(--pvg-border)] p-6 mb-8">
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
            href={`/track-order?order=${encodeURIComponent(order.order_number)}${order.guest_email ? `&email=${encodeURIComponent(order.guest_email)}` : ''}`}
            className="flex items-center justify-center gap-2 bg-brand-primary text-white py-3.5 px-6 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
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
          <div className="bg-brand-gold-light rounded-2xl border border-[var(--pvg-accent)]/30 p-6 mb-8 text-center">
            <UserPlus className="h-8 w-8 text-[var(--pvg-accent)] mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-2">
              Create an account to track future orders
            </h3>
            <p className="text-sm text-[var(--pvg-muted)] mb-4">
              Get order updates, save favorites, and enjoy faster checkout.
            </p>
            <Link
              href={`/order-confirmation/${order.id}?auth=login`}
              className="inline-flex items-center gap-2 bg-brand-accent text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Create Account
            </Link>
          </div>
        )}

        {/* Continue Shopping */}
        <div className="text-center">
          <Link
            href="/gemstones"
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
