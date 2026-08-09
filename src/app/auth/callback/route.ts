import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logCustomerActivity } from '@/lib/customers/activity';

function safeNext(next: string | null): string {
  return next?.startsWith('/') && !next.startsWith('//') ? next : '/account';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/?auth=login`);
  }

  const meta = data.user.user_metadata ?? {};
  const fullName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    null;

  // Belt-and-suspenders: email register also upserts; OAuth needs this path.
  await supabase.from('customer_profiles').upsert(
    {
      id: data.user.id,
      email: data.user.email ?? null,
      full_name: fullName,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  );

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('team_members')
    .select('is_active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (member?.is_active) {
    const challenge = new URL(`${origin}/api/auth/admin-mfa/challenge`);
    const adminNext =
      next.startsWith('/admin') || next.startsWith('/studio') ? next : '/admin';
    challenge.searchParams.set('next', adminNext);
    return NextResponse.redirect(challenge);
  }

  void logCustomerActivity({
    customerId: data.user.id,
    eventType: 'login',
    title: 'Logged in',
    subtitle: data.user.email ?? 'OAuth sign-in',
    metadata: { method: 'oauth' },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
