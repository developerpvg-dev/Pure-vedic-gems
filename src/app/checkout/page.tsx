'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  Lock,
  Landmark,
  Award,
  MessageCircle,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import type { ContactInfo, ShippingAddress, ShippingMethodId } from '@/lib/validators/order';
import type { SelectedShippingPlan } from '@/lib/types/shipping';
import { ContactSection } from '@/components/checkout/ContactSection';
import { ShippingSection } from '@/components/checkout/ShippingSection';
import { PaymentSection } from '@/components/checkout/PaymentSection';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { RewardPointsRedemption, type CheckoutRewardState } from '@/components/checkout/RewardPointsRedemption';
import Link from 'next/link';

type CheckoutStep = 'contact' | 'shipping' | 'payment';

const STEPS: { id: CheckoutStep; step: number; label: string }[] = [
  { id: 'contact', step: 1, label: 'Contact' },
  { id: 'shipping', step: 2, label: 'Shipping' },
  { id: 'payment', step: 3, label: 'Payment' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { user, profile, isLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact');
  const [contactData, setContactData] = useState<ContactInfo | null>(null);
  const [shippingData, setShippingData] = useState<ShippingAddress | null>(null);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId | null>(null);
  const [selectedShippingPlan, setSelectedShippingPlan] = useState<SelectedShippingPlan | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardInfo, setRewardInfo] = useState<CheckoutRewardState | null>(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardPointsToRedeem, setRewardPointsToRedeem] = useState(0);

  const isContactComplete = contactData !== null;
  const isShippingComplete = shippingData !== null;
  const cartSubtotal = useMemo(() => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart.items]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setRewardInfo(null);
      setRewardPointsToRedeem(0);
      return () => { active = false; };
    }

    setRewardLoading(true);
    fetch('/api/account/rewards')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!active || !data?.balance || !data?.settings) return;
        setRewardInfo({
          available_points: data.balance.available_points ?? 0,
          point_value_inr: data.settings.point_value_inr ?? 1,
          min_redeem_points: data.settings.min_redeem_points ?? 1,
          max_redeem_points_per_order: data.settings.max_redeem_points_per_order ?? 0,
          max_redeem_percent: data.settings.max_redeem_percent ?? 0,
          earn_points_per_order: data.settings.earn_points_per_order ?? 0,
          is_active: Boolean(data.settings.is_active),
        });
      })
      .finally(() => {
        if (active) setRewardLoading(false);
      });

    return () => { active = false; };
  }, [user]);

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

  const handleContactComplete = (data: ContactInfo) => {
    setContactData(data);
    setCurrentStep('shipping');
  };

  const handleShippingComplete = (
    data: ShippingAddress,
    method: ShippingMethodId,
    plan: SelectedShippingPlan
  ) => {
    setShippingData(data);
    setShippingMethod(method);
    setSelectedShippingPlan(plan);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = (resultOrderId: string) => {
    clearCart();
    router.push(`/order-confirmation/${resultOrderId}`);
  };

  const stepComplete = (id: CheckoutStep) => {
    if (id === 'contact') return isContactComplete;
    if (id === 'shipping') return isShippingComplete;
    return false;
  };

  const stepDisabled = (id: CheckoutStep) => {
    if (id === 'contact') return false;
    if (id === 'shipping') return !isContactComplete;
    return !isShippingComplete;
  };

  if (cart.items.length === 0 && !orderId) {
    return (
      <div className="pvg-checkout-page">
        <div className="pvg-checkout-empty">
          <div className="pvg-checkout-empty-icon">
            <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="pvg-checkout-title">Your cart is empty</h1>
          <p className="pvg-checkout-subtitle mt-2">
            Add certified gemstones or jewellery to your cart before completing checkout.
          </p>
          <Link href="/shop" className="pvg-checkout-btn pvg-checkout-btn--accent mt-6 w-auto px-8">
            Browse Gemstones
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pvg-checkout-page">
        <div className="pvg-checkout-empty">
          <Loader2 className="h-10 w-10 animate-spin text-[#8a6400] mb-4" />
          <p className="pvg-checkout-title text-xl">Preparing secure checkout</p>
          <p className="pvg-checkout-subtitle mt-2">Checking your account status…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pvg-checkout-page">
      <div className="pvg-checkout-shell">
        <header className="pvg-checkout-hero">
          <div className="pvg-checkout-hero-top">
            <div>
              <Link href="/cart" className="pvg-checkout-back">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to cart
              </Link>
              <p className="pvg-checkout-eyebrow mt-3">Secure checkout</p>
              <h1 className="pvg-checkout-title">Complete your order</h1>
              <p className="pvg-checkout-subtitle">
                A few quick steps — we&apos;ll confirm pricing and taxes before payment opens.
              </p>
            </div>
            <span className="pvg-checkout-secure-pill">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8a6400]" />
              SSL encrypted
            </span>
          </div>
        </header>

        <nav className="pvg-checkout-progress" aria-label="Checkout progress">
          {STEPS.map(({ id, step, label }) => {
            const active = currentStep === id;
            const complete = stepComplete(id);
            const disabled = stepDisabled(id);
            return (
              <button
                key={id}
                type="button"
                className={`pvg-checkout-progress-item${active ? ' pvg-checkout-progress-item--active' : ''}${complete ? ' pvg-checkout-progress-item--complete' : ''}`}
                onClick={() => !disabled && setCurrentStep(id)}
                disabled={disabled}
                aria-current={active ? 'step' : undefined}
              >
                <div className="pvg-checkout-progress-track" aria-hidden>
                  <div className="pvg-checkout-progress-fill" />
                </div>
                <div className="pvg-checkout-progress-label">
                  <span className="pvg-checkout-progress-num">{complete && !active ? '✓' : step}</span>
                  <span className="pvg-checkout-progress-text">{label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="pvg-checkout-grid">
          <div className="pvg-checkout-main">
            <ContactSection
              isActive={currentStep === 'contact'}
              isComplete={isContactComplete}
              defaultValues={defaultContact}
              savedData={contactData}
              onComplete={handleContactComplete}
              onEdit={() => setCurrentStep('contact')}
              isLoggedIn={!!user}
            />

            <ShippingSection
              isActive={currentStep === 'shipping'}
              isComplete={isShippingComplete}
              savedData={shippingData}
              savedMethod={shippingMethod}
              savedPlan={selectedShippingPlan}
              cartSubtotal={cartSubtotal}
              onComplete={handleShippingComplete}
              onPlanChange={setSelectedShippingPlan}
              onEdit={() => setCurrentStep('shipping')}
              disabled={!isContactComplete}
            />

            {currentStep === 'payment' && (
              <div className="pvg-checkout-step pvg-checkout-step--active">
                <h3 className="pvg-checkout-step-title mb-3">Special instructions</h3>
                <p className="pvg-checkout-hint mb-3">Optional — sizing notes, gifting, or delivery preferences.</p>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests for your order…"
                  maxLength={1000}
                  rows={3}
                  className="pvg-checkout-input resize-none"
                />
              </div>
            )}

            {currentStep === 'payment' && contactData && shippingData && shippingMethod && (
              <>
                <RewardPointsRedemption
                  userSignedIn={!!user}
                  loading={rewardLoading}
                  rewards={rewardInfo}
                  subtotal={cartSubtotal}
                  pointsToRedeem={rewardPointsToRedeem}
                  onChange={setRewardPointsToRedeem}
                />
                <PaymentSection
                  cartItems={cart.items}
                  contact={contactData}
                  shippingAddress={shippingData}
                  shippingMethod={shippingMethod}
                  specialInstructions={specialInstructions}
                  rewardPointsToRedeem={rewardPointsToRedeem}
                  selectedShippingPlan={selectedShippingPlan}
                  rewards={rewardInfo}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  onOrderCreated={setOrderId}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </>
            )}
          </div>

          <aside>
            <div className="lg:sticky pvg-sticky-below-header">
              <CheckoutOrderSummary
                items={cart.items}
                selectedShippingPlan={selectedShippingPlan}
                rewardPointsToRedeem={rewardPointsToRedeem}
                rewards={rewardInfo}
              />

              <div className="pvg-checkout-trust">
                <div className="pvg-checkout-trust-title">
                  <ShieldCheck className="h-4 w-4 text-[#8a6400]" />
                  Why shop with confidence
                </div>
                <ul className="pvg-checkout-trust-list">
                  <li className="pvg-checkout-trust-item">
                    <Lock />
                    256-bit SSL encryption on every transaction
                  </li>
                  <li className="pvg-checkout-trust-item">
                    <Landmark />
                    RBI-authorised Razorpay payment gateway
                  </li>
                  <li className="pvg-checkout-trust-item">
                    <Award />
                    100% authentic, lab-certified gemstones
                  </li>
                  <li className="pvg-checkout-trust-item">
                    <Truck />
                    Insured shipping worldwide
                  </li>
                  <li className="pvg-checkout-trust-item">
                    <MessageCircle />
                    WhatsApp support for order updates
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
