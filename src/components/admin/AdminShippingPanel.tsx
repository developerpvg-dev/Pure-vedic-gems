'use client';

import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Save, Truck } from 'lucide-react';

interface ShippingMethod {
  id: string;
  label: string;
  cost: number;
  free_above: number | null;
  country_code?: string | null;
  zones: string[];
  is_active: boolean;
  sort_order: number;
  min_order_amount?: number | null;
  max_order_amount?: number | null;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  description?: string | null;
}

interface ShippingCountry {
  code: string;
  name: string;
  requires_indian_pincode: boolean;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_SHIPPING_FORM = {
  id: '',
  label: '',
  description: '',
  cost: '',
  country_code: 'IN',
  min_order_amount: '',
  max_order_amount: '',
  estimated_days_min: '',
  estimated_days_max: '',
  sort_order: '0',
  is_active: true,
};

export function AdminShippingPanel({ showTitle = false }: { showTitle?: boolean }) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingCountries, setShippingCountries] = useState<ShippingCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [shippingForm, setShippingForm] = useState(EMPTY_SHIPPING_FORM);
  const [editingShippingId, setEditingShippingId] = useState<string | null>(null);
  const [countryForm, setCountryForm] = useState({
    code: '',
    name: '',
    requires_indian_pincode: false,
    sort_order: '0',
    is_active: true,
  });

  async function loadShipping() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/commerce');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Unable to load shipping settings');
      } else {
        const data = await res.json();
        setShippingMethods(data.shippingMethods || []);
        setShippingCountries(data.shippingCountries || []);
      }
    } catch {
      setError('Failed to load shipping settings');
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShipping();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function saveCommerce(resource: string, payload: Record<string, unknown>, onSuccess?: () => void) {
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/admin/commerce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, payload }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Save failed');
      return;
    }
    setMessage('Saved successfully');
    onSuccess?.();
    await loadShipping();
  }

  async function disableCommerce(resource: string, id: string) {
    if (!confirm('Disable this item?')) return;
    const res = await fetch(`/api/admin/commerce?resource=${resource}&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    setMessage(res.ok ? 'Disabled successfully' : 'Disable failed');
    await loadShipping();
  }

  function resetShippingForm() {
    setEditingShippingId(null);
    setShippingForm(EMPTY_SHIPPING_FORM);
  }

  function startEditShippingPlan(method: ShippingMethod) {
    setEditingShippingId(method.id);
    setShippingForm({
      id: method.id,
      label: method.label,
      description: method.description ?? '',
      cost: String(method.cost),
      country_code: method.country_code || method.zones?.[0] || 'IN',
      min_order_amount: method.min_order_amount != null ? String(method.min_order_amount) : '',
      max_order_amount: method.max_order_amount != null ? String(method.max_order_amount) : '',
      estimated_days_min: method.estimated_days_min != null ? String(method.estimated_days_min) : '',
      estimated_days_max: method.estimated_days_max != null ? String(method.estimated_days_max) : '',
      sort_order: String(method.sort_order ?? 0),
      is_active: method.is_active,
    });
    document.getElementById('shipping-plan-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const activeShippingPlans = [...shippingMethods]
    .filter((method) => method.is_active)
    .sort((a, b) => {
      const countryCompare = (a.country_code || '').localeCompare(b.country_code || '');
      if (countryCompare !== 0) return countryCompare;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

  const shippingPlansByCountry = activeShippingPlans.reduce<Record<string, ShippingMethod[]>>((groups, method) => {
    const code = method.country_code || '—';
    if (!groups[code]) groups[code] = [];
    groups[code].push(method);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle ? (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Zones & Plans</h1>
          <p className="mt-1 text-sm text-gray-500">
            Full zone list and paid plans — India (IN), International (XX), and named countries.
          </p>
        </div>
      ) : null}

      {(message || error) && (
        <p className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
          {error || message}
        </p>
      )}

      <div className="grid gap-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
            <Truck className="h-4 w-4" /> Shipping Zones
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Plan zones only — use <span className="font-semibold">IN</span> for India and{' '}
            <span className="font-semibold">XX</span> for all international orders. Checkout address
            countries/states/cities come from the full country list.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveCommerce('shipping_country', countryForm);
            }}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              value={countryForm.code}
              onChange={(e) => setCountryForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="Code (IN)"
              maxLength={2}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase"
            />
            <input
              required
              value={countryForm.name}
              onChange={(e) => setCountryForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Country name"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={countryForm.sort_order}
              onChange={(e) => setCountryForm((p) => ({ ...p, sort_order: e.target.value }))}
              placeholder="Sort"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={countryForm.requires_indian_pincode}
                onChange={(e) => setCountryForm((p) => ({ ...p, requires_indian_pincode: e.target.checked }))}
              />{' '}
              Indian pincode
            </label>
            <button
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-5"
            >
              <Save className="h-4 w-4" /> Save Country
            </button>
          </form>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shippingCountries.length === 0 ? (
              <p className="text-sm text-gray-400 sm:col-span-2 lg:col-span-3">No shipping zones yet.</p>
            ) : (
              shippingCountries.map((country) => (
                <div key={country.code} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{country.name}</p>
                    <p className="text-xs text-gray-500">
                      {country.code} · sort {country.sort_order}
                      {country.requires_indian_pincode ? ' · Indian pincode' : ''}
                      {!country.is_active ? ' · inactive' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => disableCommerce('shipping_country', country.code)}
                    className="text-xs font-semibold text-red-600"
                  >
                    Disable
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="shipping-plan-form" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
                <Truck className="h-4 w-4" /> Shipping Plans
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editingShippingId
                  ? 'Update cost, order-value band, or label for this plan.'
                  : 'Add a paid plan for India (IN) or International (XX), with optional min/max order value.'}
              </p>
            </div>
            {editingShippingId ? (
              <button
                type="button"
                onClick={resetShippingForm}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
                New plan
              </button>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveCommerce('shipping', shippingForm, resetShippingForm);
            }}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              value={shippingForm.id}
              onChange={(e) => setShippingForm((p) => ({ ...p, id: e.target.value }))}
              placeholder="Plan ID (auto-generated if empty)"
              readOnly={Boolean(editingShippingId)}
              className={`rounded-lg border border-gray-200 px-3 py-2 text-sm ${editingShippingId ? 'bg-gray-50 text-gray-500' : ''}`}
            />
            <input
              required
              value={shippingForm.label}
              onChange={(e) => setShippingForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="Plan label"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={shippingForm.country_code}
              onChange={(e) => setShippingForm((p) => ({ ...p, country_code: e.target.value }))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {shippingCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={shippingForm.cost}
              onChange={(e) => setShippingForm((p) => ({ ...p, cost: e.target.value }))}
              placeholder="Cost (INR)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={shippingForm.min_order_amount}
              onChange={(e) => setShippingForm((p) => ({ ...p, min_order_amount: e.target.value }))}
              placeholder="Min order value (INR)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={shippingForm.max_order_amount}
              onChange={(e) => setShippingForm((p) => ({ ...p, max_order_amount: e.target.value }))}
              placeholder="Max order value (INR)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={shippingForm.estimated_days_min}
              onChange={(e) => setShippingForm((p) => ({ ...p, estimated_days_min: e.target.value }))}
              placeholder="Min days"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={shippingForm.estimated_days_max}
              onChange={(e) => setShippingForm((p) => ({ ...p, estimated_days_max: e.target.value }))}
              placeholder="Max days"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min="0"
              step="1"
              value={shippingForm.sort_order}
              onChange={(e) => setShippingForm((p) => ({ ...p, sort_order: e.target.value }))}
              placeholder="Sort order"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={shippingForm.description}
              onChange={(e) => setShippingForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description (shown at checkout)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2 lg:col-span-4"
            />
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {editingShippingId ? 'Update plan' : 'Add plan'}
              </button>
              {editingShippingId ? (
                <button
                  type="button"
                  onClick={resetShippingForm}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Active plans ({activeShippingPlans.length})
            </h3>
            {activeShippingPlans.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">No active shipping plans yet.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {Object.entries(shippingPlansByCountry).map(([countryCode, plans]) => {
                  const countryName =
                    shippingCountries.find((c) => c.code === countryCode)?.name ?? countryCode;
                  return (
                    <div key={countryCode}>
                      <p className="mb-2 text-xs font-semibold text-gray-700">{countryName}</p>
                      <div className="space-y-2">
                        {plans.map((method) => (
                          <div
                            key={method.id}
                            className={`flex flex-col gap-3 rounded-lg px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                              editingShippingId === method.id
                                ? 'bg-amber-50 ring-1 ring-amber-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900">{method.label}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                <span className="font-mono">{method.id}</span>
                                {' · '}₹{method.cost.toLocaleString('en-IN')}
                                {method.min_order_amount != null || method.max_order_amount != null
                                  ? ` · order ₹${method.min_order_amount != null ? method.min_order_amount.toLocaleString('en-IN') : '0'}–${method.max_order_amount != null ? method.max_order_amount.toLocaleString('en-IN') : '∞'}`
                                  : ''}
                                {method.estimated_days_min != null && method.estimated_days_max != null
                                  ? ` · ${method.estimated_days_min}–${method.estimated_days_max} days`
                                  : ''}
                                {' · sort '}
                                {method.sort_order}
                              </p>
                              {method.description ? (
                                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{method.description}</p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditShippingPlan(method)}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => disableCommerce('shipping', method.id)}
                                className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Disable
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
