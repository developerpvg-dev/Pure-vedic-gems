import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { listAdminCustomers } from '@/lib/admin/customer-directory';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { addManualRewardAdjustment, getRewardBalance, getRewardSettings } from '@/lib/rewards/service';
import { logAdminAction } from '@/lib/utils/admin-log';
import type { RewardPointTransaction } from '@/lib/types/database';

const adjustmentSchema = z.object({
  customer_id: z.string().uuid(),
  points: z.coerce.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, 'Points cannot be zero'),
  description: z.string().trim().min(3).max(500),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const customerId = searchParams.get('customer_id')?.trim();
  const recentOnly = searchParams.get('recent') === '1';
  const admin = createAdminClient();

  const settings = await getRewardSettings();
  const pointValueInr = Number(settings.point_value_inr ?? 1);

  if (recentOnly) {
    const { data: recentRows } = await admin
      .from('reward_point_transactions')
      .select('*')
      .eq('type', 'adjustment')
      .order('created_at', { ascending: false })
      .limit(25);

    const recentTransactions = (recentRows ?? []) as RewardPointTransaction[];
    const recentCustomerIds = Array.from(new Set(recentTransactions.map((row) => row.customer_id)));
    const { data: recentProfiles } = recentCustomerIds.length
      ? await admin
          .from('customer_profiles')
          .select('id, full_name, email, phone')
          .in('id', recentCustomerIds)
      : { data: [] };
    const profileById = new Map((recentProfiles ?? []).map((profile) => [profile.id, profile]));

    return NextResponse.json({
      pointValueInr,
      recentTransactions: recentTransactions.map((transaction) => ({
        ...transaction,
        customer: profileById.get(transaction.customer_id) ?? null,
      })),
    });
  }

  let customers: unknown[] = [];
  if (search) {
    const result = await listAdminCustomers({
      search,
      page: 1,
      perPage: 25,
      sort: 'activity',
    });
    customers = result.customers.map(({ id, full_name, email, phone, whatsapp, updated_at }) => ({
      id,
      full_name,
      email,
      phone,
      whatsapp,
      updated_at,
    }));
  }

  let selectedCustomer = null;
  let balance = null;
  let transactions: RewardPointTransaction[] = [];
  if (customerId) {
    const [customerResult, transactionResult, balanceResult] = await Promise.all([
      admin
        .from('customer_profiles')
        .select('id, full_name, email, phone, whatsapp, updated_at')
        .eq('id', customerId)
        .maybeSingle(),
      admin
        .from('reward_point_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(100),
      getRewardBalance(customerId),
    ]);

    selectedCustomer = customerResult.data ?? null;
    balance = balanceResult;
    transactions = (transactionResult.data ?? []) as RewardPointTransaction[];
  }

  return NextResponse.json({
    pointValueInr,
    customers,
    selectedCustomer,
    balance,
    transactions,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as { action?: string; payload?: unknown } | null;
  if (!body?.action) return NextResponse.json({ error: 'action is required' }, { status: 400 });

  if (body.action !== 'adjustment') {
    return NextResponse.json(
      { error: 'Automatic reward rules are disabled. Only manual customer assignments are supported.' },
      { status: 400 },
    );
  }

  const parsed = adjustmentSchema.safeParse(body.payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const transaction = await addManualRewardAdjustment({
      customerId: parsed.data.customer_id,
      points: parsed.data.points,
      description: parsed.data.description,
      adminUserId: auth.user.id,
    });

    await logAdminAction({
      userId: auth.user.id,
      action: 'reward_manual_adjustment',
      resourceType: 'reward_point_transaction',
      resourceId: transaction.id,
      details: parsed.data,
      ipAddress: getRequestIp(request),
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Adjustment failed' }, { status: 400 });
  }
}
