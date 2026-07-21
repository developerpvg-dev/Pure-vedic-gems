import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const FULL_SELECT =
  'id, order_number, status, designer_name, assigned_designer_id, design_price, design_due_at, design_routed_at, design_completed_at, design_slip_notes, design_notes, created_at, items, total';

const FULL_SELECT_WITH_SOURCE = `${FULL_SELECT}, order_source`;

// ponytail: week35 columns may not be migrated yet — fall back to week24 designer fields
const LEGACY_SELECT =
  'id, order_number, status, assigned_designer_id, design_routed_at, design_completed_at, design_notes, created_at, items, total';

type DesignJobRow = {
  id: string;
  order_number: string;
  status: string;
  designer_name?: string | null;
  assigned_designer_id: string | null;
  design_price?: number | null;
  design_due_at?: string | null;
  design_routed_at: string | null;
  design_completed_at: string | null;
  design_slip_notes?: string | null;
  design_notes: string | null;
  created_at: string;
  items: unknown;
  total: number;
  order_source?: string | null;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42703' ||
    Boolean(error.message?.includes('does not exist')) ||
    Boolean(error.message?.includes('designer_name')) ||
    Boolean(error.message?.includes('design_price')) ||
    Boolean(error.message?.includes('design_due_at')) ||
    Boolean(error.message?.includes('order_source'))
  );
}

function daysBetween(fromIso: string | null, toIso: string | null) {
  if (!fromIso || !toIso) return null;
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)));
}

function itemSummary(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) return '';
  return items
    .slice(0, 3)
    .map((item) => {
      if (!item || typeof item !== 'object') return '';
      const row = item as { name?: string; configuration_summary?: string };
      return row.configuration_summary || row.name || '';
    })
    .filter(Boolean)
    .join('; ');
}

function toCsv(rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return 'order_number,designer,status,routed,due,returned,days_taken,design_price,items\n';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h] ?? null)).join(','))].join('\n');
}

