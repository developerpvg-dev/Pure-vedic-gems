'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    const redirectTo = `${window.location.origin}/account/set-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo }
    );
    setIsLoading(false);
    if (resetError) {
      setError(resetError.message ?? 'Could not send a reset link. Please try again.');
      return;
    }
    setSent(true);
  }

  return (
    <div className="pvg-account-stack" style={{ maxWidth: 520, margin: '0 auto' }}>
      <AccountPageHeader
        centered
        eyebrow="Account access"
        title="Reset your password"
        subtitle="Welcome back to our new store. Enter the email you used on our old site and we'll send you a link to set a new password."
      />

      <div className="pvg-account-card pvg-account-card-pad">
        {sent ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: '#166534' }} />
            <div>
              <h2 className="font-heading text-xl" style={{ color: 'var(--pvg-primary)' }}>
                Check your email
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--pvg-muted)' }}>
                We sent a password-reset link to <strong style={{ color: 'var(--pvg-text)' }}>{email}</strong>.
                Click the link to choose a new password and activate your account.
              </p>
            </div>
            <Link href="/shop?auth=login" className="pvg-account-btn inline-flex">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="forgot-email"
                className="block text-[13px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--pvg-primary)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--pvg-muted)' }}
                />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                  style={{
                    borderColor: 'var(--pvg-border)',
                    background: 'var(--pvg-surface)',
                    color: 'var(--pvg-text)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--pvg-accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--pvg-border)')}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--pvg-muted)' }}>
                If your account was migrated from our old WordPress site, this is the email you registered with.
              </p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </button>

            <Link
              href="/shop?auth=login"
              className="flex items-center justify-center gap-1.5 text-sm"
              style={{ color: 'var(--pvg-muted)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
