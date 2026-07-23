'use client';

import { useState, type ReactNode } from 'react';
import {
  CreditCard,
  Package,
  Settings2,
  User,
} from 'lucide-react';

export type OrderDetailTab = 'overview' | 'items' | 'payment' | 'manage';

const TABS: Array<{
  id: OrderDetailTab;
  label: string;
  icon: typeof User;
}> = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'manage', label: 'Manage', icon: Settings2 },
];

export function AdminOrderDetailShell({
  defaultTab = 'overview',
  badges,
  overview,
  items,
  payment,
  manage,
}: {
  defaultTab?: OrderDetailTab;
  /** Optional count/status chips next to tab labels */
  badges?: Partial<Record<OrderDetailTab, string | null>>;
  overview: ReactNode;
  items: ReactNode;
  payment: ReactNode;
  manage: ReactNode;
}) {
  const [tab, setTab] = useState<OrderDetailTab>(defaultTab);

  const panel =
    tab === 'overview'
      ? overview
      : tab === 'items'
        ? items
        : tab === 'payment'
          ? payment
          : manage;

  return (
    <div className="space-y-5">
      <nav
        className="flex flex-wrap gap-1 rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        aria-label="Order sections"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const badge = badges?.[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:flex-none sm:px-4 ${
                active
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
              <span>{label}</span>
              {badge ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div key={tab} className="space-y-5">
        {panel}
      </div>
    </div>
  );
}
