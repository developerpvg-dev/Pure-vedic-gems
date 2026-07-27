'use client';

import { Gift, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import { useCurrencySubscription } from '@/lib/hooks/useCurrency';
import {
  calculateMaxRedeemablePoints,
  calculateRewardDiscount,
} from '@/lib/rewards/rules';

export interface CheckoutRewardState {
  available_points: number;
  point_value_inr: number;
  min_redeem_points: number;
  max_redeem_points_per_order: number;
  max_redeem_percent: number;
  earn_points_per_order: number;
  is_active: boolean;
}

interface RewardPointsRedemptionProps {
  userSignedIn: boolean;
  loading: boolean;
  rewards: CheckoutRewardState | null;
  subtotal: number;
  pointsToRedeem: number;
  onChange: (points: number) => void;
}

function calculateMaxRedeem(rewards: CheckoutRewardState | null, subtotal: number) {
  if (!rewards?.is_active) return 0;
  return calculateMaxRedeemablePoints(rewards, rewards.available_points, subtotal);
}

export function estimateRewardDiscount(points: number, rewards: CheckoutRewardState | null, subtotal: number) {
  if (!rewards?.is_active) return 0;
  const maxPoints = calculateMaxRedeem(rewards, subtotal);
  const applied = Math.min(Math.max(0, points), maxPoints);
  return calculateRewardDiscount(applied, Number(rewards.point_value_inr || 1));
}

export function RewardPointsRedemption({
  userSignedIn,
  loading,
  rewards,
  subtotal,
  pointsToRedeem,
  onChange,
}: RewardPointsRedemptionProps) {
  useCurrencySubscription();
  const maxRedeem = calculateMaxRedeem(rewards, subtotal);
  const appliedPoints = Math.min(pointsToRedeem, maxRedeem);
  const discount = estimateRewardDiscount(appliedPoints, rewards, subtotal);

  if (!userSignedIn) {
    return (
      <div className="pvg-checkout-optional">
        <div className="flex items-center gap-2 text-sm text-[#7a6250]">
          <Gift className="h-4 w-4 shrink-0 text-[#8a6400]" />
          <span>Sign in to redeem reward points on this order.</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pvg-checkout-optional flex items-center gap-2 text-sm text-[#7a6250]">
        <Loader2 className="h-4 w-4 animate-spin text-[#8a6400]" />
        Loading reward points…
      </div>
    );
  }

  if (!rewards?.is_active) return null;

  return (
    <div className="pvg-checkout-optional">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Gift className="h-4 w-4 shrink-0 text-[#8a6400]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#3d2b1f]">Reward points</p>
            <p className="text-xs text-[#7a6250]">
              {rewards.available_points.toLocaleString('en-IN')} available · max{' '}
              {maxRedeem.toLocaleString('en-IN')} pts
              {discount > 0 ? ` · −${formatPrice(discount)}` : ''}
            </p>
          </div>
        </div>
        {maxRedeem > 0 ? (
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <input
              type="number"
              min={rewards.min_redeem_points}
              max={maxRedeem}
              value={pointsToRedeem || ''}
              onChange={(event) => {
                const value = Number(event.target.value) || 0;
                onChange(
                  value === 0
                    ? 0
                    : Math.min(maxRedeem, Math.max(rewards.min_redeem_points, value)),
                );
              }}
              placeholder={`Up to ${maxRedeem}`}
              className="pvg-checkout-input !py-2 sm:w-28"
            />
            <button
              type="button"
              onClick={() => onChange(maxRedeem)}
              className="shrink-0 rounded-lg border border-stone-200 px-2.5 py-2 text-xs font-semibold text-[#3d2b1f] hover:bg-stone-50"
            >
              Max
            </button>
            {appliedPoints > 0 ? (
              <button
                type="button"
                onClick={() => onChange(0)}
                className="shrink-0 rounded-lg bg-[#3d2b1f] px-2.5 py-2 text-xs font-semibold text-white"
              >
                Clear
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs text-[#7a6250]">None redeemable on this total.</p>
        )}
      </div>
    </div>
  );
}
