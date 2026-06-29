'use client';

import { useEffect, useState } from 'react';
import { BadgeIndianRupee, Loader2, Mail, Pencil, Plus, Save, Search, Shield, Truck, TicketPercent, UserPlus, Users, X } from 'lucide-react';
import {
  FX_CURRENCY_OPTIONS,
  currencyRateKey,
  formatCurrencyRateLabel,
  type NormalizedCurrencyRate,
} from '@/lib/admin/commerce-currency';

type Tab = 'commerce' | 'team';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface ShippingMethod {
  id: string;
  label: string;
  cost: number;
  free_above: number | null;
  country_code?: string | null;
  zones: string[];
  is_active: boolean;
  sort_order: number;
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

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  applies_to_category_slugs: string[];
  first_time_customers_only: boolean;
  is_active: boolean;
}

type CurrencyRate = NormalizedCurrencyRate;

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  content: 'Content',
  inventory: 'Inventory',
  finance: 'Finance',
  fulfillment: 'Fulfillment',
  support: 'Support',
  designer: 'Jewelry Designer',
  director: 'Owner',
  manager: 'Admin',
  accounts: 'Finance',
};

const DEFAULT_INVITE_ROLES = ['admin', 'sales', 'content', 'inventory', 'finance', 'fulfillment', 'support', 'designer'];

const EMPTY_SHIPPING_FORM = {
  id: '',
  label: '',
  description: '',
  cost: '',
  country_code: 'IN',
  estimated_days_min: '',
  estimated_days_max: '',
  sort_order: '0',
  is_active: true,
};

const EMPTY_COUPON_FORM = {
  id: '',
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  max_discount: '',
  usage_limit: '',
  usage_limit_per_customer: '',
  valid_from: '',
  valid_until: '',
  applies_to_category_slugs: '',
  first_time_customers_only: false,
  is_active: true,
};

const EMPTY_CURRENCY_FORM = {
  id: '',
  base_currency: 'INR',
  currency: 'USD',
  rate: '',
  manual_override: true,
  is_active: true,
};

function toDateInputValue(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function couponStatus(coupon: Coupon): 'active' | 'expired' | 'exhausted' | 'inactive' {
  if (!coupon.is_active) return 'inactive';
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return 'expired';
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) return 'exhausted';
  return 'active';
}

