'use client';

import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Flame,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import { formatPrice } from '@/lib/utils/format';

export interface YagyaBuyData {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  short_desc: string | null;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  booking_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  yagya_title: string;
  customer: { name: string; email: string; contact: string };
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  sankalp_name: string;
  gotra: string;
  rashi: string;
  nakshatra: string;
  date_of_birth: string;
  birth_time: string;
  birth_place: string;
  preferred_date: string;
  message: string;
  website: string;
}

const INITIAL_FORM: FormState = {
  full_name: '',
  email: '',
  phone: '',
  sankalp_name: '',
  gotra: '',
  rashi: '',
  nakshatra: '',
  date_of_birth: '',
  birth_time: '',
  birth_place: '',
  preferred_date: '',
  message: '',
  website: '',
};

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

export function YagyaBuyForm({ yagya }: { yagya: YagyaBuyData }) {
  const { user, profile, isAuthenticated } = useAuth();
  const { currency } = useCurrency();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

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
    if (!form.full_name.trim()) nextErrors.full_name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Valid email required';
    if (!form.phone.trim() || !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) nextErrors.phone = 'Valid phone required';
    return nextErrors;
  }

  function buildBody() {
    const body: Record<string, string> = { yagya_id: yagya.id, currency };
    for (const [key, value] of Object.entries(form)) {
      const trimmed = value.trim();
      if (trimmed) body[key] = trimmed;
    }
    return body;
  }

  async function verifyPayment(bookingId: string, response: RazorpayResponse) {
    const verifyRes = await fetch('/api/yagya/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: bookingId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
    const data = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok) throw new Error(data.error || 'Payment verification failed');
    return data as { booking_id: string };
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
      const createRes = await fetch('/api/yagya/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
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
        description: payment.yagya_title,
        order_id: payment.razorpay_order_id,
        prefill: payment.customer,
        notes: { booking_id: payment.booking_id },
        theme: { color: '#b45309' },
        modal: { ondismiss: () => setPaying(false) },
        handler: (response) => {
          void (async () => {
            try {
              const verified = await verifyPayment(payment.booking_id, response);
              trackStorefrontEvent('yagya_payment_success', {
                booking_id: verified.booking_id,
                yagya_id: yagya.id,
              });
              setSuccess({ id: verified.booking_id });
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-700 ring-1 ring-green-100">
          <CheckCircle className="h-9 w-9" />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#7A1515]">Payment Verified</p>
        <h1 className="text-3xl font-semibold text-slate-800">Yagya Booked</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
          Your {yagya.name} booking and payment are confirmed. Our priests will reach out with the muhurat and sankalp details.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {isAuthenticated && (
            <Link href="/account/yagyas" className="inline-flex items-center gap-2 rounded-md border border-[#7A1515] bg-[#7A1515] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5f1010]">
              <Flame className="h-4 w-4" /> View My Yagyas
            </Link>
          )}
          <Link href="/vedic-yagyas-service" className="inline-flex items-center gap-2 rounded-md border border-[#7A1515]/30 bg-white px-5 py-3 text-sm font-semibold text-[#7A1515] transition hover:bg-[#fff7eb]">
            Browse more Yagyas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-[#7A1515]/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-[#7A1515]/10 pb-3">
          <Flame className="h-4 w-4 text-[#7A1515]" />
          <h2 className="text-sm font-semibold text-slate-700">Sankalp &amp; contact details</h2>
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
          <FieldInput icon={User} label="Full Name" value={form.full_name} onChange={(v) => updateField('full_name', v)} error={errors.full_name} />
          <FieldInput icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => updateField('email', v)} error={errors.email} />
          <FieldInput icon={Phone} label="Phone" value={form.phone} onChange={(v) => updateField('phone', v)} error={errors.phone} />
          <FieldInput icon={Users} label="Sankalp Name (person for the yagya)" value={form.sankalp_name} onChange={(v) => updateField('sankalp_name', v)} placeholder="Name of the devotee" />
          <FieldInput icon={Sparkles} label="Gotra" value={form.gotra} onChange={(v) => updateField('gotra', v)} />
          <FieldInput icon={Sparkles} label="Rashi (Moon sign)" value={form.rashi} onChange={(v) => updateField('rashi', v)} />
          <FieldInput icon={Sparkles} label="Nakshatra" value={form.nakshatra} onChange={(v) => updateField('nakshatra', v)} />
          <FieldInput icon={MapPin} label="Birth Place" value={form.birth_place} onChange={(v) => updateField('birth_place', v)} placeholder="City, State" />
          <FieldInput icon={Calendar} label="Birth Date" type="date" value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} />
          <FieldInput icon={Clock} label="Birth Time" type="time" value={form.birth_time} onChange={(v) => updateField('birth_time', v)} />
          <FieldInput icon={Calendar} label="Preferred Date" type="date" min={new Date().toISOString().split('T')[0]} value={form.preferred_date} onChange={(v) => updateField('preferred_date', v)} />
          <TextArea label="Special instructions / message" value={form.message} onChange={(v) => updateField('message', v)} rows={3} />
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-[#7A1515]/15 bg-white p-5 shadow-sm lg:sticky lg:top-28">
        <div className="rounded-lg bg-[#fff7eb] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-[#7A1515]">Your Yagya</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-800">{yagya.name}</h3>
          {yagya.short_desc && <p className="mt-1 text-xs text-slate-500">{yagya.short_desc}</p>}
          {yagya.price > 0 && <p className="mt-2 text-xl font-bold text-[#7A1515]">{formatPrice(yagya.price)}</p>}
        </div>

        {errors._form && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errors._form}</p>}

        <button
          type="button"
          disabled={paying || yagya.price <= 0}
          onClick={handlePayment}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#7A1515] bg-[#7A1515] px-4 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-[0_8px_20px_rgba(122,21,21,0.18)] transition hover:bg-[#5f1010] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
          {paying ? 'Opening Payment...' : 'Proceed to Payment'}
        </button>

        <p className="mt-3 text-[10px] leading-5 text-slate-400">
          Processed securely by Razorpay. Final samagri and pandit dakshina are coordinated after booking.
        </p>
      </aside>
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
          className={`w-full rounded-lg border bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-[#7A1515]/50 focus:ring-1 focus:ring-[#7A1515]/20 ${
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
    <div className="sm:col-span-2">
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={5000}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#7A1515]/50 focus:ring-1 focus:ring-[#7A1515]/20"
      />
    </div>
  );
}
