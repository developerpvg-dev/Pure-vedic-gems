'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeIndianRupee,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Video,
} from 'lucide-react';
import { LoginModal } from '@/components/auth/LoginModal';
import { useAuth } from '@/lib/hooks/useAuth';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import type { ConsultationPlan } from '@/lib/types/database';

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  consultation_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan_title: string;
  customer: {
    name: string;
    email: string;
    contact: string;
  };
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  life_situation: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
  website: string;
}

const INITIAL_FORM: FormState = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  birth_time: '',
  birth_place: '',
  life_situation: '',
  preferred_date: '',
  preferred_time: '',
  message: '',
  website: '',
};

function formatInr(amount: number | null) {
  if (amount == null) return 'INR';
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function formatUsd(amount: number | null) {
  if (amount == null) return null;
  return `$${amount.toLocaleString('en-US')}`;
}

function getConsultationMode(plan: ConsultationPlan): { label: string; icon: ComponentType<{ className?: string }> } {
  const title = plan.title.toLowerCase();
  if (title.includes('face') || title.includes('personal')) return { label: 'Face to face', icon: MapPin };
  if (title.includes('skype') || title.includes('telephonic')) return { label: 'Phone / Skype', icon: Video };
  if (title.includes('softcopy') || title.includes('horoscope')) return { label: 'Horoscope softcopy', icon: FileText };
  return { label: 'Paid consultation', icon: MessageCircle };
}

function getPlanHighlights(plan: ConsultationPlan) {
  const title = plan.title.toLowerCase();
  const highlights = [];
  highlights.push(title.includes('one question') || title.includes('only one') ? 'One focused question' : 'Detailed guidance');
  highlights.push(title.includes('horoscope') ? 'Horoscope based review' : 'Problem-specific remedy path');
  highlights.push(plan.duration_minutes ? `${plan.duration_minutes} minute slot` : 'Priority booking queue');
  return highlights;
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
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
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function ConsultationBookingForm({ plans }: { plans: ConsultationPlan[] }) {
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? '');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authOpen, setAuthOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId]
  );

  useEffect(() => {
    if (!user && !profile) return;
    setForm((current) => ({
      ...current,
      full_name: current.full_name || profile?.full_name || '',
      email: current.email || profile?.email || user?.email || '',
      phone: current.phone || profile?.phone || profile?.whatsapp || '',
      date_of_birth: current.date_of_birth || profile?.date_of_birth || '',
      birth_time: current.birth_time || profile?.birth_time || '',
      birth_place: current.birth_place || profile?.birth_place || '',
    }));
  }, [profile, user]);

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!selectedPlan) nextErrors.plan = 'Select a consultation plan';
    if (!form.full_name.trim()) nextErrors.full_name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Valid email required';
    if (!form.phone.trim() || !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) nextErrors.phone = 'Valid phone required';
    return nextErrors;
  }

  function buildBookingBody() {
    const body: Record<string, string> = { plan_id: selectedPlan?.id ?? '' };
    for (const [key, value] of Object.entries(form)) {
      const trimmed = value.trim();
      if (trimmed) body[key] = trimmed;
    }
    return body;
  }

  async function verifyPayment(consultationId: string, response: RazorpayResponse) {
    const verifyRes = await fetch('/api/consultation/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultation_id: consultationId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });

    const data = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }
    return data as { consultation_id: string };
  }

  async function handlePayment() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    setPaying(true);
    setErrors({});

    try {
      const createRes = await fetch('/api/consultation/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBookingBody()),
      });

      const createData = await createRes.json().catch(() => ({}));
      if (createRes.status === 401) {
        setAuthOpen(true);
        setPaying(false);
        return;
      }
      if (!createRes.ok) {
        setErrors({ _form: createData.error || 'Unable to start payment' });
        setPaying(false);
        return;
      }

      const payment = createData as CreateOrderResponse;
      if (!payment.key_id) {
        setErrors({ _form: 'Payment gateway key is not configured.' });
        setPaying(false);
        return;
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        setErrors({ _form: 'Unable to load Razorpay checkout. Please try again.' });
        setPaying(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: payment.key_id,
        amount: payment.amount,
        currency: payment.currency,
        name: 'PureVedicGems',
        description: payment.plan_title,
        order_id: payment.razorpay_order_id,
        prefill: payment.customer,
        notes: { consultation_id: payment.consultation_id },
        theme: { color: '#7A1515' },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: (response) => {
          void (async () => {
            try {
              const verified = await verifyPayment(payment.consultation_id, response);
              trackStorefrontEvent('consultation_payment_success', {
                consultation_id: verified.consultation_id,
                plan_id: selectedPlan?.id,
              });
              setSuccess({ id: verified.consultation_id });
            } catch (error) {
              setErrors({ _form: error instanceof Error ? error.message : 'Payment verification failed' });
            } finally {
              setPaying(false);
            }
          })();
        },
      });

      checkout.open();
    } catch {
      setErrors({ _form: 'Something went wrong while starting payment.' });
      setPaying(false);
    }
  }

  if (success) {
    return (
      <div className="bg-[#fbf7ef] px-4 pb-16 pt-30">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center rounded-lg border border-brand-border bg-white px-6 py-14 text-center shadow-[0_18px_54px_rgba(68,35,12,0.08)]">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-100">
            <CheckCircle className="h-9 w-9" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-brand-accent">Payment Verified</p>
          <h1 className="font-heading text-3xl font-bold text-brand-primary sm:text-4xl">Consultation Booked</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-brand-muted">
            Your booking and payment details are saved in your account. A confirmation email has been sent with the consultation service and payment reference.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/account/consultations" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-bg transition hover:bg-brand-accent hover:text-brand-primary">
              <FileText className="h-4 w-4" /> View Booking
            </Link>
            <Link href="/" className="rounded-lg border border-brand-border px-5 py-3 text-sm font-semibold text-brand-primary transition hover:bg-brand-surface">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbf7ef]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:pt-32">
        <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="mb-8 grid gap-6 border-b border-brand-border pb-7 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[2px] text-brand-accent">
              <Sparkles className="h-3.5 w-3.5" /> Paid Consultation
            </div>
            <h1 className="font-heading text-3xl font-bold leading-tight text-brand-primary sm:text-5xl">Book a Vedic Consultation</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-muted sm:text-base">
              Choose the exact consultation service, add your birth and contact details, then confirm the booking with secure Razorpay payment.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-brand-muted">
            <div className="rounded-lg border border-brand-border bg-white px-3 py-4">
              <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-brand-accent" /> Verified payment
            </div>
            <div className="rounded-lg border border-brand-border bg-white px-3 py-4">
              <Calendar className="mx-auto mb-2 h-5 w-5 text-brand-accent" /> Preferred slot
            </div>
            <div className="rounded-lg border border-brand-border bg-white px-3 py-4">
              <FileText className="mx-auto mb-2 h-5 w-5 text-brand-accent" /> Account record
            </div>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-lg border border-brand-border bg-white px-6 py-12 text-center shadow-[0_18px_54px_rgba(68,35,12,0.06)]">
            <p className="font-semibold text-brand-primary">Consultation plans are currently unavailable.</p>
            <p className="mt-2 text-sm text-brand-muted">Please check back shortly or contact the PureVedicGems team.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[2px] text-brand-accent">Step 1</p>
                  <h2 className="mt-1 text-xl font-semibold text-brand-primary">Select Your Consultation Plan</h2>
                </div>
                {errors.plan && <span className="text-xs text-red-600">{errors.plan}</span>}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan, index) => {
                  const selected = selectedPlan?.id === plan.id;
                  const mode = getConsultationMode(plan);
                  const ModeIcon = mode.icon;
                  const usdPrice = formatUsd(plan.amount_usd);
                  const highlights = getPlanHighlights(plan);
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`group relative flex min-h-72 flex-col overflow-hidden rounded-lg border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                        selected
                          ? 'border-brand-primary bg-white shadow-[0_18px_46px_rgba(80,31,18,0.14)] ring-1 ring-brand-primary'
                          : 'border-brand-border bg-white hover:-translate-y-1 hover:border-brand-accent hover:shadow-[0_14px_34px_rgba(80,31,18,0.08)]'
                      }`}
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className={`grid h-11 w-11 place-items-center rounded-lg text-sm font-bold ${selected ? 'bg-brand-primary text-brand-bg' : 'bg-brand-surface text-brand-primary'}`}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-brand-primary">{formatInr(plan.amount_inr)}</p>
                          {usdPrice && <p className="text-xs text-brand-muted">{usdPrice}</p>}
                        </div>
                      </div>
                      <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-primary">
                        <ModeIcon className="h-3.5 w-3.5" /> {mode.label}
                      </div>
                      <h3 className="text-base font-semibold leading-6 text-brand-primary">{plan.title}</h3>
                      {plan.description && <p className="mt-3 flex-1 text-sm leading-6 text-brand-muted">{plan.description}</p>}
                      <div className="mt-5 space-y-2 border-t border-brand-border pt-4">
                        {highlights.map((highlight) => (
                          <div key={highlight} className="flex items-center gap-2 text-xs text-brand-muted">
                            <CheckCircle className="h-3.5 w-3.5 text-brand-accent" /> {highlight}
                          </div>
                        ))}
                      </div>
                      <div className={`mt-5 inline-flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition ${selected ? 'bg-brand-primary text-brand-bg' : 'bg-brand-surface text-brand-primary group-hover:bg-brand-gold-light'}`}>
                        {selected ? 'Selected Plan' : 'Choose This Plan'}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="h-fit rounded-lg border border-brand-border bg-white p-5 shadow-[0_18px_54px_rgba(68,35,12,0.08)] lg:sticky lg:top-32">
              <div className="mb-5 rounded-lg bg-brand-surface p-4">
                <p className="text-xs font-bold uppercase tracking-[2px] text-brand-accent">Step 2</p>
                <div className="mt-3 flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-brand-primary shadow-sm">
                    <BadgeIndianRupee className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-6 text-brand-primary">{selectedPlan?.title}</h2>
                    {selectedPlan && (
                      <p className="mt-1 text-2xl font-bold text-brand-primary">{formatInr(selectedPlan.amount_inr)}</p>
                    )}
                  </div>
                </div>
              </div>

              {!isLoading && !isAuthenticated && (
                <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Please login or create an account before paying for a consultation.</p>
                  </div>
                  <button type="button" onClick={() => setAuthOpen(true)} className="mt-3 rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-brand-bg">
                    Login / Signup
                  </button>
                </div>
              )}

              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
                className="hidden"
              />

              <div className="space-y-5">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-brand-accent">Contact</p>
                  <div className="space-y-4">
                    <FieldInput icon={User} label="Full Name" value={form.full_name} onChange={(value) => updateField('full_name', value)} error={errors.full_name} />
                    <FieldInput icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} error={errors.email} />
                    <FieldInput icon={Phone} label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} error={errors.phone} />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-brand-accent">Birth Details</p>
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldInput icon={Calendar} label="Birth Date" type="date" value={form.date_of_birth} onChange={(value) => updateField('date_of_birth', value)} />
                      <FieldInput icon={Clock} label="Birth Time" type="time" value={form.birth_time} onChange={(value) => updateField('birth_time', value)} />
                    </div>
                    <FieldInput icon={MapPin} label="Birth Place" value={form.birth_place} onChange={(value) => updateField('birth_place', value)} placeholder="City, State" />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-brand-accent">Preferred Timing</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FieldInput icon={Calendar} label="Preferred Date" type="date" min={new Date().toISOString().split('T')[0]} value={form.preferred_date} onChange={(value) => updateField('preferred_date', value)} />
                    <FieldInput icon={Clock} label="Preferred Time" type="time" value={form.preferred_time} onChange={(value) => updateField('preferred_time', value)} />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-brand-accent">Question</p>
                  <div className="space-y-4">
                    <TextArea label="Life Situation / Concern" value={form.life_situation} onChange={(value) => updateField('life_situation', value)} rows={3} />
                    <TextArea label="Specific Question / Message" value={form.message} onChange={(value) => updateField('message', value)} rows={3} />
                  </div>
                </div>
              </div>

              <p className="mt-5 rounded-lg border border-brand-border bg-brand-bg px-4 py-3 text-xs leading-6 text-brand-muted">
                Payment is processed by Razorpay. Consultation guidance is based on traditional Vedic practice and should not be treated as medical, legal, financial, or emergency advice.
              </p>

              {errors._form && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{errors._form}</p>}

              <button
                type="button"
                disabled={paying || isLoading || !selectedPlan}
                onClick={handlePayment}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-6 py-3.5 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-accent hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-55"
              >
                {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {paying ? 'Opening Payment...' : 'Pay & Book Consultation'}
              </button>
            </aside>
          </div>
        )}

        <LoginModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
          initialView="login"
        />
      </div>
    </div>
  );
}

function FieldInput({
  icon: Icon,
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  min,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-brand-muted">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
        <input
          type={type}
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-brand-bg py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-accent ${
            error ? 'border-red-300' : 'border-brand-border'
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-brand-muted">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={5000}
        className="w-full resize-y rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand-accent"
      />
    </div>
  );
}