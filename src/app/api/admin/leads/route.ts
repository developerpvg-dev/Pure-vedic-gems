import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const adminDb = createAdminClient();
  const { data: member } = await adminDb
    .from('team_members')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  const m = member as { role: string; is_active: boolean } | null;
  if (!m?.is_active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, role: m.role };
}

// GET: list all enquiries + consultations (combined leads)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'enquiry' | 'consultation' | null (both)
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')));
  const offset = (page - 1) * perPage;

  const admin = createAdminClient();
  const results: { enquiries?: unknown[]; consultations?: unknown[]; total: number } = { total: 0 };

  // Fetch enquiries
  if (!type || type === 'enquiry') {
    let query = admin
      .from('enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    query = query.range(offset, offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('Leads enquiries error:', error);
      return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
    }
    results.enquiries = data || [];
    results.total += count || 0;
  }

  // Fetch consultations
  if (!type || type === 'consultation') {
    let query = admin
      .from('consultations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type === 'consultation') {
      query = query.range(offset, offset + perPage - 1);
    } else {
      // When fetching both, limit consultations too
      query = query.range(0, perPage - 1);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error('Leads consultations error:', error);
      return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
    }
    results.consultations = data || [];
    results.total += count || 0;
  }

  return NextResponse.json({ ...results, page, per_page: perPage });
}
