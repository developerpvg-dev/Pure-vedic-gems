'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';
import { useCurrencySubscription } from '@/lib/hooks/useCurrency';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';
import { buildCartItemPriceBreakdown } from '@/lib/cart/price-breakdown';
import type { SelectedShippingPlan } from '@/lib/types/shipping';
import type { CartItem } from '@/lib/types/cart';
import { estimateClientTax } from '@/lib/utils/tax';
import type { CheckoutRewardState } from '@/components/checkout/RewardPointsRedemption';
import { estimateRewardDiscount } from '@/components/checkout/RewardPointsRedemption';
import { CheckoutCouponField } from '@/components/checkout/CheckoutCouponField';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  selectedShippingPlan: SelectedShippingPlan | null;
  rewardPointsToRedeem?: number;
  rewards?: CheckoutRewardState | null;
  couponCode?: string | null;
  appliedCouponCode?: string | null;
  couponDiscount?: number;
  onApplyCoupon?: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onRemoveCoupon?: () => void;
  couponDisabled?: boolean;
}

function amountLabel(amount: number | null, display?: string) {
  if (display) return display;
  if (amount == null) return '—';
  return formatPrice(amount);
}

function lineTotalInclGst(
  breakdown: ReturnType<typeof buildCartItemPriceBreakdown>,
  quantity: number,
) {
  return (breakdown.preGstSubtotal + breakdown.estimatedGst) * quantity;
}

export function CheckoutOrderSummary({
  items,
  selectedShippingPlan,
  rewardPointsToRedeem = 0,
  rewards = null,
  couponCode = null,
  appliedCouponCode = null,
  couponDiscount = 0,
  onApplyCoupon,
  onRemoveCoupon,
  couponDisabled = false,
}: CheckoutOrderSummaryProps) {
  useCurrencySubscription();
  const [breakupOpen, setBreakupOpen] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = selectedShippingPlan?.cost ?? 0;
  const rewardDiscount = estimateRewardDiscount(rewardPointsToRedeem, rewards, subtotal);
  const gst = estimateClientTax(items, shipping);
  const total = Math.max(0, subtotal - couponDiscount - rewardDiscount + shipping + gst);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const itemBreakups = useMemo(
    () => items.map((item) => ({ item, breakdown: buildCartItemPriceBreakdown(item) })),
    [items],
  );

  return (
    <div className="pvg-checkout-summary">
      <div className="pvg-checkout-summary-head">
        <h2 className="pvg-checkout-summary-title">Order summary</h2>
        <p className="pvg-checkout-summary-count">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
          {gst > 0 ? ' · jewellery prices incl. GST' : ''}
        </p>
      </div>

      <div className="pvg-checkout-summary-body">
        <div>
          {itemBreakups.map(({ item, breakdown }) => {
            const priceInclGst = lineTotalInclGst(breakdown, item.quantity);
            return (
            <div key={item.key} className="pvg-checkout-item-block">
              <div className="pvg-checkout-item">
                <div className="pvg-checkout-item-thumb">
                  <Image
                    src={item.image_url || '/placeholder-gem.png'}
                    alt={item.name}
                    fill
                    sizes="52px"
                    className="object-cover"
                  />
                  {item.quantity > 1 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8a6400] text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  )}
                </div>
                <div className="pvg-checkout-item-info">
                  <p className="pvg-checkout-item-name">{item.name}</p>
                  {(item.carat_weight || item.origin) && (
                    <p className="pvg-checkout-item-meta">
                      {item.carat_weight ? `${item.carat_weight} ct` : ''}
                      {item.carat_weight && item.origin ? ' · ' : ''}
                      {item.origin ?? ''}
                    </p>
                  )}
                  {Boolean(item.configuration_summary || item.configuration_snapshot) && (
                    <div className="pvg-checkout-item-chips-wrap">
                      <ConfigurationDetailsDisplay
                        snapshot={item.configuration_snapshot}
                        summary={item.configuration_summary}
                        deliveryEtaLabel={item.delivery_eta_label}
                        variant="compact"
                      />
                    </div>
                  )}
                </div>
                <p className="pvg-checkout-item-price">{formatPrice(priceInclGst)}</p>
              </div>
            </div>
            );
          })}
        </div>

        {onApplyCoupon && onRemoveCoupon ? (
          <CheckoutCouponField
            couponCode={couponCode ?? ''}
            appliedCode={appliedCouponCode}
            couponDiscount={couponDiscount}
            disabled={couponDisabled}
            onApply={onApplyCoupon}
            onRemove={onRemoveCoupon}
          />
        ) : null}

        <div className="pvg-checkout-breakup">
          <button
            type="button"
            className="pvg-checkout-breakup-toggle"
            aria-expanded={breakupOpen}
            onClick={() => setBreakupOpen((open) => !open)}
          >
            <span>Price details</span>
            <span className="inline-flex items-center gap-1.5">
              {!breakupOpen ? (
                <span className="tabular-nums text-[#8a6400]">{formatPrice(total)}</span>
              ) : null}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${breakupOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </button>

          <div className="pvg-checkout-lines">
            <div className="pvg-checkout-line">
              <span>
                Subtotal
                {gst > 0 ? (
                  <span className="block text-[0.7rem] text-[var(--pvg-muted)]">
                    incl. GST on jewellery
                  </span>
                ) : null}
              </span>
              <span>{formatPrice(subtotal + gst)}</span>
            </div>
            <div className="pvg-checkout-line">
              <span>
                Shipping
                {selectedShippingPlan ? (
                  <span className="block text-[0.7rem] text-[var(--pvg-muted)]">
                    {selectedShippingPlan.label}
                  </span>
                ) : null}
              </span>
              <span>
                {selectedShippingPlan ? formatPrice(shipping) : 'Select shipping above'}
              </span>
            </div>
            {rewardDiscount > 0 && (
              <div className="pvg-checkout-line pvg-checkout-line--discount">
                <span>Reward points</span>
                <span>-{formatPrice(rewardDiscount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="pvg-checkout-line pvg-checkout-line--discount">
                <span>Coupon{appliedCouponCode ? ` (${appliedCouponCode})` : ''}</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
          </div>

          {breakupOpen ? (
            <div className="pvg-checkout-lines pvg-checkout-lines--breakup">
              {itemBreakups.map(({ item, breakdown }) => (
                <div key={`breakup-${item.key}`} className="pvg-checkout-item-charges">
                  <div className="pvg-checkout-line pvg-checkout-line--item-head">
                    <span>
                      {item.name}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    </span>
                    <span>
                      {formatPrice(lineTotalInclGst(breakdown, item.quantity))}
                    </span>
                  </div>
                  {breakdown.lines.map((line) => (
                    <div key={`${item.key}-${line.key}`} className="pvg-checkout-line pvg-checkout-line--charge">
                      <span>
                        {line.label}
                        {line.detail ? (
                          <span className="block text-[0.68rem] font-normal text-[var(--pvg-muted)]">
                            {line.detail}
                          </span>
                        ) : null}
                      </span>
                      <span>{amountLabel(line.amount, line.display)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pvg-checkout-total">
          <span className="pvg-checkout-total-label">Total</span>
          <span className="pvg-checkout-total-value">{formatPrice(total)}</span>
        </div>

        <p className="pvg-checkout-footnote">
          Jewellery prices include 3% GST. Gemstones, Rudraksha, and shipping are GST-free. Invoice tax
          split is calculated securely before payment.
        </p>
      </div>
    </div>
  );
}
