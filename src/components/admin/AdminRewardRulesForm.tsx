'use client';

import { useMemo } from 'react';
import { Calculator, Gift, Info, Save } from 'lucide-react';
import {
  calculateEarnedPointsPreview,
  calculateMaxRedeemablePoints,
  calculateRewardDiscount,
  formatPointValue,
  type RewardRulesInput,
} from '@/lib/rewards/rules';

interface AdminRewardRulesFormProps {
  settings: RewardRulesInput;
  saving: boolean;
  onChange: (settings: RewardRulesInput) => void;
  onSubmit: (event: React.FormEvent) => void;
}

const EXAMPLE_ORDER_INR = 50_000;
const EXAMPLE_BALANCE = 10_000;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      {children}
      <p className="text-xs leading-relaxed text-gray-500">{hint}</p>
    </label>
  );
}

export default function AdminRewardRulesForm({
  settings,
  saving,
  onChange,
  onSubmit,
}: AdminRewardRulesFormProps) {
  const preview = useMemo(() => {
    const maxPoints = calculateMaxRedeemablePoints(settings, EXAMPLE_BALANCE, EXAMPLE_ORDER_INR);
    const maxDiscount = calculateRewardDiscount(maxPoints, Number(settings.point_value_inr));
    const earnNoRedeem = calculateEarnedPointsPreview(settings, 0);
    const earnWithMaxRedeem = calculateEarnedPointsPreview(settings, maxPoints);
    const percentCap = Math.round(EXAMPLE_ORDER_INR * (Number(settings.max_redeem_percent) / 100));
    const fixedCap = settings.max_redeem_points_per_order * Number(settings.point_value_inr);

    return {
      maxPoints,
      maxDiscount,
      earnNoRedeem,
      earnWithMaxRedeem,
      percentCap,
      fixedCap,
    };
  }, [settings]);

  const validationError = useMemo(() => {
    if (settings.min_redeem_points > settings.max_redeem_points_per_order) {
      return 'Minimum redeem points cannot be higher than the per-order maximum.';
    }
    if (settings.point_value_inr <= 0) {
      return 'Point value must be greater than zero.';
    }
    const percent = Number(settings.max_redeem_percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return 'Maximum redeem percent must be between 0 and 100.';
    }
    return null;
  }, [settings]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Reward Rules</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure how customers earn and redeem PVG reward points at checkout. Changes apply to
            new orders immediately.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-6">
        {/* Program status */}
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={settings.is_active}
              onChange={(event) =>
                onChange({ ...settings, is_active: event.target.checked })
              }
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">Rewards program active</span>
              <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                When disabled, customers cannot redeem points at checkout and no new points are
                awarded after payment. Existing balances remain in the ledger.
              </span>
            </span>
          </label>
        </div>

        {/* Earning */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">How points are earned</h3>
          <p className="mt-1 text-xs text-gray-500">
            Points are awarded once per paid order — not as a percentage of order value. This
            matches the legacy SUMO rewards model.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Points earned per paid order"
              hint="Flat grant after successful payment capture. Example: 500 means every completed order earns 500 points (before redemption offset below)."
            >
              <input
                type="number"
                min={0}
                value={settings.earn_points_per_order}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    earn_points_per_order: Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field
              label="Redemption reduces earn (automatic)"
              hint={`If a customer redeems points on the same order, earn is reduced 1:1. Example: earn ${settings.earn_points_per_order} − redeem 100 = ${calculateEarnedPointsPreview(settings, 100)} points awarded.`}
            >
              <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                Earn = max(0, {settings.earn_points_per_order} − points redeemed on order)
              </div>
            </Field>
          </div>
        </div>

        {/* Redemption value */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">Point value & redemption limits</h3>
          <p className="mt-1 text-xs text-gray-500">
            Redemption is capped against merchandise total (gem + metal + making + certification +
            puja, after any coupon). Shipping and GST are not included in the % base.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Rupee value per point"
              hint={formatPointValue(settings) + '. This is the discount applied at checkout for each point redeemed.'}
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₹</span>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={settings.point_value_inr}
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      point_value_inr: Number(event.target.value) || 1,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 py-2 pl-7 pr-3 text-sm"
                />
              </div>
            </Field>
            <Field
              label="Minimum points per order"
              hint="Customer must redeem at least this many points in one checkout (or none at all)."
            >
              <input
                type="number"
                min={0}
                value={settings.min_redeem_points}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    min_redeem_points: Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field
              label="Maximum points per order"
              hint={`Hard cap on points redeemed in a single checkout. At current value, this equals up to ₹${(settings.max_redeem_points_per_order * Number(settings.point_value_inr)).toLocaleString('en-IN')} off.`}
            >
              <input
                type="number"
                min={0}
                value={settings.max_redeem_points_per_order}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    max_redeem_points_per_order: Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </Field>
            <Field
              label="Maximum % of order merchandise"
              hint={`Discount from points cannot exceed this % of merchandise (after coupon). On ₹50,000 merchandise, the ${settings.max_redeem_percent}% cap = ₹${preview.percentCap.toLocaleString('en-IN')}. Example: 100 pts on a ₹100 order at 20% → max 20 pts off.`}
            >
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.max_redeem_percent}
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      max_redeem_percent: Number(event.target.value) || 0,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
            </Field>
          </div>
        </div>

        {/* Expiry */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">Point expiry</h3>
          <Field
            label="Expiry period (days)"
            hint={
              settings.expiry_days
                ? `Earned points expire ${settings.expiry_days} days after they are granted. Expired points are excluded from the customer's available balance.`
                : 'Leave empty for no expiry. Points remain usable until manually adjusted or redeemed.'
            }
          >
            <input
              type="number"
              min={1}
              value={settings.expiry_days ?? ''}
              onChange={(event) =>
                onChange({
                  ...settings,
                  expiry_days: event.target.value ? Number(event.target.value) : null,
                })
              }
              placeholder="No expiry"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm sm:max-w-xs"
            />
          </Field>
        </div>

        {/* Live preview */}
        <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Calculator className="h-4 w-4" />
            Example with current rules
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-950/90">
            <li>
              Customer with {EXAMPLE_BALANCE.toLocaleString('en-IN')} points checks out on a ₹
              {EXAMPLE_ORDER_INR.toLocaleString('en-IN')} product subtotal.
            </li>
            <li>
              Max redeemable: <strong>{preview.maxPoints.toLocaleString('en-IN')} points</strong> (₹
              {preview.maxDiscount.toLocaleString('en-IN')} off) — limited by balance,{' '}
              {settings.max_redeem_percent}% subtotal cap (₹{preview.percentCap.toLocaleString('en-IN')}),
              and per-order cap ({settings.max_redeem_points_per_order.toLocaleString('en-IN')} pts / ₹
              {preview.fixedCap.toLocaleString('en-IN')}).
            </li>
            <li>
              If they redeem nothing: earn <strong>{preview.earnNoRedeem.toLocaleString('en-IN')} points</strong>{' '}
              after payment.
            </li>
            <li>
              If they redeem the maximum ({preview.maxPoints.toLocaleString('en-IN')} pts): earn{' '}
              <strong>{preview.earnWithMaxRedeem.toLocaleString('en-IN')} points</strong> after payment.
            </li>
          </ul>
        </div>

        {/* Checkout flow note */}
        <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5 text-xs leading-relaxed text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Checkout flow:</strong> Points are reserved when the order is created (pending),
            confirmed after successful payment, and cancelled if payment fails. Only signed-in customers
            can earn or redeem. Guest checkout does not use rewards.
          </p>
        </div>

        {validationError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{validationError}</p>
        )}

        <button
          type="submit"
          disabled={saving || !!validationError}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          Save Reward Rules
        </button>
      </form>
    </section>
  );
}
