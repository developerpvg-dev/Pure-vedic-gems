import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseCustomerAddresses } from '@/lib/customer/address-book';
import {
  CUSTOMER_ACCOUNT_STATUSES,
  setCustomerAccountStatus,
  type CustomerAccountStatus,
} from '@/lib/customers/account-status';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';

const PatchCustomerSchema = z.object({
  account_status: z.enum(CUSTOMER_ACCOUNT_STATUSES),
  reason: z.string().trim().max(500).optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from('customer_profiles')
    .select(
      'id, full_name, email, phone, whatsapp, date_of_birth, birth_time, birth_place, gotra, rashi, addresses, default_address_index, account_status, status_reason, status_changed_at, status_changed_by, created_at, updated_at'
    )
    .eq('id', id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const [authUser, orderStats] = await Promise.all([
    admin.auth.admin.getUserById(id).then((result) => result.data.user).catch(() => null),
    admin
      .from('orders')
      .select('total')
      .eq('customer_id', id)
      .then((result) => result.data ?? []),
  ]);

  const addresses = parseCustomerAddresses(profile.addresses ?? [], profile.default_address_index ?? 0);
  const totalOrders = orderStats.length;
  const totalSpent = orderStats.reduce((sum, order) => sum + Number(order.total ?? 0), 0);

  return NextResponse.json({
    customer: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      whatsapp: profile.whatsapp,
      date_of_birth: profile.date_of_birth,
      birth_time: profile.birth_time,
      birth_place: profile.birth_place,
      gotra: profile.gotra,
      rashi: profile.rashi,
      addresses,
      default_address_index: profile.default_address_index ?? 0,
      account_status: (profile.account_status ?? 'active') as CustomerAccountStatus,
      status_reason: profile.status_reason,
      status_changed_at: profile.status_changed_at,
      status_changed_by: profile.status_changed_by,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
      total_orders: totalOrders,
      total_spent: totalSpent,
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = PatchCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot change your own customer account status here.' }, { status: 400 });
  }

  try {
    const result = await setCustomerAccountStatus({
      customerId: id,
      status: parsed.data.account_status,
      reason: parsed.data.reason,
      changedBy: auth.user.id,
    });

    await logAdminAction({
      userId: auth.user.id,
      action: 'customer_account_status_update',
      resourceType: 'customer',
      resourceId: id,
      details: {
        account_status: parsed.data.account_status,
        reason: parsed.data.reason ?? null,
      },
      ipAddress: getRequestIp(request),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update customer status';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
