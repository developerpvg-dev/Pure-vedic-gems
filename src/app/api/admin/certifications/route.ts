import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const adminDb = createAdminClient();
  const { data: member } = await adminDb
    .from('team_members')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  const m = member as { role: string; is_active: boolean } | null;
  if (!m?.is_active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, role: m.role };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('certification_labs')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
  }

  return NextResponse.json({ certifications: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, full_name, extra_charge, turnaround_days, sample_cert_url, description, is_default, sort_order } = body as {
    name?: string; full_name?: string; extra_charge?: number; turnaround_days?: number;
    sample_cert_url?: string; description?: string; is_default?: boolean; sort_order?: number;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (typeof extra_charge === 'number' && extra_charge < 0) {
    return NextResponse.json({ error: 'extra_charge must be non-negative' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('certification_labs')
    .insert({
      name: String(name).trim().substring(0, 20),
      full_name: full_name ? String(full_name).trim().substring(0, 200) : undefined,
      extra_charge: typeof extra_charge === 'number' ? extra_charge : 0,
      turnaround_days: typeof turnaround_days === 'number' ? turnaround_days : undefined,
      sample_cert_url: sample_cert_url ? String(sample_cert_url).trim() : undefined,
      description: description ? String(description).trim() : undefined,
      is_default: is_default ?? false,
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A certification with this name already exists' }, { status: 409 });
    }
    console.error('[admin/certifications] Create error:', error);
    return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
  }

  return NextResponse.json({ certification: data }, { status: 201 });
}