/**
 * GET /api/admin/design-jobs
 * Track jewelry design assignments: designer, due date, status, completion / return.
 * Query: designer, status, from, to (ISO date), date_field=routed|completed, format=csv
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const designer = searchParams.get('designer')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const from = searchParams.get('from')?.trim() || '';
  const to = searchParams.get('to')?.trim() || '';
  const dateField = searchParams.get('date_field') === 'completed' ? 'completed' : 'routed';
  const format = searchParams.get('format')?.trim() || '';

  const db = asUntypedSupabase(createAdminClient());

  let usedLegacy = false;

  let query = db
    .from('orders')
    .select(FULL_SELECT_WITH_SOURCE)
    .or(
      'designer_name.not.is.null,assigned_designer_id.not.is.null,status.in.(design_assigned,design_in_progress,design_completed)',
    )
    .order('design_due_at', { ascending: true, nullsFirst: false })
    .limit(500);

  if (designer) query = query.ilike('designer_name', `%${designer}%`);
  if (status) query = query.eq('status', status);

  let { data, error } = await query;

  // week40 not applied yet — retry without order_source
  if (error && error.message?.includes('order_source')) {
    let retry = db
      .from('orders')
      .select(FULL_SELECT)
      .or(
        'designer_name.not.is.null,assigned_designer_id.not.is.null,status.in.(design_assigned,design_in_progress,design_completed)',
      )
      .order('design_due_at', { ascending: true, nullsFirst: false })
      .limit(500);
    if (designer) retry = retry.ilike('designer_name', `%${designer}%`);
    if (status) retry = retry.eq('status', status);
    const retryResult = await retry;
    data = retryResult.data;
    error = retryResult.error;
  }

  if (error && isMissingColumnError(error)) {
    usedLegacy = true;
    let legacy = db
      .from('orders')
      .select(LEGACY_SELECT)
      .or(
        'assigned_designer_id.not.is.null,status.in.(design_assigned,design_in_progress,design_completed)',
      )
      .order('design_routed_at', { ascending: false, nullsFirst: false })
      .limit(500);

    if (status) legacy = legacy.eq('status', status);

    const legacyResult = await legacy;
    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error) {
    console.error('[design-jobs]', error);
    return NextResponse.json({ error: 'Failed to load design jobs' }, { status: 500 });
  }

  const jobs = (data ?? []) as DesignJobRow[];

  const portalIds = [
    ...new Set(
      jobs
        .filter((j) => !j.designer_name && j.assigned_designer_id)
        .map((j) => j.assigned_designer_id as string),
    ),
  ];
  const nameById = new Map<string, string>();
  if (portalIds.length) {
    const { data: members } = await createAdminClient()
      .from('team_members')
      .select('id, name')
      .in('id', portalIds);
    for (const m of members ?? []) {
      nameById.set(m.id as string, (m.name as string) || 'Designer');
    }
  }

  let enriched = jobs.map((job) => {
    const designerDisplay =
      job.designer_name ||
      (job.assigned_designer_id ? nameById.get(job.assigned_designer_id) : null) ||
      'Unassigned';
    const daysTaken = daysBetween(job.design_routed_at, job.design_completed_at);
    return {
      ...job,
      designer_name: job.designer_name ?? null,
      design_price: job.design_price ?? null,
      design_due_at: job.design_due_at ?? null,
      design_slip_notes: job.design_slip_notes ?? null,
      order_source: job.order_source ?? null,
      designer_display: designerDisplay,
      item_count: Array.isArray(job.items) ? job.items.length : 0,
      item_summary: itemSummary(job.items),
      days_taken: daysTaken,
      returned_at: job.design_completed_at,
    };
  });

  if (usedLegacy && designer) {
    const q = designer.toLowerCase();
    enriched = enriched.filter((job) => job.designer_display.toLowerCase().includes(q));
  }

  // Date range on routed or completed/returned
  if (from || to) {
    const fromMs = from ? new Date(`${from}T00:00:00.000Z`).getTime() : null;
    const toMs = to ? new Date(`${to}T23:59:59.999Z`).getTime() : null;
    enriched = enriched.filter((job) => {
      const iso = dateField === 'completed' ? job.design_completed_at : job.design_routed_at || job.created_at;
      if (!iso) return false;
      const t = new Date(iso).getTime();
      if (Number.isNaN(t)) return false;
      if (fromMs != null && t < fromMs) return false;
      if (toMs != null && t > toMs) return false;
      return true;
    });
  }

  const byDesigner = new Map<
    string,
    {
      designer: string;
      open: number;
      in_progress: number;
      completed: number;
      overdue: number;
      design_price_total: number;
    }
  >();
  const now = Date.now();
  for (const job of enriched) {
    const key = job.designer_display;
    const bucket = byDesigner.get(key) ?? {
      designer: key,
      open: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      design_price_total: 0,
    };
    if (job.status === 'design_completed' || job.design_completed_at) {
      bucket.completed += 1;
    } else if (job.status === 'design_in_progress') {
      bucket.in_progress += 1;
      bucket.open += 1;
      if (job.design_due_at && new Date(job.design_due_at).getTime() < now) bucket.overdue += 1;
    } else {
      bucket.open += 1;
      if (job.design_due_at && new Date(job.design_due_at).getTime() < now) bucket.overdue += 1;
    }
    bucket.design_price_total += Number(job.design_price) || 0;
    byDesigner.set(key, bucket);
  }

  const summary = Array.from(byDesigner.values()).sort((a, b) => a.designer.localeCompare(b.designer));

  if (format === 'csv') {
    const csv = toCsv(
      enriched.map((job) => ({
        order_number: job.order_number,
        designer: job.designer_display,
        status: job.status,
        routed: job.design_routed_at,
        due: job.design_due_at,
        returned: job.design_completed_at,
        days_taken: job.days_taken,
        design_price: job.design_price,
        items: job.item_summary,
      })),
    );
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="design-jobs-${from || 'all'}-${to || 'all'}.csv"`,
      },
    });
  }

  return NextResponse.json({
    jobs: enriched,
    summary,
    needsMigration: usedLegacy,
    filters: { designer, status, from, to, date_field: dateField },
  });
}
