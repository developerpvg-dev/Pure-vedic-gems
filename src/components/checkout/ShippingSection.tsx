'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { MapPin, Pencil, ChevronDown, Truck, Zap, Clock, Globe, Loader2 } from 'lucide-react';
import { ShippingAddressSchema, type ShippingAddress, type ShippingMethodId } from '@/lib/validators/order';
import type { SelectedShippingPlan, ShippingCountry, ShippingPlan } from '@/lib/types/shipping';
import { formatPrice } from '@/lib/utils/format';

const PINCODE_MAP: Record<string, { city: string; state: string }> = {
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110017': { city: 'New Delhi', state: 'Delhi' },
  '110019': { city: 'New Delhi', state: 'Delhi' },
  '110020': { city: 'New Delhi', state: 'Delhi' },
  '110049': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '400070': { city: 'Mumbai', state: 'Maharashtra' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Bengaluru', state: 'Karnataka' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '600028': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '160017': { city: 'Chandigarh', state: 'Chandigarh' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '440001': { city: 'Nagpur', state: 'Maharashtra' },
  '395001': { city: 'Surat', state: 'Gujarat' },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '682001': { city: 'Kochi', state: 'Kerala' },
};

function lookupPincode(pincode: string) {
  if (PINCODE_MAP[pincode]) return PINCODE_MAP[pincode];
  const prefix = pincode.slice(0, 3);
  for (const [code, data] of Object.entries(PINCODE_MAP)) {
    if (code.startsWith(prefix)) return data;
  }
  return null;
}

function planIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('express') || lower.includes('priority')) return Zap;
  if (lower.includes('same') || lower.includes('1-2')) return Clock;
  return Truck;
}

interface ShippingSectionProps {
  isActive: boolean;
  isComplete: boolean;
  savedData: ShippingAddress | null;
  savedMethod: ShippingMethodId | null;
  savedPlan: SelectedShippingPlan | null;
  onComplete: (data: ShippingAddress, method: ShippingMethodId, plan: SelectedShippingPlan) => void;
  onEdit: () => void;
  disabled: boolean;
}

