import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { getErpTagDetail } from '@/lib/erp/sync';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const tgno = request.nextUrl.searchParams.get('tgno')?.trim();
  if (!tgno) {
    return NextResponse.json({ error: 'tgno query parameter is required' }, { status: 400 });
  }

  const detail = await getErpTagDetail(tgno);
  if (!detail) {
    return NextResponse.json({ error: 'Invalid tag number' }, { status: 400 });
  }

  if (!detail.foundInCache && !detail.website && !detail.erp) {
    return NextResponse.json({
      error: 'Tag not found in stock cache or on website. Upload the category Excel sheet first.',
      detail,
    }, { status: 404 });
  }

  return NextResponse.json({ detail });
}
