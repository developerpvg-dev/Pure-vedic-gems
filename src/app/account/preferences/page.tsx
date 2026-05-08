import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PreferenceManager } from '@/components/account/PreferenceManager';
import { DEFAULT_NOTIFICATION_PREFERENCES, parseNotificationPreferences } from '@/lib/customer/notification-preferences';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notification Preferences | PureVedicGems',
};

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/preferences');

  const { data: preferencesRow } = await supabase
    .from('customer_preferences')
    .select('notification_preferences')
    .eq('customer_id', user.id)
    .maybeSingle();

  const initialPreferences = preferencesRow
    ? parseNotificationPreferences(preferencesRow.notification_preferences)
    : DEFAULT_NOTIFICATION_PREFERENCES;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-muted hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1 className="font-heading text-3xl text-brand-primary md:text-4xl">Preferences & Consent</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted">Control order messages, review reminders, wishlist nudges, and marketing consent from one place.</p>
        <OrnamentalDivider className="mt-4 max-w-50" />
      </div>
      <PreferenceManager initialPreferences={initialPreferences} />
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 text-sm leading-relaxed text-brand-muted">
        <div className="flex gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
          <p>Account security roadmap: phone verification, device/session review, recovery email checks, and high-value order manual verification remain visible here as the approved security policy expands.</p>
        </div>
      </div>
    </div>
  );
}