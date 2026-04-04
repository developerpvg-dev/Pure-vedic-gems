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
    .from('energization_options')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch energization options' }, { status: 500 });
  }

  return NextResponse.json({ energizations: data ?? [] });
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

  const { name, description, price, duration, includes, includes_video, sort_order } = body as {
    name?: string; description?: string; price?: number; duration?: string;
    includes?: string[]; includes_video?: boolean; sort_order?: number;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (typeof price === 'number' && price < 0) {
    return NextResponse.json({ error: 'price must be non-negative' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('energization_options')
    .insert({
      name: String(name).trim().substring(0, 100),
      description: description ? String(description).trim() : undefined,
      price: typeof price === 'number' ? price : 0,
      duration: duration ? String(duration).trim().substring(0, 50) : undefined,
      includes: Array.isArray(includes) ? includes : undefined,
      includes_video: includes_video ?? false,
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[admin/energizations] Create error:', error);
    return NextResponse.json({ error: 'Failed to create energization option' }, { status: 500 });
  }

  return NextResponse.json({ energization: data }, { status: 201 });
}
