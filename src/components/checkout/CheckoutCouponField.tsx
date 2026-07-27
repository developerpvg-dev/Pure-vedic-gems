'use client';

import { useState } from 'react';
import { Check, Loader2, Tag, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format';

type Props = {
  couponCode: string;
  appliedCode: string | null;
  couponDiscount: number;
  disabled?: boolean;
  onApply: (code: string) => Promise<{ ok: boolean; error?: string }>;
  onRemove: () => void;
};

export function CheckoutCouponField({
  couponCode,
  appliedCode,
  couponDiscount,
  disabled = false,
  onApply,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(Boolean(couponCode));
  const [input, setInput] = useState(couponCode);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    const code = input.trim();
    if (!code) {
      setError('Enter a coupon code.');
      return;
    }
    setApplying(true);
    setError(null);
    const result = await onApply(code);
    setApplying(false);
    if (!result.ok) {
      setError(result.error || 'Coupon could not be applied.');
      return;
    }
    setOpen(false);
  }

  if (appliedCode && couponDiscount > 0) {
    return (
      <div className="pvg-checkout-coupon pvg-checkout-coupon--applied">
        <div className="pvg-checkout-coupon-applied-main">
          <span className="pvg-checkout-coupon-badge" aria-hidden>
            <Check className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <p className="pvg-checkout-coupon-applied-code">{appliedCode}</p>
            <p className="pvg-checkout-coupon-applied-save">
              You save {formatPrice(couponDiscount)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onRemove();
            setInput('');
            setOpen(false);
            setError(null);
          }}
          disabled={disabled}
          className="pvg-checkout-coupon-remove"
        >
          Remove
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="pvg-checkout-coupon-trigger"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <Tag className="h-3.5 w-3.5" />
        Have a coupon code?
      </button>
    );
  }

  return (
    <div className="pvg-checkout-coupon">
      <div className="pvg-checkout-coupon-head">
        <span className="pvg-checkout-coupon-head-label">
          <Tag className="h-3.5 w-3.5" />
          Coupon code
        </span>
        <button
          type="button"
          className="pvg-checkout-coupon-cancel"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={disabled || applying}
          aria-label="Close coupon"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="pvg-checkout-coupon-row">
        <input
          id="pvg-coupon-code"
          type="text"
          value={input}
          autoFocus
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleApply();
            }
          }}
          disabled={disabled || applying}
          placeholder="ENTER CODE"
          className="pvg-checkout-coupon-input"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={disabled || applying || !input.trim()}
          className="pvg-checkout-coupon-apply"
        >
          {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error ? <p className="pvg-checkout-coupon-error">{error}</p> : null}
    </div>
  );
}
