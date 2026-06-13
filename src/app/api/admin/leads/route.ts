import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { sanitizeSearchTerm } from '@/lib/utils/search';

type CombinedLead = (Record<string, unknown> & { id: string; created_at: string; _type: 'enquiry' | 'consultation' });

function cleanSearch(value: string) {
  return sanitizeSearchTerm(value);
}

async function fetchLeadSummary(admin: ReturnType<typeof createAdminClient>) {
  const [
    { count: totalEnquiries },
    { count: totalConsultations },
    { count: newEnquiries },
    { count: pendingConsultations },
    { count: completedConsultations },
  ] = await Promise.all([
    admin.from('enquiries').select('id', { count: 'exact', head: true }),
    admin.from('consultations').select('id', { count: 'exact', head: true }),
    admin.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('consultations').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_payment']),
    admin.from('consultations').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return {
    totalEnquiries: totalEnquiries ?? 0,
    totalConsultations: totalConsultations ?? 0,
    total: (totalEnquiries ?? 0) + (totalConsultations ?? 0),
    newEnquiries: newEnquiries ?? 0,
    pendingConsultations: pendingConsultations ?? 0,
    completedConsultations: completedConsultations ?? 0,
  };
}

// GET: list enquiries + consultations (paginated combined leads)
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || '20')));
  const offset = (page - 1) * perPage;

  const admin = createAdminClient();
  const searchTerm = search ? `%${cleanSearch(search)}%` : null;
  const summary = await fetchLeadSummary(admin);

  if (type === 'enquiry') {
    let query = admin.from('enquiries').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (searchTerm) query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},subject.ilike.${searchTerm}`);
    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
    const leads = (data ?? []).map((lead) => ({ ...lead, _type: 'enquiry' as const }));
    return NextResponse.json({
      leads,
      enquiries: leads,
      consultations: [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
      summary,
    });
  }

  if (type === 'consultation') {
    let query = admin.from('consultations').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (searchTerm) query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},plan_title_snapshot.ilike.${searchTerm}`);
    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
    const leads = (data ?? []).map((lead) => ({ ...lead, _type: 'consultation' as const }));
    return NextResponse.json({
      leads,
      enquiries: [],
      consultations: leads,
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
      summary,
    });
  }

  // Combined view: fetch enough rows from each source to merge-sort the current page
  const fetchLimit = offset + perPage;
  let enquiryQuery = admin.from('enquiries').select('*').order('created_at', { ascending: false }).limit(fetchLimit);
  let consultationQuery = admin.from('consultations').select('*').order('created_at', { ascending: false }).limit(fetchLimit);

  if (status) {
    enquiryQuery = enquiryQuery.eq('status', status);
    consultationQuery = consultationQuery.eq('status', status);
  }
  if (searchTerm) {
    enquiryQuery = enquiryQuery.or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},subject.ilike.${searchTerm}`);
    consultationQuery = consultationQuery.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},plan_title_snapshot.ilike.${searchTerm}`);
  }

  const [{ data: enquiries }, { data: consultations }] = await Promise.all([enquiryQuery, consultationQuery]);
  const combined: CombinedLead[] = [
    ...(enquiries ?? []).map((lead) => ({ ...(lead as Record<string, unknown>), _type: 'enquiry' as const } as CombinedLead)),
    ...(consultations ?? []).map((lead) => ({ ...(lead as Record<string, unknown>), _type: 'consultation' as const } as CombinedLead)),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const leads = combined.slice(offset, offset + perPage);

  return NextResponse.json({
    leads,
    enquiries: leads.filter((lead) => lead._type === 'enquiry'),
    consultations: leads.filter((lead) => lead._type === 'consultation'),
    total: summary.total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(summary.total / perPage),
    summary,
  });
}
