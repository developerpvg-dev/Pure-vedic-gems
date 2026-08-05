import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  return NextResponse.redirect(`${origin}${next}`);
}
