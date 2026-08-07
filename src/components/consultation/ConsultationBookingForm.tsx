'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  Award,
  BadgeIndianRupee,
  BadgeCheck,
  Calendar,
  CalendarCheck,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCurrency, useCurrencySubscription } from '@/lib/hooks/useCurrency';
import { formatPrice } from '@/lib/utils/format';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { consultationModeFromPlan, stripSkype } from '@/lib/consultation/plan-display';
import type { ConsultationPlan } from '@/lib/types/database';
import '@/app/consultation/consultation-page.css';

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
  customer_city: string;
  customer_state: string;
  customer_country: string;
  life_situation: string;
  preferred_date: string;
  preferred_time: string;
  message: string;
  website: string;
}

type PlanColor = 'amber' | 'violet' | 'emerald' | 'blue' | 'orange' | 'rose';

interface PlanMetadata {
  card_color?: PlanColor;
  image_url?: string | null;
  badge_label?: string | null;
  mode_label?: string | null;
  details?: string | null;
  highlights?: string[];
}

const INITIAL_FORM: FormState = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  birth_time: '',
  birth_place: '',
  customer_city: '',
  customer_state: '',
  customer_country: '',
  life_situation: '',
  preferred_date: '',
  preferred_time: '',
  message: '',
  website: '',
};

const COLOR_SEQUENCE: PlanColor[] = ['amber', 'violet', 'emerald', 'blue', 'orange', 'rose'];

const BRAND_PLAN_THEME = {
  text: 'text-[#7A1515]',
  border: 'border-[#7A1515]/30',
  soft: 'bg-[#fff7eb]',
  button: 'border border-[#7A1515] bg-[#7A1515] text-white hover:bg-[#5f1010]',
  outline: 'border-[#7A1515]/30 text-[#7A1515] hover:bg-[#fff7eb]',
  ring: 'ring-[#7A1515]/20',
};

const PLAN_THEMES: Record<PlanColor, typeof BRAND_PLAN_THEME> = {
  amber: BRAND_PLAN_THEME,
  violet: BRAND_PLAN_THEME,
  emerald: BRAND_PLAN_THEME,
  blue: BRAND_PLAN_THEME,
  orange: BRAND_PLAN_THEME,
  rose: BRAND_PLAN_THEME,
};

function formatPlanPrice(amount: number | null) {
  if (amount == null) return formatPrice(0);
  return formatPrice(Number(amount));
}

function readMetadata(plan: ConsultationPlan): PlanMetadata {
  if (!plan.metadata || typeof plan.metadata !== 'object' || Array.isArray(plan.metadata)) return {};
  return plan.metadata as PlanMetadata;
}

function getPlanTheme(plan: ConsultationPlan, index: number) {
  const metadata = readMetadata(plan);
  const color = metadata.card_color ?? COLOR_SEQUENCE[index % COLOR_SEQUENCE.length];
  return { color, theme: PLAN_THEMES[color] };
}

function getConsultationMode(plan: ConsultationPlan): { label: string; icon: ComponentType<{ className?: string }> } {
  const label = consultationModeFromPlan({ title: plan.title, metadata: plan.metadata }) ?? 'Paid Consultation';
  const lower = label.toLowerCase();
  if (lower.includes('face') || lower.includes('personal')) return { label, icon: Users };
  if (lower.includes('telephonic') || lower.includes('phone') || lower.includes('chat')) return { label, icon: Phone };
  if (lower.includes('softcopy') || lower.includes('horoscope')) return { label, icon: FileText };
  return { label, icon: MessageCircle };
}

function getPlanHighlights(plan: ConsultationPlan) {
  const metadata = readMetadata(plan);
  if (metadata.highlights?.length) return metadata.highlights.slice(0, 5);
  const title = plan.title.toLowerCase();
  return [
    title.includes('one question') || title.includes('only one') ? 'One focused question' : 'Detailed consultation',
    title.includes('horoscope') ? 'Horoscope study' : 'Problem-specific remedy path',
    plan.duration_minutes ? `${plan.duration_minutes} minute slot` : 'Priority booking queue',
  ];
}

