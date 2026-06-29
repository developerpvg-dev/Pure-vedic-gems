/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
export async function GET() {
  const auth = await requireAdminAccess('orders.design');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const db = asUntypedSupabase(admin);

  const { data, error } = await db
    .from('orders')
    .select('id, order_number, status, total, created_at, design_routed_at, design_completed_at, design_notes, items, shipping_address, special_instructions')
    .eq('assigned_designer_id', auth.user.id)
    .order('design_routed_at', { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load assignments' }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
