import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logCustomerActivity } from '@/lib/customers/activity';

// Clears the legacy `requires_password_reset` flag after a migrated customer
// successfully sets a new password. The password itself is updated client-side
// via supabase.auth.updateUser — this route only finalises the profile flag so
// the proxy/layout stops redirecting them to /account/set-password.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: profile, error: profileError } = await admin
    .from('customer_profiles')
    .update({
      requires_password_reset: false,
      password_reset_at: now,
    })
    .eq('id', user.id)
    .select('requires_password_reset, password_reset_at')
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: 'Could not finalize your password reset. Please try again.' },
      { status: 500 }
    );
  }

  void logCustomerActivity({
    customerId: user.id,
    eventType: 'password_reset',
    title: 'Password set (legacy migration)',
    subtitle: user.email ?? 'Migrated account activated',
    metadata: { source: 'legacy_first_login_reset' },
  });

  return NextResponse.json({ success: true, profile });
}
