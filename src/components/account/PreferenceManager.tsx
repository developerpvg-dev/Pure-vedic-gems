'use client';

import { useState } from 'react';
import { Bell, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationPreferences } from '@/lib/customer/notification-preferences';

const OPTIONS: Array<{ key: keyof NotificationPreferences; label: string; help: string }> = [
  { key: 'email_order_updates', label: 'Email order updates', help: 'Confirmation, tracking, and delivery messages.' },
  { key: 'email_review_requests', label: 'Email review requests', help: 'Delivered order review reminders only.' },
  { key: 'email_guides', label: 'Wearing and care guides', help: 'Post-purchase care and energization guidance.' },
  { key: 'email_offers', label: 'Offers by email', help: 'Optional marketing messages and seasonal campaigns.' },
  { key: 'whatsapp_order_updates', label: 'WhatsApp order updates', help: 'Transactional updates on WhatsApp.' },
  { key: 'whatsapp_consultation', label: 'WhatsApp consultation updates', help: 'Consultation reminders and schedule changes.' },
  { key: 'wishlist_price_drop', label: 'Saved gem price alerts', help: 'Only if the saved item changes price.' },
  { key: 'wishlist_back_in_stock', label: 'Back-in-stock alerts', help: 'Only for saved gems you asked to watch.' },
  { key: 'consent_marketing', label: 'Marketing consent', help: 'Required before offers or re-engagement automation.' },
];

export function PreferenceManager({ initialPreferences }: { initialPreferences: NotificationPreferences }) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);

  async function save(nextPreferences: NotificationPreferences) {
    setPreferences(nextPreferences);
    setIsSaving(true);
    const response = await fetch('/api/account/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextPreferences),
    }).catch(() => null);
    setIsSaving(false);

    if (!response?.ok) {
      toast.error('Could not update preferences');
      setPreferences(preferences);
      return;
    }

    const data = await response.json().catch(() => null) as { preferences?: NotificationPreferences } | null;
    if (data?.preferences) setPreferences(data.preferences);
    toast.success('Preferences updated');
  }

  return (
    <div className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold-light text-[var(--pvg-accent)]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-heading text-xl text-[var(--pvg-primary)]">Notification Preferences</h2>
            <p className="mt-1 text-sm text-[var(--pvg-muted)]">Consent-aware email and WhatsApp automation controls.</p>
          </div>
        </div>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-[var(--pvg-accent)]" />}
      </div>

      <div className="divide-y divide-[var(--pvg-border)]">
        {OPTIONS.map((option) => {
          const value = Boolean(preferences[option.key]);
          return (
            <label key={option.key} className="flex cursor-pointer items-start justify-between gap-4 py-4">
              <span>
                <span className="block text-sm font-semibold text-[var(--pvg-primary)]">{option.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-[var(--pvg-muted)]">{option.help}</span>
              </span>
              <input
                type="checkbox"
                checked={value}
                onChange={(event) => {
                  const now = new Date().toISOString();
                  void save({
                    ...preferences,
                    [option.key]: event.target.checked,
                    consent_updated_at: option.key === 'consent_marketing' ? now : preferences.consent_updated_at ?? now,
                  });
                }}
                className="mt-1 h-5 w-5 rounded border-[var(--pvg-border)] accent-[var(--pvg-accent)]"
              />
            </label>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Transactional messages remain available for orders, payments, safety, and account security. Marketing and wishlist nudges require explicit consent.</p>
        </div>
      </div>
    </div>
  );
}