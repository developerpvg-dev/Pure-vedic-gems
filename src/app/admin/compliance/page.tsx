'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, FileText, IndianRupee, Loader2, ReceiptText, RefreshCw, RotateCcw, Scale, ShieldCheck } from 'lucide-react';
import { AdminAnalyticsPanel, AdminPageHeader, AdminStatCard } from '@/components/admin/AdminPageShell';
import { MetricBars, RevenueTrendChart, fmtInr } from '@/components/admin/AdminCharts';
import { useAdminAnalytics } from '@/components/admin/useAdminAnalytics';

type ComplianceTab = 'privacy' | 'returns' | 'invoices' | 'tax' | 'policies';
type Row = Record<string, unknown> & { id: string; status?: string; created_at?: string; updated_at?: string };

interface ComplianceData {
  taxRules: Row[];
  privacyRequests: Row[];
  returnRequests: Row[];
  invoices: Row[];
  refundRecords: Row[];
  policyVersions: Row[];
  statusOptions: Record<string, string[]>;
}

const EMPTY_DATA: ComplianceData = {
  taxRules: [],
  privacyRequests: [],
  returnRequests: [],
  invoices: [],
  refundRecords: [],
  policyVersions: [],
  statusOptions: {},
};

const TABS: Array<{ id: ComplianceTab; label: string; icon: React.ElementType }> = [
  { id: 'privacy', label: 'Privacy Requests', icon: ShieldCheck },
  { id: 'returns', label: 'Returns / RMA', icon: RotateCcw },
  { id: 'invoices', label: 'Invoices', icon: ReceiptText },
  { id: 'tax', label: 'Tax Rules', icon: Scale },
  { id: 'policies', label: 'Policy Versions', icon: FileText },
];

function asString(value: unknown, fallback = '-') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function asNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function dateLabel(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-IN');
}

function statusClass(status?: string) {
  if (!status) return 'bg-gray-100 text-gray-600';
  if (['completed', 'approved', 'issued', 'sent', 'closed', 'refunded', 'replaced'].includes(status)) return 'bg-green-100 text-green-700';
  if (['rejected', 'cancelled', 'failed', 'void'].includes(status)) return 'bg-red-100 text-red-700';
  if (['in_progress', 'inspection', 'authorized', 'verifying', 'received'].includes(status)) return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
}

