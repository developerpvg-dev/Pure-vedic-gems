'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';
import { TAX_POLICY_VERSION } from '@/lib/utils/tax';

const COOKIE_NAME = 'pvg_cookie_consent';
const MAX_AGE = 60 * 60 * 24 * 180;

function readConsent() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeConsent(value: 'accepted' | 'essential') {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent('pvg:consent-updated'));
}

function subscribe(callback: () => void) {
  window.addEventListener('pvg:consent-updated', callback);
  return () => window.removeEventListener('pvg:consent-updated', callback);
}

function getSnapshot() {
  return readConsent() ?? '';
}

function getServerSnapshot() {
  return 'server';
}

async function recordConsent(status: 'granted' | 'denied') {
  await fetch('/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consent_type: 'cookie_analytics',
      status,
      policy_version: TAX_POLICY_VERSION,
      source: 'cookie_banner',
      metadata: { banner_version: 'week12' },
    }),
  }).catch(() => undefined);
}

export function CookieConsentBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const visible = consent === '';

  if (!visible) return null;

  const choose = (value: 'accepted' | 'essential') => {
    writeConsent(value);
    void recordConsent(value === 'accepted' ? 'granted' : 'denied');
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[1200] mx-auto max-w-4xl rounded-2xl border border-[var(--pvg-border)] bg-background p-4 shadow-2xl md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-primary">Privacy choices</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              We use essential cookies for cart, checkout, account security, and fraud prevention. Analytics cookies help us improve search, product discovery, and checkout quality only with your consent.
            </p>
            <Link href="/policies/privacy" className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">
              Read Privacy Policy
            </Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => choose('essential')}
            className="rounded-full border border-[var(--pvg-border)] px-4 py-2 text-xs font-semibold text-primary hover:bg-secondary"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:opacity-90"
          >
            Accept analytics
          </button>
          <button
            type="button"
            onClick={() => choose('essential')}
            className="rounded-full p-2 text-muted-foreground hover:bg-secondary"
            aria-label="Close cookie notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}