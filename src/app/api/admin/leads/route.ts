import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { sanitizeSearchTerm } from '@/lib/utils/search';
import { leadListScope, isLeadManager } from '@/lib/leads/permissions';
import { LEAD_PIPELINE_STAGES } from '@/lib/leads/constants';

type CombinedLead = Record<string, unknown> & {
  id: string;
  created_at: string;
  _type: 'enquiry' | 'consultation';
};

async function fetchLeadSummary(
  admin: ReturnType<typeof createAdminClient>,
  scope: ReturnType<typeof leadListScope>
) {
  const stageCounts = await Promise.all(
    LEAD_PIPELINE_STAGES.map(async (stage) => {
      let q = admin.from('enquiries').select('id', { count: 'exact', head: true }).eq('pipeline_stage', stage);
      if (scope) q = q.eq(scope.column, scope.value);
      const { count } = await q;
      return [stage, count ?? 0] as const;
    })
  );

  let totalQ = admin.from('enquiries').select('id', { count: 'exact', head: true });
  if (scope) totalQ = totalQ.eq(scope.column, scope.value);

  const today = new Date().toISOString().slice(0, 10);
  let followQ = admin
    .from('enquiries')
    .select('id', { count: 'exact', head: true })
    .lte('follow_up_date', today)
    .neq('pipeline_stage', 'closed');
  if (scope) followQ = followQ.eq(scope.column, scope.value);

  let saleQ = admin.from('enquiries').select('id', { count: 'exact', head: true }).eq('sale_close', true);
  if (scope) saleQ = saleQ.eq(scope.column, scope.value);

  const [
    { count: totalEnquiries },
    { count: totalConsultations },
    { count: unassigned },
    { count: needsFollowUp },
    { count: saleClosed },
  ] = await Promise.all([
    totalQ,
    scope
      ? Promise.resolve({ count: 0 })
      : admin.from('consultations').select('id', { count: 'exact', head: true }),
    scope
      ? Promise.resolve({ count: 0 })
      : admin.from('enquiries').select('id', { count: 'exact', head: true }).is('assigned_to', null).neq('pipeline_stage', 'closed'),
    followQ,
    saleQ,
  ]);

  const byStage = Object.fromEntries(stageCounts) as Record<string, number>;

  return {
    totalEnquiries: totalEnquiries ?? 0,
    totalConsultations: totalConsultations ?? 0,
    total: (totalEnquiries ?? 0) + (totalConsultations ?? 0),
    unassigned: unassigned ?? 0,
    needsFollowUp: needsFollowUp ?? 0,
    saleClosed: saleClosed ?? 0,
    newEnquiries: byStage.new ?? 0,
    verifying: byStage.verifying ?? 0,
    verified: byStage.verified ?? 0,
    withAstrologer: byStage.with_astrologer ?? 0,
    remediesReady: byStage.remedies_ready ?? 0,
    byStage,
  };
}

function applyEnquiryFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  opts: {
    scope: ReturnType<typeof leadListScope>;
    status: string | null;
    pipeline: string | null;
    assignedTo: string | null;
    astrologerId: string | null;
    source: string | null;
    remark: string | null;
    enquiryType: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    followUp: string | null;
    unassigned: boolean;
    saleClose: string | null;
    paymentReceived: string | null;
    detailsConfirmed: string | null;
    searchTerm: string | null;
  }
) {
  let q = query;
  if (opts.scope) q = q.eq(opts.scope.column, opts.scope.value);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.pipeline) q = q.eq('pipeline_stage', opts.pipeline);
  if (!opts.scope && opts.assignedTo) q = q.eq('assigned_to', opts.assignedTo);
  if (!opts.scope && opts.astrologerId) q = q.eq('astrologer_id', opts.astrologerId);
  if (opts.source) q = q.eq('source', opts.source);
  if (opts.remark) q = q.eq('last_remark_code', opts.remark);
  if (opts.enquiryType) q = q.ilike('enquiry_type', `%${sanitizeSearchTerm(opts.enquiryType)}%`);
  if (opts.dateFrom) q = q.gte('created_at', `${opts.dateFrom}T00:00:00.000Z`);
  if (opts.dateTo) q = q.lte('created_at', `${opts.dateTo}T23:59:59.999Z`);
  if (opts.unassigned) q = q.is('assigned_to', null);
  if (opts.saleClose === '1') q = q.eq('sale_close', true);
  if (opts.saleClose === '0') q = q.or('sale_close.is.null,sale_close.eq.false');
  if (opts.paymentReceived === '1') q = q.eq('payment_received', true);
  if (opts.paymentReceived === '0') q = q.eq('payment_received', false);
  if (opts.detailsConfirmed === '1') q = q.eq('details_confirmed', true);
  if (opts.detailsConfirmed === '0') q = q.eq('details_confirmed', false);
  if (opts.followUp === 'overdue') {
    const today = new Date().toISOString().slice(0, 10);
    q = q.lte('follow_up_date', today).neq('pipeline_stage', 'closed');
  } else if (opts.followUp === 'today') {
    q = q.eq('follow_up_date', new Date().toISOString().slice(0, 10));
  } else if (opts.followUp === 'upcoming') {
    q = q.gt('follow_up_date', new Date().toISOString().slice(0, 10));
  }
  if (opts.searchTerm) {
    q = q.or(
      `name.ilike.${opts.searchTerm},email.ilike.${opts.searchTerm},phone.ilike.${opts.searchTerm},subject.ilike.${opts.searchTerm},ip_location.ilike.${opts.searchTerm},birth_place.ilike.${opts.searchTerm},astrologer_name.ilike.${opts.searchTerm}`
    );
  }
  return q;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'enquiry';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25')));
  const offset = (page - 1) * perPage;

  const admin = createAdminClient();
  const scope = leadListScope(auth.member.normalizedRole, auth.user.id);
  const searchTerm = searchParams.get('search')?.trim()
    ? `%${sanitizeSearchTerm(searchParams.get('search')!.trim())}%`
    : null;

  const filterOpts = {
    scope,
    status: searchParams.get('status'),
    pipeline: searchParams.get('pipeline'),
    assignedTo: searchParams.get('assigned_to'),
    astrologerId: searchParams.get('astrologer_id'),
    source: searchParams.get('source'),
    remark: searchParams.get('remark'),
    enquiryType: searchParams.get('enquiry_type'),
    dateFrom: searchParams.get('date_from'),
    dateTo: searchParams.get('date_to'),
    followUp: searchParams.get('follow_up'),
    unassigned: searchParams.get('unassigned') === '1',
    saleClose: searchParams.get('sale_close'),
    paymentReceived: searchParams.get('payment_received'),
    detailsConfirmed: searchParams.get('details_confirmed'),
    searchTerm,
  };

  const summary = await fetchLeadSummary(admin, scope);
  const capabilities = {
    canAssign: isLeadManager(auth.member.normalizedRole),
    canForwardAstrologer: isLeadManager(auth.member.normalizedRole),
    canEditRemedies:
      isLeadManager(auth.member.normalizedRole) || auth.member.normalizedRole === 'astrologer',
    canSendToTelecaller: isLeadManager(auth.member.normalizedRole),
    role: auth.member.normalizedRole,
    scoped: Boolean(scope),
  };

  // Scoped roles always see enquiry CRM only
  if (scope || type === 'enquiry') {
    let query = applyEnquiryFilters(
      admin.from('enquiries').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
      filterOpts
    );
    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch enquiries', detail: error.message }, { status: 500 });
    }
    return NextResponse.json({
      leads: (data ?? []).map((lead: Record<string, unknown>) => ({ ...lead, _type: 'enquiry' as const })),
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
      summary,
      role: auth.member.normalizedRole,
      capabilities,
    });
  }

  if (type === 'consultation') {
    let query = admin.from('consultations').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (filterOpts.status) query = query.eq('status', filterOpts.status);
    if (filterOpts.dateFrom) query = query.gte('created_at', `${filterOpts.dateFrom}T00:00:00.000Z`);
    if (filterOpts.dateTo) query = query.lte('created_at', `${filterOpts.dateTo}T23:59:59.999Z`);
    if (searchTerm) {
      query = query.or(
        `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},plan_title_snapshot.ilike.${searchTerm}`
      );
    }
    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
    return NextResponse.json({
      leads: (data ?? []).map((lead) => ({ ...lead, _type: 'consultation' as const })),
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
      summary,
      role: auth.member.normalizedRole,
      capabilities,
    });
  }

  // Combined (all)
  const fetchLimit = offset + perPage;
  let enquiryQuery = applyEnquiryFilters(
    admin.from('enquiries').select('*').order('created_at', { ascending: false }).limit(fetchLimit),
    filterOpts
  );
  let consultationQuery = admin.from('consultations').select('*').order('created_at', { ascending: false }).limit(fetchLimit);
  if (filterOpts.status) consultationQuery = consultationQuery.eq('status', filterOpts.status);
  if (filterOpts.dateFrom) consultationQuery = consultationQuery.gte('created_at', `${filterOpts.dateFrom}T00:00:00.000Z`);
  if (filterOpts.dateTo) consultationQuery = consultationQuery.lte('created_at', `${filterOpts.dateTo}T23:59:59.999Z`);
  if (searchTerm) {
    consultationQuery = consultationQuery.or(
      `full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},plan_title_snapshot.ilike.${searchTerm}`
    );
  }

  const [{ data: enquiries }, { data: consultations }] = await Promise.all([enquiryQuery, consultationQuery]);
  const combined: CombinedLead[] = [
    ...((enquiries ?? []) as Record<string, unknown>[]).map(
      (lead) => ({ ...lead, _type: 'enquiry' as const }) as CombinedLead
    ),
    ...((consultations ?? []) as Record<string, unknown>[]).map(
      (lead) => ({ ...lead, _type: 'consultation' as const }) as CombinedLead
    ),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    leads: combined.slice(offset, offset + perPage),
    total: summary.total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(summary.total / perPage),
    summary,
    role: auth.member.normalizedRole,
    capabilities,
  });
}
