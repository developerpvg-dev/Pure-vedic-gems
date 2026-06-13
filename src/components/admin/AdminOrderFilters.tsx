'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  EMPTY_ADMIN_ORDER_FILTERS,
  ORDER_PERIOD_PRESETS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type AdminOrderFilterState,
} from '@/lib/admin/order-filters';

export {
  EMPTY_ADMIN_ORDER_FILTERS,
  adminOrderFiltersToParams,
  analyticsParamsFromFilters,
  type AdminOrderFilterState,
} from '@/lib/admin/order-filters';

const FILTER_LABELS: Record<keyof AdminOrderFilterState, string> = {
  search: 'Search',
  status: 'Status',
  payment_status: 'Payment',
  date_from: 'From',
  date_to: 'To',
  period: 'Period',
  min_total: 'Min total',
  max_total: 'Max total',
  payment_method: 'Payment method',
  include_energization: 'Energization',
  refund_status: 'Refund',
  invoice_status: 'Invoice',
  customer_type: 'Customer',
  sort_by: 'Sort',
  sort_order: 'Order',
};

function label(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function fieldClassName() {
  return 'w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';
}

function countActiveFilters(filters: AdminOrderFilterState) {
  return Object.entries(filters).filter(([key, value]) => {
    if (key === 'period') return value !== '30d';
    if (key === 'sort_by') return value !== 'created_at';
    if (key === 'sort_order') return value !== 'desc';
    return Boolean(value);
  }).length;
}

const SORT_OPTIONS = [
  { value: 'created_at-desc', sort_by: 'created_at', sort_order: 'desc', label: 'Newest first' },
  { value: 'created_at-asc', sort_by: 'created_at', sort_order: 'asc', label: 'Oldest first' },
  { value: 'total-desc', sort_by: 'total', sort_order: 'desc', label: 'Total: high to low' },
  { value: 'total-asc', sort_by: 'total', sort_order: 'asc', label: 'Total: low to high' },
  { value: 'order_number-asc', sort_by: 'order_number', sort_order: 'asc', label: 'Order #: A–Z' },
  { value: 'status-asc', sort_by: 'status', sort_order: 'asc', label: 'Status: A–Z' },
  { value: 'payment_status-asc', sort_by: 'payment_status', sort_order: 'asc', label: 'Payment: A–Z' },
];

type AdminOrderFiltersProps = {
  filters: AdminOrderFilterState;
  onChange: (updates: Partial<AdminOrderFilterState>) => void;
  onClear: () => void;
};

export function AdminOrderFilters({ filters, onChange, onClear }: AdminOrderFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activeCount = countActiveFilters(filters);
  const sortValue = `${filters.sort_by}-${filters.sort_order}`;

  const activeBadges = useMemo(() => {
    const badges: Array<{ key: keyof AdminOrderFilterState; label: string }> = [];
    for (const [key, value] of Object.entries(filters) as Array<[keyof AdminOrderFilterState, string]>) {
      if (!value) continue;
      if (key === 'period' && value === '30d') continue;
      if (key === 'sort_by' && value === 'created_at') continue;
      if (key === 'sort_order' && value === 'desc') continue;

      let display = value;
      if (key === 'period') display = label(value);
      else if (key === 'customer_type') display = value === 'guest' ? 'Guest checkout' : 'Registered';
      else if (key === 'include_energization') display = value === 'true' ? 'With energization' : 'Without energization';
      else if (key === 'min_total' || key === 'max_total') display = `₹${Number(value).toLocaleString('en-IN')}`;
      else display = label(value);

      badges.push({ key, label: `${FILTER_LABELS[key]}: ${display}` });
    }
    return badges;
  }, [filters]);

  function updateSort(nextValue: string) {
    const match = SORT_OPTIONS.find((option) => option.value === nextValue);
    if (!match) return;
    onChange({ sort_by: match.sort_by, sort_order: match.sort_order });
  }

  function clearBadge(key: keyof AdminOrderFilterState) {
    if (key === 'period') onChange({ period: '30d', date_from: '', date_to: '' });
    else if (key === 'sort_by' || key === 'sort_order') onChange({ sort_by: 'created_at', sort_order: 'desc' });
    else onChange({ [key]: '' });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">Filters</p>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-xs font-medium text-amber-700 hover:text-amber-800">
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search order #, name, email, phone..."
            className={`${fieldClassName()} pl-10`}
          />
        </div>

        <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={fieldClassName()}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>{label(status)}</option>
          ))}
        </select>

        <select value={filters.payment_status} onChange={(e) => onChange({ payment_status: e.target.value })} className={fieldClassName()}>
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>{label(status)}</option>
          ))}
        </select>

        <select
          value={filters.period}
          onChange={(e) => onChange({ period: e.target.value as AdminOrderFilterState['period'], date_from: '', date_to: '' })}
          className={fieldClassName()}
        >
          {ORDER_PERIOD_PRESETS.map((period) => (
            <option key={period} value={period}>
              {period === 'all' ? 'All time' : `Last ${period.replace('d', ' days')}`}
            </option>
          ))}
        </select>

        <select value={sortValue} onChange={(e) => updateSort(e.target.value)} className={fieldClassName()}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            advancedOpen ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Advanced filters
          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {advancedOpen && (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Date from</span>
              <input type="date" value={filters.date_from} onChange={(e) => onChange({ date_from: e.target.value, period: '' })} className={fieldClassName()} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Date to</span>
              <input type="date" value={filters.date_to} onChange={(e) => onChange({ date_to: e.target.value, period: '' })} className={fieldClassName()} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Min total (₹)</span>
              <input type="number" min={0} value={filters.min_total} onChange={(e) => onChange({ min_total: e.target.value })} placeholder="0" className={fieldClassName()} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Max total (₹)</span>
              <input type="number" min={0} value={filters.max_total} onChange={(e) => onChange({ max_total: e.target.value })} placeholder="No limit" className={fieldClassName()} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Customer type</span>
              <select value={filters.customer_type} onChange={(e) => onChange({ customer_type: e.target.value })} className={fieldClassName()}>
                <option value="">All customers</option>
                <option value="registered">Registered accounts</option>
                <option value="guest">Guest checkout</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Payment method</span>
              <select value={filters.payment_method} onChange={(e) => onChange({ payment_method: e.target.value })} className={fieldClassName()}>
                <option value="">Any method</option>
                <option value="razorpay">Razorpay</option>
                <option value="cod">Cash on delivery</option>
                <option value="bank_transfer">Bank transfer</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Energization</span>
              <select value={filters.include_energization} onChange={(e) => onChange({ include_energization: e.target.value })} className={fieldClassName()}>
                <option value="">Any</option>
                <option value="true">Includes energization</option>
                <option value="false">No energization</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Refund status</span>
              <select value={filters.refund_status} onChange={(e) => onChange({ refund_status: e.target.value })} className={fieldClassName()}>
                <option value="">Any</option>
                <option value="none">None</option>
                <option value="requested">Requested</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-500">Invoice status</span>
              <select value={filters.invoice_status} onChange={(e) => onChange({ invoice_status: e.target.value })} className={fieldClassName()}>
                <option value="">Any</option>
                <option value="pending">Pending</option>
                <option value="generated">Generated</option>
                <option value="sent">Sent</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {activeBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          {activeBadges.map((badge) => (
            <span key={badge.key} className="inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80">
              <span className="truncate">{badge.label}</span>
              <button type="button" onClick={() => clearBadge(badge.key)} className="shrink-0 rounded-full p-0.5 hover:bg-amber-100" aria-label={`Remove ${badge.label} filter`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