export function ShippingSection({
  isActive,
  isComplete,
  savedData,
  savedMethod,
  savedPlan,
  onComplete,
  onEdit,
  disabled,
}: ShippingSectionProps) {
  const [countries, setCountries] = useState<ShippingCountry[]>([]);
  const [plans, setPlans] = useState<ShippingPlan[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [line1, setLine1] = useState(savedData?.line1 ?? '');
  const [line2, setLine2] = useState(savedData?.line2 ?? '');
  const [city, setCity] = useState(savedData?.city ?? '');
  const [state, setState] = useState(savedData?.state ?? '');
  const [pincode, setPincode] = useState(savedData?.pincode ?? '');
  const [countryCode, setCountryCode] = useState(savedData?.country_code ?? 'IN');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId | ''>(savedMethod ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode) ?? null,
    [countries, countryCode]
  );

  const isIndia = countryCode === 'IN';

  useEffect(() => {
    let active = true;
    setLoadingCountries(true);
    fetch('/api/shipping')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load countries'))))
      .then((data: { countries?: ShippingCountry[] }) => {
        if (!active) return;
        const nextCountries = data.countries ?? [];
        setCountries(nextCountries);
        if (!savedData?.country_code && nextCountries.length > 0) {
          const india = nextCountries.find((c) => c.code === 'IN') ?? nextCountries[0];
          setCountryCode(india.code);
        }
      })
      .catch(() => {
        if (active) setLoadError('Unable to load shipping countries. Please refresh and try again.');
      })
      .finally(() => {
        if (active) setLoadingCountries(false);
      });
    return () => { active = false; };
  }, [savedData?.country_code]);

  useEffect(() => {
    if (!countryCode) return;
    let active = true;
    setLoadingPlans(true);
    setLoadError('');
    fetch(`/api/shipping?country=${encodeURIComponent(countryCode)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load plans'))))
      .then((data: { plans?: ShippingPlan[] }) => {
        if (!active) return;
        const nextPlans = data.plans ?? [];
        setPlans(nextPlans);
        setShippingMethod((current) => {
          if (current && nextPlans.some((plan) => plan.id === current)) return current;
          return nextPlans[0]?.id ?? '';
        });
      })
      .catch(() => {
        if (active) {
          setPlans([]);
          setShippingMethod('');
          setLoadError('Unable to load shipping plans for the selected country.');
        }
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => { active = false; };
  }, [countryCode]);

  const handlePincodeChange = useCallback((value: string, indian: boolean) => {
    const clean = indian ? value.replace(/\D/g, '').slice(0, 6) : value.slice(0, 20);
    setPincode(clean);
    setPincodeAutoFilled(false);

    if (indian && clean.length === 6) {
      const result = lookupPincode(clean);
      if (result) {
        setCity(result.city);
        setState(result.state);
        setPincodeAutoFilled(true);
      }
    }
  }, []);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setShippingMethod('');
    setPincode('');
    setPincodeAutoFilled(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!shippingMethod) {
      setErrors({ shipping_method: 'Please select a shipping plan' });
      return;
    }

    const countryName = selectedCountry?.name ?? countryCode;
    const result = ShippingAddressSchema.safeParse({
      line1,
      line2: line2 || undefined,
      city,
      state,
      pincode,
      country_code: countryCode,
      country: countryName,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        if (msgs && msgs.length > 0) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    const plan = plans.find((item) => item.id === shippingMethod);
    if (!plan) {
      setErrors({ shipping_method: 'Selected shipping plan is no longer available' });
      return;
    }

    onComplete(result.data, shippingMethod, {
      id: plan.id,
      label: plan.label,
      cost: Number(plan.cost),
      country_code: plan.country_code,
    });
  };

  if (!isActive && isComplete && savedData) {
    return (
      <div className="pvg-checkout-step pvg-checkout-step--complete">
        <div className="pvg-checkout-step-head pvg-checkout-step-head--tight">
          <div className="pvg-checkout-step-title-row">
            <span className="pvg-checkout-step-badge">✓</span>
            <h2 className="pvg-checkout-step-title">Shipping address</h2>
          </div>
          <button type="button" onClick={onEdit} className="pvg-checkout-step-edit">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <div className="pvg-checkout-step-summary">
          <p>{savedData.line1}{savedData.line2 ? `, ${savedData.line2}` : ''}</p>
          <p>{savedData.city}, {savedData.state} - {savedData.pincode}</p>
          <p>{savedData.country}</p>
          <p className="text-xs">{savedPlan?.label ?? savedMethod}</p>
        </div>
      </div>
    );
  }

  if (!isActive || disabled) {
    return (
      <div className="pvg-checkout-step pvg-checkout-step--disabled">
        <div className="pvg-checkout-step-title-row">
          <span className="pvg-checkout-step-badge">2</span>
          <h2 className="pvg-checkout-step-title">Shipping address</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="pvg-checkout-step pvg-checkout-step--active">
      <div className="pvg-checkout-step-head">
        <div className="pvg-checkout-step-title-row">
          <span className="pvg-checkout-step-badge">2</span>
          <h2 className="pvg-checkout-step-title">Shipping address</h2>
        </div>
      </div>

      {loadError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Country *
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--pvg-muted)]" />
            <select
              value={countryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={loadingCountries || countries.length === 0}
              className="w-full appearance-none pl-10 pr-4 py-3 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-text)] bg-brand-bg focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)]"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Address Line 1 *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--pvg-muted)]" />
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="House/Flat No., Building, Street"
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.line1 ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
          </div>
          {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Address Line 2 <span className="text-[var(--pvg-muted)]">(Optional)</span>
          </label>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Landmark, Area, Colony"
            className="w-full px-4 py-3 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              {isIndia ? 'Pincode *' : 'Postal code *'}
            </label>
            <input
              type="text"
              inputMode={isIndia ? 'numeric' : 'text'}
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value, isIndia)}
              placeholder={isIndia ? '110017' : 'Postal code'}
              maxLength={isIndia ? 6 : 20}
              className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.pincode ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
            {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
            {pincodeAutoFilled && <p className="text-xs text-green-600 mt-1">City and state auto-filled</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">City *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.city ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              State / Province *
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State / Province"
              className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.state ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-3">
            Shipping Plan
          </label>
          {loadingPlans ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--pvg-border)] px-4 py-6 text-sm text-[var(--pvg-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading plans for {selectedCountry?.name ?? 'selected country'}...
            </div>
          ) : plans.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No shipping plans are available for this country yet. Please choose another country or contact support.
            </p>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => {
                const Icon = planIcon(plan.label);
                const eta =
                  plan.estimated_days_min != null && plan.estimated_days_max != null
                    ? `${plan.estimated_days_min}-${plan.estimated_days_max} days`
                    : null;
                return (
                  <label
                    key={plan.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      shippingMethod === plan.id
                        ? 'border-[var(--pvg-accent)] bg-brand-gold-light'
                        : 'border-[var(--pvg-border)] hover:border-[var(--pvg-accent)]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping_method"
                      value={plan.id}
                      checked={shippingMethod === plan.id}
                      onChange={() => setShippingMethod(plan.id)}
                      className="sr-only"
                    />
                    <Icon className="h-4.5 w-4.5 text-[var(--pvg-accent)] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[var(--pvg-text)] block">
                        {plan.label}
                      </span>
                      {plan.description ? (
                        <span className="text-xs text-[var(--pvg-muted)] block mt-1">{plan.description}</span>
                      ) : null}
                      {eta ? <span className="text-xs text-[var(--pvg-muted)] block mt-1">ETA: {eta}</span> : null}
                    </div>
                    <span className="text-sm font-semibold text-[var(--pvg-primary)] shrink-0">
                      {formatPrice(Number(plan.cost))}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {errors.shipping_method && <p className="text-xs text-red-500 mt-2">{errors.shipping_method}</p>}
        </div>

        <button
          type="submit"
          disabled={plans.length === 0 || !shippingMethod}
          className="pvg-checkout-btn pvg-checkout-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </button>
      </form>
    </div>
  );
}
