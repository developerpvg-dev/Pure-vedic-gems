import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { consultationPlanSchema } from '@/lib/validators/consultation';

export async function GET() {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('consultation_plans')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Admin] Consultation plans fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch consultation plans' }, { status: 500 });
  }

  return NextResponse.json({ plans: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth && auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = consultationPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('consultation_plans')
    .insert(parsed.data)
    .select('*')
    .single();

  if (error) {
    console.error('[Admin] Consultation plan create failed:', error);
    return NextResponse.json({ error: 'Failed to create consultation plan' }, { status: 500 });
  }

  return NextResponse.json({ plan: data }, { status: 201 });
}