function couponStatusClass(status: ReturnType<typeof couponStatus>) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'expired':
      return 'bg-orange-100 text-orange-700';
    case 'exhausted':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function formatCouponDiscount(coupon: Coupon) {
  if (coupon.discount_type === 'percentage') {
    const cap = coupon.max_discount ? ` · max ₹${coupon.max_discount.toLocaleString('en-IN')}` : '';
    return `${coupon.discount_value}%${cap}`;
  }
  return `₹${coupon.discount_value.toLocaleString('en-IN')} off`;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('commerce');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<string[]>(DEFAULT_INVITE_ROLES);
  const [inviteRoles, setInviteRoles] = useState<string[]>(DEFAULT_INVITE_ROLES);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingCountries, setShippingCountries] = useState<ShippingCountry[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'sales' });
  const [inviteLink, setInviteLink] = useState('');
  const [inviteModalError, setInviteModalError] = useState('');
  const [shippingForm, setShippingForm] = useState(EMPTY_SHIPPING_FORM);
  const [editingShippingId, setEditingShippingId] = useState<string | null>(null);
  const [countryForm, setCountryForm] = useState({
    code: '',
    name: '',
    requires_indian_pincode: false,
    sort_order: '0',
    is_active: true,
  });
  const [couponForm, setCouponForm] = useState(EMPTY_COUPON_FORM);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilter, setCouponFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currencyForm, setCurrencyForm] = useState(EMPTY_CURRENCY_FORM);
  const [editingCurrencyKey, setEditingCurrencyKey] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({ gst_enabled: true, tax_note: 'GST calculated at checkout', notify_admin_email: '' });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [teamRes, commerceRes] = await Promise.all([fetch('/api/admin/settings'), fetch('/api/admin/commerce')]);
      if (teamRes.ok) {
        const data = await teamRes.json();
        setMembers(data.members || []);
        setRoles(data.roles || DEFAULT_INVITE_ROLES);
        setInviteRoles(data.inviteRoles || DEFAULT_INVITE_ROLES);
      }
      if (!commerceRes.ok) {
        const data = await commerceRes.json().catch(() => ({}));
        setError(data.error || 'Unable to load commerce settings');
      } else {
        const data = await commerceRes.json();
        setShippingMethods(data.shippingMethods || []);
        setShippingCountries(data.shippingCountries || []);
        setCoupons(data.coupons || []);
        setCurrencyRates(data.currencyRates || []);
        if (data.commerceSettings?.values) setSettingsForm((current) => ({ ...current, ...data.commerceSettings.values }));
      }
    } catch {
      setError('Failed to load settings');
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAll(); }, 0);
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
    await loadAll();
  }

  async function disableCommerce(resource: string, id: string) {
    if (!confirm('Disable this item?')) return;
    const res = await fetch(`/api/admin/commerce?resource=${resource}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setMessage(res.ok ? 'Disabled successfully' : 'Disable failed');
    await loadAll();
  }

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setInviteLink('');
    setInviteModalError('');
    setMessage('');

    const res = await fetch('/api/admin/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteForm),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setInviteModalError(data.error || 'Failed to send invitation');
      return;
    }

    setShowInviteMember(false);
    setInviteForm({ email: '', name: '', role: 'sales' });
    setInviteLink(data.inviteUrl || '');
    setMessage(data.message || 'Invitation sent. The link expires in 15 minutes.');
    await loadAll();
  }

  function openInviteModal() {
    setInviteModalError('');
    setShowInviteMember(true);
  }

  async function updateMember(id: string, updates: Record<string, unknown>) {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: id, ...updates }),
    });
    setMessage(res.ok ? 'Team member updated' : 'Team update failed');
    await loadAll();
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

  function resetCouponForm() {
    setEditingCouponId(null);
    setCouponForm(EMPTY_COUPON_FORM);
  }

  function startEditCoupon(coupon: Coupon) {
    setEditingCouponId(coupon.id);
    setCouponForm({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount ?? 0),
      max_discount: coupon.max_discount != null ? String(coupon.max_discount) : '',
      usage_limit: coupon.usage_limit != null ? String(coupon.usage_limit) : '',
      usage_limit_per_customer: coupon.usage_limit_per_customer != null ? String(coupon.usage_limit_per_customer) : '',
      valid_from: toDateInputValue(coupon.valid_from),
      valid_until: toDateInputValue(coupon.valid_until),
      applies_to_category_slugs: (coupon.applies_to_category_slugs ?? []).join(', '),
      first_time_customers_only: coupon.first_time_customers_only,
      is_active: coupon.is_active,
    });
    document.getElementById('coupon-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetCurrencyForm() {
    setEditingCurrencyKey(null);
    setCurrencyForm(EMPTY_CURRENCY_FORM);
  }

  function startEditCurrency(rate: CurrencyRate) {
    const key = currencyRateKey(rate);
    setEditingCurrencyKey(key);
    setCurrencyForm({
      id: rate.id ?? '',
      base_currency: rate.base_currency,
      currency: rate.currency,
      rate: String(rate.rate),
      manual_override: rate.manual_override,
      is_active: rate.is_active,
    });
    document.getElementById('currency-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const filteredCoupons = coupons
    .filter((coupon) => {
      if (couponFilter === 'active' && !coupon.is_active) return false;
      if (couponFilter === 'inactive' && coupon.is_active) return false;
      if (!couponSearch.trim()) return true;
      const q = couponSearch.trim().toLowerCase();
      return coupon.code.toLowerCase().includes(q);
    })
    .sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.code.localeCompare(b.code));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-1 text-sm text-gray-500">Commerce controls, team roles, and launch operations.</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {(['commerce', 'team'] as Tab[]).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-md px-4 py-2 text-sm font-semibold capitalize ${tab === item ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {(message || error) && <p className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{error || message}</p>}

      {tab === 'commerce' ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-gray-200 bg-white p-5 xl:col-span-2">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><Truck className="h-4 w-4" /> Shipping Countries</h2>
            <p className="mt-1 text-sm text-gray-500">Countries shown in checkout. Each country can have multiple paid shipping plans.</p>
            <form
              onSubmit={(event) => { event.preventDefault(); void saveCommerce('shipping_country', countryForm); }}
              className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
            >
              <input required value={countryForm.code} onChange={(e) => setCountryForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="Code (IN)" maxLength={2} className="rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase" />
              <input required value={countryForm.name} onChange={(e) => setCountryForm((p) => ({ ...p, name: e.target.value }))} placeholder="Country name" className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2" />
              <input value={countryForm.sort_order} onChange={(e) => setCountryForm((p) => ({ ...p, sort_order: e.target.value }))} placeholder="Sort" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={countryForm.requires_indian_pincode} onChange={(e) => setCountryForm((p) => ({ ...p, requires_indian_pincode: e.target.checked }))} /> Indian pincode</label>
              <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2 lg:col-span-5"><Save className="h-4 w-4" /> Save Country</button>
            </form>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {shippingCountries.map((country) => (
                <div key={country.code} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{country.name}</p>
                    <p className="text-xs text-gray-500">{country.code} · sort {country.sort_order}</p>
                  </div>
                  <button onClick={() => disableCommerce('shipping_country', country.code)} className="text-xs font-semibold text-red-600">Disable</button>
                </div>
              ))}
            </div>
          </section>

          <section id="shipping-plan-form" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
                  <Truck className="h-4 w-4" /> Shipping Plans
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editingShippingId ? 'Update pricing, delivery days, or label for this plan.' : 'Add a new paid shipping plan for a country.'}
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
                  <option key={country.code} value={country.code}>{country.name}</option>
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
                    const countryName = shippingCountries.find((c) => c.code === countryCode)?.name ?? countryCode;
                    return (
                      <div key={countryCode}>
                        <p className="mb-2 text-xs font-semibold text-gray-700">{countryName}</p>
                        <div className="space-y-2">
                          {plans.map((method) => (
                            <div
                              key={method.id}
                              className={`flex flex-col gap-3 rounded-lg px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                                editingShippingId === method.id ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-gray-50'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900">{method.label}</p>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  <span className="font-mono">{method.id}</span>
                                  {' · '}
                                  ₹{method.cost.toLocaleString('en-IN')}
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

          <section id="coupon-form" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
                  <TicketPercent className="h-4 w-4" /> Coupons
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editingCouponId ? 'Update discount rules, limits, and validity.' : 'Create percentage or fixed-amount discount codes for checkout.'}
                </p>
              </div>
              {editingCouponId ? (
                <button
                  type="button"
                  onClick={resetCouponForm}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New coupon
                </button>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveCommerce(
                  'coupon',
                  {
                    ...couponForm,
                    id: editingCouponId || couponForm.id || undefined,
                  },
                  resetCouponForm
                );
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <input
                required
                value={couponForm.code}
                onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="Coupon code"
                readOnly={Boolean(editingCouponId)}
                className={`rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase ${editingCouponId ? 'bg-gray-50 text-gray-500' : ''}`}
              />
              <select
                value={couponForm.discount_type}
                onChange={(e) => setCouponForm((p) => ({ ...p, discount_type: e.target.value }))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount (₹)</option>
              </select>
              <input
                required
                type="number"
                min="0"
                step={couponForm.discount_type === 'percentage' ? '0.01' : '1'}
                value={couponForm.discount_value}
                onChange={(e) => setCouponForm((p) => ({ ...p, discount_value: e.target.value }))}
                placeholder={couponForm.discount_type === 'percentage' ? 'Discount %' : 'Discount ₹'}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={couponForm.max_discount}
                onChange={(e) => setCouponForm((p) => ({ ...p, max_discount: e.target.value }))}
                placeholder="Max discount cap (₹)"
                disabled={couponForm.discount_type !== 'percentage'}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
              <input
                type="number"
                min="0"
                step="1"
                value={couponForm.min_order_amount}
                onChange={(e) => setCouponForm((p) => ({ ...p, min_order_amount: e.target.value }))}
                placeholder="Min order (₹)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                step="1"
                value={couponForm.usage_limit}
                onChange={(e) => setCouponForm((p) => ({ ...p, usage_limit: e.target.value }))}
                placeholder="Total usage limit"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="1"
                step="1"
                value={couponForm.usage_limit_per_customer}
                onChange={(e) => setCouponForm((p) => ({ ...p, usage_limit_per_customer: e.target.value }))}
                placeholder="Per-customer limit"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={couponForm.valid_from}
                onChange={(e) => setCouponForm((p) => ({ ...p, valid_from: e.target.value }))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                aria-label="Valid from"
              />
              <input
                type="date"
                value={couponForm.valid_until}
                onChange={(e) => setCouponForm((p) => ({ ...p, valid_until: e.target.value }))}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                aria-label="Valid until"
              />
              <input
                value={couponForm.applies_to_category_slugs}
                onChange={(e) => setCouponForm((p) => ({ ...p, applies_to_category_slugs: e.target.value }))}
                placeholder="Category slugs (comma-separated)"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
              />
              <label className="inline-flex items-center gap-2 self-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={couponForm.first_time_customers_only}
                  onChange={(e) => setCouponForm((p) => ({ ...p, first_time_customers_only: e.target.checked }))}
                />
                First-time customers only
              </label>
              <label className="inline-flex items-center gap-2 self-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={couponForm.is_active}
                  onChange={(e) => setCouponForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Active
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {editingCouponId ? 'Update coupon' : 'Add coupon'}
                </button>
                {editingCouponId ? (
                  <button
                    type="button"
                    onClick={resetCouponForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  All coupons ({filteredCoupons.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'inactive'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setCouponFilter(filter)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        couponFilter === filter ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Search coupon code…"
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm"
                />
              </div>

              {filteredCoupons.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400">No coupons match your filters.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {filteredCoupons.map((coupon) => {
                    const status = couponStatus(coupon);
                    return (
                      <div
                        key={coupon.id}
                        className={`flex flex-col gap-3 rounded-lg px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
                          editingCouponId === coupon.id ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">{coupon.code}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${couponStatusClass(status)}`}>
                              {status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatCouponDiscount(coupon)}
                            {coupon.min_order_amount > 0 ? ` · min ₹${coupon.min_order_amount.toLocaleString('en-IN')}` : ''}
                            {' · used '}
                            {coupon.used_count}
                            {coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ''}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {coupon.valid_until ? `Expires ${new Date(coupon.valid_until).toLocaleDateString('en-IN')}` : 'No expiry'}
                            {coupon.first_time_customers_only ? ' · First order only' : ''}
                            {(coupon.applies_to_category_slugs ?? []).length
                              ? ` · Categories: ${coupon.applies_to_category_slugs.join(', ')}`
                              : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCoupon(coupon)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          {coupon.is_active ? (
                            <button
                              type="button"
                              onClick={() => disableCommerce('coupon', coupon.id)}
                              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                void saveCommerce('coupon', {
                                  id: coupon.id,
                                  code: coupon.code,
                                  discount_type: coupon.discount_type,
                                  discount_value: coupon.discount_value,
                                  min_order_amount: coupon.min_order_amount,
                                  max_discount: coupon.max_discount,
                                  usage_limit: coupon.usage_limit,
                                  usage_limit_per_customer: coupon.usage_limit_per_customer,
                                  valid_from: coupon.valid_from,
                                  valid_until: coupon.valid_until,
                                  applies_to_category_slugs: coupon.applies_to_category_slugs ?? [],
                                  first_time_customers_only: coupon.first_time_customers_only,
                                  is_active: true,
                                })
                              }
                              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section id="currency-form" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600">
                  <BadgeIndianRupee className="h-4 w-4" /> Currency Rates
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Set how many INR each foreign currency equals. Used for multi-currency product pricing.
                </p>
              </div>
              {editingCurrencyKey ? (
                <button
                  type="button"
                  onClick={resetCurrencyForm}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New rate
                </button>
              ) : null}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveCommerce(
                  'currency',
                  {
                    ...currencyForm,
                    id: currencyForm.id || undefined,
                    base_currency: 'INR',
                  },
                  resetCurrencyForm
                );
              }}
              className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Base: <strong>INR</strong>
              </div>
              <select
                value={currencyForm.currency}
                onChange={(e) => setCurrencyForm((p) => ({ ...p, currency: e.target.value }))}
                disabled={Boolean(editingCurrencyKey) && currencyForm.currency === 'INR'}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-gray-50"
              >
                <option value="INR">INR (base)</option>
                {FX_CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <input
                required
                type="number"
                min="0.0001"
                step="0.0001"
                value={currencyForm.rate}
                onChange={(e) => setCurrencyForm((p) => ({ ...p, rate: e.target.value }))}
                placeholder="INR per 1 unit"
                disabled={currencyForm.currency === 'INR'}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
              />
              <label className="inline-flex items-center gap-2 self-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={currencyForm.manual_override}
                  onChange={(e) => setCurrencyForm((p) => ({ ...p, manual_override: e.target.checked }))}
                />
                Manual override
              </label>
              {currencyForm.currency !== 'INR' && currencyForm.rate ? (
                <p className="text-sm text-gray-600 sm:col-span-2 lg:col-span-4">
                  Preview: <strong>1 {currencyForm.currency} = ₹{Number(currencyForm.rate).toLocaleString('en-IN')}</strong>
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {editingCurrencyKey ? 'Update rate' : 'Add rate'}
                </button>
                {editingCurrencyKey ? (
                  <button
                    type="button"
                    onClick={resetCurrencyForm}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Active rates ({currencyRates.length})
              </h3>
              {currencyRates.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">No currency rates configured yet.</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {currencyRates.map((rate) => {
                    const key = currencyRateKey(rate);
                    const isEditing = editingCurrencyKey === key;
                    return (
                      <div
                        key={key}
                        className={`flex flex-col gap-3 rounded-lg px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                          isEditing ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrencyRateLabel(rate)}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {rate.manual_override ? 'Manual' : 'Auto'}
                            {rate.source ? ` · ${rate.source}` : ''}
                            {rate.updated_at ? ` · updated ${new Date(rate.updated_at).toLocaleDateString('en-IN')}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditCurrency(rate)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          {rate.currency !== 'INR' ? (
                            <button
                              type="button"
                              onClick={() => disableCommerce('currency', key)}
                              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Tax, Notifications & Site Settings</h2>
            <form onSubmit={(event) => { event.preventDefault(); void saveCommerce('settings', settingsForm); }} className="mt-4 grid gap-3">
              <input value={settingsForm.tax_note} onChange={(e) => setSettingsForm((p) => ({ ...p, tax_note: e.target.value }))} placeholder="Tax note" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={settingsForm.notify_admin_email} onChange={(e) => setSettingsForm((p) => ({ ...p, notify_admin_email: e.target.value }))} placeholder="Notification email" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={settingsForm.gst_enabled} onChange={(e) => setSettingsForm((p) => ({ ...p, gst_enabled: e.target.checked }))} /> GST enabled</label>
              <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" /> Save Settings</button>
            </form>
          </section>
        </div>
      ) : (
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><Users className="h-4 w-4" /> Team & RBAC</h2>
              <p className="mt-1 text-xs text-gray-500">All team members are invited by email. The link is valid for 15 minutes.</p>
            </div>
            <button onClick={openInviteModal} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              <UserPlus className="h-4 w-4" /> Invite Team Member
            </button>
          </div>
          {inviteLink ? (
            <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-3 text-sm text-indigo-900">
              <p className="font-semibold">Invitation link (15 min):</p>
              <p className="mt-1 break-all font-mono text-xs">{inviteLink}</p>
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500"><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Joined</th><th className="p-3">Actions</th></tr></thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50">
                    <td className="p-3"><span className="inline-flex items-center gap-2 font-medium text-gray-900"><Shield className="h-4 w-4 text-gray-300" />{member.name}</span></td>
                    <td className="p-3"><select value={member.role} onChange={(e) => updateMember(member.id, { role: e.target.value })} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>)}</select></td>
                    <td className="p-3"><button onClick={() => updateMember(member.id, { is_active: !member.is_active })} className={`rounded-full px-3 py-1 text-xs font-semibold ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{member.is_active ? 'Active' : 'Inactive'}</button></td>
                    <td className="p-3 text-gray-500">{new Date(member.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-3"><button onClick={() => updateMember(member.id, { is_active: false })} disabled={!member.is_active} className="text-xs font-semibold text-red-600 disabled:text-gray-300">Deactivate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showInviteMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={inviteMember} className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Invite Team Member</h2>
              <button type="button" onClick={() => setShowInviteMember(false)} aria-label="Close">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              They will receive an email with a secure link to create their account. The link expires in 15 minutes.
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email address"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
              />
              <input
                required
                value={inviteForm.name}
                onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Display name"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
              >
                {inviteRoles.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>
                ))}
              </select>

              {inviteModalError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteModalError}</p>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {saving ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}