import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from('blog_comments')
    .select('id, blog_slug, customer_id, author_name, body, is_approved, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`blog_slug.ilike.%${q}%,author_name.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch blog comments' }, { status: 500 });
  }

  return NextResponse.json({
    comments: data ?? [],
    total: count ?? 0,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil((count ?? 0) / limit)),
  });
}
