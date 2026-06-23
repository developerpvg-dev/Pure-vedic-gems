'use client';

import { useState, useTransition } from 'react';
import {
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import type { Database } from '@/lib/types/database';

type ProfileUpdate = Database['public']['Tables']['customer_profiles']['Update'];

const RASHI_OPTIONS = [
  'Aries (Mesh)',
  'Taurus (Vrishabha)',
  'Gemini (Mithuna)',
  'Cancer (Kark)',
  'Leo (Simha)',
  'Virgo (Kanya)',
  'Libra (Tula)',
  'Scorpio (Vrishchika)',
  'Sagittarius (Dhanu)',
  'Capricorn (Makar)',
  'Aquarius (Kumbha)',
  'Pisces (Meena)',
];

interface FieldProps {
  id: string;
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  isSelect?: boolean;
  options?: string[];
  helpText?: string;
}

function Field({
  id,
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  isSelect,
  options,
  helpText,
}: FieldProps) {
  const baseInputClass = 'pvg-account-field pl-10';

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="pvg-account-label">
        {label}
        {required ? <span className="ml-1 text-[#b8861e]">*</span> : null}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b5b4e]"
          aria-hidden="true"
        />
        {isSelect ? (
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseInputClass} cursor-pointer appearance-none`}
          >
            <option value="">— Select —</option>
            {options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={baseInputClass}
          />
        )}
      </div>
      {helpText ? <p className="text-xs text-[#6b5b4e]">{helpText}</p> : null}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    whatsapp: profile?.whatsapp ?? '',
    date_of_birth: profile?.date_of_birth ?? '',
    birth_time: profile?.birth_time ?? '',
    birth_place: profile?.birth_place ?? '',
    gotra: profile?.gotra ?? '',
    rashi: profile?.rashi ?? '',
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [field]: v }));
    setSaved(false);
    setError('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaved(false);

    startTransition(async () => {
      const supabase = createClient();
      const updateData: ProfileUpdate = {
        full_name: form.full_name || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        date_of_birth: form.date_of_birth || null,
        birth_time: form.birth_time || null,
        birth_place: form.birth_place || null,
        gotra: form.gotra || null,
        rashi: form.rashi || null,
      };
      // Cast to `any` on the client bypasses a supabase-js conditional-type
      // quirk that resolves the .update() parameter to `never` for this table.
      // updateData is fully typed as ProfileUpdate so runtime safety is preserved.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('customer_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        setError('Failed to save profile. Please try again.');
        return;
      }

      await refreshProfile();
      setSaved(true);
    });
  }

  return (
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="Profile & DOB"
        subtitle="Edit your contact details and birth information for consultations and recommendations."
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="pvg-account-card pvg-account-card-pad space-y-6 lg:col-span-2">
            <h2 className="pvg-account-card-title">Personal Information</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="full_name"
                label="Full Name"
                icon={User}
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="Arjun Sharma"
                required
              />
              <div className="space-y-1">
                <label
                  className="block text-[13px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--pvg-primary)' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  className="w-full rounded-lg border py-2.5 px-4 text-sm"
                  style={{
                    borderColor: 'var(--pvg-border)',
                    background: 'var(--pvg-bg-alt)',
                    color: 'var(--pvg-muted)',
                    cursor: 'not-allowed',
                  }}
                />
                <p className="text-xs" style={{ color: 'var(--pvg-muted)' }}>
                  Email cannot be changed
                </p>
              </div>
              <Field
                id="phone"
                label="Mobile Number"
                icon={Phone}
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
              />
              <Field
                id="whatsapp"
                label="WhatsApp Number"
                icon={Phone}
                type="tel"
                value={form.whatsapp}
                onChange={set('whatsapp')}
                placeholder="+91 98765 43210"
                helpText="Used for order updates & consultation booking"
              />
            </div>
          </div>

          <div className="pvg-account-card pvg-account-card-pad space-y-5">
            <div>
              <h2 className="pvg-account-card-title">Vedic Birth Details</h2>
              <p className="mt-1 text-xs text-[#6b5b4e]">
                Used for gemstone recommendations & energization ceremonies
              </p>
            </div>

            <Field
              id="date_of_birth"
              label="Date of Birth"
              icon={Calendar}
              type="date"
              value={form.date_of_birth}
              onChange={set('date_of_birth')}
            />
            <Field
              id="birth_time"
              label="Birth Time"
              icon={Clock}
              type="time"
              value={form.birth_time}
              onChange={set('birth_time')}
              helpText="Approximate time is fine"
            />
            <Field
              id="birth_place"
              label="Birth Place"
              icon={MapPin}
              value={form.birth_place}
              onChange={set('birth_place')}
              placeholder="Delhi, India"
            />
            <Field
              id="gotra"
              label="Gotra"
              icon={User}
              value={form.gotra}
              onChange={set('gotra')}
              placeholder="e.g. Bharadwaj"
            />
            <Field
              id="rashi"
              label="Rashi (Moon Sign)"
              icon={Calendar}
              value={form.rashi}
              onChange={set('rashi')}
              isSelect
              options={RASHI_OPTIONS}
            />
          </div>
        </div>

        {/* ── Actions row ─────────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && (
            <span
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#16a34a' }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Profile saved
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={isPending}
              className="pvg-account-btn disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
