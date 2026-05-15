'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Video,
  X,
} from 'lucide-react';
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

function formatInr(amount: number | null) {
  if (amount == null) return 'Rs 0';
  return `Rs ${Number(amount).toLocaleString('en-IN')}`;
}

function formatUsd(amount: number | null) {
  if (amount == null) return null;
  return `$${Number(amount).toLocaleString('en-US')}`;
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
  const metadata = readMetadata(plan);
  if (metadata.mode_label) return { label: metadata.mode_label, icon: MessageCircle };
  const title = plan.title.toLowerCase();
  if (title.includes('face') || title.includes('personal')) return { label: 'Personal / Face to Face', icon: Users };
  if (title.includes('skype') || title.includes('telephonic')) return { label: 'Telephonic / Skype', icon: Video };
  if (title.includes('softcopy') || title.includes('horoscope')) return { label: 'Horoscope Softcopy', icon: FileText };
  return { label: 'Paid Consultation', icon: MessageCircle };
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
  return metadata.details || plan.description || 'Full guidance details will be shared by the PureVedicGems team after booking.';
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
      <div className="bg-[#fbf7ef] px-4 pb-16 pt-30">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center rounded-lg border border-brand-border bg-white px-6 py-14 text-center shadow-[0_18px_54px_rgba(68,35,12,0.08)]">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-100">
            <CheckCircle className="h-9 w-9" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-brand-accent">Payment Verified</p>
          <h1 className="text-3xl font-bold text-brand-primary sm:text-4xl">Consultation Booked</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-brand-muted">
            Your booking and payment details are saved. A confirmation email has been sent with the consultation service and payment reference.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {isAuthenticated && (
              <Link href="/account/consultations" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-bg transition hover:bg-brand-accent hover:text-brand-primary">
                <FileText className="h-4 w-4" /> View Booking
              </Link>
            )}
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
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-10 lg:pt-36">
        <div className="text-center">
          <h1 className="text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl">Book a Vedic Consultation</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">Choose the exact consultation service, add your birth and contact details, then confirm the booking with secure Razorpay payment.</p>
        </div>

        {plans.length === 0 ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-brand-border bg-white px-6 py-12 text-center shadow-[0_18px_54px_rgba(68,35,12,0.06)]">
            <p className="font-semibold text-brand-primary">Consultation plans are currently unavailable.</p>
            <p className="mt-2 text-sm text-brand-muted">Please check back shortly or contact the PureVedicGems team.</p>
          </div>
        ) : (
          <>
            <section className="mt-7 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Consultation plans">
              {plans.map((plan, index) => {
                const metadata = readMetadata(plan);
                const { theme } = getPlanTheme(plan, index);
                const selected = selectedPlan?.id === plan.id;
                const mode = getConsultationMode(plan);
                const ModeIcon = mode.icon;
                const usdPrice = formatUsd(plan.amount_usd);
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${selected ? `${theme.border} ring-2 ${theme.ring}` : 'border-[#7A1515]/15'}`}
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
                        <img src={metadata.image_url} alt={plan.title} className="h-full w-full object-contain p-2" />
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

                    <h2 className="mt-0.5 text-[12px] font-medium leading-4 text-slate-700">{plan.title}</h2>

                    <p className={`mt-1 text-[13px] font-semibold ${theme.text}`}>{formatInr(plan.amount_inr)}</p>
                    {usdPrice && <p className="text-[10px] text-slate-400">{usdPrice}</p>}

                    <div className="mt-2 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => selectPlan(plan.id)}
                        className={`w-full rounded-md px-2 py-1 text-[11px] font-medium transition ${theme.button}`}
                      >
                        {selected ? '✓ Selected' : 'Select Plan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailsPlanId(plan.id)}
                        className={`w-full rounded-md border bg-white px-2 py-1 text-[11px] font-medium transition ${theme.outline}`}
                      >
                        See Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section id="consultation-booking" className="mt-6 grid gap-4 scroll-mt-24 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">
                      <FileText className="h-3 w-3" /> Booking Details
                    </span>
                    <h2 className="text-sm font-semibold text-slate-700">Complete Your Consultation Request</h2>
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
                  <FieldInput icon={User} label="Full Name" value={form.full_name} onChange={(value) => updateField('full_name', value)} error={errors.full_name} />
                  <FieldInput icon={Mail} label="Email" type="email" value={form.email} onChange={(value) => updateField('email', value)} error={errors.email} />
                  <FieldInput icon={Phone} label="Phone" value={form.phone} onChange={(value) => updateField('phone', value)} error={errors.phone} />
                  <FieldInput icon={MapPin} label="Birth Place" value={form.birth_place} onChange={(value) => updateField('birth_place', value)} placeholder="City, State" />
                  <FieldInput icon={Calendar} label="Birth Date" type="date" value={form.date_of_birth} onChange={(value) => updateField('date_of_birth', value)} />
                  <FieldInput icon={Clock} label="Birth Time" type="time" value={form.birth_time} onChange={(value) => updateField('birth_time', value)} />
                  <FieldInput icon={Calendar} label="Preferred Date" type="date" min={new Date().toISOString().split('T')[0]} value={form.preferred_date} onChange={(value) => updateField('preferred_date', value)} />
                  <FieldInput icon={Clock} label="Preferred Time" type="time" value={form.preferred_time} onChange={(value) => updateField('preferred_time', value)} />
                  <TextArea label="Life Situation / Concern" value={form.life_situation} onChange={(value) => updateField('life_situation', value)} rows={3} />
                  <TextArea label="Specific Question / Message" value={form.message} onChange={(value) => updateField('message', value)} rows={3} />
                </div>
              </div>

              <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28">
                {/* Selected plan pill */}
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand-primary">
                    <BadgeIndianRupee className="h-3 w-3" /> Your Selection
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-400">Plan</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-slate-800">{selectedPlan?.title ?? <span className="italic text-slate-400">No plan selected</span>}</h3>
                  {selectedPlan && (
                    <p className="mt-1 text-xl font-bold text-brand-primary">{formatInr(selectedPlan.amount_inr)}</p>
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
  const paragraphs = getPlanDetails(plan).split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.22em] ${theme.text}`}>Plan Details</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{plan.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close plan details">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className={`grid min-h-56 place-items-center rounded-lg ${theme.soft}`}>
            {metadata.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={metadata.image_url} alt={plan.title} className="max-h-52 w-full object-contain p-3" />
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
            <p className={`text-3xl font-black ${theme.text}`}>{formatInr(plan.amount_inr)}</p>
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
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type={type}
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-brand-accent ${
            error ? 'border-red-300' : 'border-slate-200'
          }`}
        />
      </div>
      {error && <p className="mt-0.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={5000}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-accent"
      />
    </div>
  );
}