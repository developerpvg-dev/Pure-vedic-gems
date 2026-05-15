import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { consultationPlanUpdateSchema } from '@/lib/validators/consultation';
import type { Database, Json } from '@/lib/types/database';

type ConsultationPlanUpdate = Database['public']['Tables']['consultation_plans']['Update'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = consultationPlanUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { metadata, ...fields } = parsed.data;
  const payload: ConsultationPlanUpdate = {
    ...fields,
    updated_at: new Date().toISOString(),
  };
  if (metadata !== undefined) {
    payload.metadata = metadata as Json;
  }

  const { data, error } = await admin
    .from('consultation_plans')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[Admin] Consultation plan update failed:', error);
    return NextResponse.json({ error: 'Failed to update consultation plan' }, { status: 500 });
  }

  return NextResponse.json({ plan: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth && auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('consultation_plans')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('[Admin] Consultation plan delete failed:', error);
    return NextResponse.json({ error: 'Failed to delete consultation plan' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true, id: data.id });
}