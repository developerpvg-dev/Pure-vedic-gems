'use client';

import { useState } from 'react';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

type Props = {
  emailLabel: string;
  onVerified: (redirectTo: string) => void;
  onBack?: () => void;
};

export function AdminOtpForm({ emailLabel, onVerified, onBack }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/admin-mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Verification failed');
      return;
    }
    onVerified(data.redirectTo || '/admin');
  }

  async function resend() {
    setError('');
    setResending(true);
    const res = await fetch('/api/auth/admin-mfa/resend', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    setResending(false);
    if (!res.ok) {
      setError(data.error || 'Could not resend code');
    }
  }

  return (
    <form onSubmit={verify} className="space-y-4">
      <div className="text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'var(--pvg-gold-light, #f5e6c8)' }}
        >
          <ShieldCheck className="h-7 w-7" style={{ color: 'var(--pvg-accent, #b8860b)' }} />
        </div>
        <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary, #3D2B1F)' }}>
          Verify team access
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pvg-muted, #7A6250)' }}>
          Enter the 6-digit code sent to{' '}
          <strong style={{ color: 'var(--pvg-text)' }}>{emailLabel}</strong>
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="admin-otp"
          className="block text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--pvg-primary)' }}
        >
          Email code
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--pvg-muted)' }}
          />
          <input
            id="admin-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
            placeholder="123456"
            required
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-center text-lg tracking-[0.35em] outline-none"
            style={{
              borderColor: 'var(--pvg-border, rgba(61,43,31,0.12))',
              background: 'var(--pvg-surface, #fff)',
              color: 'var(--pvg-text)',
            }}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-widest disabled:opacity-60"
        style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg, #fff)' }}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Verify &amp; continue
      </button>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--pvg-muted)' }}>
        <button type="button" onClick={resend} disabled={resending} className="hover:underline disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend code'}
        </button>
        {onBack ? (
          <button type="button" onClick={onBack} className="hover:underline">
            Back to sign in
          </button>
        ) : null}
      </div>
    </form>
  );
}
