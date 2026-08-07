import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAdminMfaCookies } from '@/lib/admin/mfa';

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const res = NextResponse.json({ success: true });
  clearAdminMfaCookies(res);
  return res;
}
