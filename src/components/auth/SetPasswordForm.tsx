'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SetPasswordFormProps {
  defaultName?: string;
  defaultEmail?: string;
  next: string;
}

const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'upper', label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'A number', test: (p: string) => /\d/.test(p) },
];

export function SetPasswordForm({ defaultName, defaultEmail, next }: SetPasswordFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const passedCount = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const allPassed = passedCount === PASSWORD_RULES.length;
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const canSubmit = allPassed && passwordsMatch && !isLoading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!allPassed) {
      setError('Please meet all the password requirements.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    // 1) Update the auth user's password using the active session.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setIsLoading(false);
      setError(updateError.message ?? 'Could not update your password. Please try again.');
      return;
    }

    // 2) Clear the legacy reset flag server-side.
    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      // Password was already changed; surface but don't block.
      setError(json.error ?? 'Password updated, but we could not finalize your account. Please refresh.');
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setDone(true);
    setTimeout(() => router.push(next), 1200);
  }

  if (done) {
    return (
      <div className="pvg-account-card pvg-account-card-pad" style={{ textAlign: 'center' }}>
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12" style={{ color: '#166534' }} />
        <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary)' }}>
          Password set successfully
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--pvg-muted)' }}>
          Your account is now active. Taking you to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pvg-account-card pvg-account-card-pad space-y-5">
      {defaultName && (
        <p className="text-sm" style={{ color: 'var(--pvg-muted)' }}>
          Signed in as <strong style={{ color: 'var(--pvg-text)' }}>{defaultName}</strong>
          {defaultEmail ? <> · {defaultEmail}</> : null}
        </p>
      )}

      <div className="space-y-1">
        <label
          htmlFor="new-password"
          className="block text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--pvg-primary)' }}
        >
          New Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--pvg-muted)' }}
          />
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
            className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-all"
            style={{
              borderColor: 'var(--pvg-border)',
              background: 'var(--pvg-surface)',
              color: 'var(--pvg-text)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pvg-accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--pvg-border)')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--pvg-muted)' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <ul className="space-y-1.5 text-xs" style={{ color: 'var(--pvg-muted)' }}>
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-2">
              <CheckCircle2
                className="h-3.5 w-3.5"
                style={{ color: ok ? '#166534' : 'var(--pvg-muted)' }}
              />
              <span style={{ color: ok ? '#166534' : 'var(--pvg-muted)' }}>{rule.label}</span>
            </li>
          );
        })}
      </ul>

      <div className="space-y-1">
        <label
          htmlFor="confirm-password"
          className="block text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--pvg-primary)' }}
        >
          Confirm Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--pvg-muted)' }}
          />
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
            className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-all"
            style={{
              borderColor: confirm && !passwordsMatch ? '#dc2626' : 'var(--pvg-border)',
              background: 'var(--pvg-surface)',
              color: 'var(--pvg-text)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pvg-accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = confirm && !passwordsMatch ? '#dc2626' : 'var(--pvg-border)')}
          />
        </div>
        {confirm && !passwordsMatch && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        Set Password & Continue
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--pvg-muted)' }}>
        Once set, your full order history, rewards, and consultations will be available on your dashboard.
      </p>
    </form>
  );
}
