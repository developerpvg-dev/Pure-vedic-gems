import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page') ?? '20')));
  const from = (page - 1) * perPage;
  const admin = createAdminClient();

  let query = admin
    .from('customer_profiles')
    .select('id, full_name, email, phone, whatsapp, rashi, created_at, updated_at', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (search) {
    const searchTerm = `%${search.replace(/[%,]/g, ' ').trim()}%`;
    query = query.or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},whatsapp.ilike.${searchTerm}`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  return NextResponse.json({
    customers: data ?? [],
    total: count ?? 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count ?? 0) / perPage),
  });
}