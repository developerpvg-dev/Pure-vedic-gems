'use client';

import { useState, useCallback, useMemo } from 'react';
import { Building2, CreditCard, Copy, Check, Loader2, ShieldCheck, Upload } from 'lucide-react';
import type { CartItem } from '@/lib/types/cart';
import type {
  ContactInfo,
  ShippingAddress,
  ShippingMethodId,
} from '@/lib/validators/order';
import { TAX_POLICY_VERSION, estimateClientTax } from '@/lib/utils/tax';
import { formatPrice } from '@/lib/utils/format';
import { useCurrency, useCurrencySubscription } from '@/lib/hooks/useCurrency';
import type { SelectedShippingPlan } from '@/lib/types/shipping';
import type { CheckoutRewardState } from '@/components/checkout/RewardPointsRedemption';
import { estimateRewardDiscount } from '@/components/checkout/RewardPointsRedemption';
import { BANK_ACCOUNTS, type BankAccountId } from '@/lib/constants/bank-accounts';

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

type PayMethod = 'razorpay' | 'bank_transfer';

// ─── Props ──────────────────────────────────────────────────────────────────

interface PaymentSectionProps {
  cartItems: CartItem[];
  contact: ContactInfo;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethodId;
  specialInstructions?: string;
  rewardPointsToRedeem?: number;
  selectedShippingPlan?: SelectedShippingPlan | null;
  rewards?: CheckoutRewardState | null;
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
  specialInstructions,
  rewardPointsToRedeem = 0,
  selectedShippingPlan = null,
  rewards = null,
  isProcessing,
  setIsProcessing,
  onOrderCreated,
  onPaymentSuccess,
}: PaymentSectionProps) {
  useCurrencySubscription();
  const { currency } = useCurrency();

  const estimate = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = selectedShippingPlan?.cost ?? 0;
    const rewardDiscount = estimateRewardDiscount(rewardPointsToRedeem, rewards, subtotal);
    const gst = estimateClientTax(cartItems, shipping);
    const totalInr = Math.max(0, subtotal - rewardDiscount + shipping + gst);
    return { totalInr };
  }, [cartItems, selectedShippingPlan, rewardPointsToRedeem, rewards]);

  const showFxNote = currency !== 'INR';
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    'idle' | 'creating_order' | 'creating_payment' | 'paying' | 'verifying' | 'submitting_proof'
  >('idle');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [returnsAccepted, setReturnsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('razorpay');
  const [bankId, setBankId] = useState<BankAccountId>('icici');
  const [transferRef, setTransferRef] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedBank = BANK_ACCOUNTS.find((b) => b.id === bankId) ?? BANK_ACCOUNTS[0];

  const copyField = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // ignore
    }
  }, []);

  const buildOrderBody = useCallback(
    () => ({
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
      special_instructions: specialInstructions,
      reward_points_to_redeem: rewardPointsToRedeem,
      payment_method: payMethod,
      checkout_consent: {
        terms_accepted: true,
        privacy_accepted: true,
        return_policy_accepted: true,
        marketing_consent: marketingConsent,
        policy_version: TAX_POLICY_VERSION,
      },
    }),
    [
      cartItems,
      contact,
      shippingAddress,
      shippingMethod,
      specialInstructions,
      rewardPointsToRedeem,
      payMethod,
      marketingConsent,
    ],
  );

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
      );
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

  const handleBankTransfer = useCallback(async () => {
    if (isProcessing) return;
    if (!termsAccepted || !returnsAccepted) {
      setError('Please accept the checkout terms, privacy policy, and return policy before payment.');
      return;
    }
    if (!transferRef.trim() || transferRef.trim().length < 4) {
      setError('Enter your UTR / transaction reference from the bank transfer.');
      return;
    }
    if (!proofFiles || proofFiles.length === 0) {
      setError('Upload a screenshot or receipt of the bank transfer.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      setStep('creating_order');
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOrderBody()),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      const { order_id } = orderData;
      onOrderCreated(order_id);

      setStep('submitting_proof');
      const form = new FormData();
      form.set('order_id', order_id);
      form.set('bank_id', bankId);
      form.set('reference', transferRef.trim());
      if (transferNotes.trim()) form.set('notes', transferNotes.trim());
      Array.from(proofFiles).forEach((file) => form.append('proofs', file));

      const submitRes = await fetch('/api/payment/bank-transfer/submit', {
        method: 'POST',
        body: form,
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || 'Failed to submit payment proof');

      onPaymentSuccess(order_id);
    } catch (err) {
      setIsProcessing(false);
      setStep('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }, [
    isProcessing,
    termsAccepted,
    returnsAccepted,
    transferRef,
    proofFiles,
    setIsProcessing,
    buildOrderBody,
    onOrderCreated,
    bankId,
    transferNotes,
    onPaymentSuccess,
  ]);

  const handlePayNow = useCallback(async () => {
    if (payMethod === 'bank_transfer') {
      await handleBankTransfer();
      return;
    }

    if (isProcessing) return;
    if (!termsAccepted || !returnsAccepted) {
      setError('Please accept the checkout terms, privacy policy, and return policy before payment.');
      return;
    }
    setError(null);
    setIsProcessing(true);

    try {
      setStep('creating_order');
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildOrderBody()),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      const { order_id, order_number } = orderData;
      onOrderCreated(order_id);

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

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.');
      }

      setStep('paying');
      const options: RazorpayOptions = {
        key: paymentData.key_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'PureVedicGems',
        description: `Order ${order_number}`,
        order_id: paymentData.razorpay_order_id,
        handler: async (response: RazorpayResponse) => {
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
                  : 'Payment could not be confirmed. Please retry or contact support.',
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
                : 'Payment could not be confirmed. Please retry or contact support.',
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
            'Payment failed. Please try again. Your order is saved for a short time.',
        );
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      setStep('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }, [
    payMethod,
    handleBankTransfer,
    isProcessing,
    termsAccepted,
    returnsAccepted,
    setIsProcessing,
    buildOrderBody,
    onOrderCreated,
    loadRazorpayScript,
    contact,
    onPaymentSuccess,
  ]);

  const stepLabels: Record<string, string> = {
    creating_order: 'Creating your order...',
    creating_payment: 'Connecting to payment gateway...',
    paying: 'Complete payment in the Razorpay window',
    verifying: 'Verifying your payment...',
    submitting_proof: 'Uploading payment proof...',
  };

  const bankReady =
    transferRef.trim().length >= 4 && !!proofFiles && proofFiles.length > 0;
  const canSubmit =
    termsAccepted &&
    returnsAccepted &&
    !isProcessing &&
    (payMethod === 'razorpay' || bankReady);

  return (
    <div className="pvg-checkout-step pvg-checkout-step--active">
      <div className="pvg-checkout-step-head">
        <div className="pvg-checkout-step-title-row">
          <span className="pvg-checkout-step-badge">3</span>
          <h2 className="pvg-checkout-step-title">Payment</h2>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPayMethod('razorpay')}
          disabled={isProcessing}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
            payMethod === 'razorpay'
              ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#3d2b1f]'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Razorpay
        </button>
        <button
          type="button"
          onClick={() => setPayMethod('bank_transfer')}
          disabled={isProcessing}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
            payMethod === 'bank_transfer'
              ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#3d2b1f]'
              : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Bank transfer
        </button>
      </div>

      {payMethod === 'razorpay' ? (
        <div className="pvg-checkout-panel mb-6">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#8a6400]" />
            <span className="text-sm font-semibold text-[#3d2b1f]">Razorpay secure payment</span>
          </div>
          <p className="pvg-checkout-hint mb-3">
            Complete payment in Razorpay&apos;s window — card and UPI details never touch our servers.
          </p>
          {showFxNote ? (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-semibold">Order total: {formatPrice(estimate.totalInr)}</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                Razorpay charges in Indian Rupees only: you will pay{' '}
                <strong>{formatPrice(estimate.totalInr, 'INR')}</strong>. International cards still
                work; your bank converts at their rate.
              </p>
            </div>
          ) : (
            <p className="mb-3 text-sm font-semibold text-[#3d2b1f]">
              Order total: {formatPrice(estimate.totalInr, 'INR')}
            </p>
          )}
          <div className="pvg-checkout-pay-methods">
            <span className="pvg-checkout-pay-tag">UPI</span>
            <span className="pvg-checkout-pay-tag">Credit card</span>
            <span className="pvg-checkout-pay-tag">Debit card</span>
            <span className="pvg-checkout-pay-tag">Net banking</span>
          </div>
        </div>
      ) : (
        <div className="pvg-checkout-panel mb-6 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#8a6400]" />
              <span className="text-sm font-semibold text-[#3d2b1f]">Transfer to any account</span>
            </div>
            <p className="pvg-checkout-hint">
              Pay exactly {formatPrice(estimate.totalInr, 'INR')} to one of the accounts below, then
              upload your UTR and screenshot. We confirm the order after our team verifies the
              transfer.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {BANK_ACCOUNTS.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => setBankId(bank.id)}
                disabled={isProcessing}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                  bankId === bank.id
                    ? 'border-[#C9A84C] bg-[#C9A84C]/15 text-[#3d2b1f]'
                    : 'border-stone-200 text-stone-600'
                }`}
              >
                {bank.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50/80 p-3 text-sm text-[#3d2b1f]">
            {(
              [
                ['Account name', selectedBank.account_name],
                ['Account number', selectedBank.account_number],
                ['IFSC', selectedBank.ifsc],
                ['Branch', selectedBank.branch],
                ['MICR', selectedBank.micr],
                ...(selectedBank.swift ? ([['SWIFT', selectedBank.swift]] as const) : []),
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    {label}
                  </p>
                  <p className="font-medium">{value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyField(`${selectedBank.id}-${label}`, value)}
                  className="mt-1 rounded p-1 text-stone-400 hover:bg-white hover:text-stone-700"
                  aria-label={`Copy ${label}`}
                >
                  {copiedField === `${selectedBank.id}-${label}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#3d2b1f]">
              UTR / transaction reference
            </label>
            <input
              type="text"
              value={transferRef}
              onChange={(e) => setTransferRef(e.target.value)}
              disabled={isProcessing}
              placeholder="e.g. 123456789012"
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#3d2b1f]">
              Notes (optional)
            </label>
            <textarea
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              disabled={isProcessing}
              rows={2}
              placeholder="Bank name used, transfer time, etc."
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#C9A84C]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#3d2b1f]">
              Payment screenshot / receipt
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white px-3 py-3 text-sm text-stone-600 hover:border-[#C9A84C]">
              <Upload className="h-4 w-4" />
              <span>
                {proofFiles && proofFiles.length > 0
                  ? `${proofFiles.length} file${proofFiles.length > 1 ? 's' : ''} selected`
                  : 'JPG, PNG, WebP, or PDF (max 5)'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                disabled={isProcessing}
                className="hidden"
                onChange={(e) => setProofFiles(e.target.files)}
              />
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="pvg-checkout-panel mb-4 space-y-3 text-xs text-[#7a6250]">
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            I agree to the{' '}
            <a href="/policies/terms" className="underline hover:text-brand-accent">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/policies/privacy" className="underline hover:text-brand-accent">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={returnsAccepted}
            onChange={(event) => setReturnsAccepted(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand the{' '}
            <a href="/policies/returns" className="underline hover:text-brand-accent">
              Returns and Refund Policy
            </a>
            , including custom jewellery and certificate fee exclusions.
          </span>
        </label>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(event) => setMarketingConsent(event.target.checked)}
            className="mt-0.5"
          />
          <span>
            Send me care guidance, wearing reminders, and service updates by email or WhatsApp.
            Optional.
          </span>
        </label>
      </div>

      {isProcessing && step !== 'idle' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          {stepLabels[step]}
        </div>
      )}

      <button
        type="button"
        onClick={handlePayNow}
        disabled={!canSubmit}
        className="pvg-checkout-btn pvg-checkout-btn--accent py-4 text-base"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : payMethod === 'bank_transfer' ? (
          <>
            <Upload className="h-5 w-5" />
            Submit transfer proof
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5" />
            Pay {formatPrice(estimate.totalInr)} Securely
          </>
        )}
      </button>

      <p className="pvg-checkout-footnote mt-3">
        {payMethod === 'bank_transfer'
          ? 'Order stays on hold until we verify your transfer (usually within 1 business day).'
          : showFxNote
            ? `Payment window shows ${formatPrice(estimate.totalInr, 'INR')}. Tax totals are verified on our server before Razorpay opens.`
            : 'Payment and tax totals are verified on our server before Razorpay opens.'}
      </p>
    </div>
  );
}
