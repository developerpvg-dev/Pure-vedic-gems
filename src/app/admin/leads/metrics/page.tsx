'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Download, Loader2 } from 'lucide-react';
import { AdminStatCard } from '@/components/admin/AdminPageShell';
import { LEAD_NOT_CONVERTED_BY_CODE, type LeadNotConvertedReason } from '@/lib/leads/constants';

type StaffMember = { id: string; name: string };
type RankRow = {
  id: string | null;
  name: string;
  converted: number;
  not_converted: number;
  pending: number;
  total: number;
  rate: number;
};

type MetricsPayload = {
  summary: {
    pending_outcome: number;
    converted: number;
    not_converted: number;
    explained_total: number;
    conversion_rate: number;
  };
  by_telecaller: RankRow[];
  by_astrologer: RankRow[];
  not_converted_reasons: { code: string; count: number }[];
  trend: { month: string; converted: number; not_converted: number }[];
};

function buildHref(base: Record<string, string>, extra: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...extra })) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/admin/leads?${qs}` : '/admin/leads';
}

export default function LeadMetricsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [astrologerId, setAstrologerId] = useState('');
  const [kind, setKind] = useState<'remedies' | 'consultation' | ''>('');
  const [staff, setStaff] = useState<{ telecom: StaffMember[]; astrologers: StaffMember[] }>({
    telecom: [],
    astrologers: [],
  });
  const [data, setData] = useState<MetricsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/leads/staff')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json) setStaff({ telecom: json.telecom ?? [], astrologers: json.astrologers ?? [] });
      })
      .catch(() => undefined);
  }, []);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (assignedTo) params.set('assigned_to', assignedTo);
    if (astrologerId) params.set('astrologer_id', astrologerId);
    if (kind) params.set('enquiry_type', kind);
    try {
      const res = await fetch(`/api/admin/leads/analytics?${params}`);
      const json = (await res.json().catch(() => null)) as (MetricsPayload & { error?: string }) | null;
      if (!res.ok) throw new Error(json?.error || 'Unable to load metrics');
      setData(json as MetricsPayload);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Unable to load metrics');
    }
    setLoading(false);
  }, [dateFrom, dateTo, assignedTo, astrologerId, kind]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  const filterBase = {
    date_from: dateFrom,
    date_to: dateTo,
    assigned_to: assignedTo,
    astrologer_id: astrologerId,
  };

  function exportHref() {
    const params = new URLSearchParams({ format: 'xlsx' });
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (assignedTo) params.set('assigned_to', assignedTo);
    if (astrologerId) params.set('astrologer_id', astrologerId);
    if (kind) params.set('enquiry_type', kind);
    return `/api/admin/leads/analytics?${params}`;
  }

  const reasonMax = Math.max(1, ...(data?.not_converted_reasons.map((r) => r.count) ?? [1]));
  const trendMax = Math.max(
    1,
    ...(data?.trend.flatMap((t) => [t.converted, t.not_converted]) ?? [1])
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/leads" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to leads
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Lead conversion metrics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Telecaller and astrologer conversion performance — aggregated in the database for large lead volume.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={exportHref()}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
            <BarChart3 className="h-3.5 w-3.5" />
            Manager / parcel dispatch
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-medium text-gray-500">
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-gray-500">
            Telecaller
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {staff.telecom.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-500">
            Astrologer
            <select
              value={astrologerId}
              onChange={(e) => setAstrologerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {staff.astrologers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-500">
            Lead type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as '' | 'remedies' | 'consultation')}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="remedies">Remedies (₹101)</option>
              <option value="consultation">Consultation</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <AdminStatCard label="In window" value={data.summary.explained_total.toLocaleString('en-IN')} icon={BarChart3} tone="text-gray-900" bg="bg-gray-50" />
            <AdminStatCard label="Converted" value={data.summary.converted.toLocaleString('en-IN')} icon={BarChart3} tone="text-emerald-700" bg="bg-emerald-50" />
            <AdminStatCard label="Not converted" value={data.summary.not_converted.toLocaleString('en-IN')} icon={BarChart3} tone="text-amber-700" bg="bg-amber-50" />
            <AdminStatCard label="Pending outcome" value={data.summary.pending_outcome.toLocaleString('en-IN')} icon={BarChart3} tone="text-lime-700" bg="bg-lime-50" />
            <AdminStatCard label="Conversion rate" value={`${data.summary.conversion_rate}%`} icon={BarChart3} tone="text-indigo-700" bg="bg-indigo-50" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RankTable
              title="By telecaller"
              rows={data.by_telecaller}
              hrefFor={(row, conversion) =>
                buildHref(filterBase, {
                  assigned_to: row.id || '',
                  conversion,
                })
              }
            />
            <RankTable
              title="By astrologer"
              rows={data.by_astrologer}
              hrefFor={(row, conversion) =>
                buildHref(filterBase, {
                  astrologer_id: row.id || '',
                  conversion,
                })
              }
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Not converted reasons</p>
              {data.not_converted_reasons.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No not-converted leads in this window.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {data.not_converted_reasons.map((row) => {
                    const label =
                      LEAD_NOT_CONVERTED_BY_CODE[row.code as LeadNotConvertedReason]?.label || row.code;
                    const pct = Math.round((row.count / reasonMax) * 100);
                    return (
                      <Link
                        key={row.code}
                        href={buildHref(filterBase, { conversion: 'not_converted' })}
                        className="block rounded-lg p-1 hover:bg-gray-50"
                      >
                        <div className="mb-1 flex justify-between gap-2 text-[11px] text-gray-600">
                          <span className="truncate">{label}</span>
                          <span className="font-semibold text-gray-800">{row.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Monthly trend</p>
              {data.trend.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No conversion outcomes in this window.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {data.trend.map((row) => (
                    <div key={row.month}>
                      <div className="mb-1 flex justify-between text-[11px] text-gray-600">
                        <span className="font-semibold text-gray-800">{row.month}</span>
                        <span>
                          {row.converted} converted · {row.not_converted} not
                        </span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.round((row.converted / trendMax) * 100)}%` }}
                        />
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${Math.round((row.not_converted / trendMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function RankTable({
  title,
  rows,
  hrefFor,
}: {
  title: string;
  rows: RankRow[];
  hrefFor: (row: RankRow, conversion: string) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No rows for these filters.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-gray-400">
              <tr>
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Converted</th>
                <th className="pb-2 font-semibold">Not</th>
                <th className="pb-2 font-semibold">Pending</th>
                <th className="pb-2 font-semibold">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id || row.name} className="text-gray-800">
                  <td className="py-2 font-semibold">
                    <Link href={hrefFor(row, '')} className="hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link href={hrefFor(row, 'converted')} className="text-emerald-700 hover:underline">
                      {row.converted}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link href={hrefFor(row, 'not_converted')} className="text-amber-700 hover:underline">
                      {row.not_converted}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Link href={hrefFor(row, 'pending')} className="text-lime-700 hover:underline">
                      {row.pending}
                    </Link>
                  </td>
                  <td className="py-2 font-semibold">{row.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