function getPlanDetails(plan: ConsultationPlan) {
  const metadata = readMetadata(plan);
  return stripSkype(metadata.details || plan.description || 'Full guidance details will be shared by the PureVedicGems team after booking.');
}

function planDisplayTitle(plan: ConsultationPlan) {
  return stripSkype(plan.title);
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
  useCurrencySubscription();
  const { currency } = useCurrency();
  const { user, profile, isAuthenticated } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id ?? '');
  const [detailsPlanId, setDetailsPlanId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId]
  );

  const detailsPlan = useMemo(
    () => plans.find((plan) => plan.id === detailsPlanId) ?? null,
    [plans, detailsPlanId]
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

  // Deep-link from homepage expert cards (and similar CTAs) straight to plans.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#detailed-consultation') return;
    const target = document.getElementById('detailed-consultation');
    if (!target) return;
    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

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

  function selectPlan(planId: string) {
    setSelectedPlanId(planId);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.plan;
      return next;
    });
    document.getElementById('consultation-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};
    if (!selectedPlan) nextErrors.plan = 'Please select a consultation plan.';
    if (!form.full_name.trim()) nextErrors.full_name = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Please enter a valid email address.';
    if (!form.phone.trim()) nextErrors.phone = 'Phone is required.';
    else if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone)) nextErrors.phone = 'Please enter a valid phone number.';
    if (!form.birth_place.trim()) nextErrors.birth_place = 'Birth place is required.';
    if (!form.date_of_birth) {
      nextErrors.date_of_birth = 'Birth date is required.';
    } else {
      const dob = new Date(`${form.date_of_birth}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(dob.getTime())) nextErrors.date_of_birth = 'Please enter a valid birth date.';
      else if (dob > today) nextErrors.date_of_birth = 'Birth date cannot be in the future.';
    }
    if (!form.birth_time.trim()) nextErrors.birth_time = 'Birth time is required.';
    else if (!/^\d{2}:\d{2}$/.test(form.birth_time)) nextErrors.birth_time = 'Please enter a valid birth time.';
    if (!form.customer_city.trim()) nextErrors.customer_city = 'City / district is required.';
    if (!form.customer_state.trim()) nextErrors.customer_state = 'State is required.';
    if (!form.customer_country.trim()) nextErrors.customer_country = 'Country is required.';
    if (!form.preferred_date) {
      nextErrors.preferred_date = 'Preferred date is required.';
    } else {
      const preferred = new Date(`${form.preferred_date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(preferred.getTime())) nextErrors.preferred_date = 'Please enter a valid preferred date.';
      else if (preferred < today) nextErrors.preferred_date = 'Preferred date cannot be in the past.';
    }
    if (!form.preferred_time.trim()) nextErrors.preferred_time = 'Preferred time is required.';
    else if (!/^\d{2}:\d{2}$/.test(form.preferred_time)) nextErrors.preferred_time = 'Please enter a valid preferred time.';
    if (!form.life_situation.trim()) nextErrors.life_situation = 'Life situation / concern is required.';
    return nextErrors;
  }

  function buildBookingBody() {
    const body: Record<string, string> = { plan_id: selectedPlan?.id ?? '', currency };
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
      const order = [
        'full_name',
        'email',
        'phone',
        'birth_place',
        'date_of_birth',
        'birth_time',
        'customer_city',
        'customer_state',
        'customer_country',
        'preferred_date',
        'preferred_time',
        'life_situation',
      ] as const;
      const first = order.find((key) => validationErrors[key]);
      if (first) document.getElementById(`consult-${first}`)?.focus();
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
      <div className="pvg-consultation-page px-4 sm:px-6">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center rounded-xl border border-[#ede6d5] bg-white px-5 py-12 text-center shadow-[0_10px_32px_rgba(44,4,4,0.06)] sm:px-8 sm:py-14">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-100">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h1 className="section-title">Consultation Booked</h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.75rem auto 0', maxWidth: '32rem' }}>
            Your booking and payment details are saved. A confirmation email has been sent with the consultation service and payment reference.
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto' }} aria-hidden="true" />
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {isAuthenticated && (
              <Link href="/account/consultations" className="inline-flex items-center gap-2 rounded-lg bg-[#7a1515] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4d0a0a]">
                <FileText className="h-4 w-4" /> View Booking
              </Link>
            )}
            <Link href="/" className="rounded-lg border border-[#ede6d5] px-5 py-3 text-sm font-semibold text-[#2c0404] transition hover:bg-[#faf8f4]">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pvg-consultation-page px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div id="detailed-consultation" className="mx-auto max-w-4xl scroll-mt-28 pb-8 pt-8 text-center sm:pt-10 lg:pt-12" aria-labelledby="detailed-consultation-heading">
          <h1 className="section-title" id="detailed-consultation-heading">
            Book a Vedic Consultation
          </h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: '0.75rem auto 0', maxWidth: '36rem' }}>
            Choose your consultation service, add birth and contact details, then confirm with secure Razorpay payment.
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
        </div>

        {plans.length === 0 ? (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-[#ede6d5] bg-white px-5 py-12 text-center shadow-[0_10px_32px_rgba(44,4,4,0.06)] sm:px-6">
            <p className="font-semibold text-[#2c0404]">Consultation plans are currently unavailable.</p>
            <p className="mt-2 text-sm text-[#5a5043]">Please check back shortly or contact the PureVedicGems team.</p>
          </div>
        ) : (
          <>
            <section className="pvg-consultation-plans mt-2" aria-label="Consultation plans">
              {plans.map((plan, index) => {
                const metadata = readMetadata(plan);
                const { theme } = getPlanTheme(plan, index);
                const selected = selectedPlan?.id === plan.id;
                const mode = getConsultationMode(plan);
                const ModeIcon = mode.icon;
                const title = planDisplayTitle(plan);
                return (
                  <article
                    key={plan.id}
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`Select plan: ${mode.label}`}
                    onClick={() => selectPlan(plan.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectPlan(plan.id);
                      }
                    }}
                    className={`relative flex cursor-pointer flex-col rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${selected ? `${theme.border} ring-2 ${theme.ring}` : 'border-[#7A1515]/15'}`}
                  >
                    {metadata.badge_label && (
                      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7A1515] px-2.5 py-0.5 text-[9px] font-medium text-white">
                        {metadata.badge_label}
                      </span>
                    )}

                    {/* strict 1:1 square image */}
                    <div className={`aspect-square w-full overflow-hidden rounded-lg ${theme.soft}`}>
                      {metadata.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={metadata.image_url} alt={title} className="h-full w-full object-contain p-2" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ModeIcon className={`h-8 w-8 ${theme.text}`} />
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-1">
                      <ModeIcon className={`h-3 w-3 shrink-0 ${theme.text}`} />
                      <span className={`truncate text-[10px] font-medium ${theme.text}`}>{mode.label}</span>
                    </div>

                    <h2 className="mt-0.5 text-[12px] font-medium leading-4 text-slate-700">{title}</h2>

                    <p className={`mt-1 text-[13px] font-semibold ${theme.text}`}>{formatPlanPrice(plan.amount_inr)}</p>

                    <div className="mt-2 flex flex-col gap-1">
                      <span className={`w-full rounded-md px-2 py-1 text-center text-[11px] font-medium ${theme.button}`}>
                        {selected ? '✓ Selected' : 'Select Plan'}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetailsPlanId(plan.id);
                        }}
                        className={`w-full rounded-md border bg-white px-2 py-1 text-[11px] font-medium transition ${theme.outline}`}
                      >
                        See Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section id="consultation-booking" className="pvg-consultation-booking mt-6 scroll-mt-28">
              <div className="pvg-consultation-booking-card p-4 sm:p-5">
                <div className="pvg-consultation-booking-head">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="pvg-consultation-booking-badge">
                      <FileText className="h-3 w-3" aria-hidden="true" /> Booking Details
                    </span>
                    <h2 className="pvg-consultation-booking-title">Complete Your Consultation Request</h2>
                  </div>
                  {errors.plan && <span className="text-xs font-medium text-red-500">{errors.plan}</span>}
                </div>

                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={form.website}
                  onChange={(event) => updateField('website', event.target.value)}
                  className="hidden"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldInput id="consult-full_name" icon={User} label="Full Name" value={form.full_name} onChange={(value) => updateField('full_name', value)} error={errors.full_name} />
                  <FieldInput id="consult-email" icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} error={errors.email} />
                  <FieldInput id="consult-phone" icon={Phone} label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} error={errors.phone} />
                  <FieldInput id="consult-birth_place" icon={MapPin} label="Birth Place" value={form.birth_place} onChange={(value) => updateField('birth_place', value)} placeholder="City or district" error={errors.birth_place} />
                  <FieldInput id="consult-date_of_birth" icon={Calendar} label="Birth Date" type="date" max={new Date().toISOString().split('T')[0]} value={form.date_of_birth} onChange={(value) => updateField('date_of_birth', value)} error={errors.date_of_birth} />
                  <FieldInput id="consult-birth_time" icon={Clock} label="Birth Time" type="time" value={form.birth_time} onChange={(value) => updateField('birth_time', value)} error={errors.birth_time} />
                  <FieldInput id="consult-customer_city" icon={MapPin} label="City / District" value={form.customer_city} onChange={(value) => updateField('customer_city', value)} placeholder="Current city" error={errors.customer_city} />
                  <FieldInput id="consult-customer_state" icon={MapPin} label="State" value={form.customer_state} onChange={(value) => updateField('customer_state', value)} placeholder="State" error={errors.customer_state} />
                  <FieldInput id="consult-customer_country" icon={MapPin} label="Country" value={form.customer_country} onChange={(value) => updateField('customer_country', value)} placeholder="Country" error={errors.customer_country} />
                  <FieldInput id="consult-preferred_date" icon={Calendar} label="Preferred Date" type="date" min={new Date().toISOString().split('T')[0]} value={form.preferred_date} onChange={(value) => updateField('preferred_date', value)} error={errors.preferred_date} />
                  <FieldInput id="consult-preferred_time" icon={Clock} label="Preferred Time" type="time" value={form.preferred_time} onChange={(value) => updateField('preferred_time', value)} error={errors.preferred_time} />
                  <TextArea id="consult-life_situation" label="Life Situation / Concern" value={form.life_situation} onChange={(value) => updateField('life_situation', value)} rows={3} error={errors.life_situation} className="sm:col-span-2" />
                  <TextArea id="consult-message" label="Specific Question / Message" value={form.message} onChange={(value) => updateField('message', value)} rows={3} optional className="sm:col-span-2" />
                </div>
              </div>

              <aside className="pvg-consultation-sidebar h-fit p-4 sm:p-5">
                {/* Selected plan pill */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-primary">
                    <BadgeIndianRupee className="h-3 w-3" /> Your Selection
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-400">Plan</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-slate-800">{selectedPlan ? planDisplayTitle(selectedPlan) : <span className="italic text-slate-400">No plan selected</span>}</h3>
                  {selectedPlan && (
                    <p className="mt-1 text-xl font-bold text-brand-primary">{formatPlanPrice(selectedPlan.amount_inr)}</p>
                  )}
                </div>

                {selectedPlan && (
                  <div className="mt-3 space-y-1.5">
                    {getPlanHighlights(selectedPlan).slice(0, 3).map((highlight) => (
                      <p key={highlight} className="flex items-center gap-2 text-[12px] text-slate-500">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-brand-accent" />
                        {highlight}
                      </p>
                    ))}
                  </div>
                )}

                {errors._form && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errors._form}</p>}

                <button
                  type="button"
                  disabled={paying || !selectedPlan}
                  onClick={handlePayment}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4A843]/45 bg-[#7A1515] px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_34px_rgba(122,21,21,0.22)] transition hover:bg-[#D4A843] hover:text-[#2C0404] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {paying ? 'Opening Payment...' : 'Proceed to Payment'}
                </button>

                <p className="mt-3 text-[10px] leading-5 text-slate-400">
                  Processed by Razorpay. Not medical, legal, or financial advice.
                </p>
              </aside>
            </section>

            <TrustStrip />
          </>
        )}
      </div>

      {detailsPlan && (
        <PlanDetailsDialog
          plan={detailsPlan}
          index={plans.findIndex((plan) => plan.id === detailsPlan.id)}
          onClose={() => setDetailsPlanId(null)}
          onSelect={() => {
            selectPlan(detailsPlan.id);
            setDetailsPlanId(null);
          }}
        />
      )}
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Award, label: 'Experienced Vedic Experts', tone: 'bg-[#FCE7C8] text-[#9A4A05]' },
    { icon: LockKeyhole, label: 'Secure & Confidential', tone: 'bg-[#DDEBFF] text-[#1D4ED8]' },
    { icon: CalendarCheck, label: 'On-time & Reliable', tone: 'bg-[#DCFCE7] text-[#15803D]' },
    { icon: UserRoundCheck, label: 'Personalized Guidance', tone: 'bg-[#FFE4E6] text-[#BE123C]' },
    { icon: BadgeCheck, label: 'Trusted by Thousands', tone: 'bg-[#FEF3C7] text-[#A16207]' },
  ];

  return (
    <div className="mt-8 rounded-2xl border border-[#E2D3B6] bg-white p-4 shadow-[0_18px_42px_rgba(61,43,31,0.07)]" aria-label="Consultation assurances">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="flex min-h-20 items-center gap-3 rounded-xl border border-[#F0DFC0] bg-gradient-to-br from-white to-[#fff7e8] p-3 shadow-[0_10px_22px_rgba(61,43,31,0.05)]">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
            <item.icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-[12px] font-black leading-5 text-[#4A3328]">{item.label}</span>
        </div>
      ))}
      </div>
    </div>
  );
}

