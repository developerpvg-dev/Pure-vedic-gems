'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Truck } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoginModal } from '@/components/auth/LoginModal';
import type { ContactInfo, ShippingAddress, EnergizationFields } from '@/lib/validators/order';
import { ContactSection } from '@/components/checkout/ContactSection';
import { ShippingSection } from '@/components/checkout/ShippingSection';
import { PaymentSection } from '@/components/checkout/PaymentSection';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { EnergizationFieldsForm } from '@/components/checkout/EnergizationFields';
import Link from 'next/link';

type CheckoutStep = 'contact' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user, profile, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');

  // ── Step state ───────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact');
  const [contactData, setContactData] = useState<ContactInfo | null>(null);
  const [shippingData, setShippingData] = useState<ShippingAddress | null>(null);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | 'same_day'>('standard');
  const [energizationData, setEnergizationData] = useState<EnergizationFields>({
    include_energization: false,
    record_ceremony: false,
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Check if any cart item needs energization ────────────────────────
  const hasEnergizationItem = useMemo(() => {
    return cart.items.some(
      (item) =>
        item.configuration_summary?.toLowerCase().includes('energiz') ||
        item.category?.toLowerCase().includes('rudraksha')
    );
  }, [cart.items]);

  // ── Step completion checks ───────────────────────────────────────────
  const isContactComplete = contactData !== null;
  const isShippingComplete = shippingData !== null;

  // ── Pre-fill from profile if logged in ───────────────────────────────
  const defaultContact: Partial<ContactInfo> = useMemo(() => {
    if (profile) {
      return {
        full_name: profile.full_name ?? '',
        email: profile.email ?? user?.email ?? '',
        phone: profile.phone ?? '',
      };
    }
    return {};
  }, [profile, user]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleContactComplete = (data: ContactInfo) => {
    setContactData(data);
    setCurrentStep('shipping');
  };

  const handleShippingComplete = (data: ShippingAddress, method: 'standard' | 'express' | 'same_day') => {
    setShippingData(data);
    setShippingMethod(method);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (resultOrderId: string) => {
    clearCart();
    router.push(`/order-confirmation/${resultOrderId}`);
  };

  // ── Empty cart guard ─────────────────────────────────────────────────
  if (cart.items.length === 0 && !orderId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
        <Truck className="h-16 w-16 text-[var(--pvg-muted)] mb-6" strokeWidth={1} />
        <h1 className="font-heading text-2xl font-semibold text-[var(--pvg-primary)] mb-3">
          Your cart is empty
        </h1>
        <p className="text-[var(--pvg-muted)] mb-8 text-center max-w-md">
          Add some gemstones to your cart before proceeding to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-[var(--pvg-accent)] text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Browse Gemstones
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20 text-center">
        <div>
          <p className="font-heading text-2xl text-[var(--pvg-primary)]">Preparing secure checkout</p>
          <p className="mt-2 text-sm text-[var(--pvg-muted)]">Checking your account status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--pvg-bg)]">
        <div className="bg-[var(--pvg-surface)] border-b border-[var(--pvg-border)]">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-heading text-xl text-[var(--pvg-primary)] font-bold">
              PureVedicGems
            </Link>
            <div className="flex items-center gap-2 text-sm text-[var(--pvg-muted)]">
              <Lock className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-16">
          <div className="w-full rounded-2xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pvg-gold-light)]">
              <Lock className="h-6 w-6 text-[var(--pvg-accent)]" />
            </div>

            <h1 className="mt-5 font-heading text-3xl text-[var(--pvg-primary)]">
              Sign in before checkout
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--pvg-muted)] sm:text-base">
              Create an account to track your order progress, delivery updates, invoices, and future gemstone purchases.
              If you already have an account, sign in and continue with the same cart.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  setAuthView('register');
                  setAuthModalOpen(true);
                }}
                className="rounded-xl bg-[var(--pvg-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create Account
              </button>
              <button
                onClick={() => {
                  setAuthView('login');
                  setAuthModalOpen(true);
                }}
                className="rounded-xl border border-[var(--pvg-border)] px-5 py-3 text-sm font-semibold text-[var(--pvg-primary)] transition hover:bg-[var(--pvg-gold-light)]"
              >
                Login to Continue
              </button>
            </div>

            <Link
              href="/cart"
              className="mt-4 inline-flex text-sm font-medium text-[var(--pvg-accent)] hover:underline"
            >
              Back to cart
            </Link>
          </div>
        </div>

        <LoginModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialView={authView}
          onSuccess={() => {
            setAuthModalOpen(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--pvg-bg)]">
      {/* Checkout Header */}
      <div className="bg-[var(--pvg-surface)] border-b border-[var(--pvg-border)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-heading text-xl text-[var(--pvg-primary)] font-bold">
            PureVedicGems
          </Link>
          <div className="flex items-center gap-2 text-sm text-[var(--pvg-muted)]">
            <Lock className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 md:gap-4 text-sm text-[var(--pvg-muted)]">
          <StepBadge
            step={1}
            label="Contact"
            isActive={currentStep === 'contact'}
            isComplete={isContactComplete}
            onClick={() => setCurrentStep('contact')}
          />
          <div className="h-px w-8 bg-[var(--pvg-border)]" />
          <StepBadge
            step={2}
            label="Shipping"
            isActive={currentStep === 'shipping'}
            isComplete={isShippingComplete}
            onClick={() => isContactComplete && setCurrentStep('shipping')}
            disabled={!isContactComplete}
          />
          <div className="h-px w-8 bg-[var(--pvg-border)]" />
          <StepBadge
            step={3}
            label="Payment"
            isActive={currentStep === 'payment'}
            isComplete={false}
            onClick={() => isShippingComplete && setCurrentStep('payment')}
            disabled={!isShippingComplete}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column — Forms */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Contact */}
            <ContactSection
              isActive={currentStep === 'contact'}
              isComplete={isContactComplete}
              defaultValues={defaultContact}
              savedData={contactData}
              onComplete={handleContactComplete}
              onEdit={() => setCurrentStep('contact')}
              isLoggedIn={!!user}
            />

            {/* Step 2: Shipping */}
            <ShippingSection
              isActive={currentStep === 'shipping'}
              isComplete={isShippingComplete}
              savedData={shippingData}
              savedMethod={shippingMethod}
              onComplete={handleShippingComplete}
              onEdit={() => setCurrentStep('shipping')}
              disabled={!isContactComplete}
            />

            {/* Energization Fields (shown if applicable) */}
            {hasEnergizationItem && currentStep === 'payment' && (
              <EnergizationFieldsForm
                value={energizationData}
                onChange={setEnergizationData}
              />
            )}

            {/* Special Instructions */}
            {currentStep === 'payment' && (
              <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6">
                <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-3">
                  Special Instructions (Optional)
                </h3>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for your order..."
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-bg)] px-4 py-3 text-sm text-[var(--pvg-text)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] resize-none"
                />
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 'payment' && contactData && shippingData && (
              <PaymentSection
                cartItems={cart.items}
                contact={contactData}
                shippingAddress={shippingData}
                shippingMethod={shippingMethod}
                energization={hasEnergizationItem ? energizationData : undefined}
                specialInstructions={specialInstructions}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onOrderCreated={setOrderId}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}
          </div>

          {/* Right Column — Order Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <CheckoutOrderSummary
                items={cart.items}
                shippingMethod={shippingMethod}
              />
              {/* Trust badges */}
              <div className="mt-6 bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-5 w-5 text-[var(--pvg-accent)]" />
                  <span className="text-sm font-medium text-[var(--pvg-primary)]">
                    Secure Payment Guaranteed
                  </span>
                </div>
                <div className="space-y-2.5 text-xs text-[var(--pvg-muted)]">
                  <p>🔒 256-bit SSL encryption</p>
                  <p>🏦 RBI authorized payment gateway</p>
                  <p>📜 100% authentic certified gemstones</p>
                  <p>🚚 Free insured shipping across India</p>
                  <p>📞 24/7 WhatsApp support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Badge Component ───────────────────────────────────────────────────

function StepBadge({
  step,
  label,
  isActive,
  isComplete,
  onClick,
  disabled,
}: {
  step: number;
  label: string;
  isActive: boolean;
  isComplete: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all
        ${
          isActive
            ? 'bg-[var(--pvg-accent)] text-white'
            : isComplete
              ? 'bg-[var(--pvg-gold-light)] text-[var(--pvg-primary)] cursor-pointer hover:bg-[var(--pvg-accent)]/20'
              : 'bg-[var(--pvg-bg-alt)] text-[var(--pvg-muted)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold
          ${isActive ? 'bg-white/20' : isComplete ? 'bg-green-100 text-green-700' : 'bg-[var(--pvg-border)]'}
        `}
      >
        {isComplete ? '✓' : step}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
