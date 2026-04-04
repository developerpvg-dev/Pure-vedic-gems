import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  // Use admin client to bypass RLS on team_members
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

/**
 * GET /api/admin/categories
 * Returns ALL categories (including inactive) for admin management.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('gem_categories')
    .select('*')
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

/**
 * POST /api/admin/categories
 * Create a new gem category.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, slug, type, sanskrit_name, planet, emoji, color, image_url, hover_image_url, description, sort_order } = body as {
    name?: string; slug?: string; type?: string; sanskrit_name?: string;
    planet?: string; emoji?: string; color?: string; image_url?: string; hover_image_url?: string;
    description?: string; sort_order?: number;
  };

  if (!name || !slug || !type) {
    return NextResponse.json({ error: 'name, slug, and type are required' }, { status: 400 });
  }

  if (type !== 'navaratna' && type !== 'upratna') {
    return NextResponse.json({ error: 'type must be navaratna or upratna' }, { status: 400 });
  }

  // Sanitize slug
  const safeSlug = String(slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('gem_categories')
    .insert({
      name: String(name).trim(),
      slug: safeSlug,
      type,
      sanskrit_name: sanskrit_name ? String(sanskrit_name).trim() : null,
      planet: planet ? String(planet).trim() : null,
      emoji: emoji ? String(emoji).trim() : null,
      color: color ? String(color).trim() : null,
      image_url: image_url ? String(image_url).trim() : null,
      hover_image_url: hover_image_url ? String(hover_image_url).trim() : null,
      description: description ? String(description).trim() : null,
      sort_order: typeof sort_order === 'number' ? sort_order : 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 });
    }
    if (error.code === 'PGRST204') {
      return NextResponse.json({
        error: 'Database schema is out of date. Please run the migration: ALTER TABLE gem_categories ADD COLUMN IF NOT EXISTS hover_image_url TEXT;',
        code: error.code,
      }, { status: 422 });
    }
    console.error('[admin/categories] Create error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
