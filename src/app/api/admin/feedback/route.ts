import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const status = request.nextUrl.searchParams.get('status');
  const admin = createAdminClient();
  let query = admin
    .from('feedback_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: 'Failed to load feedback' }, { status: 500 });
  return NextResponse.json({ feedback: data ?? [] });
}
