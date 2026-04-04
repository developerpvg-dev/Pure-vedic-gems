'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, ChevronDown, Pencil } from 'lucide-react';
import { ContactInfoSchema, type ContactInfo } from '@/lib/validators/order';

interface ContactSectionProps {
  isActive: boolean;
  isComplete: boolean;
  defaultValues: Partial<ContactInfo>;
  savedData: ContactInfo | null;
  onComplete: (data: ContactInfo) => void;
  onEdit: () => void;
  isLoggedIn: boolean;
}

export function ContactSection({
  isActive,
  isComplete,
  defaultValues,
  savedData,
  onComplete,
  onEdit,
  isLoggedIn,
}: ContactSectionProps) {
  const [fullName, setFullName] = useState(savedData?.full_name ?? defaultValues.full_name ?? '');
  const [email, setEmail] = useState(savedData?.email ?? defaultValues.email ?? '');
  const [phone, setPhone] = useState(savedData?.phone ?? defaultValues.phone ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill from profile when it loads
  useEffect(() => {
    if (!savedData && defaultValues.full_name) {
      setFullName((prev) => prev || defaultValues.full_name || '');
      setEmail((prev) => prev || defaultValues.email || '');
      setPhone((prev) => prev || defaultValues.phone || '');
    }
  }, [defaultValues, savedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = ContactInfoSchema.safeParse({ full_name: fullName, email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        if (msgs && msgs.length > 0) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    onComplete(result.data);
  };

  // ── Collapsed view when complete ──────────────────────────────────────
  if (!isActive && isComplete && savedData) {
    return (
      <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              ✓
            </span>
            <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
              Contact Information
            </h2>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-sm text-[var(--pvg-accent)] hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <div className="text-sm text-[var(--pvg-muted)] space-y-1 ml-8">
          <p>{savedData.full_name}</p>
          <p>{savedData.email} · {savedData.phone}</p>
        </div>
      </div>
    );
  }

  // ── Disabled view ────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6 opacity-50">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--pvg-bg-alt)] text-[var(--pvg-muted)] text-xs font-bold">
            1
          </span>
          <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
            Contact Information
          </h2>
        </div>
      </div>
    );
  }

  // ── Active form ──────────────────────────────────────────────────────
  return (
    <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--pvg-accent)] text-white text-xs font-bold">
          1
        </span>
        <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
          Contact Information
        </h2>
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-[var(--pvg-muted)] mb-4">
          Already have an account?{' '}
          <a href="/?auth=login" className="text-[var(--pvg-accent)] hover:underline font-medium">
            Log in
          </a>{' '}
          for a faster checkout.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--pvg-muted)]" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] transition-shadow ${
                errors.full_name ? 'border-red-400 ring-1 ring-red-300' : 'border-[var(--pvg-border)]'
              }`}
            />
          </div>
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--pvg-muted)]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] transition-shadow ${
                errors.email ? 'border-red-400 ring-1 ring-red-300' : 'border-[var(--pvg-border)]'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--pvg-muted)]" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] transition-shadow ${
                errors.phone ? 'border-red-400 ring-1 ring-red-300' : 'border-[var(--pvg-border)]'
              }`}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          )}
          <p className="text-xs text-[var(--pvg-muted)] mt-1">
            We&apos;ll send shipping updates to this number via WhatsApp
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--pvg-primary)] text-white py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Continue to Shipping
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </button>
      </form>
    </div>
  );
}
