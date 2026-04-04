'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { OTPInput } from './OTPInput';
import { RegisterForm } from './RegisterForm';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type Tab = 'email' | 'phone' | 'magic';
type View = 'login' | 'register' | 'otp' | 'check-email' | 'email-sent';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional: redirect path after successful auth (handled by caller) */
  onSuccess?: () => void;
  initialView?: 'login' | 'register';
}

// ────────────────────────────────────────────────────────────────────────────
// OTP Timer hook
// ────────────────────────────────────────────────────────────────────────────

function useOTPTimer(initial = 60) {
  const [seconds, setSeconds] = useState(0);
  const start = () => setSeconds(initial);
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return { seconds, start, canResend: seconds === 0 };
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function LoginModal({
  open,
  onClose,
  onSuccess,
  initialView = 'login',
}: LoginModalProps) {
  const { signIn, sendOTP, verifyOTP, sendMagicLink } = useAuth();

  const [view, setView] = useState<View>(initialView);
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // Email/password form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Magic link form
  const [magicEmail, setMagicEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { seconds: otpSeconds, start: startOTPTimer, canResend } = useOTPTimer(60);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setView(initialView);
      return;
    }

    if (!open) {
      setTimeout(() => {
        setView(initialView);
        setActiveTab('email');
        setError('');
        setEmail('');
        setPassword('');
        setPhone('');
        setOtp('');
        setMagicEmail('');
      }, 300);
    }
  }, [initialView, open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const clear = () => setError('');

  // ── Email login ─────────────────────────────────────────────────────────────

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    clear();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
    onClose();
  }

  // ── OTP flow ────────────────────────────────────────────────────────────────

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    clear();
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setIsLoading(true);
    const result = await sendOTP(phone.trim());
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    startOTPTimer();
    setView('otp');
  }

  async function handleVerifyOTP() {
    clear();
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setIsLoading(true);
    const result = await verifyOTP(phone.trim(), otp);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      setOtp('');
      return;
    }
    onSuccess?.();
    onClose();
  }

  async function handleResendOTP() {
    if (!canResend) return;
    setOtp('');
    clear();
    setIsLoading(true);
    await sendOTP(phone.trim());
    setIsLoading(false);
    startOTPTimer();
  }

  // ── Magic link ──────────────────────────────────────────────────────────────

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    clear();
    if (!magicEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    const result = await sendMagicLink(magicEmail.trim());
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setView('email-sent');
  }

  // ── Register success ────────────────────────────────────────────────────────

  function handleRegisterSuccess(requiresVerification: boolean) {
    if (requiresVerification) {
      setView('check-email');
    } else {
      onSuccess?.();
      onClose();
    }
  }

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-0 z-[2001] flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to PureVedicGems"
      >
        <div
          className="relative w-full my-auto max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
          style={{
            maxWidth: '460px',
            background: 'var(--pvg-bg)',
            border: '1px solid var(--pvg-border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--pvg-bg-alt)', color: 'var(--pvg-muted)' }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-7">
            {/* ── REGISTER VIEW ── */}
            {view === 'register' && (
              <RegisterForm
                onSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => setView('login')}
              />
            )}

            {/* ── OTP ENTRY VIEW ── */}
            {view === 'otp' && (
              <div className="space-y-6 text-center">
                <div>
                  <div
                    className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: 'var(--pvg-gold-light)' }}
                  >
                    <Phone className="h-6 w-6" style={{ color: 'var(--pvg-accent)' }} />
                  </div>
                  <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary)' }}>
                    Enter OTP
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pvg-muted)' }}>
                    We sent a 6-digit code to{' '}
                    <strong style={{ color: 'var(--pvg-text)' }}>{phone}</strong>
                  </p>
                </div>

                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  hasError={!!error}
                  disabled={isLoading}
                />

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length < 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify &amp; Sign In
                </button>

                <div className="text-sm" style={{ color: 'var(--pvg-muted)' }}>
                  {canResend ? (
                    <button
                      onClick={handleResendOTP}
                      className="font-semibold underline underline-offset-2"
                      style={{ color: 'var(--pvg-accent)' }}
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <>
                      Resend in{' '}
                      <strong style={{ color: 'var(--pvg-text)' }}>
                        {otpSeconds}s
                      </strong>
                    </>
                  )}
                </div>

                <button
                  onClick={() => { setView('login'); setOtp(''); clear(); }}
                  className="text-sm underline underline-offset-2"
                  style={{ color: 'var(--pvg-muted)' }}
                >
                  ← Change number
                </button>
              </div>
            )}

            {/* ── CHECK EMAIL VIEW (after register) ── */}
            {view === 'check-email' && (
              <div className="space-y-5 py-4 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: 'var(--pvg-gold-light)' }}
                >
                  <Mail className="h-8 w-8" style={{ color: 'var(--pvg-accent)' }} />
                </div>
                <div>
                  <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary)' }}>
                    Verify Your Email
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pvg-muted)' }}>
                    We&apos;ve sent a verification link to your email. Please click it to activate your account.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all"
                  style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
                >
                  Got it
                </button>
              </div>
            )}

            {/* ── EMAIL SENT VIEW (magic link) ── */}
            {view === 'email-sent' && (
              <div className="space-y-5 py-4 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: 'var(--pvg-gold-light)' }}
                >
                  <Sparkles className="h-8 w-8" style={{ color: 'var(--pvg-accent)' }} />
                </div>
                <div>
                  <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary)' }}>
                    Check Your Email
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pvg-muted)' }}>
                    A magic sign-in link has been sent to{' '}
                    <strong style={{ color: 'var(--pvg-text)' }}>{magicEmail}</strong>.
                    Click the link to sign in instantly.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all"
                  style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
                >
                  Got it
                </button>
              </div>
            )}

            {/* ── LOGIN VIEW ── */}
            {view === 'login' && (
              <div className="space-y-5">
                {/* Header */}
                <div className="text-center">
                  <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary)' }}>
                    Welcome Back
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--pvg-muted)' }}>
                    Sign in to your PureVedicGems account
                  </p>
                </div>

                {/* Tabs */}
                <div
                  className="flex rounded-lg p-1"
                  style={{ background: 'var(--pvg-bg-alt)' }}
                  role="tablist"
                >
                  {(
                    [
                      { id: 'email' as Tab, label: 'Email', icon: Mail },
                      { id: 'phone' as Tab, label: 'Phone OTP', icon: Phone },
                      { id: 'magic' as Tab, label: 'Magic Link', icon: Sparkles },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={activeTab === id}
                      onClick={() => { setActiveTab(id); clear(); }}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all',
                        activeTab === id
                          ? 'shadow-sm'
                          : 'opacity-60 hover:opacity-80'
                      )}
                      style={
                        activeTab === id
                          ? {
                              background: 'var(--pvg-surface)',
                              color: 'var(--pvg-primary)',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            }
                          : { color: 'var(--pvg-text)' }
                      }
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {/* ── Email Tab ── */}
                {activeTab === 'email' && (
                  <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
                    <div className="space-y-1">
                      <label
                        htmlFor="login-email"
                        className="block text-[13px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--pvg-primary)' }}
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{ color: 'var(--pvg-muted)' }}
                        />
                        <input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); clear(); }}
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
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="login-password"
                          className="block text-[13px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--pvg-primary)' }}
                        >
                          Password
                        </label>
                        <a
                          href="/account/forgot-password"
                          className="text-xs hover:underline"
                          style={{ color: 'var(--pvg-accent)' }}
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--pvg-muted)' }} />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); clear(); }}
                          placeholder="Your password"
                          autoComplete="current-password"
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: 'var(--pvg-muted)' }}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ background: 'var(--pvg-primary)', color: 'var(--pvg-bg)' }}
                    >
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Sign In
                    </button>
                  </form>
                )}

                {/* ── Phone OTP Tab ── */}
                {activeTab === 'phone' && (
                  <form onSubmit={handleSendOTP} className="space-y-4" noValidate>
                    <div className="space-y-1">
                      <label
                        htmlFor="login-phone"
                        className="block text-[13px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--pvg-primary)' }}
                      >
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone
                          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                          style={{ color: 'var(--pvg-muted)' }}
                        />
                        <input
                          id="login-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => { setPhone(e.target.value); clear(); }}
                          placeholder="+91 98765 43210"
                          autoComplete="tel"
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
                        We&apos;ll send a one-time password via SMS
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
                      Send OTP
                    </button>
                  </form>
                )}

                {/* ── Magic Link Tab ── */}
                {activeTab === 'magic' && (
                  <form onSubmit={handleMagicLink} className="space-y-4" noValidate>
                    <div className="space-y-1">
                      <label
                        htmlFor="magic-email"
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
                          id="magic-email"
                          type="email"
                          value={magicEmail}
                          onChange={(e) => { setMagicEmail(e.target.value); clear(); }}
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
                        No password needed — we&apos;ll email you a sign-in link
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
                      Send Magic Link
                    </button>
                  </form>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'var(--pvg-border)' }} />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span
                      className="px-3"
                      style={{ background: 'var(--pvg-bg)', color: 'var(--pvg-muted)' }}
                    >
                      New to PureVedicGems?
                    </span>
                  </div>
                </div>

                {/* Register CTA */}
                <button
                  onClick={() => { setView('register'); clear(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold uppercase tracking-wider transition-all hover:-translate-y-0.5"
                  style={{
                    borderColor: 'var(--pvg-accent)',
                    color: 'var(--pvg-accent)',
                    background: 'var(--pvg-gold-light)',
                  }}
                >
                  Create Free Account
                </button>
              </div>
            )}
          </div>

          {/* Heritage footer strip */}
          <div
            className="rounded-b-2xl px-7 py-3 text-center text-[11px] uppercase tracking-[2px]"
            style={{
              background: 'var(--pvg-primary)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            Heritage since 1937 · 87+ Years of Trust
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Lock icon (used in form, import from lucide) ──────────────────────────────

function Lock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
