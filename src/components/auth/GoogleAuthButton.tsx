'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { GoogleIcon } from './GoogleIcon';

interface GoogleAuthButtonProps {
  label?: string;
  onError?: (message: string) => void;
  className?: string;
}

export function GoogleAuthButton({
  label = 'Continue with Google',
  onError,
  className = '',
}: GoogleAuthButtonProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setLoading(false);
      onError?.(result.error);
    }
    // On success the browser navigates away to Google.
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      style={{
        borderColor: 'var(--pvg-border)',
        background: 'var(--pvg-surface)',
        color: 'var(--pvg-text)',
      }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="h-4 w-4 shrink-0" />
      )}
      {label}
    </button>
  );
}
