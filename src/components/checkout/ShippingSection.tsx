'use client';

import { useState, useEffect, useMemo } from 'react';
import { Country, State, City } from 'country-state-city';
import { Globe, MapPin, Pencil, ChevronDown, Truck, Loader2 } from 'lucide-react';
import { ShippingAddressSchema, type ShippingAddress, type ShippingMethodId } from '@/lib/validators/order';
import type { SelectedShippingPlan, ShippingPlan } from '@/lib/types/shipping';
import { formatPrice } from '@/lib/utils/format';
import { SearchableSelect } from '@/components/checkout/SearchableSelect';

const ALL_COUNTRIES = Country.getAllCountries();
const POPULAR_COUNTRY_CODES = ['IN', 'US', 'GB', 'AE', 'AU', 'CA', 'SG', 'DE'];
const COUNTRY_OPTIONS = ALL_COUNTRIES.map((c) => ({
  value: c.isoCode,
  label: c.name,
  hint: c.isoCode,
}));

interface ShippingSectionProps {
  isActive: boolean;
  isComplete: boolean;
  savedData: ShippingAddress | null;
  savedMethod: ShippingMethodId | null;
  savedPlan: SelectedShippingPlan | null;
  cartSubtotal: number;
  onComplete: (data: ShippingAddress, method: ShippingMethodId, plan: SelectedShippingPlan) => void;
  onPlanChange?: (plan: SelectedShippingPlan | null) => void;
  onEdit: () => void;
  disabled: boolean;
}

function toSelectedPlan(plan: ShippingPlan): SelectedShippingPlan {
  return {
    id: plan.id,
    label: plan.label,
    cost: Number(plan.cost),
    country_code: plan.country_code,
  };
}

function findStateCode(countryCode: string, stateName: string) {
  const states = State.getStatesOfCountry(countryCode);
  const match = states.find(
    (s) => s.name.toLowerCase() === stateName.trim().toLowerCase()
  );
  return match?.isoCode ?? '';
}

