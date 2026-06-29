import { NextRequest, NextResponse } from 'next/server';
import { listAdminCustomers, type CustomerSortMode } from '@/lib/admin/customer-directory';
import { requireAdminAccess } from '@/lib/admin/api';

function parseSortMode(value: string | null): CustomerSortMode {
  return value === 'activity' ? 'activity' : 'signup';
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page') ?? '20')));
  const sort = parseSortMode(searchParams.get('sort'));

  try {
    const result = await listAdminCustomers({ search, page, perPage, sort });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
