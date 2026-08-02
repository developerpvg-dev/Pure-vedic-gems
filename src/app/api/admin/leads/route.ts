import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { sanitizeSearchTerm } from '@/lib/utils/search';
import { leadListScope, isLeadManager, redactLeadContactForRole } from '@/lib/leads/permissions';
import { LEAD_PIPELINE_STAGES, TELECOM_ACTIVE_STAGES, ASTRO_ACTIVE_STAGES } from '@/lib/leads/constants';
import { mergeBirthFields, needsBirthHydration } from '@/lib/leads/hydrate';
import { attachDuplicateHints } from '@/lib/leads/duplicates';
import { ensureLeadFromConsultation } from '@/lib/leads/from-consultation';
import type { Consultation } from '@/lib/types/database';

// ponytail: hard cap — raise or page if managers regularly export >5k filtered rows
const LEADS_EXPORT_LIMIT = 5000;

function toLeadExportRows(
  rows: Record<string, unknown>[],
  telecallerNames: Map<string, string>
) {
  return rows.map((r) => ({
    Lead: r.lead_number ?? '',
    Name: r.name ?? '',
    Email: r.email ?? '',
    Phone: r.phone ?? '',
    Kind: r.enquiry_type ?? '',
    Stage: r.pipeline_stage ?? '',
    Status: r.status ?? '',
    Source: r.source ?? '',
    Telecaller: (r.assigned_to && telecallerNames.get(r.assigned_to as string)) || '',
    Astrologer: r.astrologer_name ?? '',
    'Last remark': r.last_remark_code ?? '',
    Conversion: r.conversion_status ?? '',
    'Conversion note': r.conversion_reason_note ?? '',
    'Order #': r.order_number ?? '',
    DOB: r.date_of_birth ?? '',
    'Birth time': r.birth_time ?? '',
    'Birth place': r.birth_place ?? '',
    City: r.customer_city ?? '',
    State: r.customer_state ?? '',
    Country: r.customer_country ?? '',
    Concern: r.area_of_concern ?? '',
    'Follow-up': r.follow_up_date ?? '',
    'Sale closed': r.sale_close ? 'yes' : '',
    'Payment received': r.payment_received ? 'yes' : '',
    'Closed reason': r.closed_reason ?? '',
    Created: r.created_at ?? '',
  }));
}

type CombinedLead = Record<string, unknown> & {
  id: string;
  created_at: string;
  _type: 'enquiry' | 'consultation';
};

function presentLeadForRole(role: string | null | undefined, lead: Record<string, unknown>) {
  return redactLeadContactForRole(role, lead);
}

function applyKindFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q: any,
  enquiryType: string | null
) {
  if (!enquiryType) return q;
  if (enquiryType === 'remedies' || enquiryType === 'Remedies Recommendation') {
    // Quote spaced values — bare spaces break PostgREST .or() parsing
    return q.or(
      [
        'source.eq.homepage_recommendation',
        'enquiry_type.ilike.%Remedies%',
        'enquiry_type.ilike.%Gemstone%',
        'subject.ilike.%Gemstone%',
        'subject.ilike."%Gem Recommendation%"',
        'subject.ilike.%₹101%',
      ].join(',')
    );
  }
  if (enquiryType === 'consultation' || enquiryType === 'Consultation') {
    return q.or(
      [
        'source.eq.consultation_page',
        'enquiry_type.ilike.%Consultation%',
        'subject.ilike.%consultation%',
      ].join(',')
    );
  }
  if (enquiryType === 'contact' || enquiryType === 'Enquiry') {
    // ponytail: do NOT use %Contact% — it matches "Consultation"
    return q.or(
      [
        'source.eq.contact_form',
        'enquiry_type.eq.Enquiry',
        'enquiry_type.ilike.%Contact enquir%',
        'subject.ilike.%Contact enquir%',
      ].join(',')
    );
  }
  return q.ilike('enquiry_type', `%${sanitizeSearchTerm(enquiryType)}%`);
}

