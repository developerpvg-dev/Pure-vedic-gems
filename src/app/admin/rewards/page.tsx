'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, PlusCircle, RefreshCcw, Search } from 'lucide-react';
import AdminRewardRulesForm from '@/components/admin/AdminRewardRulesForm';
import type { RewardRulesInput } from '@/lib/rewards/rules';

interface RewardSettingsRow extends RewardRulesInput {}

interface RewardBalance {
  available_points: number;
  confirmed_points: number;
  pending_redeemed_points: number;
  lifetime_earned_points: number;
  lifetime_redeemed_points: number;
  expired_points?: number;
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
  order_id: string | null;
  type: string;
  status: string;
  points: number;
  amount_inr: number;
  description: string | null;
  checkpoint: string | null;
  expires_at: string | null;
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

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  earned: 'Points earned',
  redeemed: 'Points redeemed',
  adjustment: 'Manual adjustment',
  expired: 'Points expired',
  refund: 'Refund reversal',
  migration: 'Legacy migration',
};

function rupees(amount: number) {
  return `₹${Number(amount ?? 0).toLocaleString('en-IN')}`;
}

function customerName(customer: CustomerRow | null | undefined) {
  return customer?.full_name || customer?.email || customer?.phone || 'Unnamed customer';
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-700';
  }
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
    setMessage('Reward rules saved successfully.');
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
    setMessage('Manual adjustment saved.');
    void loadRewards({ customerId: selectedCustomer.id });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reward Points</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure earn & redeem rules, review customer balances, and post manual corrections.
          </p>
        </div>
        <button
          onClick={() => void loadRewards({ customerId: selectedCustomer?.id ?? null, searchTerm: search })}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {(message || error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}
        >
          {error || message}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <AdminRewardRulesForm
              settings={settings}
              saving={saving}
              onChange={setSettings}
              onSubmit={saveSettings}
            />

            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Find Customer</h2>
              <p className="mt-1 text-xs text-gray-500">
                Search by name, email, or phone to view balance, ledger, and post adjustments.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadRewards({ customerId: null, searchTerm: search });
                }}
                className="mt-4 flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Name, email, phone"
                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                  Search
                </button>
              </form>
              <div className="mt-4 space-y-2">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => void loadRewards({ customerId: customer.id, searchTerm: search })}
                    className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left text-sm hover:border-amber-200 hover:bg-amber-50"
                  >
                    <p className="font-semibold text-gray-900">{customerName(customer)}</p>
                    <p className="text-xs text-gray-500">{customer.email || customer.phone || customer.id}</p>
                  </button>
                ))}
                {search && customers.length === 0 && (
                  <p className="text-sm text-gray-500">No matching customers.</p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {selectedCustomer ? (
              <section className="rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Selected Customer</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">{customerName(selectedCustomer)}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.id}
                  </p>
                </div>
                <div className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      label: 'Available to redeem',
                      value: balance?.available_points ?? 0,
                      hint: 'Confirmed balance minus pending checkout holds',
                    },
                    {
                      label: 'Pending holds',
                      value: balance?.pending_redeemed_points ?? 0,
                      hint: 'Reserved at checkout, not yet confirmed',
                    },
                    {
                      label: 'Confirmed total',
                      value: balance?.confirmed_points ?? 0,
                      hint: 'Net confirmed points in ledger',
                    },
                    {
                      label: 'Lifetime earned',
                      value: balance?.lifetime_earned_points ?? 0,
                      hint: 'All points ever credited',
                    },
                    {
                      label: 'Lifetime redeemed',
                      value: balance?.lifetime_redeemed_points ?? 0,
                      hint: 'All points ever spent',
                    },
                    {
                      label: 'Expired',
                      value: balance?.expired_points ?? 0,
                      hint: settings.expiry_days
                        ? `Past ${settings.expiry_days}-day expiry window`
                        : 'No expiry configured',
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">{item.label}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {item.value.toLocaleString('en-IN')}
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{item.hint}</p>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={saveAdjustment}
                  className="space-y-3 border-b border-gray-100 p-5"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Manual adjustment</p>
                    <p className="text-xs text-gray-500">
                      Add positive points (credit) or negative points (debit). Use a clear reason —
                      this is recorded in the customer ledger.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Points (+/−)</span>
                      <input
                        required
                        type="number"
                        value={adjustmentPoints}
                        onChange={(event) => setAdjustmentPoints(event.target.value)}
                        placeholder="e.g. 500 or -200"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-gray-600">Reason</span>
                      <input
                        required
                        value={adjustmentDescription}
                        onChange={(event) => setAdjustmentDescription(event.target.value)}
                        placeholder="e.g. Goodwill credit for delayed shipment"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        disabled={saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                      >
                        <PlusCircle className="h-4 w-4" /> Post adjustment
                      </button>
                    </div>
                  </div>
                </form>
                <TransactionList transactions={transactions} />
              </section>
            ) : (
              <section className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
                Search and select a customer to view their balance, transaction history, and post manual
                adjustments.
              </section>
            )}

            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                  Recent Reward Activity
                </h2>
                <p className="mt-1 text-xs text-gray-500">Last 25 transactions across all customers.</p>
              </div>
              <TransactionList transactions={recentTransactions} showCustomer />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionList({
  transactions,
  showCustomer = false,
}: {
  transactions: TransactionRow[];
  showCustomer?: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-gray-500">No reward transactions found.</div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((transaction) => {
        const typeLabel =
          TRANSACTION_TYPE_LABELS[transaction.type] ??
          transaction.type.replace(/_/g, ' ');
        const isExpired =
          transaction.type === 'earned' &&
          transaction.expires_at &&
          new Date(transaction.expires_at).getTime() < Date.now();

        return (
          <div
            key={transaction.id}
            className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">
                  {transaction.description || typeLabel}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClass(transaction.status)}`}
                >
                  {transaction.status}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  {typeLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(transaction.created_at).toLocaleString('en-IN')}
                {transaction.checkpoint ? ` · ${transaction.checkpoint}` : ''}
                {transaction.expires_at && (
                  <>
                    {' '}
                    · Expires{' '}
                    {new Date(transaction.expires_at).toLocaleDateString('en-IN')}
                    {isExpired ? ' (expired)' : ''}
                  </>
                )}
              </p>
              {transaction.order_id && (
                <Link
                  href={`/admin/orders/${transaction.order_id}`}
                  className="mt-1 inline-block text-xs font-semibold text-amber-700 hover:underline"
                >
                  View order →
                </Link>
              )}
              {showCustomer && (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  {customerName(transaction.customer)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${transaction.points >= 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                {transaction.points >= 0 ? '+' : ''}
                {transaction.points.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500">{rupees(transaction.amount_inr)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
