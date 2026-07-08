import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SetPasswordForm } from '@/components/auth/SetPasswordForm';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Set Your Password | PureVedicGems',
  description: 'Set a new password to activate your migrated account.',
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/shop?auth=login&next=/account/set-password');
  }

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('requires_password_reset, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const next = (await searchParams).next ?? '/account';
  const safeNext = next.startsWith('/account') ? next : '/account';

  return (
    <div className="pvg-account-stack" style={{ maxWidth: 520, margin: '0 auto' }}>
      <AccountPageHeader
        centered
        eyebrow="Account migrated from our old site"
        title="Set a new password"
        subtitle="Your account was moved from our previous WordPress store. Please choose a new password to activate your dashboard, order history, and rewards."
      />
      <SetPasswordForm
        defaultName={profile?.full_name ?? undefined}
        defaultEmail={profile?.email ?? user.email ?? undefined}
        next={safeNext}
      />
    </div>
  );
}
