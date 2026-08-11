'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, ChevronDown, Pencil, Building2 } from 'lucide-react';
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
  const [businessName, setBusinessName] = useState(savedData?.business_name ?? defaultValues.business_name ?? '');
  const [billingGstin, setBillingGstin] = useState(savedData?.billing_gstin ?? defaultValues.billing_gstin ?? '');
  const [businessBilling, setBusinessBilling] = useState(Boolean(savedData?.billing_gstin || defaultValues.billing_gstin));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill from profile when it loads
  useEffect(() => {
    if (!savedData && defaultValues.full_name) {
      const timeoutId = setTimeout(() => {
        setFullName((prev) => prev || defaultValues.full_name || '');
        setEmail((prev) => prev || defaultValues.email || '');
        setPhone((prev) => prev || defaultValues.phone || '');
      }, 0);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [defaultValues, savedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = ContactInfoSchema.safeParse({
      full_name: fullName,
      email,
      phone,
      business_name: businessBilling ? businessName : '',
      billing_gstin: businessBilling ? billingGstin : '',
    });
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
      <div className="pvg-checkout-step pvg-checkout-step--complete">
        <div className="pvg-checkout-step-head pvg-checkout-step-head--tight">
          <div className="pvg-checkout-step-title-row">
            <span className="pvg-checkout-step-badge">✓</span>
            <h2 className="pvg-checkout-step-title">Contact</h2>
          </div>
          <button type="button" onClick={onEdit} className="pvg-checkout-step-edit">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <div className="pvg-checkout-step-summary">
          <p className="font-medium text-[#3d2b1f]">{savedData.full_name}</p>
          <p className="truncate">{savedData.email}</p>
          <p>{savedData.phone}</p>
          {savedData.billing_gstin ? (
            <p className="truncate">Tax ID: {savedData.billing_gstin}</p>
          ) : null}
        </div>
      </div>
    );
  }

  // ── Disabled view ────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <div className="pvg-checkout-step pvg-checkout-step--disabled">
        <div className="pvg-checkout-step-title-row">
          <span className="pvg-checkout-step-badge">1</span>
          <h2 className="pvg-checkout-step-title">Contact information</h2>
        </div>
      </div>
    );
  }

  // ── Active form ──────────────────────────────────────────────────────
  return (
    <div className="pvg-checkout-step pvg-checkout-step--active">
      <div className="pvg-checkout-step-head">
        <div className="pvg-checkout-step-title-row">
          <span className="pvg-checkout-step-badge">1</span>
          <h2 className="pvg-checkout-step-title">Contact information</h2>
        </div>
      </div>

      {!isLoggedIn && (
        <p className="text-xs text-[var(--pvg-muted)] mb-4">
          Already have an account?{' '}
          <Link href="/checkout?auth=login" className="text-[var(--pvg-accent)] hover:underline font-medium">
            Log in
          </Link>{' '}
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
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] transition-shadow ${
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
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] transition-shadow ${
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
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] transition-shadow ${
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

        <div className="pvg-checkout-panel">
          <label className="flex items-start gap-3 text-sm text-[var(--pvg-text)]">
            <input
              type="checkbox"
              checked={businessBilling}
              onChange={(e) => setBusinessBilling(e.target.checked)}
              className="mt-1"
            />
            <span>
              I need a business tax invoice for this purchase.
              <span className="mt-1 block text-xs text-[var(--pvg-muted)]">
                Your business tax ID is stored on the order and printed on the invoice only after payment verification.
              </span>
            </span>
          </label>

          {businessBilling && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--pvg-text)] mb-1.5">Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--pvg-muted)]" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Registered business name"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-surface placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                      errors.business_name ? 'border-red-400' : 'border-[var(--pvg-border)]'
                    }`}
                  />
                </div>
                {errors.business_name && <p className="text-xs text-red-500 mt-1">{errors.business_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--pvg-text)] mb-1.5">Business tax ID</label>
                <input
                  type="text"
                  value={billingGstin}
                  onChange={(e) => setBillingGstin(e.target.value.toUpperCase())}
                  placeholder="07ABCDE1234F1Z5"
                  maxLength={15}
                  className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-surface placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                    errors.billing_gstin ? 'border-red-400' : 'border-[var(--pvg-border)]'
                  }`}
                />
                {errors.billing_gstin && <p className="text-xs text-red-500 mt-1">{errors.billing_gstin}</p>}
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="pvg-checkout-btn pvg-checkout-btn--primary">
          Continue to Shipping
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </button>
      </form>
    </div>
  );
}
