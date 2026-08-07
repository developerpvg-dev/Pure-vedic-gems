'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { RegisterForm } from './RegisterForm';
import { GoogleAuthButton } from './GoogleAuthButton';
import { GoogleIcon } from './GoogleIcon';
import { AdminOtpForm } from './AdminOtpForm';
import { cn } from '@/lib/utils';

type Tab = 'email' | 'google' | 'magic';
type View = 'login' | 'register' | 'check-email' | 'email-sent' | 'admin-otp';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional: redirect path after successful auth (handled by caller) */
  onSuccess?: () => void;
  initialView?: 'login' | 'register';
}

export function LoginModal({
  open,
  onClose,
  onSuccess,
  initialView = 'login',
}: LoginModalProps) {
  const { signIn, sendMagicLink } = useAuth();

  const [view, setView] = useState<View>(initialView);
  const [activeTab, setActiveTab] = useState<Tab>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLegacyResetHint, setShowLegacyResetHint] = useState(false);
  const [adminOtpEmail, setAdminOtpEmail] = useState('');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (open) {
      timeoutId = setTimeout(() => setView(initialView), 0);
      return () => clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      setView(initialView);
      setActiveTab('email');
      setError('');
      setEmail('');
      setPassword('');
      setMagicEmail('');
      setShowLegacyResetHint(false);
      setAdminOtpEmail('');
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [initialView, open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const clear = () => {
    setError('');
    setShowLegacyResetHint(false);
  };

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
      setShowLegacyResetHint(true);
      return;
    }
    if (result.requiresAdminOtp) {
      setAdminOtpEmail(result.adminOtpEmail || email);
      setView('admin-otp');
      return;
    }
    if (result.requiresPasswordReset) {
      window.location.href = '/account/set-password';
      return;
    }
    onSuccess?.();
    onClose();
  }

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
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          overflowY: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to PureVedicGems"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            minHeight: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              borderRadius: 'clamp(12px, 2vw, 16px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)',
              background: 'var(--pvg-bg, #FDF7EE)',
              border: '1px solid var(--pvg-border, rgba(61,43,31,0.12))',
              isolation: 'isolate',
            }}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80"
              style={{
                background: 'var(--pvg-bg-alt, #F4EADB)',
                color: 'var(--pvg-muted, #7A6250)',
              }}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-5 sm:p-7">
              {view === 'register' && (
                <RegisterForm
                  onSuccess={handleRegisterSuccess}
                  onSwitchToLogin={() => setView('login')}
                />
              )}

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
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: 'var(--pvg-muted)' }}
                    >
                      We&apos;ve sent a verification link to your email. Please click it to
                      activate your account.
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
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: 'var(--pvg-muted)' }}
                    >
                      A magic sign-in link has been sent to{' '}
                      <strong style={{ color: 'var(--pvg-text)' }}>{magicEmail}</strong>. Click
                      the link to sign in instantly.
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

              {view === 'admin-otp' && (
                <AdminOtpForm
                  emailLabel={adminOtpEmail || 'your email'}
                  onBack={() => {
                    setView('login');
                    setAdminOtpEmail('');
                    clear();
                  }}
                  onVerified={(redirectTo) => {
                    onClose();
                    window.location.href = redirectTo;
                  }}
                />
              )}

              {view === 'login' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-heading text-2xl" style={{ color: 'var(--pvg-primary)' }}>
                      Welcome Back
                    </h2>
                    <p className="mt-1 text-sm" style={{ color: 'var(--pvg-muted)' }}>
                      Sign in to your PureVedicGems account
                    </p>
                  </div>

                  <div
                    className="flex rounded-lg p-1"
                    style={{ background: 'var(--pvg-bg-alt)' }}
                    role="tablist"
                  >
                    {(
                      [
                        { id: 'email' as Tab, label: 'Email', icon: Mail },
                        { id: 'google' as Tab, label: 'Google', icon: GoogleIcon },
                        { id: 'magic' as Tab, label: 'Magic Link', icon: Sparkles },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={activeTab === id}
                        onClick={() => {
                          setActiveTab(id);
                          clear();
                        }}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all',
                          activeTab === id ? 'shadow-sm' : 'opacity-60 hover:opacity-80'
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
                            onChange={(e) => {
                              setEmail(e.target.value);
                              clear();
                            }}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                            style={{
                              borderColor: 'var(--pvg-border)',
                              background: 'var(--pvg-surface)',
                              color: 'var(--pvg-text)',
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = 'var(--pvg-border)')
                            }
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
                          <Lock
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                            style={{ color: 'var(--pvg-muted)' }}
                          />
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              clear();
                            }}
                            placeholder="Your password"
                            autoComplete="current-password"
                            required
                            className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-all"
                            style={{
                              borderColor: 'var(--pvg-border)',
                              background: 'var(--pvg-surface)',
                              color: 'var(--pvg-text)',
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = 'var(--pvg-border)')
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
                      </div>

                      {error && <p className="text-sm text-red-500">{error}</p>}

                      {showLegacyResetHint && (
                        <a
                          href="/account/forgot-password"
                          className="block rounded-lg border px-4 py-3 text-sm transition-all hover:-translate-y-0.5"
                          style={{
                            borderColor: 'var(--pvg-accent)',
                            background: 'var(--pvg-gold-light)',
                            color: 'var(--pvg-primary)',
                          }}
                        >
                          <strong>Account moved from our old site?</strong> Set a new password to
                          activate it →
                        </a>
                      )}

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

                  {activeTab === 'google' && (
                    <div className="space-y-4">
                      <p className="text-center text-sm" style={{ color: 'var(--pvg-muted)' }}>
                        Sign in or create an account with Google — one tap, no password.
                      </p>
                      {error && <p className="text-center text-sm text-red-500">{error}</p>}
                      <GoogleAuthButton
                        label="Continue with Google"
                        onError={setError}
                      />
                    </div>
                  )}

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
                            onChange={(e) => {
                              setMagicEmail(e.target.value);
                              clear();
                            }}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                            style={{
                              borderColor: 'var(--pvg-border)',
                              background: 'var(--pvg-surface)',
                              color: 'var(--pvg-text)',
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = 'var(--pvg-accent)')
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = 'var(--pvg-border)')
                            }
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

                  <button
                    onClick={() => {
                      setView('register');
                      clear();
                    }}
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

            <div
              className="rounded-b-2xl px-5 sm:px-7 py-3 text-center text-[11px] uppercase tracking-[2px]"
              style={{
                background: 'var(--pvg-primary, #3D2B1F)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Heritage since 1937 · 87+ Years of Trust
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

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
