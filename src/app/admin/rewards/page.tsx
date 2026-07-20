'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Loader2, PlusCircle, RefreshCcw, Search, UserRound } from 'lucide-react';
import AdminRewardRulesForm from '@/components/admin/AdminRewardRulesForm';
import type { RewardRulesInput } from '@/lib/rewards/rules';

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
  whatsapp?: string | null;
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

const DEFAULT_RULES: RewardRulesInput = {
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
  adjustment: 'Admin assignment',
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

function toRulesInput(raw: Record<string, unknown> | null | undefined): RewardRulesInput {
  if (!raw) return DEFAULT_RULES;
  return {
    is_active: Boolean(raw.is_active),
    earn_points_per_order: Number(raw.earn_points_per_order ?? DEFAULT_RULES.earn_points_per_order),
    point_value_inr: Number(raw.point_value_inr ?? DEFAULT_RULES.point_value_inr),
    min_redeem_points: Number(raw.min_redeem_points ?? DEFAULT_RULES.min_redeem_points),
    max_redeem_points_per_order: Number(
      raw.max_redeem_points_per_order ?? DEFAULT_RULES.max_redeem_points_per_order
    ),
    max_redeem_percent: Number(raw.max_redeem_percent ?? DEFAULT_RULES.max_redeem_percent),
    expiry_days: raw.expiry_days == null ? null : Number(raw.expiry_days),
  };
}

export default function AdminRewardsPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [balance, setBalance] = useState<RewardBalance | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionRow[]>([]);
  const [pointValueInr, setPointValueInr] = useState(1);
  const [rules, setRules] = useState<RewardRulesInput>(DEFAULT_RULES);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [assignPoints, setAssignPoints] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const applySettingsPayload = useCallback((data: { settings?: Record<string, unknown>; pointValueInr?: number }) => {
    if (data.settings) setRules(toRulesInput(data.settings));
    if (data.pointValueInr != null) setPointValueInr(Number(data.pointValueInr));
  }, []);

  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const res = await fetch('/api/admin/rewards?settings=1', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to load reward rules');
      applySettingsPayload(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load reward rules');
    }
    setRulesLoading(false);
  }, [applySettingsPayload]);

  const loadCustomer = useCallback(async (customerId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/rewards?customer_id=${customerId}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to load customer rewards');
      setSelectedCustomer(data.selectedCustomer || null);
      setBalance(data.balance || null);
      setTransactions(data.transactions || []);
      if (data.pointValueInr != null) setPointValueInr(Number(data.pointValueInr));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customer rewards');
    }
    setLoading(false);
  }, []);

  const searchCustomers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCustomers([]);
      return;
    }
    setSearching(true);
    setError('');
    try {
      const params = new URLSearchParams({ search: searchTerm.trim() });
      const res = await fetch(`/api/admin/rewards?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setCustomers(data.customers || []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search failed');
    }
    setSearching(false);
  }, []);

  const loadRecentActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rewards?recent=1', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRecentTransactions(data.recentTransactions || []);
        if (data.pointValueInr != null) setPointValueInr(Number(data.pointValueInr));
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    void loadRules();
    void loadRecentActivity();
  }, [loadRules, loadRecentActivity]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void searchCustomers(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, searchCustomers]);

  async function saveRules(event: React.FormEvent) {
    event.preventDefault();
    setRulesSaving(true);
    setMessage('');
    setError('');

    const res = await fetch('/api/admin/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_settings',
        payload: rules,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setRulesSaving(false);

    if (!res.ok) {
      setError(data.error || 'Failed to save reward rules');
      return;
    }

    if (data.settings) setRules(toRulesInput(data.settings));
    setPointValueInr(Number(data.settings?.point_value_inr ?? rules.point_value_inr));
    setMessage(
      `Reward rules saved. Max redeem is now ${Number(data.settings?.max_redeem_percent ?? rules.max_redeem_percent)}% of order merchandise.`
    );
  }

  async function assignRewards(event: React.FormEvent) {
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
          points: assignPoints,
          description: assignDescription,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Failed to assign rewards');
      return;
    }

    setAssignPoints('');
    setAssignDescription('');
    setMessage('Reward points assigned successfully.');
    void loadCustomer(selectedCustomer.id);
    void loadRecentActivity();
  }

  function clearSelection() {
    setSelectedCustomer(null);
    setBalance(null);
    setTransactions([]);
    setAssignPoints('');
    setAssignDescription('');
    setMessage('');
    setError('');
  }

  const assignPreview =
    assignPoints.trim() && Number.isFinite(Number(assignPoints))
      ? Number(assignPoints) * pointValueInr
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Set redeem limits (including max % of order), then search a customer to credit or debit
            points manually.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadRules();
            void loadRecentActivity();
            if (selectedCustomer) void loadCustomer(selectedCustomer.id);
          }}
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

      {rulesLoading ? (
        <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-12">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : (
        <AdminRewardRulesForm
          settings={rules}
          saving={rulesSaving}
          onChange={setRules}
          onSubmit={saveRules}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-700" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">Find Customer</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Search by name, email, phone, or WhatsApp. Select a customer to view balance and assign points.
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Start typing to search customers…"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm"
              autoComplete="off"
            />
          </div>

          <div className="mt-4 space-y-2">
            {searching ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : null}
            {!searching && search.trim() && customers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No matching customers.</p>
            ) : null}
            {!search.trim() ? (
              <p className="py-6 text-center text-sm text-gray-400">
                Enter at least one character to search the customer directory.
              </p>
            ) : null}
            {customers.map((customer) => {
              const isSelected = selectedCustomer?.id === customer.id;
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => void loadCustomer(customer.id)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-100 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/60'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{customerName(customer)}</p>
                  <p className="text-xs text-gray-500">
                    {customer.email || customer.phone || customer.whatsapp || customer.id}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center rounded-xl border border-gray-200 bg-white py-20">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : selectedCustomer ? (
            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Selected Customer</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">{customerName(selectedCustomer)}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/customers/${selectedCustomer.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <UserRound className="h-3.5 w-3.5" /> Profile
                  </Link>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid gap-3 border-b border-gray-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Available balance', value: balance?.available_points ?? 0 },
                  { label: 'Confirmed total', value: balance?.confirmed_points ?? 0 },
                  { label: 'Lifetime credited', value: balance?.lifetime_earned_points ?? 0 },
                  { label: 'Lifetime used', value: balance?.lifetime_redeemed_points ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">{item.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {item.value.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      ≈ {rupees(item.value * pointValueInr)} at ₹{pointValueInr}/point
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={assignRewards} className="space-y-4 border-b border-gray-100 p-5">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-amber-700" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Assign reward points</p>
                    <p className="text-xs text-gray-500">
                      Enter positive points to credit, or negative to deduct. A clear reason is required.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Points (+/−)</span>
                    <input
                      required
                      type="number"
                      value={assignPoints}
                      onChange={(event) => setAssignPoints(event.target.value)}
                      placeholder="e.g. 500"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-600">Reason</span>
                    <input
                      required
                      value={assignDescription}
                      onChange={(event) => setAssignDescription(event.target.value)}
                      placeholder="e.g. Referral bonus, loyalty gift, correction"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                    >
                      <PlusCircle className="h-4 w-4" />
                      {saving ? 'Saving…' : 'Assign points'}
                    </button>
                  </div>
                </div>
                {assignPreview !== null ? (
                  <p className="text-xs text-gray-500">
                    Value: {assignPreview >= 0 ? '+' : ''}
                    {rupees(assignPreview)} ({assignPoints} points × ₹{pointValueInr})
                  </p>
                ) : null}
              </form>

              <TransactionList transactions={transactions} />
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <Gift className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-700">No customer selected</p>
              <p className="mt-1 text-sm text-gray-500">
                Search for a customer on the left, then assign reward points to their account.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
                Recent Admin Assignments
              </h2>
              <p className="mt-1 text-xs text-gray-500">Last 25 manual reward assignments across all customers.</p>
            </div>
            <TransactionList transactions={recentTransactions} showCustomer />
          </section>
        </div>
      </div>
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
          TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type.replace(/_/g, ' ');

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
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(transaction.created_at).toLocaleString('en-IN')}
                {transaction.checkpoint ? ` · ${transaction.checkpoint}` : ''}
              </p>
              {transaction.order_id ? (
                <Link
                  href={`/admin/orders/${transaction.order_id}`}
                  className="mt-1 inline-block text-xs font-semibold text-amber-700 hover:underline"
                >
                  View order →
                </Link>
              ) : null}
              {showCustomer ? (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  {customerName(transaction.customer)}
                </p>
              ) : null}
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
