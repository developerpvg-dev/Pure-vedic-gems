'use client';

import { useState, useCallback } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import type { CartItem } from '@/lib/types/cart';
import type {
  ContactInfo,
  ShippingAddress,
  EnergizationFields,
  ShippingMethodId,
} from '@/lib/validators/order';

// ─── Razorpay Checkout Types ────────────────────────────────────────────────

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
  notes: Record<string, string>;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PaymentVerifyResponse {
  success?: boolean;
  pending?: boolean;
  retry_after_ms?: number;
  error?: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface PaymentSectionProps {
  cartItems: CartItem[];
  contact: ContactInfo;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodId;
  energization?: EnergizationFields;
  specialInstructions?: string;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  onOrderCreated: (orderId: string) => void;
  onPaymentSuccess: (orderId: string) => void;
}

export function PaymentSection({
  cartItems,
  contact,
  shippingAddress,
  shippingMethod,
  energization,
  specialInstructions,
  isProcessing,
  setIsProcessing,
  onOrderCreated,
  onPaymentSuccess,
}: PaymentSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'creating_order' | 'creating_payment' | 'paying' | 'verifying'>('idle');

  // ── Load Razorpay script dynamically ──────────────────────────────────
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  // ── Main payment flow ─────────────────────────────────────────────────
  const handlePayNow = useCallback(async () => {
    if (isProcessing) return;
    setError(null);
    setIsProcessing(true);

    try {
      // ── Step 1: Create order in our DB ──────────────────────────────
      setStep('creating_order');
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            name: item.name,
            sku: item.sku,
            tag_number: item.tag_number,
            quantity: item.quantity,
            price: item.price,
            carat_weight: item.carat_weight,
            origin: item.origin,
            image_url: item.image_url,
            category: item.category,
            configuration_id: item.configuration_id,
            configuration_summary: item.configuration_summary,
            configuration_snapshot: item.configuration_snapshot,
            delivery_eta_label: item.delivery_eta_label,
          })),
          contact,
          shipping_address: shippingAddress,
          shipping_method: shippingMethod,
          energization,
          special_instructions: specialInstructions,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const { order_id, order_number } = orderData;
      onOrderCreated(order_id);

      // ── Step 2: Create Razorpay payment order ───────────────────────
      setStep('creating_payment');
      const paymentRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentData.error || 'Failed to create payment');
      }

      // ── Step 3: Load Razorpay checkout script ───────────────────────
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.');
      }

      // ── Step 4: Open Razorpay checkout modal ────────────────────────
      setStep('paying');
      const options: RazorpayOptions = {
        key: paymentData.key_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'PureVedicGems',
        description: `Order ${order_number}`,
        order_id: paymentData.razorpay_order_id,
        handler: async (response: RazorpayResponse) => {
          // ── Step 5: Verify payment server-side ──────────────────────
          setStep('verifying');
          try {
            let verifyData: PaymentVerifyResponse | null = null;
            for (let attempt = 1; attempt <= 3; attempt += 1) {
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id,
                }),
              });

              const data = (await verifyRes.json()) as PaymentVerifyResponse;
              verifyData = data;
              if (!verifyRes.ok) {
                throw new Error(data.error || 'Payment verification failed');
              }
              if (data.success) break;
              if (!data.pending || attempt === 3) break;
              await wait(data.retry_after_ms ?? 2500);
            }

            if (!verifyData?.success) {
              throw new Error(
                verifyData?.pending
                  ? 'Payment is still being confirmed. Please wait a moment, then check your order status or contact support with your order number.'
                  : 'Payment could not be confirmed. Please retry or contact support.'
              );
            }

            onPaymentSuccess(order_id);
          } catch (verifyErr) {
            console.error('[Checkout] Verification error:', verifyErr);
            setIsProcessing(false);
            setStep('idle');
            setError(
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment could not be confirmed. Please retry or contact support.'
            );
          }
        },
        prefill: {
          name: contact.full_name,
          email: contact.email,
          contact: contact.phone,
        },
        theme: { color: '#C9A84C' },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setStep('idle');
            setError('Payment was cancelled. Your order is saved — you can retry anytime.');
          },
        },
        notes: {
          order_id,
          order_number,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: { error: { description: string } }) => {
        setIsProcessing(false);
        setStep('idle');
        setError(
          response.error.description ||
            'Payment failed. Please try again. Your order is saved for a short time.'
        );
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      setStep('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }, [
    cartItems,
    contact,
    shippingAddress,
    shippingMethod,
    energization,
    specialInstructions,
    isProcessing,
    setIsProcessing,
    onOrderCreated,
    onPaymentSuccess,
    loadRazorpayScript,
  ]);

  // ── Step progress labels ──────────────────────────────────────────────
  const stepLabels: Record<string, string> = {
    creating_order: 'Creating your order...',
    creating_payment: 'Connecting to payment gateway...',
    paying: 'Complete payment in the Razorpay window',
    verifying: 'Verifying your payment...',
  };

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-brand-accent text-white text-xs font-bold">
          3
        </span>
        <h2 className="font-heading text-lg font-semibold text-brand-primary">
          Payment
        </h2>
      </div>

      {/* Payment info */}
      <div className="mb-6 p-4 rounded-lg bg-brand-bg border border-brand-border">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4 text-brand-accent" />
          <span className="text-sm font-medium text-brand-primary">
            Razorpay Secure Payment
          </span>
        </div>
        <p className="text-xs text-brand-muted mb-3">
          You&apos;ll be redirected to Razorpay&apos;s secure checkout to complete your payment.
          Your card details never touch our servers.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-brand-muted">
          <span className="px-2 py-1 bg-brand-surface rounded border border-brand-border">UPI</span>
          <span className="px-2 py-1 bg-brand-surface rounded border border-brand-border">Credit Card</span>
          <span className="px-2 py-1 bg-brand-surface rounded border border-brand-border">Debit Card</span>
          <span className="px-2 py-1 bg-brand-surface rounded border border-brand-border">Net Banking</span>
          <span className="px-2 py-1 bg-brand-surface rounded border border-brand-border">EMI</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Processing status */}
      {isProcessing && step !== 'idle' && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          {stepLabels[step]}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePayNow}
        disabled={isProcessing}
        className={`w-full py-4 rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-all ${
          isProcessing
            ? 'bg-brand-muted text-white cursor-wait'
            : 'bg-brand-accent text-white hover:brightness-105 hover:shadow-lg'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5" />
            Pay Securely
          </>
        )}
      </button>

      <p className="text-center text-xs text-brand-muted mt-3">
        By proceeding, you agree to our{' '}
        <a href="/policies/terms" className="underline hover:text-brand-accent">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/policies/privacy" className="underline hover:text-brand-accent">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
