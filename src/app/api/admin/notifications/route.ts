import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { NOTIFICATION_TEMPLATE_LIBRARY } from '@/lib/constants/notification-templates';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('notification_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch notification logs' }, { status: 500 });

  return NextResponse.json({ logs: data ?? [], templates: NOTIFICATION_TEMPLATE_LIBRARY, total: count ?? 0, page, limit });
}