export default function CompliancePage() {
  const [tab, setTab] = useState<ComplianceTab>('privacy');
  const [data, setData] = useState<ComplianceData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  const { analytics, loading: analyticsLoading, open: analyticsOpen, toggle } = useAdminAnalytics<{
    summary: { openPrivacyRequests: number; openReturnRequests: number; totalInvoices: number; pendingInvoices: number; invoiceValue: number; totalRefunds: number; refundValue: number; activeTaxRules: number; activePolicies: number };
    trend: Array<{ date: string; label: string; orders: number; revenue: number }>;
    privacyStatusBreakdown: Array<{ label: string; value: number; meta: number }>;
    returnStatusBreakdown: Array<{ label: string; value: number; meta: number }>;
    invoiceStatusBreakdown: Array<{ label: string; value: number; meta: number }>;
  }>('/api/admin/compliance/analytics');

  async function loadCompliance() {
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/admin/compliance');
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setMessage(payload.error || 'Unable to load compliance desk');
      return;
    }
    setData({ ...EMPTY_DATA, ...payload });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCompliance(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const openPrivacy = data.privacyRequests.filter((item) => !['completed', 'rejected', 'cancelled'].includes(asString(item.status, ''))).length;
    const openReturns = data.returnRequests.filter((item) => !['closed', 'rejected', 'refunded', 'replaced'].includes(asString(item.status, ''))).length;
    const pendingInvoices = data.invoices.filter((item) => ['draft', 'failed'].includes(asString(item.status, ''))).length;
    const verificationNeeded = data.taxRules.filter((rule) => JSON.stringify(rule.metadata ?? {}).includes('verification_required')).length;
    return { openPrivacy, openReturns, pendingInvoices, verificationNeeded };
  }, [data]);

  async function updateStatus(resource: string, id: string, status: string) {
    setSavingId(id);
    setMessage('');
    const response = await fetch('/api/admin/compliance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource, id, status }),
    });
    const payload = await response.json().catch(() => ({}));
    setSavingId('');
    if (!response.ok) {
      setMessage(payload.error || 'Update failed');
      return;
    }
    setMessage('Status updated');
    await loadCompliance();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Compliance Desk"
        description="Tax, invoices, returns, privacy, consent, and policy evidence."
        actions={
          <button onClick={() => loadCompliance()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      {message && <p className={`rounded-lg px-3 py-2 text-sm ${message.includes('failed') || message.includes('Unable') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Open privacy" value={(analytics?.summary.openPrivacyRequests ?? stats.openPrivacy).toLocaleString('en-IN')} icon={ShieldCheck} tone="text-amber-600" bg="bg-amber-50" />
        <AdminStatCard label="Open returns" value={(analytics?.summary.openReturnRequests ?? stats.openReturns).toLocaleString('en-IN')} icon={RotateCcw} tone="text-orange-600" bg="bg-orange-50" />
        <AdminStatCard label="Invoice value" value={fmtInr(analytics?.summary.invoiceValue ?? 0)} icon={IndianRupee} tone="text-green-600" bg="bg-green-50" subtext={`${analytics?.summary.pendingInvoices ?? stats.pendingInvoices} pending`} />
        <AdminStatCard label="Refunds" value={fmtInr(analytics?.summary.refundValue ?? 0)} icon={ReceiptText} tone="text-red-600" bg="bg-red-50" subtext={`${analytics?.summary.totalRefunds ?? 0} records`} />
      </div>

      <AdminAnalyticsPanel title="Compliance analytics" subtitle="Cross-desk activity · last 30 days" loading={analyticsLoading} open={analyticsOpen} onToggle={toggle}>
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">Activity trend</h3>
            {analytics ? <RevenueTrendChart data={analytics.trend} /> : null}
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 xl:col-span-2">
            <MetricBars embedded title="Privacy status" icon={ShieldCheck} items={analytics?.privacyStatusBreakdown.slice(0, 6) ?? []} />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Return / RMA status" icon={RotateCcw} items={analytics?.returnStatusBreakdown.slice(0, 6) ?? []} />
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
            <MetricBars embedded title="Invoice status" icon={ReceiptText} items={analytics?.invoiceStatusBreakdown.slice(0, 6) ?? []} />
          </div>
        </div>
      </AdminAnalyticsPanel>

      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === item.id ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon className="h-4 w-4" /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'privacy' && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <TableHeader title="Privacy Requests" description="Export, deletion, correction, consent withdrawal, and unsubscribe requests." />
          <ResponsiveTable headers={['Type', 'Customer', 'Status', 'Due', 'Created', 'Action']}>
            {data.privacyRequests.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <Cell>{asString(item.request_type).replaceAll('_', ' ')}</Cell>
                <Cell><p className="font-medium text-gray-900">{asString(item.full_name)}</p><p className="text-xs text-gray-500">{asString(item.email)}</p></Cell>
                <StatusCell status={asString(item.status, '')} />
                <Cell>{dateLabel(item.due_at)}</Cell>
                <Cell>{dateLabel(item.created_at)}</Cell>
                <ActionCell resource="privacy_requests" item={item} options={data.statusOptions.privacy_requests || []} savingId={savingId} onChange={updateStatus} />
              </tr>
            ))}
          </ResponsiveTable>
        </section>
      )}

      {tab === 'returns' && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <TableHeader title="Returns / RMA" description="Inspection and resolution workflow for returns, store credit, replacement, and refunds." />
          <ResponsiveTable headers={['RMA', 'Requester', 'Reason', 'Resolution', 'Status', 'Action']}>
            {data.returnRequests.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <Cell>{asString(item.rma_number)}</Cell>
                <Cell><p className="font-medium text-gray-900">{asString(item.requester_name)}</p><p className="text-xs text-gray-500">{asString(item.requester_email)}</p></Cell>
                <Cell>{asString(item.reason_category).replaceAll('_', ' ')}</Cell>
                <Cell>{asString(item.requested_resolution).replaceAll('_', ' ')}</Cell>
                <StatusCell status={asString(item.status, '')} />
                <ActionCell resource="return_requests" item={item} options={data.statusOptions.return_requests || []} savingId={savingId} onChange={updateStatus} />
              </tr>
            ))}
          </ResponsiveTable>
        </section>
      )}

      {tab === 'invoices' && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <TableHeader title="Invoices" description="GST invoice register and PDF generation status." />
          <ResponsiveTable headers={['Invoice', 'Buyer GSTIN', 'Tax', 'Total', 'Status', 'Action']}>
            {data.invoices.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <Cell>{asString(item.invoice_number)}</Cell>
                <Cell>{asString(item.buyer_gstin)}</Cell>
                <Cell>₹{asNumber(item.tax_amount).toLocaleString('en-IN')}</Cell>
                <Cell>₹{asNumber(item.total).toLocaleString('en-IN')}</Cell>
                <StatusCell status={asString(item.status, '')} />
                <ActionCell resource="invoices" item={item} options={data.statusOptions.invoices || []} savingId={savingId} onChange={updateStatus} />
              </tr>
            ))}
          </ResponsiveTable>
        </section>
      )}

      {tab === 'tax' && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <TableHeader title="Tax Rules" description="Configurable HSN/GST baseline. Accountant verification is still required before live invoicing." />
          <ResponsiveTable headers={['Rule', 'HSN', 'Class', 'Component', 'Rate', 'Notes']}>
            {data.taxRules.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <Cell><p className="font-medium text-gray-900">{asString(item.label)}</p><p className="text-xs text-gray-500">{asString(item.rule_code)}</p></Cell>
                <Cell>{asString(item.hsn_code)}</Cell>
                <Cell>{asString(item.tax_class)}</Cell>
                <Cell>{asString(item.component)}</Cell>
                <Cell>{asNumber(item.rate_percent)}%</Cell>
                <Cell><span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> {asString(item.notes)}</span></Cell>
              </tr>
            ))}
          </ResponsiveTable>
        </section>
      )}

      {tab === 'policies' && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <TableHeader title="Policy Versions" description="Evidence of active policy versions used by checkout consent and public legal pages." />
          <ResponsiveTable headers={['Policy', 'Version', 'Effective', 'URL', 'Summary']}>
            {data.policyVersions.map((item) => (
              <tr key={item.id} className="border-t border-gray-100">
                <Cell><p className="font-medium text-gray-900">{asString(item.title)}</p><p className="text-xs text-gray-500">{asString(item.policy_key)}</p></Cell>
                <Cell>{asString(item.version)}</Cell>
                <Cell>{dateLabel(item.effective_date)}</Cell>
                <Cell>{asString(item.published_url)}</Cell>
                <Cell>{asString(item.summary)}</Cell>
              </tr>
            ))}
          </ResponsiveTable>
        </section>
      )}
    </div>
  );
}

function TableHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function ResponsiveTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-gray-700">{children}</td>;
}

function StatusCell({ status }: { status: string }) {
  return <Cell><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>{status.replaceAll('_', ' ')}</span></Cell>;
}

function ActionCell({
  resource,
  item,
  options,
  savingId,
  onChange,
}: {
  resource: string;
  item: Row;
  options: string[];
  savingId: string;
  onChange: (resource: string, id: string, status: string) => Promise<void>;
}) {
  return (
    <Cell>
      <select
        value={asString(item.status, '')}
        disabled={savingId === item.id}
        onChange={(event) => onChange(resource, item.id, event.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
      >
        {options.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
      </select>
    </Cell>
  );
}