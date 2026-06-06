import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { addManualRewardAdjustment, getRewardBalance, getRewardSettings, updateRewardSettings } from '@/lib/rewards/service';
import { logAdminAction } from '@/lib/utils/admin-log';
import type { RewardPointTransaction } from '@/lib/types/database';

const nullableInteger = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
  z.number().int().positive().nullable()
);

const settingsSchema = z.object({
  is_active: z.coerce.boolean(),
  earn_points_per_order: z.coerce.number().int().nonnegative().max(1_000_000),
  point_value_inr: z.coerce.number().positive().max(100_000),
  min_redeem_points: z.coerce.number().int().nonnegative().max(1_000_000),
  max_redeem_points_per_order: z.coerce.number().int().nonnegative().max(1_000_000),
  max_redeem_percent: z.coerce.number().min(0).max(100),
  expiry_days: nullableInteger,
});

const adjustmentSchema = z.object({
  customer_id: z.string().uuid(),
  points: z.coerce.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, 'Points cannot be zero'),
  description: z.string().trim().min(3).max(500),
});

function cleanSearch(value: string) {
  return value.replace(/[%,]/g, ' ').trim();
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim();
  const customerId = searchParams.get('customer_id')?.trim();
  const admin = createAdminClient();

  const [settings, recentTransactionsResult] = await Promise.all([
    getRewardSettings(),
    admin
      .from('reward_point_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);

  const recentTransactions = (recentTransactionsResult.data ?? []) as RewardPointTransaction[];
  const recentCustomerIds = Array.from(new Set(recentTransactions.map((transaction) => transaction.customer_id)));
  const { data: recentProfiles } = recentCustomerIds.length
    ? await admin
        .from('customer_profiles')
        .select('id, full_name, email, phone')
        .in('id', recentCustomerIds)
    : { data: [] };
  const profileById = new Map((recentProfiles ?? []).map((profile) => [profile.id, profile]));

  let customers: unknown[] = [];
  if (search) {
    const searchTerm = `%${cleanSearch(search)}%`;
    const { data } = await admin
      .from('customer_profiles')
      .select('id, full_name, email, phone, updated_at')
      .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},whatsapp.ilike.${searchTerm}`)
      .order('updated_at', { ascending: false })
      .limit(20);
    customers = data ?? [];
  }

  let selectedCustomer = null;
  let balance = null;
  let transactions: RewardPointTransaction[] = [];
  if (customerId) {
    const [customerResult, transactionResult, balanceResult] = await Promise.all([
      admin
        .from('customer_profiles')
        .select('id, full_name, email, phone, updated_at')
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
    settings,
    customers,
    selectedCustomer,
    balance,
    transactions,
    recentTransactions: recentTransactions.map((transaction) => ({
      ...transaction,
      customer: profileById.get(transaction.customer_id) ?? null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('settings.commerce');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null) as { action?: string; payload?: unknown } | null;
  if (!body?.action) return NextResponse.json({ error: 'action is required' }, { status: 400 });

  if (body.action === 'settings') {
    const parsed = settingsSchema.safeParse(body.payload);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const settings = await updateRewardSettings(parsed.data, auth.user.id);
    await logAdminAction({
      userId: auth.user.id,
      action: 'reward_settings_update',
      resourceType: 'reward_settings',
      resourceId: 'default',
      details: parsed.data,
      ipAddress: getRequestIp(request),
    });

    return NextResponse.json({ success: true, settings });
  }

  if (body.action === 'adjustment') {
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}