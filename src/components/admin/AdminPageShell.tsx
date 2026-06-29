'use client';

import type { ComponentType, ReactNode } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  tone = 'text-gray-900',
  bg = 'bg-gray-50',
  subtext,
}: {
  label: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  tone?: string;
  bg?: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`h-5 w-5 ${tone}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 break-words text-lg font-bold leading-tight tabular-nums text-gray-900 sm:text-xl">{value}</p>
          {subtext ? <p className="mt-0.5 text-xs text-gray-400">{subtext}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function AdminAnalyticsPanel({
  title,
  subtitle,
  loading,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-gray-50 sm:px-5 ${open ? 'border-b border-gray-100' : ''}`}
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-600" /> : null}
          {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      {open ? <div className="min-w-0 space-y-5 overflow-hidden p-4 sm:p-5">{children}</div> : null}
    </section>
  );
}

export function AdminDataSection({
  title,
  count,
  loading,
  children,
  footer,
}: {
  title: string;
  count?: number;
  loading?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-bold text-gray-900">
          {title}
          {typeof count === 'number' ? <span className="ml-1.5 font-normal text-gray-500">({count.toLocaleString('en-IN')})</span> : null}
        </h2>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-600" /> : null}
      </div>
      {children}
      {footer ? <div className="border-t border-gray-100 px-4 py-3 sm:px-5">{footer}</div> : null}
    </section>
  );
}