function PlanDetailsDialog({ plan, index, onClose, onSelect }: { plan: ConsultationPlan; index: number; onClose: () => void; onSelect: () => void }) {
  const metadata = readMetadata(plan);
  const mode = getConsultationMode(plan);
  const ModeIcon = mode.icon;
  const { theme } = getPlanTheme(plan, Math.max(index, 0));
  const title = planDisplayTitle(plan);
  const paragraphs = getPlanDetails(plan).split('\n').map((line) => line.trim()).filter(Boolean);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] overflow-y-auto bg-slate-950/55"
      onClick={onClose}
      role="presentation"
    >
      <div className="flex min-h-full items-start justify-center p-3 pt-[calc(var(--pvg-site-header-offset)+0.75rem)] sm:items-center sm:p-4 sm:pt-4">
        <div
          className="flex max-h-[calc(100dvh-var(--pvg-site-header-offset)-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[min(90dvh,calc(100dvh-2rem))]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-details-title"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0 pr-3">
              <p className={`text-xs font-black uppercase tracking-[0.22em] ${theme.text}`}>Plan Details</p>
              <h2 id="plan-details-title" className="mt-1 text-lg font-black text-slate-950 sm:text-xl">{title}</h2>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close plan details">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[220px_minmax(0,1fr)]">
              <div className={`grid min-h-44 place-items-center rounded-lg sm:min-h-56 ${theme.soft}`}>
                {metadata.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={metadata.image_url} alt={title} className="max-h-44 w-full object-contain p-3 sm:max-h-52" />
                ) : (
                  <ModeIcon className={`h-16 w-16 ${theme.text}`} />
                )}
              </div>
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${theme.soft} ${theme.text}`}>
                    <ModeIcon className="h-3.5 w-3.5" />
                    {mode.label}
                  </span>
                  {plan.duration_minutes && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{plan.duration_minutes} min</span>}
                </div>
                <p className={`text-3xl font-black ${theme.text}`}>{formatPlanPrice(plan.amount_inr)}</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {getPlanHighlights(plan).map((highlight) => (
                    <p key={highlight} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${theme.text}`} />
                      {highlight}
                    </p>
                  ))}
                </div>
                <button type="button" onClick={onSelect} className={`mt-6 w-full rounded-lg px-5 py-3 text-sm font-black transition ${theme.button}`}>
                  Select This Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FieldInput({
  id,
  icon: Icon,
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  min,
  max,
}: {
  id?: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={type}
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-brand-accent ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
        />
      </div>
      {error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  rows,
  error,
  optional,
  className,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  error?: string;
  optional?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-500">
        {label}
        {optional ? <span className="font-normal text-slate-400"> (optional)</span> : null}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={5000}
        required={!optional}
        aria-invalid={Boolean(error)}
        className={`w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-accent ${
          error ? 'border-red-300' : 'border-slate-200'
        }`}
      />
      {error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}