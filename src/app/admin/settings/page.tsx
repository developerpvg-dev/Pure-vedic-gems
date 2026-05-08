'use client';

import { useEffect, useState } from 'react';
import { BadgeIndianRupee, Loader2, Plus, Save, Shield, Truck, TicketPercent, UserPlus, Users, X } from 'lucide-react';

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
  zones: string[];
  is_active: boolean;
  sort_order: number;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  usage_limit: number | null;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

interface CurrencyRate {
  id: string;
  base_currency: string;
  currency: string;
  rate: number;
  manual_override: boolean;
  is_active: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  content: 'Content',
  finance: 'Finance',
  fulfillment: 'Fulfillment',
  support: 'Support',
  director: 'Owner',
  manager: 'Admin',
  accounts: 'Finance',
};

const DEFAULT_ROLES = ['owner', 'admin', 'sales', 'content', 'finance', 'fulfillment', 'support'];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('commerce');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', name: '', role: 'sales' });
  const [shippingForm, setShippingForm] = useState({ id: '', label: '', cost: '0', free_above: '', zones: 'IN', sort_order: '0', is_active: true });
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '0', usage_limit: '', valid_until: '', is_active: true });
  const [currencyForm, setCurrencyForm] = useState({ base_currency: 'INR', currency: 'USD', rate: '', manual_override: true, is_active: true });
  const [settingsForm, setSettingsForm] = useState({ gst_enabled: true, tax_note: 'GST calculated at checkout', notify_admin_email: '' });

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [teamRes, commerceRes] = await Promise.all([fetch('/api/admin/settings'), fetch('/api/admin/commerce')]);
      if (teamRes.ok) {
        const data = await teamRes.json();
        setMembers(data.members || []);
        setRoles(data.roles || DEFAULT_ROLES);
      }
      if (!commerceRes.ok) {
        const data = await commerceRes.json().catch(() => ({}));
        setError(data.error || 'Unable to load commerce settings');
      } else {
        const data = await commerceRes.json();
        setShippingMethods(data.shippingMethods || []);
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

  async function saveCommerce(resource: string, payload: Record<string, unknown>) {
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
    await loadAll();
  }

  async function disableCommerce(resource: string, id: string) {
    if (!confirm('Disable this item?')) return;
    const res = await fetch(`/api/admin/commerce?resource=${resource}&id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setMessage(res.ok ? 'Disabled successfully' : 'Disable failed');
    await loadAll();
  }

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberForm),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Failed to add member');
      return;
    }
    setShowAddMember(false);
    setMemberForm({ email: '', name: '', role: 'sales' });
    setMessage('Team member added');
    await loadAll();
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;

  return (
    <div className="space-y-6">
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
          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><Truck className="h-4 w-4" /> Shipping Methods</h2>
            <form
              onSubmit={(event) => { event.preventDefault(); void saveCommerce('shipping', shippingForm); }}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <input value={shippingForm.id} onChange={(e) => setShippingForm((p) => ({ ...p, id: e.target.value }))} placeholder="ID auto from label" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input required value={shippingForm.label} onChange={(e) => setShippingForm((p) => ({ ...p, label: e.target.value }))} placeholder="Label" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={shippingForm.cost} onChange={(e) => setShippingForm((p) => ({ ...p, cost: e.target.value }))} placeholder="Cost" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={shippingForm.free_above} onChange={(e) => setShippingForm((p) => ({ ...p, free_above: e.target.value }))} placeholder="Free above" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={shippingForm.zones} onChange={(e) => setShippingForm((p) => ({ ...p, zones: e.target.value }))} placeholder="Zones: IN,UK" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={shippingForm.sort_order} onChange={(e) => setShippingForm((p) => ({ ...p, sort_order: e.target.value }))} placeholder="Sort" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2"><Save className="h-4 w-4" /> Save Shipping</button>
            </form>
            <div className="mt-4 space-y-2">
              {shippingMethods.map((method, index) => (
                <div key={method.id || `${method.label}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div><p className="font-semibold text-gray-900">{method.label}</p><p className="text-xs text-gray-500">₹{method.cost} · {method.zones?.join(', ') || 'All zones'}</p></div>
                  <button onClick={() => disableCommerce('shipping', method.id)} className="text-xs font-semibold text-red-600">Disable</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><TicketPercent className="h-4 w-4" /> Coupons</h2>
            <form onSubmit={(event) => { event.preventDefault(); void saveCommerce('coupon', couponForm); }} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={couponForm.code} onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value }))} placeholder="Code" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <select value={couponForm.discount_type} onChange={(e) => setCouponForm((p) => ({ ...p, discount_type: e.target.value }))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select>
              <input required value={couponForm.discount_value} onChange={(e) => setCouponForm((p) => ({ ...p, discount_value: e.target.value }))} placeholder="Discount value" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={couponForm.min_order_amount} onChange={(e) => setCouponForm((p) => ({ ...p, min_order_amount: e.target.value }))} placeholder="Min order" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={couponForm.usage_limit} onChange={(e) => setCouponForm((p) => ({ ...p, usage_limit: e.target.value }))} placeholder="Usage limit" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input type="date" value={couponForm.valid_until} onChange={(e) => setCouponForm((p) => ({ ...p, valid_until: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2"><Save className="h-4 w-4" /> Save Coupon</button>
            </form>
            <div className="mt-4 space-y-2">
              {coupons.map((coupon, index) => (
                <div key={coupon.id || `${coupon.code}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <div><p className="font-semibold text-gray-900">{coupon.code}</p><p className="text-xs text-gray-500">{coupon.discount_type} · {coupon.discount_value} · used {coupon.used_count}</p></div>
                  <button onClick={() => disableCommerce('coupon', coupon.id)} className="text-xs font-semibold text-red-600">Disable</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><BadgeIndianRupee className="h-4 w-4" /> Currency Rates</h2>
            <form onSubmit={(event) => { event.preventDefault(); void saveCommerce('currency', currencyForm); }} className="mt-4 grid gap-3 sm:grid-cols-4">
              <input value={currencyForm.base_currency} onChange={(e) => setCurrencyForm((p) => ({ ...p, base_currency: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input value={currencyForm.currency} onChange={(e) => setCurrencyForm((p) => ({ ...p, currency: e.target.value }))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <input required value={currencyForm.rate} onChange={(e) => setCurrencyForm((p) => ({ ...p, rate: e.target.value }))} placeholder="Rate" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <button disabled={saving} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save FX</button>
            </form>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {currencyRates.map((rate, index) => <div key={rate.id || `${rate.base_currency}-${rate.currency}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">{rate.base_currency}/{rate.currency}: <strong>{rate.rate}</strong></div>)}
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
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><Users className="h-4 w-4" /> Team & RBAC</h2>
            <button onClick={() => setShowAddMember(true)} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white"><UserPlus className="h-4 w-4" /> Add Member</button>
          </div>
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

      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={addMember} className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Add Team Member</h2><button type="button" onClick={() => setShowAddMember(false)}><X className="h-5 w-5 text-gray-400" /></button></div>
            <div className="mt-4 space-y-3">
              <input type="email" required value={memberForm.email} onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))} placeholder="User email" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              <input required value={memberForm.name} onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))} placeholder="Display name" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
              <select value={memberForm.role} onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">{roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role] || role}</option>)}</select>
              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Add Member</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}