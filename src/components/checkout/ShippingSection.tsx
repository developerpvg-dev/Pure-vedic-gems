'use client';

import { useState, useCallback } from 'react';
import { MapPin, Pencil, ChevronDown, Truck, Zap, Clock } from 'lucide-react';
import { ShippingAddressSchema, SHIPPING_METHODS, type ShippingAddress, type ShippingMethodId } from '@/lib/validators/order';

// ─── Indian Pincode → City/State mapping (common metros + major cities) ─────
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

/**
 * Auto-fill city and state from pincode.
 * Uses a local map for common codes; in production, integrate India Post API.
 */
function lookupPincode(pincode: string): { city: string; state: string } | null {
  // Exact match first
  if (PINCODE_MAP[pincode]) return PINCODE_MAP[pincode];

  // Try prefix match (first 3 digits → state/city region)
  const prefix = pincode.slice(0, 3);
  for (const [code, data] of Object.entries(PINCODE_MAP)) {
    if (code.startsWith(prefix)) return data;
  }

  return null;
}

interface ShippingSectionProps {
  isActive: boolean;
  isComplete: boolean;
  savedData: ShippingAddress | null;
  savedMethod: ShippingMethodId;
  onComplete: (data: ShippingAddress, method: ShippingMethodId) => void;
  onEdit: () => void;
  disabled: boolean;
}

const methodIcons: Record<ShippingMethodId, React.ElementType> = {
  standard: Truck,
  express: Zap,
  same_day: Clock,
};

export function ShippingSection({
  isActive,
  isComplete,
  savedData,
  savedMethod,
  onComplete,
  onEdit,
  disabled,
}: ShippingSectionProps) {
  const [line1, setLine1] = useState(savedData?.line1 ?? '');
  const [line2, setLine2] = useState(savedData?.line2 ?? '');
  const [city, setCity] = useState(savedData?.city ?? '');
  const [state, setState] = useState(savedData?.state ?? '');
  const [pincode, setPincode] = useState(savedData?.pincode ?? '');
  const [country] = useState(savedData?.country ?? 'India');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>(savedMethod);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);

  // ── Pincode auto-fill ────────────────────────────────────────────────
  const handlePincodeChange = useCallback((value: string) => {
    // Only allow digits, max 6
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setPincodeAutoFilled(false);

    if (clean.length === 6) {
      const result = lookupPincode(clean);
      if (result) {
        setCity(result.city);
        setState(result.state);
        setPincodeAutoFilled(true);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = ShippingAddressSchema.safeParse({
      line1,
      line2: line2 || undefined,
      city,
      state,
      pincode,
      country,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        if (msgs && msgs.length > 0) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    onComplete(result.data, shippingMethod);
  };

  // ── Collapsed/complete view ──────────────────────────────────────────
  if (!isActive && isComplete && savedData) {
    return (
      <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              ✓
            </span>
            <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
              Shipping Address
            </h2>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-sm text-[var(--pvg-accent)] hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        <div className="text-sm text-[var(--pvg-muted)] space-y-1 ml-8">
          <p>{savedData.line1}{savedData.line2 ? `, ${savedData.line2}` : ''}</p>
          <p>{savedData.city}, {savedData.state} - {savedData.pincode}</p>
          <p className="text-xs">
            {SHIPPING_METHODS.find((m) => m.id === savedMethod)?.label}
          </p>
        </div>
      </div>
    );
  }

  // ── Disabled view ────────────────────────────────────────────────────
  if (!isActive || disabled) {
    return (
      <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6 opacity-50">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--pvg-bg-alt)] text-[var(--pvg-muted)] text-xs font-bold">
            2
          </span>
          <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
            Shipping Address
          </h2>
        </div>
      </div>
    );
  }

  // ── Active form ──────────────────────────────────────────────────────
  return (
    <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-border)] p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--pvg-accent)] text-white text-xs font-bold">
          2
        </span>
        <h2 className="font-heading text-lg font-semibold text-[var(--pvg-primary)]">
          Shipping Address
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Address Line 1 */}
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
              className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.line1 ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
          </div>
          {errors.line1 && <p className="text-xs text-red-500 mt-1">{errors.line1}</p>}
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Address Line 2 <span className="text-[var(--pvg-muted)]">(Optional)</span>
          </label>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Landmark, Area, Colony"
            className="w-full px-4 py-3 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)]"
          />
        </div>

        {/* Pincode + City + State */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pincode */}
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              Pincode *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={pincode}
              onChange={(e) => handlePincodeChange(e.target.value)}
              placeholder="110017"
              maxLength={6}
              className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.pincode ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
            {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
            {pincodeAutoFilled && (
              <p className="text-xs text-green-600 mt-1">✓ Auto-filled</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              City *
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.city ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              State *
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className={`w-full px-4 py-3 rounded-lg border text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] ${
                errors.state ? 'border-red-400' : 'border-[var(--pvg-border)]'
              }`}
            />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
          </div>
        </div>

        {/* Country (read-only for now — India only) */}
        <div>
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
            Country
          </label>
          <input
            type="text"
            value={country}
            readOnly
            className="w-full px-4 py-3 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-muted)] bg-[var(--pvg-bg-alt)] cursor-not-allowed"
          />
        </div>

        {/* Shipping Method */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-[var(--pvg-text)] mb-3">
            Shipping Method
          </label>
          <div className="space-y-2">
            {SHIPPING_METHODS.map((method) => {
              const Icon = methodIcons[method.id];
              return (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    shippingMethod === method.id
                      ? 'border-[var(--pvg-accent)] bg-[var(--pvg-gold-light)]'
                      : 'border-[var(--pvg-border)] hover:border-[var(--pvg-accent)]/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping_method"
                    value={method.id}
                    checked={shippingMethod === method.id}
                    onChange={() => setShippingMethod(method.id)}
                    className="sr-only"
                  />
                  <Icon className="h-4.5 w-4.5 text-[var(--pvg-accent)]" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--pvg-text)]">
                      {method.label}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--pvg-primary)]">
                    {method.cost === 0 ? 'FREE' : `₹${method.cost}`}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[var(--pvg-primary)] text-white py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Continue to Payment
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </button>
      </form>
    </div>
  );
}
