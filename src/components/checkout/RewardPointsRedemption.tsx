'use client';

import { Gift, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import {
  calculateMaxRedeemablePoints,
  calculateRewardDiscount,
  calculateEarnedPointsPreview,
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
  const maxRedeem = calculateMaxRedeem(rewards, subtotal);
  const appliedPoints = Math.min(pointsToRedeem, maxRedeem);
  const discount = estimateRewardDiscount(appliedPoints, rewards, subtotal);
  const earnAfterOrder = rewards
    ? calculateEarnedPointsPreview(rewards, appliedPoints)
    : 0;

  if (!userSignedIn) {
    return (
      <div className="pvg-checkout-step">
        <div className="flex gap-3">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
          <div>
            <h3 className="font-heading text-base font-semibold text-brand-primary">Reward Points</h3>
            <p className="mt-1 text-sm text-brand-muted">Sign in before payment to redeem migrated PVG reward points on this order.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pvg-checkout-step flex items-center gap-3 text-sm text-[#7a6250]">
        <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
        Loading reward points...
      </div>
    );
  }

  if (!rewards?.is_active) return null;

  return (
    <div className="pvg-checkout-step">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
          <div>
            <h3 className="font-heading text-base font-semibold text-brand-primary">Reward Points</h3>
            <p className="mt-1 text-sm text-brand-muted">
              {rewards.available_points.toLocaleString('en-IN')} points available (1 point = ₹
              {Number(rewards.point_value_inr).toLocaleString('en-IN')}).
              {appliedPoints > 0
                ? ` You will earn ${earnAfterOrder.toLocaleString('en-IN')} points after payment.`
                : ` Earn up to ${rewards.earn_points_per_order.toLocaleString('en-IN')} points after payment.`}
            </p>
          </div>
        </div>
        {discount > 0 && (
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
            -{formatPrice(discount)}
          </span>
        )}
      </div>

      {maxRedeem > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="number"
            min={rewards.min_redeem_points}
            max={maxRedeem}
            value={pointsToRedeem || ''}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              onChange(value === 0 ? 0 : Math.min(maxRedeem, Math.max(rewards.min_redeem_points, value)));
            }}
            placeholder={`Redeem up to ${maxRedeem}`}
            className="pvg-checkout-input"
          />
          <button
            type="button"
            onClick={() => onChange(maxRedeem)}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-bg-alt"
          >
            Use Max
          </button>
          <button
            type="button"
            onClick={() => onChange(0)}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Clear
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-brand-muted">No points are currently redeemable for this order total.</p>
      )}

      {appliedPoints > 0 && (
        <p className="mt-3 text-xs text-brand-muted">
          {appliedPoints.toLocaleString('en-IN')} point(s) = {formatPrice(discount)} off this order.
          Points are reserved at checkout and confirmed only after successful payment.
        </p>
      )}
    </div>
  );
}