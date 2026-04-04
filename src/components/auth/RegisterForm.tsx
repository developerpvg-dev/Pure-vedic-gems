'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { RegisterSchema } from '@/lib/validators/auth';

interface RegisterFormProps {
  onSuccess?: (requiresVerification: boolean) => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    setError('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side validation
    const parsed = RegisterSchema.safeParse({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const [field, msgs] of Object.entries(
        parsed.error.flatten().fieldErrors
      )) {
        errs[field] = (msgs as string[])[0] ?? '';
      }
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    const result = await signUp({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      password: parsed.data.password,
      phone: parsed.data.phone,
    });
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onSuccess?.(result.requiresEmailVerification ?? false);
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--pvg-gold-light)' }}
        >
          <User className="h-6 w-6" style={{ color: 'var(--pvg-accent)' }} />
        </div>
        <h2
          className="font-heading text-2xl"
          style={{ color: 'var(--pvg-primary)' }}
        >
          Create Account
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--pvg-muted)' }}>
          Join India&apos;s most trusted gemstone heritage brand
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1">
          <label
            htmlFor="reg-name"
            className="block text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--pvg-primary)' }}
          >
            Full Name *
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--pvg-muted)' }}
            />
            <input
              id="reg-name"
              type="text"
              value={form.full_name}
              onChange={set('full_name')}
              placeholder="Arjun Sharma"
              autoComplete="name"
              required
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
              style={{
                borderColor: fieldErrors.full_name
                  ? '#ef4444'
                  : 'var(--pvg-border)',
                background: 'var(--pvg-surface)',
                color: 'var(--pvg-text)',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = fieldErrors.full_name
                  ? '#ef4444'
                  : 'var(--pvg-border)')
              }
            />
          </div>
          {fieldErrors.full_name && (
            <p className="text-xs text-red-500">{fieldErrors.full_name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="reg-email"
            className="block text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--pvg-primary)' }}
          >
            Email Address *
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--pvg-muted)' }}
            />
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="arjun@example.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
              style={{
                borderColor: fieldErrors.email
                  ? '#ef4444'
                  : 'var(--pvg-border)',
                background: 'var(--pvg-surface)',
                color: 'var(--pvg-text)',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = fieldErrors.email
                  ? '#ef4444'
                  : 'var(--pvg-border)')
              }
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="reg-password"
            className="block text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--pvg-primary)' }}
          >
            Password *
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--pvg-muted)' }}
            />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
              className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-all"
              style={{
                borderColor: fieldErrors.password
                  ? '#ef4444'
                  : 'var(--pvg-border)',
                background: 'var(--pvg-surface)',
                color: 'var(--pvg-text)',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = fieldErrors.password
                  ? '#ef4444'
                  : 'var(--pvg-border)')
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--pvg-muted)' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {/* Password strength hint */}
          {form.password.length > 0 && (
            <p
              className="text-xs"
              style={{
                color:
                  form.password.length >= 8
                    ? '#16a34a'
                    : 'var(--pvg-muted)',
              }}
            >
              {form.password.length >= 8
                ? '✓ Strong enough'
                : `${8 - form.password.length} more characters needed`}
            </p>
          )}
          {fieldErrors.password && (
            <p className="text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Phone (optional) */}
        <div className="space-y-1">
          <label
            htmlFor="reg-phone"
            className="block text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--pvg-primary)' }}
          >
            Phone{' '}
            <span className="font-normal normal-case tracking-normal" style={{ color: 'var(--pvg-muted)' }}>
              (optional)
            </span>
          </label>
          <div className="relative">
            <Phone
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--pvg-muted)' }}
            />
            <input
              id="reg-phone"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
              style={{
                borderColor: fieldErrors.phone
                  ? '#ef4444'
                  : 'var(--pvg-border)',
                background: 'var(--pvg-surface)',
                color: 'var(--pvg-text)',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = fieldErrors.phone
                  ? '#ef4444'
                  : 'var(--pvg-border)')
              }
            />
          </div>
          {fieldErrors.phone && (
            <p className="text-xs text-red-500">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Global error */}
        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: '#fca5a5',
              background: '#fef2f2',
              color: '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: 'var(--pvg-primary)',
            color: 'var(--pvg-bg)',
          }}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating Account…' : 'Create Account'}
        </button>

        {/* Terms note */}
        <p className="text-center text-xs" style={{ color: 'var(--pvg-muted)' }}>
          By registering you agree to our{' '}
          <a
            href="/policies/terms"
            className="underline underline-offset-2 hover:text-[var(--pvg-accent)]"
          >
            Terms
          </a>{' '}
          &amp;{' '}
          <a
            href="/policies/privacy"
            className="underline underline-offset-2 hover:text-[var(--pvg-accent)]"
          >
            Privacy Policy
          </a>
        </p>
      </form>

      {/* Switch to login */}
      {onSwitchToLogin && (
        <div
          className="border-t pt-4 text-center text-sm"
          style={{ borderColor: 'var(--pvg-border)' }}
        >
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold transition-colors hover:text-[var(--pvg-accent)]"
            style={{ color: 'var(--pvg-accent)' }}
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}
