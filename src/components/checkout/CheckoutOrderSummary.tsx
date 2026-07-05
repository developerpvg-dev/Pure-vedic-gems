'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils/format';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';
import type { SelectedShippingPlan } from '@/lib/types/shipping';
import type { CartItem } from '@/lib/types/cart';
import { estimateClientTax } from '@/lib/utils/tax';
import type { CheckoutRewardState } from '@/components/checkout/RewardPointsRedemption';
import { estimateRewardDiscount } from '@/components/checkout/RewardPointsRedemption';

interface CheckoutOrderSummaryProps {
  items: CartItem[];
  selectedShippingPlan: SelectedShippingPlan | null;
  rewardPointsToRedeem?: number;
  rewards?: CheckoutRewardState | null;
}

export function CheckoutOrderSummary({
  items,
  selectedShippingPlan,
  rewardPointsToRedeem = 0,
  rewards = null,
}: CheckoutOrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = selectedShippingPlan?.cost ?? 0;
  const rewardDiscount = estimateRewardDiscount(rewardPointsToRedeem, rewards, subtotal);
  const gst = estimateClientTax(items, shipping);
  const total = Math.max(0, subtotal - rewardDiscount + shipping + gst);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="pvg-checkout-summary">
      <div className="pvg-checkout-summary-head">
        <h2 className="pvg-checkout-summary-title">Order summary</h2>
        <p className="pvg-checkout-summary-count">
          {itemCount} item{itemCount !== 1 ? 's' : ''} · taxes estimated below
        </p>
      </div>

      <div className="pvg-checkout-summary-body">
        <div>
          {items.map((item) => (
            <div key={item.key} className="pvg-checkout-item">
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
              <p className="pvg-checkout-item-price">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="pvg-checkout-lines">
          <div className="pvg-checkout-line">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="pvg-checkout-line">
            <span>Shipping</span>
            <span>
              {selectedShippingPlan ? formatPrice(shipping) : 'Select at checkout'}
            </span>
          </div>
          {selectedShippingPlan ? (
            <p className="text-xs text-[var(--pvg-muted)] -mt-1">{selectedShippingPlan.label}</p>
          ) : null}
          {rewardDiscount > 0 && (
            <div className="pvg-checkout-line pvg-checkout-line--discount">
              <span>Reward points</span>
              <span>-{formatPrice(rewardDiscount)}</span>
            </div>
          )}
          <div className="pvg-checkout-line">
            <span>Estimated GST/IGST</span>
            <span>{formatPrice(gst)}</span>
          </div>
        </div>

        <div className="pvg-checkout-total">
          <span className="pvg-checkout-total-label">Total</span>
          <span className="pvg-checkout-total-value">{formatPrice(total)}</span>
        </div>

        <p className="pvg-checkout-footnote">
          Final HSN, GST split, and invoice eligibility are recalculated securely before payment.
        </p>
      </div>
    </div>
  );
}