export function ShippingSection({
  isActive,
  isComplete,
  savedData,
  savedMethod,
  savedPlan,
  cartSubtotal,
  onComplete,
  onPlanChange,
  onEdit,
  disabled,
}: ShippingSectionProps) {
  const [plans, setPlans] = useState<ShippingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [line1, setLine1] = useState(savedData?.line1 ?? '');
  const [line2, setLine2] = useState(savedData?.line2 ?? '');
  const [city, setCity] = useState(savedData?.city ?? '');
  const [stateName, setStateName] = useState(savedData?.state ?? '');
  const [stateCode, setStateCode] = useState(
    savedData ? findStateCode(savedData.country_code, savedData.state) : ''
  );
  const [pincode, setPincode] = useState(savedData?.pincode ?? '');
  const [countryCode, setCountryCode] = useState(savedData?.country_code ?? 'IN');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId | ''>(savedMethod ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');

  const selectedCountry = useMemo(
    () => ALL_COUNTRIES.find((c) => c.isoCode === countryCode) ?? null,
    [countryCode]
  );
  const states = useMemo(() => State.getStatesOfCountry(countryCode), [countryCode]);
  const cities = useMemo(
    () => (stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [countryCode, stateCode]
  );
  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.isoCode, label: s.name })),
    [states]
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.name, label: c.name })),
    [cities]
  );
  const isIndia = countryCode === 'IN';

  useEffect(() => {
    if (!countryCode) return;
    let active = true;
    setLoadingPlans(true);
    setLoadError('');
    onPlanChange?.(null);
    const url = `/api/shipping?country=${encodeURIComponent(countryCode)}&subtotal=${encodeURIComponent(String(cartSubtotal))}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load plans'))))
      .then((data: { plans?: ShippingPlan[] }) => {
        if (!active) return;
        const nextPlans = data.plans ?? [];
        setPlans(nextPlans);
        const nextId =
          (shippingMethod && nextPlans.some((plan) => plan.id === shippingMethod)
            ? shippingMethod
            : nextPlans[0]?.id) ?? '';
        setShippingMethod(nextId);
        const selected = nextPlans.find((plan) => plan.id === nextId);
        onPlanChange?.(selected ? toSelectedPlan(selected) : null);
      })
      .catch(() => {
        if (active) {
          setPlans([]);
          setShippingMethod('');
          onPlanChange?.(null);
          setLoadError('Unable to load shipping plans for the selected country.');
        }
      })
      .finally(() => {
        if (active) setLoadingPlans(false);
      });
    return () => { active = false; };
    // ponytail: intentionally omit shippingMethod — re-fetch is keyed by country/subtotal only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, cartSubtotal]);

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setStateCode('');
    setStateName('');
    setCity('');
    setPincode('');
    setShippingMethod('');
    onPlanChange?.(null);
  };

  const handlePlanSelect = (planId: ShippingMethodId) => {
    setShippingMethod(planId);
    const plan = plans.find((item) => item.id === planId);
    onPlanChange?.(plan ? toSelectedPlan(plan) : null);
  };

  const handleStateChange = (code: string) => {
    setStateCode(code);
    const next = states.find((s) => s.isoCode === code);
    setStateName(next?.name ?? '');
    setCity('');
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
      state: stateName,
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

    onComplete(result.data, shippingMethod, toSelectedPlan(plan));
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

  const textInputClass = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] disabled:cursor-not-allowed disabled:opacity-55 ${
      hasError ? 'border-red-400' : 'border-[var(--pvg-border)]'
    }`;

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
          <SearchableSelect
            options={COUNTRY_OPTIONS}
            value={countryCode}
            onChange={handleCountryChange}
            placeholder="Search country"
            searchPlaceholder="Type to search country…"
            emptyLabel="No countries match"
            listLabel="Countries"
            icon={<Globe className="h-4 w-4 shrink-0 text-[var(--pvg-muted)]" />}
            popularValues={POPULAR_COUNTRY_CODES}
            popularLabel="Popular"
            allLabel="All countries"
          />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              State / Province *
            </label>
            {states.length > 0 ? (
              <SearchableSelect
                options={stateOptions}
                value={stateCode}
                onChange={handleStateChange}
                placeholder="Search state / province"
                searchPlaceholder="Type to search state…"
                emptyLabel="No states match"
                listLabel="States"
                hasError={Boolean(errors.state)}
              />
            ) : (
              <input
                type="text"
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  setStateCode('');
                }}
                placeholder="State / Province"
                className={textInputClass(Boolean(errors.state))}
              />
            )}
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">City *</label>
            {cities.length > 0 ? (
              <SearchableSelect
                options={cityOptions}
                value={city}
                onChange={setCity}
                placeholder={stateCode ? 'Search city' : 'Select state first'}
                searchPlaceholder="Type to search city…"
                emptyLabel="No cities match"
                listLabel="Cities"
                disabled={!stateCode}
                hasError={Boolean(errors.city)}
                maxResults={120}
              />
            ) : (
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={states.length > 0 && !stateCode ? 'Select state first' : 'City'}
                disabled={states.length > 0 && !stateCode}
                className={textInputClass(Boolean(errors.city))}
              />
            )}
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            {isIndia ? 'Pincode *' : 'Postal code *'}
          </label>
          <input
            type="text"
            inputMode={isIndia ? 'numeric' : 'text'}
            value={pincode}
            onChange={(e) => {
              const value = e.target.value;
              setPincode(isIndia ? value.replace(/\D/g, '').slice(0, 6) : value.slice(0, 20));
            }}
            placeholder={isIndia ? '110017' : 'Postal code'}
            maxLength={isIndia ? 6 : 20}
            className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-brand-bg placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
              errors.pincode ? 'border-red-400' : 'border-[var(--pvg-border)]'
            }`}
          />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-3">
            Shipping Plan
          </label>
          <p className="text-xs text-[var(--pvg-muted)] mb-3">
            Based on order value {formatPrice(cartSubtotal)}
            {isIndia ? ' · India' : ' · International'}
          </p>
          {loadingPlans ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--pvg-border)] px-4 py-6 text-sm text-[var(--pvg-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading shipping for {selectedCountry?.name ?? 'selected country'}...
            </div>
          ) : plans.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No shipping plan matches this order value for the selected country. Please contact support.
            </p>
          ) : (
            <div className="space-y-2">
              {plans.map((plan) => {
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
                      onChange={() => handlePlanSelect(plan.id)}
                      className="sr-only"
                    />
                    <Truck className="h-4.5 w-4.5 text-[var(--pvg-accent)] mt-0.5 shrink-0" />
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
