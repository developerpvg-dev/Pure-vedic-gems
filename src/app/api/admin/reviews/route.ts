import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('reviews')
    .select('*, products(id, name, slug, category, thumbnail_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status === 'pending') query = query.eq('is_approved', false);
  if (status === 'approved') query = query.eq('is_approved', true);
  if (status === 'featured') query = query.eq('is_featured', true);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });

  return NextResponse.json({
    reviews: data ?? [],
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}