/** Pull paid bookings into CRM when payment ran before week43 / verify missed the insert. */
async function syncPaidConsultationsIntoCrm(admin: ReturnType<typeof createAdminClient>) {
  const { data: paid, error } = await admin
    .from('consultations')
    .select('*')
    .eq('payment_status', 'captured')
    .order('created_at', { ascending: false })
    .limit(60);
  if (error || !paid?.length) return;

  const rows = paid as unknown as Consultation[];
  const ids = rows.map((row) => row.id);
  const { data: linked } = await admin.from('enquiries').select('consultation_id').in('consultation_id', ids);
  const have = new Set((linked ?? []).map((row) => row.consultation_id as string));

  for (const row of rows) {
    if (have.has(row.id)) continue;
    try {
      await ensureLeadFromConsultation(admin, row);
    } catch (err) {
      // ponytail: missing consultation_id column until week43 — don't break the list
      console.error('[Leads] sync consultation→enquiry failed:', err);
      break;
    }
  }
}

async function fetchLeadSummary(
  admin: ReturnType<typeof createAdminClient>,
  scope: ReturnType<typeof leadListScope>,
  enquiryType: string | null
) {
  const withKind = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    q: any
  ) => {
    if (scope) q = q.eq(scope.column, scope.value);
    return applyKindFilter(q, enquiryType);
  };

  const stageCounts = await Promise.all(
    LEAD_PIPELINE_STAGES.map(async (stage) => {
      const { count } = await withKind(
        admin.from('enquiries').select('id', { count: 'exact', head: true }).eq('pipeline_stage', stage)
      );
      return [stage, count ?? 0] as const;
    })
  );

  const byStage = Object.fromEntries(stageCounts) as Record<string, number>;
  const sumStages = (stages: readonly string[]) =>
    stages.reduce((n, s) => n + (byStage[s] ?? 0), 0);

  const activeStages =
    scope?.column === 'assigned_to'
      ? TELECOM_ACTIVE_STAGES
      : scope?.column === 'astrologer_id'
        ? ASTRO_ACTIVE_STAGES
        : LEAD_PIPELINE_STAGES.filter((s) => s !== 'closed');

  const today = new Date().toISOString().slice(0, 10);
  const [
    { count: totalEnquiries },
    { count: unassigned },
    { count: saleClosed },
    { data: recentClosed },
  ] = await Promise.all([
    withKind(admin.from('enquiries').select('id', { count: 'exact', head: true })),
    withKind(
      admin
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .is('assigned_to', null)
        .neq('pipeline_stage', 'closed')
    ),
    withKind(admin.from('enquiries').select('id', { count: 'exact', head: true }).eq('sale_close', true)),
    withKind(
      admin
        .from('enquiries')
        .select('last_remark_code, closed_reason, pipeline_stage, created_at')
        .eq('pipeline_stage', 'closed')
        .order('closed_at', { ascending: false })
        .limit(200)
    ),
  ]);

  // Past-work outcome bars for scoped desks (closed remark codes)
  const pastOutcomes: Record<string, number> = {};
  for (const row of recentClosed ?? []) {
    const key = (row.closed_reason || row.last_remark_code || 'closed') as string;
    pastOutcomes[key] = (pastOutcomes[key] ?? 0) + 1;
  }

  return {
    totalEnquiries: totalEnquiries ?? 0,
    totalConsultations: 0,
    total: totalEnquiries ?? 0,
    activeQueue: sumStages(activeStages),
    pastClosed: byStage.closed ?? 0,
    unassigned: unassigned ?? 0,
    needsFollowUp: byStage.follow_up ?? 0, // legacy; stage removed — kept for older clients
    saleClosed: saleClosed ?? 0,
    newEnquiries: byStage.new ?? 0,
    verifying: byStage.verifying ?? 0,
    verified: byStage.verified ?? 0,
    withAstrologer: byStage.with_astrologer ?? 0,
    remediesReady: byStage.remedies_ready ?? 0,
    deliverRemedies: byStage.sent_to_customer ?? 0,
    remediesExplained: byStage.remedies_explained ?? 0,
    conversion: byStage.conversion ?? 0,
    byStage,
    pastOutcomes,
    asOf: today,
  };
}

function applyEnquiryFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  opts: {
    scope: ReturnType<typeof leadListScope>;
    status: string | null;
    pipeline: string | null;
    pipelineIn: string[] | null;
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
    conversionStatus: string | null;
    searchTerm: string | null;
  }
) {
  let q = query;
  if (opts.scope) q = q.eq(opts.scope.column, opts.scope.value);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.pipeline) q = q.eq('pipeline_stage', opts.pipeline);
  else if (opts.pipelineIn?.length) q = q.in('pipeline_stage', opts.pipelineIn);
  if (!opts.scope && opts.assignedTo) q = q.eq('assigned_to', opts.assignedTo);
  if (!opts.scope && opts.astrologerId) q = q.eq('astrologer_id', opts.astrologerId);
  if (opts.source) q = q.eq('source', opts.source);
  if (opts.remark) q = q.eq('last_remark_code', opts.remark);
  if (opts.conversionStatus === 'converted' || opts.conversionStatus === 'not_converted') {
    q = q.eq('conversion_status', opts.conversionStatus);
  } else if (opts.conversionStatus === 'pending') {
    q = q.in('pipeline_stage', ['conversion', 'remedies_explained']).is('conversion_status', null);
  } else if (opts.conversionStatus === 'none') {
    q = q.is('conversion_status', null);
  }
  q = applyKindFilter(q, opts.enquiryType);
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

function normalizeEnquiryRow(row: Record<string, unknown>): Record<string, unknown> {
  let stage = (row.pipeline_stage as string | null) || 'new';
  // Display-only: explained without outcome shows on Conversion chip
  if (stage === 'remedies_explained' && !row.conversion_status) stage = 'conversion';
  return {
    ...row,
    pipeline_stage: stage,
  };
}

