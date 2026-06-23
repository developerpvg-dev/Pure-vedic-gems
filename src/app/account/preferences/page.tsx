import { redirect } from 'next/navigation';
import { Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PreferenceManager } from '@/components/account/PreferenceManager';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { DEFAULT_NOTIFICATION_PREFERENCES, parseNotificationPreferences } from '@/lib/customer/notification-preferences';

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
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="Preferences"
        subtitle="Control order messages, review reminders, wishlist nudges, and marketing consent from one place."
      />
      <PreferenceManager initialPreferences={initialPreferences} />
      <div className="pvg-account-card pvg-account-card-pad text-sm leading-relaxed text-[#5a5043]">
        <div className="flex gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#b8861e]" aria-hidden="true" />
          <p>Account security roadmap: phone verification, device/session review, recovery email checks, and high-value order manual verification remain visible here as the approved security policy expands.</p>
        </div>
      </div>
    </div>
  );
}
