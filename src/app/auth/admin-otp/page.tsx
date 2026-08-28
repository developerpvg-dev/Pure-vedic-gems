'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminOtpForm } from '@/components/auth/AdminOtpForm';

function AdminOtpContent() {
  const searchParams = useSearchParams();
  const [emailLabel, setEmailLabel] = useState('');
  const [otpMode, setOtpMode] = useState<'email' | 'fixed'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get('error') === 'send_failed') {
      setError('Could not send the verification email. Try signing in again.');
      setLoading(false);
      return;
    }

    void (async () => {
      const res = await fetch('/api/auth/admin-mfa/challenge', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok || !data.pending) {
        setError('Verification expired. Please sign in again.');
        return;
      }
      setEmailLabel(data.email || 'your email');
      setOtpMode(data.mode === 'fixed' ? 'fixed' : 'email');
    })();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div
        className="rounded-2xl border p-6 shadow-lg sm:p-8"
        style={{
          background: 'var(--pvg-bg, #FDF7EE)',
          borderColor: 'var(--pvg-border, rgba(61,43,31,0.12))',
        }}
      >
        {error ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <a
              href="/?auth=login"
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--pvg-primary, #3D2B1F)' }}
            >
              Sign in again
            </a>
          </div>
        ) : (
          <AdminOtpForm
            emailLabel={emailLabel}
            mode={otpMode}
            onVerified={(redirectTo) => {
              window.location.href = redirectTo;
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function AdminOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
        </div>
      }
    >
      <AdminOtpContent />
    </Suspense>
  );
}
