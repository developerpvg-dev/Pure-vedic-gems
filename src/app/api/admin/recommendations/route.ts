import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { blocksForTemplate, emptyCustomer, type TemplateId } from '@/lib/recommendations/blocks';
import { mapReportRow, normalizeCustomer } from '@/lib/recommendations/normalize';
import type { Json } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const status = request.nextUrl.searchParams.get('status');
  const admin = createAdminClient();
  let q = admin
    .from('recommendation_reports')
    .select('id, title, status, customer, public_token, sent_at, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);

  if (status === 'draft' || status === 'ready' || status === 'sent') {
    q = q.eq('status', status);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[recommendations] list', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reports: (data ?? []).map((row) => ({
      ...row,
      customer: normalizeCustomer(row.customer),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    template?: TemplateId;
    enquiryId?: string | null;
    customer?: Record<string, unknown>;
  };

  const template: TemplateId = body.template === 'blank' ? 'blank' : 'classic';
  const customer = { ...emptyCustomer(), ...normalizeCustomer(body.customer) };
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('recommendation_reports')
    .insert({
      title: body.title?.trim() || `Recommendation — ${customer.name || 'Customer'}`,
      status: 'draft',
      customer: customer as unknown as Json,
      enquiry_id: body.enquiryId || null,
      blocks: blocksForTemplate(template) as unknown as Json,
      created_by: auth.user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[recommendations] create', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ report: mapReportRow(data as Record<string, unknown>) }, { status: 201 });
}
