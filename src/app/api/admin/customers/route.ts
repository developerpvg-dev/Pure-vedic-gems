import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const admin = createAdminClient();

  let query = admin
    .from('customer_profiles')
    .select('id, full_name, email, phone, whatsapp, rashi, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,whatsapp.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  return NextResponse.json({ customers: data ?? [] });
}