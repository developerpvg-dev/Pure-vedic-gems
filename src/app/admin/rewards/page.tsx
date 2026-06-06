'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2, PlusCircle, RefreshCcw, Save, Search } from 'lucide-react';

interface RewardSettingsRow {
  is_active: boolean;
  earn_points_per_order: number;
  point_value_inr: number;
  min_redeem_points: number;
  max_redeem_points_per_order: number;
  max_redeem_percent: number;
  expiry_days: number | null;
}

interface RewardBalance {
  available_points: number;
  confirmed_points: number;
  pending_redeemed_points: number;
  lifetime_earned_points: number;
  lifetime_redeemed_points: number;
}

interface CustomerRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  updated_at: string;
}

interface TransactionRow {
  id: string;
  customer_id: string;
  type: string;
  status: string;
  points: number;
  amount_inr: number;
  description: string | null;
  checkpoint: string | null;
  created_at: string;
  customer?: CustomerRow | null;
}

const DEFAULT_SETTINGS: RewardSettingsRow = {
  is_active: true,
  earn_points_per_order: 500,
  point_value_inr: 1,
  min_redeem_points: 1,
  max_redeem_points_per_order: 5000,
  max_redeem_percent: 20,
  expiry_days: null,
};

function rupees(amount: number) {
  return `₹${Number(amount ?? 0).toLocaleString('en-IN')}`;
}

function customerName(customer: CustomerRow | null | undefined) {
  return customer?.full_name || customer?.email || customer?.phone || 'Unnamed customer';
}

