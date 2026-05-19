'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, Loader2, ReceiptText, RefreshCw, RotateCcw, Scale, ShieldCheck } from 'lucide-react';

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

function StatCard({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'success' }) {
  const color = tone === 'warning' ? 'text-amber-700' : tone === 'success' ? 'text-green-700' : 'text-gray-950';
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function CompliancePage() {
  const [tab, setTab] = useState<ComplianceTab>('privacy');
  const [data, setData] = useState<ComplianceData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Compliance Desk</h1>
          <p className="mt-1 text-sm text-gray-500">Week 12 controls for tax, invoices, returns, privacy, consent, and policy evidence.</p>
        </div>
        <button onClick={() => loadCompliance()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {message && <p className={`rounded-lg px-3 py-2 text-sm ${message.includes('failed') || message.includes('Unable') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open privacy" value={stats.openPrivacy} tone={stats.openPrivacy ? 'warning' : 'success'} />
        <StatCard label="Open returns" value={stats.openReturns} tone={stats.openReturns ? 'warning' : 'success'} />
        <StatCard label="Pending invoices" value={stats.pendingInvoices} tone={stats.pendingInvoices ? 'warning' : 'success'} />
        <StatCard label="Tax rules to verify" value={stats.verificationNeeded} tone="warning" />
      </div>

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