import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { getAdminFilterOptions } from '@/lib/admin/product-filters';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth && auth.error) return auth.error;

  const category = request.nextUrl.searchParams.get('category')?.trim() || undefined;
  const options = await getAdminFilterOptions(category);

  return NextResponse.json(options);
}
