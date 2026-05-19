import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { asUntypedSupabase, type UntypedSupabase } from '@/lib/supabase/untyped';
import { logAdminAction } from '@/lib/utils/admin-log';

const resourceSchema = z.enum(['privacy_requests', 'return_requests', 'invoices']);

const statusOptions: Record<z.infer<typeof resourceSchema>, string[]> = {
  privacy_requests: ['received', 'verifying', 'in_progress', 'waiting_on_customer', 'completed', 'rejected', 'cancelled'],
  return_requests: ['requested', 'authorized', 'customer_shipped', 'received', 'inspection', 'approved', 'rejected', 'refunded', 'replaced', 'closed'],
  invoices: ['draft', 'issued', 'sent', 'void', 'failed'],
};

const patchSchema = z.object({
  resource: resourceSchema,
  id: z.string().uuid(),
  status: z.string().trim().min(2).max(60),
  note: z.string().trim().max(2000).optional().default(''),
});

async function readTable(db: UntypedSupabase, table: string, orderColumn = 'created_at') {
  const { data, error } = await db
    .from(table)
    .select('*')
    .order(orderColumn, { ascending: false })
    .limit(80);
  if (error) return [];
  return data ?? [];
}

export async function GET() {
  const auth = await requireAdminAccess('compliance.manage');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const [taxRules, privacyRequests, returnRequests, invoices, refundRecords, policyVersions] = await Promise.all([
    readTable(db, 'tax_rules', 'updated_at'),
    readTable(db, 'privacy_requests'),
    readTable(db, 'return_requests'),
    readTable(db, 'invoices'),
    readTable(db, 'refund_records'),
    readTable(db, 'policy_versions'),
  ]);

  return NextResponse.json({
    taxRules,
    privacyRequests,
    returnRequests,
    invoices,
    refundRecords,
    policyVersions,
    statusOptions,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess('compliance.manage');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { resource, id, status, note } = parsed.data;
  if (!statusOptions[resource].includes(status)) {
    return NextResponse.json({ error: `Invalid status for ${resource}` }, { status: 400 });
  }

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (resource === 'privacy_requests') {
    if (note) update.internal_notes = note;
    if (status === 'completed' || status === 'rejected' || status === 'cancelled') update.resolved_at = new Date().toISOString();
  }
  if (resource === 'return_requests') {
    if (note) update.inspection_notes = note;
    if (status === 'closed' || status === 'rejected' || status === 'refunded' || status === 'replaced') update.closed_at = new Date().toISOString();
  }
  if (resource === 'invoices') {
    if (status === 'issued' || status === 'sent') update.issued_at = new Date().toISOString();
    if (status === 'void') update.voided_at = new Date().toISOString();
  }

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db.from(resource).update(update).eq('id', id).select('*').single();
  if (error || !data) return NextResponse.json({ error: 'Failed to update compliance record' }, { status: 500 });

  await logAdminAction({
    userId: auth.user.id,
    action: 'compliance_status_update',
    resourceType: resource,
    resourceId: id,
    details: { status, note },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true, data });
}