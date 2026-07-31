import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { mapReportRow, normalizeBlocks, normalizeCustomer } from '@/lib/recommendations/normalize';
import type { Json } from '@/lib/types/database';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin.from('recommendation_reports').select('*').eq('id', id).single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || 'Not found' },
      { status: error?.code === 'PGRST116' ? 404 : 500 }
    );
  }

  return NextResponse.json({ report: mapReportRow(data as Record<string, unknown>) });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === 'string') patch.title = body.title.trim() || 'Gemstone Recommendation';
  if (body.customer !== undefined) patch.customer = normalizeCustomer(body.customer) as unknown as Json;
  if (body.blocks !== undefined) patch.blocks = normalizeBlocks(body.blocks) as unknown as Json;
  if (typeof body.chart_image_url === 'string' || body.chart_image_url === null) {
    patch.chart_image_url = body.chart_image_url;
  }
  if (body.enquiry_id === null || typeof body.enquiry_id === 'string') patch.enquiry_id = body.enquiry_id;
  if (body.status === 'draft' || body.status === 'ready' || body.status === 'sent') patch.status = body.status;

  const admin = createAdminClient();
  const { data, error } = await admin.from('recommendation_reports').update(patch).eq('id', id).select('*').single();

  if (error || !data) {
    console.error('[recommendations] patch', error);
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ report: mapReportRow(data as Record<string, unknown>) });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin.from('recommendation_reports').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
