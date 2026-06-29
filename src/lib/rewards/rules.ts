import type { RewardSettings } from '@/lib/types/database';

export function roundedRupees(value: number) {
  return Math.max(0, Math.round(value));
}

export type RewardRedemptionRules = Pick<
  RewardSettings,
  'is_active' | 'point_value_inr' | 'min_redeem_points' | 'max_redeem_points_per_order' | 'max_redeem_percent'
>;

export type RewardRulesInput = RewardRedemptionRules &
  Pick<RewardSettings, 'earn_points_per_order' | 'expiry_days'>;

/** Max points a customer can apply on an order (matches server quote logic). */
export function calculateMaxRedeemablePoints(
  settings: RewardRedemptionRules,
  availablePoints: number,
  eligibleAmountInr: number
): number {
  if (!settings.is_active || eligibleAmountInr <= 0 || availablePoints <= 0) return 0;

  const pointValue = Number(settings.point_value_inr || 1);
  const maxByPercent = roundedRupees(
    eligibleAmountInr * (Number(settings.max_redeem_percent) / 100)
  );
  const maxByFixed = settings.max_redeem_points_per_order * pointValue;
  const maxDiscount = Math.min(eligibleAmountInr, maxByPercent, maxByFixed);
  const maxPointsByDiscount = Math.floor(maxDiscount / pointValue);
  const maxPoints = Math.min(availablePoints, settings.max_redeem_points_per_order, maxPointsByDiscount);

  if (maxPoints < settings.min_redeem_points) return 0;
  return maxPoints;
}

export function calculateRewardDiscount(points: number, pointValueInr: number) {
  if (points <= 0) return 0;
  return roundedRupees(points * Number(pointValueInr || 1));
}

/** Points earned after a successful paid order. */
export function calculateEarnedPointsPreview(
  settings: Pick<RewardSettings, 'earn_points_per_order'>,
  redeemedOnOrder: number
) {
  if (redeemedOnOrder > 0) {
    return Math.max(0, settings.earn_points_per_order - redeemedOnOrder);
  }
  return settings.earn_points_per_order;
}

export function formatPointValue(settings: Pick<RewardSettings, 'point_value_inr'>) {
  return `1 point = ₹${Number(settings.point_value_inr).toLocaleString('en-IN')}`;
}
