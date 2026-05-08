import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import type { AdminPermission } from '@/lib/admin/rbac';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

type ExportType = 'products' | 'orders' | 'leads' | 'finance' | 'import_errors';
const EXPORT_PERMISSIONS: Record<ExportType, AdminPermission> = {
  products: 'products.read',
  orders: 'orders.read',
  leads: 'leads.read',
  finance: 'finance.read',
  import_errors: 'imports.write',
};

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return 'No rows\n';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as ExportType | null;
  if (!type || !(type in EXPORT_PERMISSIONS)) {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  const auth = await requireAdminAccess(EXPORT_PERMISSIONS[type]);
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  let rows: Record<string, unknown>[] = [];
  let filename = `${type}_export.csv`;

  if (type === 'products') {
    const { data, error } = await db.from<Record<string, unknown>[]>('products').select('sku, tag_number, legacy_woo_id, name, category, price, stock_status, availability_status, is_active, updated_at').limit(5000);
    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    rows = data ?? [];
  } else if (type === 'orders' || type === 'finance') {
    const query = db.from<Record<string, unknown>[]>('orders').select('order_number, guest_name, guest_email, total, payment_status, payment_method, status, tracking_number, created_at').order('created_at', { ascending: false }).limit(5000);
    const { data, error } = type === 'finance' ? await query.eq('payment_status', 'captured') : await query;
    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    rows = data ?? [];
  } else if (type === 'leads') {
    const { data: consultations } = await db.from<Record<string, unknown>[]>('consultation_requests').select('id, full_name, email, phone, consultation_type, status, created_at').limit(2500);
    const { data: enquiries } = await db.from<Record<string, unknown>[]>('enquiries').select('id, name, email, phone, subject, status, created_at').limit(2500);
    rows = [...(consultations ?? []), ...(enquiries ?? [])];
  } else if (type === 'import_errors') {
    const { data, error } = await db.from<Record<string, unknown>[]>('product_import_rows').select('batch_id, row_number, sku, status, errors, warnings, created_at').neq('errors', '[]').limit(5000);
    if (error) return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    rows = data ?? [];
  }

  filename = `purevedicgems_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(toCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}