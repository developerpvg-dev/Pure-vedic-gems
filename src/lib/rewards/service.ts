import { createAdminClient } from '@/lib/supabase/admin';
import type { Json, Order, RewardPointTransaction, RewardSettings } from '@/lib/types/database';

export interface RewardBalance {
  available_points: number;
  confirmed_points: number;
  pending_redeemed_points: number;
  lifetime_earned_points: number;
  lifetime_redeemed_points: number;
}

export interface RewardRedemptionQuote {
  requested_points: number;
  points_to_redeem: number;
  discount_amount: number;
  balance: RewardBalance;
  settings: RewardSettings;
}

export interface RewardSettingsUpdate {
  is_active: boolean;
  earn_points_per_order: number;
  point_value_inr: number;
  min_redeem_points: number;
  max_redeem_points_per_order: number;
  max_redeem_percent: number;
  expiry_days: number | null;
}

const FALLBACK_SETTINGS: RewardSettings = {
  id: 'default',
  is_active: true,
  earn_points_per_order: 500,
  point_value_inr: 1,
  min_redeem_points: 1,
  max_redeem_points_per_order: 5000,
  max_redeem_percent: 20,
  expiry_days: null,
  metadata: {},
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

function roundedRupees(value: number) {
  return Math.max(0, Math.round(value));
}

function asPositiveInteger(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export async function getRewardSettings(): Promise<RewardSettings> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('reward_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  return (data as RewardSettings | null) ?? FALLBACK_SETTINGS;
}

export async function updateRewardSettings(settings: RewardSettingsUpdate, updatedBy: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reward_settings')
    .upsert({
      id: 'default',
      ...settings,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error('Unable to update reward settings.');
  return data as RewardSettings;
}

export async function getRewardBalance(customerId: string): Promise<RewardBalance> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('reward_point_transactions')
    .select('points, status')
    .eq('customer_id', customerId);

  const rows = (data ?? []) as Array<Pick<RewardPointTransaction, 'points' | 'status'>>;
  let confirmedPoints = 0;
  let pendingRedeemedPoints = 0;
  let lifetimeEarnedPoints = 0;
  let lifetimeRedeemedPoints = 0;

  for (const row of rows) {
    const points = Number(row.points ?? 0);
    if (row.status === 'confirmed') {
      confirmedPoints += points;
      if (points > 0) lifetimeEarnedPoints += points;
      if (points < 0) lifetimeRedeemedPoints += Math.abs(points);
    } else if (row.status === 'pending' && points < 0) {
      pendingRedeemedPoints += Math.abs(points);
    }
  }

  return {
    available_points: Math.max(0, confirmedPoints - pendingRedeemedPoints),
    confirmed_points: Math.max(0, confirmedPoints),
    pending_redeemed_points: pendingRedeemedPoints,
    lifetime_earned_points: lifetimeEarnedPoints,
    lifetime_redeemed_points: lifetimeRedeemedPoints,
  };
}

export async function quoteRewardRedemption({
  customerId,
  requestedPoints,
  eligibleAmount,
}: {
  customerId: string | null;
  requestedPoints: number | null | undefined;
  eligibleAmount: number;
}): Promise<RewardRedemptionQuote | null> {
  const requested = asPositiveInteger(requestedPoints);
  if (!requested) return null;
  if (!customerId) throw new Error('Please sign in to redeem reward points.');

  const [settings, balance] = await Promise.all([
    getRewardSettings(),
    getRewardBalance(customerId),
  ]);

  if (!settings.is_active) throw new Error('Reward points are currently disabled.');
  if (requested < settings.min_redeem_points) {
    throw new Error(`Redeem at least ${settings.min_redeem_points} reward point(s).`);
  }

  const maxByPercent = roundedRupees(eligibleAmount * (Number(settings.max_redeem_percent) / 100));
  const maxByFixed = settings.max_redeem_points_per_order * Number(settings.point_value_inr);
  const maxDiscount = Math.min(eligibleAmount, maxByPercent, maxByFixed);
  const maxPointsByDiscount = Math.floor(maxDiscount / Number(settings.point_value_inr));
  const pointsToRedeem = Math.min(requested, balance.available_points, settings.max_redeem_points_per_order, maxPointsByDiscount);

  if (pointsToRedeem < requested) {
    throw new Error(`You can redeem up to ${Math.max(0, pointsToRedeem)} point(s) on this order.`);
  }
  if (pointsToRedeem <= 0) throw new Error('No reward points are available for this order.');

  return {
    requested_points: requested,
    points_to_redeem: pointsToRedeem,
    discount_amount: roundedRupees(pointsToRedeem * Number(settings.point_value_inr)),
    balance,
    settings,
  };
}

export async function reserveRewardRedemption({
  customerId,
  orderId,
  points,
  discountAmount,
}: {
  customerId: string;
  orderId: string;
  points: number;
  discountAmount: number;
}) {
  if (points <= 0 || discountAmount <= 0) return;

  const balance = await getRewardBalance(customerId);
  if (balance.available_points < points) {
    throw new Error(`Only ${balance.available_points} reward point(s) are available.`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('reward_point_transactions').insert({
    customer_id: customerId,
    order_id: orderId,
    type: 'redeemed',
    status: 'pending',
    points: -points,
    amount_inr: discountAmount,
    description: `Reserved ${points} reward point(s) for checkout`,
  });

  if (error) throw new Error('Unable to reserve reward points for this order.');
}

export async function addManualRewardAdjustment({
  customerId,
  points,
  description,
  adminUserId,
}: {
  customerId: string;
  points: number;
  description: string;
  adminUserId: string;
}) {
  const normalizedPoints = Math.trunc(points);
  if (normalizedPoints === 0) throw new Error('Adjustment points cannot be zero.');

  const [settings, balance] = await Promise.all([getRewardSettings(), getRewardBalance(customerId)]);
  if (normalizedPoints < 0 && balance.available_points < Math.abs(normalizedPoints)) {
    throw new Error(`Only ${balance.available_points} reward point(s) are available.`);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reward_point_transactions')
    .insert({
      customer_id: customerId,
      type: 'adjustment',
      status: 'confirmed',
      points: normalizedPoints,
      amount_inr: roundedRupees(Math.abs(normalizedPoints) * Number(settings.point_value_inr)),
      description: description.trim() || 'Manual reward points adjustment',
      created_by: adminUserId,
      metadata: { source: 'admin_panel' } as Json,
    })
    .select()
    .single();

  if (error) throw new Error('Unable to save reward adjustment.');
  return data as RewardPointTransaction;
}

export async function confirmRewardRedemption(orderId: string) {
  const supabase = createAdminClient();
  await supabase
    .from('reward_point_transactions')
    .update({ status: 'confirmed' })
    .eq('order_id', orderId)
    .eq('type', 'redeemed')
    .eq('status', 'pending')
    .then(null, () => undefined);
}

export async function cancelRewardRedemption(orderId: string) {
  const supabase = createAdminClient();
  await supabase
    .from('reward_point_transactions')
    .update({ status: 'cancelled' })
    .eq('order_id', orderId)
    .eq('type', 'redeemed')
    .eq('status', 'pending')
    .then(null, () => undefined);
}

export function calculateOrderEarnedPoints(order: Pick<Order, 'subtotal' | 'reward_points_redeemed'>, settings: RewardSettings) {
  if (!settings.is_active) return 0;
  const redeemedPoints = Number(order.reward_points_redeemed ?? 0);
  if (Number(order.subtotal ?? 0) <= 0) return 0;
  return redeemedPoints > 0 ? Math.max(0, settings.earn_points_per_order - redeemedPoints) : settings.earn_points_per_order;
}

export async function awardOrderRewardPoints(order: Order) {
  if (!order.customer_id) return 0;

  const settings = await getRewardSettings();
  const points = calculateOrderEarnedPoints(order, settings);
  if (points <= 0) return 0;

  const supabase = createAdminClient();
  const expiresAt = settings.expiry_days
    ? new Date(Date.now() + settings.expiry_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('reward_point_transactions').insert({
    customer_id: order.customer_id,
    order_id: order.id,
    type: 'earned',
    status: 'confirmed',
    points,
    amount_inr: points * Number(settings.point_value_inr),
    description: `Reward points earned for order ${order.order_number}`,
    expires_at: expiresAt,
    metadata: { order_number: order.order_number } as Json,
  });

  if (!error) {
    await supabase
      .from('orders')
      .update({ reward_points_earned: points })
      .eq('id', order.id)
      .then(null, () => undefined);
    return points;
  }

  return 0;
}