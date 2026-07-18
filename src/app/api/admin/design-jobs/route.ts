import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

const FULL_SELECT =
  'id, order_number, status, designer_name, assigned_designer_id, design_price, design_due_at, design_routed_at, design_completed_at, design_slip_notes, design_notes, created_at, items, total';

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
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === '42703' ||
    Boolean(error.message?.includes('does not exist')) ||
    Boolean(error.message?.includes('designer_name')) ||
    Boolean(error.message?.includes('design_price')) ||
    Boolean(error.message?.includes('design_due_at'))
  );
}

/**
 * GET /api/admin/design-jobs
 * Track jewelry design assignments: designer, due date, status, completion.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('orders.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const designer = searchParams.get('designer')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';

  const db = asUntypedSupabase(createAdminClient());

  let usedLegacy = false;

  let query = db
    .from('orders')
    .select(FULL_SELECT)
    .or(
      'designer_name.not.is.null,assigned_designer_id.not.is.null,status.in.(design_assigned,design_in_progress,design_completed)',
    )
    .order('design_due_at', { ascending: true, nullsFirst: false })
    .limit(200);

  if (designer) query = query.ilike('designer_name', `%${designer}%`);
  if (status) query = query.eq('status', status);

  let { data, error } = await query;

  if (error && isMissingColumnError(error)) {
    usedLegacy = true;
    let legacy = db
      .from('orders')
      .select(LEGACY_SELECT)
      .or(
        'assigned_designer_id.not.is.null,status.in.(design_assigned,design_in_progress,design_completed)',
      )
      .order('design_routed_at', { ascending: false, nullsFirst: false })
      .limit(200);

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

  let enriched = jobs.map((job) => ({
    ...job,
    designer_name: job.designer_name ?? null,
    design_price: job.design_price ?? null,
    design_due_at: job.design_due_at ?? null,
    design_slip_notes: job.design_slip_notes ?? null,
    designer_display:
      job.designer_name ||
      (job.assigned_designer_id ? nameById.get(job.assigned_designer_id) : null) ||
      'Unassigned',
    item_count: Array.isArray(job.items) ? job.items.length : 0,
  }));

  // Legacy filter by designer display name (designer_name column unavailable)
  if (usedLegacy && designer) {
    const q = designer.toLowerCase();
    enriched = enriched.filter((job) => job.designer_display.toLowerCase().includes(q));
  }

  const byDesigner = new Map<
    string,
    { designer: string; open: number; completed: number; overdue: number }
  >();
  const now = Date.now();
  for (const job of enriched) {
    const key = job.designer_display;
    const bucket = byDesigner.get(key) ?? { designer: key, open: 0, completed: 0, overdue: 0 };
    if (job.status === 'design_completed' || job.design_completed_at) {
      bucket.completed += 1;
    } else {
      bucket.open += 1;
      if (job.design_due_at && new Date(job.design_due_at).getTime() < now) {
        bucket.overdue += 1;
      }
    }
    byDesigner.set(key, bucket);
  }

  return NextResponse.json({
    jobs: enriched,
    summary: Array.from(byDesigner.values()).sort((a, b) => a.designer.localeCompare(b.designer)),
    needsMigration: usedLegacy,
  });
}
