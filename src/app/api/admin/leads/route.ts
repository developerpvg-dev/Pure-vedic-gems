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

type CombinedLead = (Record<string, unknown> & { id: string; created_at: string; _type: 'enquiry' | 'consultation' });

function cleanSearch(value: string) {
  return value.replace(/[%,]/g, ' ').trim();
}

// GET: list enquiries + consultations (paginated combined leads)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'enquiry' | 'consultation' | null (both)
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')));
  const offset = (page - 1) * perPage;

  const admin = createAdminClient();
  const results: { enquiries?: unknown[]; consultations?: unknown[]; leads?: CombinedLead[]; total: number } = { total: 0 };
  const searchTerm = search ? `%${cleanSearch(search)}%` : null;

  if (!type || type === 'enquiry') {
    let query = admin
      .from('enquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (searchTerm) query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},subject.ilike.${searchTerm}`);
    query = query.range(type === 'enquiry' ? offset : 0, type === 'enquiry' ? offset + perPage - 1 : offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('Leads enquiries error:', error);
      return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
    }
    results.enquiries = data || [];
    results.total += count || 0;
  }

  if (!type || type === 'consultation') {
    let query = admin
      .from('consultations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (searchTerm) query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},plan_title_snapshot.ilike.${searchTerm}`);
    query = query.range(type === 'consultation' ? offset : 0, type === 'consultation' ? offset + perPage - 1 : offset + perPage - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('Leads consultations error:', error);
      return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
    }
    results.consultations = data || [];
    results.total += count || 0;
  }

  const combined: CombinedLead[] = [
    ...(results.enquiries ?? []).map((lead) => ({ ...(lead as Record<string, unknown>), _type: 'enquiry' as const } as CombinedLead)),
    ...(results.consultations ?? []).map((lead) => ({ ...(lead as Record<string, unknown>), _type: 'consultation' as const } as CombinedLead)),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  results.leads = type ? combined : combined.slice(offset, offset + perPage);
  results.enquiries = results.leads.filter((lead) => lead._type === 'enquiry');
  results.consultations = results.leads.filter((lead) => lead._type === 'consultation');

  return NextResponse.json({
    ...results,
    page,
    per_page: perPage,
    total_pages: Math.ceil(results.total / perPage),
  });
}
