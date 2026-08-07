'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Palette, ShieldCheck } from 'lucide-react';

type InviteInfo = {
  email: string;
  name: string;
  roleLabel: string;
  expiresAt: string;
  accountExists: boolean;
};

function AdminJoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token')?.trim() ?? '';

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token. Use the link from your email.');
      setLoading(false);
      return;
    }

    void (async () => {
      const res = await fetch(`/api/admin/team/invite/validate?token=${encodeURIComponent(token)}`);
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Invalid invitation');
        return;
      }
      setInvite({
        email: data.email,
        name: data.name,
        roleLabel: data.roleLabel,
        expiresAt: data.expiresAt,
        accountExists: Boolean(data.accountExists),
      });
    })();
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token || !invite) return;

    if (!invite.accountExists) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!password) {
      setError('Enter your existing account password.');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await fetch('/api/admin/team/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        // password only used when creating a new Auth user; ignored for existing accounts
        password: invite.accountExists ? undefined : password,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitting(false);
      setError(data.error || 'Could not accept invitation');
      return;
    }

    // Same path as site login: password check + team email OTP when needed
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', email: invite.email, password }),
    });
    const loginJson = await loginRes.json().catch(() => ({}));
    setSubmitting(false);

    if (!loginRes.ok) {
      setError(
        typeof loginJson.error === 'string'
          ? loginJson.error
          : invite.accountExists
            ? 'Team access activated, but that password is wrong. Sign in from the homepage with your existing password.'
            : 'Account created. Please sign in from the homepage.',
      );
      router.push('/?auth=login');
      return;
    }

    if (loginJson.requiresAdminOtp) {
      router.push('/auth/admin-otp');
      return;
    }

    router.push(data.redirectTo || '/admin/designer');
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
        <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-600 text-white">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Join Pure Vedic Gems</h1>
              <p className="text-sm text-gray-600">Team invitation — link valid 15 minutes</p>
            </div>
          </div>
        </div>

        {error && !invite ? (
          <div className="p-6">
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          </div>
        ) : invite ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900">{invite.name}</p>
              <p className="text-gray-600">{invite.email}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {invite.roleLabel}
              </p>
              <p className="mt-2 text-[11px] text-gray-500">
                Expires {new Date(invite.expiresAt).toLocaleString('en-IN')}
              </p>
            </div>

            {invite.accountExists ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                An account already exists for this email. Enter your current password — we will not reset it.
              </p>
            ) : null}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {invite.accountExists ? 'Existing password' : 'Create password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={invite.accountExists ? 1 : 8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-amber-500"
                  placeholder={invite.accountExists ? 'Your current password' : 'Min. 8 characters'}
                />
              </div>
            </div>

            {!invite.accountExists ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
                />
              </div>
            ) : null}

            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting
                ? invite.accountExists
                  ? 'Activating…'
                  : 'Creating account…'
                : invite.accountExists
                  ? 'Accept & sign in'
                  : 'Accept & sign in'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminJoinPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>}>
      <AdminJoinContent />
    </Suspense>
  );
}