async function hydrateEnquiryLeads(
  admin: ReturnType<typeof createAdminClient>,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const needIds = rows
    .filter((r) => needsBirthHydration(r as { date_of_birth?: string | null }))
    .map((r) => r.id as string)
    .filter(Boolean);

  const recByEnquiry = new Map<
    string,
    { birth_date: string | null; birth_time: string | null; birth_place: string | null; purpose: string | null }
  >();

  if (needIds.length) {
    const { data: recs } = await admin
      .from('recommendation_requests')
      .select('enquiry_id, birth_date, birth_time, birth_place, purpose')
      .in('enquiry_id', needIds);
    for (const rec of recs ?? []) {
      if (rec.enquiry_id) recByEnquiry.set(rec.enquiry_id, rec);
    }
  }

  // Paid ₹101 / consultations: purpose lives on consultations.life_situation
  const consultIds = rows
    .filter((r) => r.consultation_id && !(r.area_of_concern as string | null))
    .map((r) => r.consultation_id as string);
  const lifeByConsult = new Map<string, string>();
  if (consultIds.length) {
    const { data: consults } = await admin
      .from('consultations')
      .select('id, life_situation, date_of_birth, birth_time, birth_place')
      .in('id', consultIds);
    for (const c of consults ?? []) {
      if (c.life_situation) lifeByConsult.set(c.id as string, c.life_situation as string);
      const eid = rows.find((r) => r.consultation_id === c.id)?.id as string | undefined;
      if (!eid) continue;
      const existing = recByEnquiry.get(eid);
      recByEnquiry.set(eid, {
        birth_date: existing?.birth_date || (c.date_of_birth as string | null) || null,
        birth_time: existing?.birth_time || (c.birth_time as string | null) || null,
        birth_place: existing?.birth_place || (c.birth_place as string | null) || null,
        purpose: existing?.purpose || (c.life_situation as string | null) || null,
      });
    }
  }

  const hydrated = rows.map((row) => {
    const id = row.id as string;
    const consultPurpose = row.consultation_id
      ? lifeByConsult.get(row.consultation_id as string) || null
      : null;
    const merged = mergeBirthFields(
      {
        date_of_birth: (row.date_of_birth as string | null) ?? null,
        birth_time: (row.birth_time as string | null) ?? null,
        birth_place: (row.birth_place as string | null) ?? null,
        area_of_concern: (row.area_of_concern as string | null) || consultPurpose,
        enquiry_type: (row.enquiry_type as string | null) ?? null,
        message: (row.message as string | null) ?? null,
        source: (row.source as string | null) ?? null,
      },
      recByEnquiry.get(id) ?? null
    );

    const changed =
      merged.date_of_birth !== ((row.date_of_birth as string | null) ?? null) ||
      merged.birth_time !== ((row.birth_time as string | null) ?? null) ||
      merged.birth_place !== ((row.birth_place as string | null) ?? null) ||
      merged.area_of_concern !== ((row.area_of_concern as string | null) ?? null);

    // Persist any newly filled dossier fields
    if (changed && (merged.date_of_birth || merged.birth_time || merged.birth_place || merged.area_of_concern)) {
      void admin
        .from('enquiries')
        .update({
          date_of_birth: merged.date_of_birth,
          birth_time: merged.birth_time,
          birth_place: merged.birth_place,
          area_of_concern: merged.area_of_concern,
          enquiry_type: merged.enquiry_type || (row.enquiry_type as string | null) || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return { ...row, ...merged };
  });

  return hydrated;
}

async function presentEnquiryLeads(
  admin: ReturnType<typeof createAdminClient>,
  role: string | null | undefined,
  rows: Record<string, unknown>[]
) {
  const hydrated = await hydrateEnquiryLeads(admin, rows);
  const withDupes = await attachDuplicateHints(admin, hydrated as Array<{
    id: string;
    created_at?: string | null;
    lead_number?: number | null;
    date_of_birth?: string | null;
    birth_time?: string | null;
    birth_place?: string | null;
  }>);
  return withDupes.map((lead) =>
    presentLeadForRole(role, { ...lead, _type: 'enquiry' as const })
  );
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

  // ponytail: null pipeline_stage breaks the New filter — normalize once per list load
  await admin.from('enquiries').update({ pipeline_stage: 'new' }).is('pipeline_stage', null);
  // ponytail: retired follow_up stage — fold old rows into verifying / deliver
  await admin
    .from('enquiries')
    .update({ pipeline_stage: 'sent_to_customer' })
    .eq('pipeline_stage', 'follow_up')
    .not('remedies_text', 'is', null);
  await admin.from('enquiries').update({ pipeline_stage: 'verifying' }).eq('pipeline_stage', 'follow_up');
  // ponytail: park post-explain leads on Conversion chip (legacy remedies_explained without outcome)
  await admin
    .from('enquiries')
    .update({ pipeline_stage: 'conversion' })
    .eq('pipeline_stage', 'remedies_explained')
    .is('conversion_status', null);
  // Backfill missing kinds so ₹101 / consultation tabs match existing rows
  await Promise.all([
    admin
      .from('enquiries')
      .update({ enquiry_type: 'Remedies Recommendation' })
      .eq('source', 'homepage_recommendation')
      .is('enquiry_type', null),
    admin
      .from('enquiries')
      .update({ enquiry_type: 'Consultation' })
      .eq('source', 'consultation_page')
      .is('enquiry_type', null),
    admin
      .from('enquiries')
      .update({ enquiry_type: 'Enquiry' })
      .eq('source', 'contact_form')
      .is('enquiry_type', null),
    admin
      .from('enquiries')
      .update({ enquiry_type: 'Remedies Recommendation' })
      .ilike('subject', '%Gemstone Recommendation%')
      .is('enquiry_type', null),
  ]);

  // Managers only: pull captured payments that never got a CRM row
  if (!scope && isLeadManager(auth.member.normalizedRole)) {
    await syncPaidConsultationsIntoCrm(admin);
  }

  const queue = searchParams.get('queue'); // active | past | waiting | all
  const pipelineParam = searchParams.get('pipeline');
  let pipelineIn: string[] | null = null;
  if (!pipelineParam && scope) {
    if (queue === 'past') pipelineIn = ['closed'];
    else if (queue === 'waiting' && scope.column === 'assigned_to') {
      pipelineIn = ['verified', 'with_astrologer', 'remedies_ready', 'remedies_explained'];
    } else if (queue === 'all') {
      pipelineIn = null;
    } else {
      // default active work for scoped roles
      pipelineIn =
        scope.column === 'assigned_to'
          ? [...TELECOM_ACTIVE_STAGES]
          : [...ASTRO_ACTIVE_STAGES];
    }
  }

  const filterOpts = {
    scope,
    status: searchParams.get('status'),
    pipeline: pipelineParam,
    pipelineIn,
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
    conversionStatus: searchParams.get('conversion') || searchParams.get('conversion_status'),
    searchTerm,
  };

  const format = searchParams.get('format');
  if (format === 'xlsx' || format === 'excel') {
    if (!isLeadManager(auth.member.normalizedRole)) {
      return NextResponse.json({ error: 'Only leads managers can export' }, { status: 403 });
    }

    const { data, error } = await applyEnquiryFilters(
      admin.from('enquiries').select('*').order('created_at', { ascending: false }).limit(LEADS_EXPORT_LIMIT),
      filterOpts
    );
    if (error) {
      return NextResponse.json({ error: 'Export failed', detail: error.message }, { status: 500 });
    }

    const rows = ((data ?? []) as Record<string, unknown>[]).map(normalizeEnquiryRow);
    const teleIds = [
      ...new Set(rows.map((r) => r.assigned_to as string | null).filter((id): id is string => Boolean(id))),
    ];
    const telecallerNames = new Map<string, string>();
    if (teleIds.length) {
      const { data: members } = await admin.from('team_members').select('id, name').in('id', teleIds);
      for (const m of members ?? []) telecallerNames.set(m.id as string, (m.name as string) || '');
    }

    const sheet = XLSX.utils.json_to_sheet(toLeadExportRows(rows, telecallerNames));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Leads');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="leads-export-${stamp}.xlsx"`,
      },
    });
  }

  const summary = await fetchLeadSummary(admin, scope, filterOpts.enquiryType);
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
    // Manager inbox: pin New leads on page 1 when no stage filter
    if (!scope && !filterOpts.pipeline && !filterOpts.pipelineIn && page === 1) {
      let newQuery = applyEnquiryFilters(
        admin.from('enquiries').select('*').order('created_at', { ascending: false }),
        { ...filterOpts, pipeline: 'new', pipelineIn: null }
      ).range(0, perPage - 1);

      const { data: newData, error: newError } = await newQuery;
      if (newError) {
        return NextResponse.json({ error: 'Failed to fetch enquiries', detail: newError.message }, { status: 500 });
      }

      const newRows = (newData ?? []) as Record<string, unknown>[];
      const newIds = new Set(newRows.map((r) => r.id as string));
      const remaining = Math.max(0, perPage - newRows.length);

      let otherRows: Record<string, unknown>[] = [];
      if (remaining > 0) {
        let otherQuery = applyEnquiryFilters(
          admin.from('enquiries').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
          filterOpts
        );
        otherQuery = otherQuery.range(0, perPage + newRows.length - 1);
        const { data: otherData, error: otherError, count: otherCount } = await otherQuery;
        if (otherError) {
          return NextResponse.json({ error: 'Failed to fetch enquiries', detail: otherError.message }, { status: 500 });
        }
        otherRows = ((otherData ?? []) as Record<string, unknown>[])
          .filter((r) => {
            const stage = (r.pipeline_stage as string | null) || 'new';
            return stage !== 'new' && !newIds.has(r.id as string);
          })
          .slice(0, remaining);
        const listTotal = otherCount ?? summary.totalEnquiries;
        const merged = [...newRows, ...otherRows].map(normalizeEnquiryRow);
        return NextResponse.json({
          leads: await presentEnquiryLeads(admin, auth.member.normalizedRole, merged),
          total: listTotal,
          page,
          per_page: perPage,
          total_pages: Math.max(1, Math.ceil(listTotal / perPage)),
          summary,
          role: auth.member.normalizedRole,
          capabilities,
        });
      }

      const { count: totalCount } = await applyEnquiryFilters(
        admin.from('enquiries').select('id', { count: 'exact', head: true }),
        filterOpts
      );
      const listTotal = totalCount ?? newRows.length;
      return NextResponse.json({
        leads: await presentEnquiryLeads(admin, auth.member.normalizedRole, newRows.map(normalizeEnquiryRow)),
        total: listTotal,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(listTotal / perPage)),
        summary,
        role: auth.member.normalizedRole,
        capabilities,
      });
    }

    let query = applyEnquiryFilters(
      admin.from('enquiries').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
      filterOpts
    );
    query = query.range(offset, offset + perPage - 1);
    const { data, count, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch enquiries', detail: error.message }, { status: 500 });
    }
    const normalized = ((data ?? []) as Record<string, unknown>[]).map(normalizeEnquiryRow);
    return NextResponse.json({
      leads: await presentEnquiryLeads(admin, auth.member.normalizedRole, normalized),
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
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
      leads: (data ?? []).map((lead) =>
        presentLeadForRole(auth.member.normalizedRole, { ...lead, _type: 'consultation' as const })
      ),
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
      (lead) =>
        presentLeadForRole(auth.member.normalizedRole, {
          ...lead,
          _type: 'enquiry' as const,
        }) as CombinedLead
    ),
    ...((consultations ?? []) as Record<string, unknown>[]).map(
      (lead) =>
        presentLeadForRole(auth.member.normalizedRole, {
          ...lead,
          _type: 'consultation' as const,
        }) as CombinedLead
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
