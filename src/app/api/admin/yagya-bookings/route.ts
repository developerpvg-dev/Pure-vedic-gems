import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import type { YagyaBooking } from '@/lib/types/database';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('payment_status');
  const search = searchParams.get('q')?.trim();

  const admin = createAdminClient();
  let query = admin
    .from('yagya_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (status && status !== 'all') query = query.eq('status', status);
  if (paymentStatus && paymentStatus !== 'all') query = query.eq('payment_status', paymentStatus);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,booking_number.ilike.%${search}%,yagya_title_snapshot.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('[Admin yagya-bookings] List failed:', error);
    return NextResponse.json({ error: 'Failed to load yagya bookings' }, { status: 500 });
  }

  return NextResponse.json({ bookings: (data ?? []) as YagyaBooking[] });
}