export default function AdminRewardsPage() {
  const [settings, setSettings] = useState<RewardSettingsRow>(DEFAULT_SETTINGS);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [balance, setBalance] = useState<RewardBalance | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionRow[]>([]);
  const [adjustmentPoints, setAdjustmentPoints] = useState('');
  const [adjustmentDescription, setAdjustmentDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRewards = useCallback(async (options?: { customerId?: string | null; searchTerm?: string }) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    const nextSearch = options?.searchTerm ?? '';
    const customerId = options?.customerId ?? null;
    if (nextSearch) params.set('search', nextSearch);
    if (customerId) params.set('customer_id', customerId);

    try {
      const res = await fetch(`/api/admin/rewards?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to load rewards');
      setSettings(data.settings || DEFAULT_SETTINGS);
      setCustomers(data.customers || []);
      setSelectedCustomer(data.selectedCustomer || null);
      setBalance(data.balance || null);
      setTransactions(data.transactions || []);
      setRecentTransactions(data.recentTransactions || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load rewards');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRewards({ customerId: null, searchTerm: '' }); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRewards]);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'settings', payload: settings }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to save reward settings');
      return;
    }
    setMessage('Reward settings saved');
    void loadRewards({ customerId: selectedCustomer?.id ?? null, searchTerm: search });
  }

  async function saveAdjustment(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedCustomer) return;
    setSaving(true);
    setMessage('');
    setError('');
    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'adjustment',
        payload: {
          customer_id: selectedCustomer.id,
          points: adjustmentPoints,
          description: adjustmentDescription,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to adjust points');
      return;
    }
    setAdjustmentPoints('');
    setAdjustmentDescription('');
    setMessage('Reward adjustment saved');
    void loadRewards({ customerId: selectedCustomer.id });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reward Points</h1>
          <p className="mt-1 text-sm text-gray-500">SUMO migration settings, customer balances, ledger history, and manual corrections.</p>
        </div>
        <button onClick={() => void loadRewards({ customerId: selectedCustomer?.id ?? null, searchTerm: search })} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {(message || error) && <p className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{error || message}</p>}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-600"><Gift className="h-4 w-4" /> Reward Rules</h2>
              <form onSubmit={saveSettings} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 sm:col-span-2">
                  <input type="checkbox" checked={settings.is_active} onChange={(event) => setSettings((current) => ({ ...current, is_active: event.target.checked }))} />
                  Rewards active
                </label>
                <input type="number" min={0} value={settings.earn_points_per_order} onChange={(event) => setSettings((current) => ({ ...current, earn_points_per_order: Number(event.target.value) }))} placeholder="Earn points/order" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input type="number" min={0.01} step="0.01" value={settings.point_value_inr} onChange={(event) => setSettings((current) => ({ ...current, point_value_inr: Number(event.target.value) }))} placeholder="Point value INR" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input type="number" min={0} value={settings.min_redeem_points} onChange={(event) => setSettings((current) => ({ ...current, min_redeem_points: Number(event.target.value) }))} placeholder="Min redeem" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input type="number" min={0} value={settings.max_redeem_points_per_order} onChange={(event) => setSettings((current) => ({ ...current, max_redeem_points_per_order: Number(event.target.value) }))} placeholder="Max/order" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input type="number" min={0} max={100} value={settings.max_redeem_percent} onChange={(event) => setSettings((current) => ({ ...current, max_redeem_percent: Number(event.target.value) }))} placeholder="Max %" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <input type="number" min={1} value={settings.expiry_days ?? ''} onChange={(event) => setSettings((current) => ({ ...current, expiry_days: event.target.value ? Number(event.target.value) : null }))} placeholder="Expiry days" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2"><Save className="h-4 w-4" /> Save Reward Rules</button>
              </form>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Find Customer</h2>
              <form onSubmit={(event) => { event.preventDefault(); void loadRewards({ customerId: null, searchTerm: search }); }} className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone" className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm" />
                </div>
                <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Search</button>
              </form>
              <div className="mt-4 space-y-2">
                {customers.map((customer) => (
                  <button key={customer.id} onClick={() => void loadRewards({ customerId: customer.id, searchTerm: search })} className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left text-sm hover:border-amber-200 hover:bg-amber-50">
                    <p className="font-semibold text-gray-900">{customerName(customer)}</p>
                    <p className="text-xs text-gray-500">{customer.email || customer.phone || customer.id}</p>
                  </button>
                ))}
                {search && customers.length === 0 && <p className="text-sm text-gray-500">No matching customers.</p>}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {selectedCustomer ? (
              <section className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Selected Customer</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">{customerName(selectedCustomer)}</h2>
                  <p className="text-sm text-gray-500">{selectedCustomer.email || selectedCustomer.phone || selectedCustomer.id}</p>
                </div>
                <div className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-4">
                  {[
                    { label: 'Available', value: balance?.available_points ?? 0 },
                    { label: 'Pending Holds', value: balance?.pending_redeemed_points ?? 0 },
                    { label: 'Earned', value: balance?.lifetime_earned_points ?? 0 },
                    { label: 'Redeemed', value: balance?.lifetime_redeemed_points ?? 0 },
                  ].map((item) => <div key={item.label} className="rounded-lg bg-gray-50 p-3"><p className="text-xs text-gray-500">{item.label}</p><p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString('en-IN')}</p></div>)}
                </div>
                <form onSubmit={saveAdjustment} className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                  <input required type="number" value={adjustmentPoints} onChange={(event) => setAdjustmentPoints(event.target.value)} placeholder="+/- points" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  <input required value={adjustmentDescription} onChange={(event) => setAdjustmentDescription(event.target.value)} placeholder="Reason for adjustment" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                  <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><PlusCircle className="h-4 w-4" /> Adjust</button>
                </form>
                <TransactionList transactions={transactions} />
              </section>
            ) : (
              <section className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Search and select a customer to view balance and post manual adjustments.</section>
            )}

            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Recent Reward Activity</h2>
              </div>
              <TransactionList transactions={recentTransactions} showCustomer />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionList({ transactions, showCustomer = false }: { transactions: TransactionRow[]; showCustomer?: boolean }) {
  if (transactions.length === 0) {
    return <div className="px-5 py-10 text-center text-sm text-gray-500">No reward transactions found.</div>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
          <div>
            <p className="font-semibold text-gray-900">{transaction.description || transaction.type.replace(/_/g, ' ')}</p>
            <p className="mt-1 text-xs text-gray-500">
              {new Date(transaction.created_at).toLocaleString('en-IN')} · {transaction.status}
              {transaction.checkpoint ? ` · ${transaction.checkpoint}` : ''}
            </p>
            {showCustomer && <p className="mt-1 text-xs font-medium text-amber-700">{customerName(transaction.customer)}</p>}
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${transaction.points >= 0 ? 'text-green-700' : 'text-red-700'}`}>{transaction.points >= 0 ? '+' : ''}{transaction.points.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500">{rupees(transaction.amount_inr)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}