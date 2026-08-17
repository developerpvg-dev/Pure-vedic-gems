'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Phone,
  Mail,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  BarChart3,
  Download,
} from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminStatCard } from '@/components/admin/AdminPageShell';
import { EnquiryDetail, type EnquiryLead, type LeadCaps } from '@/components/admin/leads/EnquiryDetail';
import {
  ASTRO_STAGE_CHIPS,
  BLOG_STAGE_CHIPS,
  CONTACT_STAGE_CHIPS,
  CONTACT_TELECOM_STAGE_CHIPS,
  LEAD_PIPELINE_LABELS,
  LEAD_REMARK_BY_CODE,
  LEAD_REMARK_CODES,
  MANAGER_STAGE_FILTERS,
  TELECOM_CALL_OUTCOMES,
  TELECOM_STAGE_CHIPS,
  isBlogEnquiryLead,
  isContactEnquiryLead,
  leadStageLabel,
  type LeadPipelineStage,
  type LeadRemarkCode,
} from '@/lib/leads/constants';
import { formatDob } from '@/lib/utils/format';
import { formatChargedMoney } from '@/lib/currency/format-charged';

type LeadKind = 'remedies' | 'consultation' | 'contact' | 'blog';

function readLeadQuery() {
  if (typeof window === 'undefined') {
    return { assigned_to: '', astrologer_id: '', conversion: '', date_from: '', date_to: '', kind: '' as '' | LeadKind, id: '' };
  }
  const q = new URLSearchParams(window.location.search);
  const kindRaw = q.get('kind') || '';
  const kind: '' | LeadKind =
    kindRaw === 'contact' || kindRaw === 'consultation' || kindRaw === 'remedies' || kindRaw === 'blog'
      ? kindRaw
      : '';
  return {
    assigned_to: q.get('assigned_to') || '',
    astrologer_id: q.get('astrologer_id') || '',
    conversion: q.get('conversion') || '',
    date_from: q.get('date_from') || '',
    date_to: q.get('date_to') || '',
    kind,
    id: q.get('id') || '',
  };
}

type StaffMember = { id: string; name: string; role: string };

type ConsultationLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  amount_inr: number | null;
  amount_paise?: number | null;
  currency: string;
  payment_status: string;
  plan_title_snapshot: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  internal_notes: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_mode: string | null;
  meeting_link: string | null;
  admin_schedule_notes: string | null;
  mode: string | null;
  created_at: string;
  _type: 'consultation';
};

type Lead = EnquiryLead | ConsultationLead;

type Remark = {
  id: string;
  remark_code: string;
  remark_label: string;
  note: string | null;
  channel?: string | null;
  occurred_at?: string | null;
  created_by_name: string | null;
  created_at: string;
};

type Caps = LeadCaps;

const LEADS_PER_PAGE = 25;

const STAGE_COLORS: Record<string, string> = {
  new: 'bg-sky-100 text-sky-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  verifying: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  with_astrologer: 'bg-violet-100 text-violet-800',
  remedies_ready: 'bg-fuchsia-100 text-fuchsia-800',
  sent_to_customer: 'bg-teal-100 text-teal-800',
  remedies_explained: 'bg-lime-100 text-lime-800',
  conversion: 'bg-orange-100 text-orange-900',
  closed: 'bg-gray-100 text-gray-600',
};

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Chart packet for astrologers — never include phone/email (manual WhatsApp/email forwards). */
function buildAstroPacket(lead: EnquiryLead) {
  return [
    `SR. No. ${lead.lead_number ?? '—'}`,
    `Enquiry Type: ${lead.enquiry_type || lead.subject || 'Enquiry'}`,
    `Name: ${lead.name}`,
    `Date of Birth: ${formatDob(lead.date_of_birth)}`,
    `Time of Birth: ${lead.birth_time || '—'}`,
    `Place of Birth: ${lead.birth_place || '—'}`,
    `City / District: ${lead.customer_city || '—'}`,
    `State: ${lead.customer_state || '—'}`,
    `Country: ${lead.customer_country || '—'}`,
    `Area of Concern: ${lead.area_of_concern || '—'}`,
  ].join('\n');
}

export default function LeadsPage() {
  const initialQ = useMemo(() => readLeadQuery(), []);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<LeadKind>(initialQ.kind || 'remedies');
  const [pipeline, setPipeline] = useState('');
  const [queue, setQueue] = useState<'active' | 'waiting' | 'past' | 'all'>('all');
  const [assignedTo, setAssignedTo] = useState(initialQ.assigned_to);
  const [astrologerId, setAstrologerId] = useState(initialQ.astrologer_id);
  const [remarkFilter, setRemarkFilter] = useState('');
  const [conversionFilter, setConversionFilter] = useState(initialQ.conversion);
  const [dateFrom, setDateFrom] = useState(initialQ.date_from);
  const [dateTo, setDateTo] = useState(initialQ.date_to);
  const [followUp, setFollowUp] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(
    Boolean(initialQ.conversion || initialQ.assigned_to || initialQ.astrologer_id)
  );
  const [expandedId, setExpandedId] = useState<string | null>(initialQ.id || null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [remarkCode, setRemarkCode] = useState<LeadRemarkCode>('call_not_answering');
  const [remarkNote, setRemarkNote] = useState('');
  const [staff, setStaff] = useState<{ telecom: StaffMember[]; astrologers: StaffMember[] }>({
    telecom: [],
    astrologers: [],
  });
  const [caps, setCaps] = useState<Caps>({
    canAssign: true,
    canForwardAstrologer: true,
    canEditRemedies: true,
    canSendToTelecaller: true,
    scoped: false,
  });
  const [summary, setSummary] = useState<{
    total: number;
    totalEnquiries: number;
    totalConsultations: number;
    activeQueue: number;
    pastClosed: number;
    newEnquiries: number;
    unassigned: number;
    needsFollowUp: number;
    verifying: number;
    verified: number;
    withAstrologer: number;
    remediesReady: number;
    deliverRemedies: number;
    remediesExplained: number;
    conversion: number;
    saleClosed: number;
    byStage?: Record<string, number>;
    pastOutcomes?: Record<string, number>;
  }>({
    total: 0,
    totalEnquiries: 0,
    totalConsultations: 0,
    activeQueue: 0,
    pastClosed: 0,
    newEnquiries: 0,
    unassigned: 0,
    needsFollowUp: 0,
    verifying: 0,
    verified: 0,
    withAstrologer: 0,
    remediesReady: 0,
    deliverRemedies: 0,
    remediesExplained: 0,
    conversion: 0,
    saleClosed: 0,
    byStage: {},
    pastOutcomes: {},
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch('/api/admin/leads/staff')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStaff({ telecom: data.telecom ?? [], astrologers: data.astrologers ?? [] });
      })
      .catch(() => undefined);
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(LEADS_PER_PAGE), type: 'enquiry' });
    params.set(
      'enquiry_type',
      kind === 'remedies'
        ? 'remedies'
        : kind === 'consultation'
          ? 'consultation'
          : kind === 'blog'
            ? 'blog'
            : 'contact'
    );
    if (pipeline) params.set('pipeline', pipeline);
    else params.set('queue', queue);
    if (assignedTo) params.set('assigned_to', assignedTo);
    if (astrologerId) params.set('astrologer_id', astrologerId);
    if (remarkFilter) params.set('remark', remarkFilter);
    if (conversionFilter) params.set('conversion', conversionFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (followUp) params.set('follow_up', followUp);
    if (unassignedOnly) params.set('unassigned', '1');
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const res = await fetch(`/api/admin/leads?${params}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        leads?: Lead[];
        total?: number;
        total_pages?: number;
        summary?: typeof summary;
        capabilities?: Caps;
        role?: string;
      };
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
      if (data.summary) setSummary((s) => ({ ...s, ...data.summary }));
      if (data.capabilities) {
        setCaps({ ...data.capabilities, role: data.role ?? data.capabilities.role });
      }
    } catch {
      setLeads([]);
      setTotal(0);
      setTotalPages(1);
    }
    setLoading(false);
  }, [
    page,
    kind,
    pipeline,
    queue,
    assignedTo,
    astrologerId,
    remarkFilter,
    conversionFilter,
    dateFrom,
    dateTo,
    followUp,
    unassignedOnly,
    debouncedSearch,
  ]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) setExpandedId(id);
  }, []);

  useEffect(() => {
    if (!expandedId) {
      setRemarks([]);
      return;
    }
    const lead = leads.find((l) => l.id === expandedId);
    if (!lead || lead._type !== 'enquiry') return;
    fetch(`/api/admin/leads/${expandedId}/remarks`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRemarks(data?.remarks ?? []))
      .catch(() => setRemarks([]));
  }, [expandedId, leads]);

  async function updateLead(id: string, type: string, updates: Record<string, unknown>) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...updates }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Unable to update lead');
      }
      await fetchLeads();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update lead');
    }
    setSaving(null);
  }

  async function addRemark(
    id: string,
    code?: LeadRemarkCode,
    extras?: {
      note?: string | null;
      channel?: 'call' | 'whatsapp' | 'email' | null;
      occurred_at?: string | null;
      follow_up_date?: string | null;
    }
  ) {
    setSaving(id);
    setError(null);
    const used = code ?? remarkCode;
    try {
      const res = await fetch(`/api/admin/leads/${id}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: used,
          note: extras?.note !== undefined ? extras.note : remarkNote || null,
          channel: extras?.channel ?? null,
          occurred_at: extras?.occurred_at ?? null,
          follow_up_date: extras?.follow_up_date,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Unable to add remark');
      }
      setRemarkNote('');
      if (code) setRemarkCode(code);
      const data = await res.json();
      setRemarks((prev) => [...prev, data.remark]);
      await fetchLeads();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add remark');
    }
    setSaving(null);
  }

  const staffName = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of [...staff.telecom, ...staff.astrologers]) map.set(m.id, m.name);
    return map;
  }, [staff]);

  const isAstroDesk = caps.role === 'astrologer';
  const isTelecomDesk = !isAstroDesk && (caps.role === 'telecom' || (caps.scoped && !caps.canAssign));
  const isManagerDesk = !isAstroDesk && !isTelecomDesk;

  const stageChips: LeadPipelineStage[] = isAstroDesk
    ? [...ASTRO_STAGE_CHIPS]
    : kind === 'blog'
      ? [...BLOG_STAGE_CHIPS]
      : kind === 'contact'
        ? isTelecomDesk
          ? [...CONTACT_TELECOM_STAGE_CHIPS]
          : [...CONTACT_STAGE_CHIPS]
        : isTelecomDesk
          ? [...TELECOM_STAGE_CHIPS]
          : [...MANAGER_STAGE_FILTERS];

  function resetFilters() {
    setPipeline('');
    setQueue('all');
    setAssignedTo('');
    setAstrologerId('');
    setRemarkFilter('');
    setConversionFilter('');
    setDateFrom('');
    setDateTo('');
    setFollowUp('');
    setUnassignedOnly(false);
    setSearch('');
    setPage(1);
  }

  function exportQueryString() {
    const params = new URLSearchParams({ type: 'enquiry', format: 'xlsx' });
    params.set(
      'enquiry_type',
      kind === 'remedies'
        ? 'remedies'
        : kind === 'consultation'
          ? 'consultation'
          : kind === 'blog'
            ? 'blog'
            : 'contact'
    );
    if (pipeline) params.set('pipeline', pipeline);
    else params.set('queue', queue);
    if (assignedTo) params.set('assigned_to', assignedTo);
    if (astrologerId) params.set('astrologer_id', astrologerId);
    if (remarkFilter) params.set('remark', remarkFilter);
    if (conversionFilter) params.set('conversion', conversionFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (followUp) params.set('follow_up', followUp);
    if (unassignedOnly) params.set('unassigned', '1');
    if (debouncedSearch) params.set('search', debouncedSearch);
    return params.toString();
  }

  const pastOutcomeBars = useMemo(() => {
    const entries = Object.entries(summary.pastOutcomes ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = Math.max(1, ...entries.map(([, n]) => n));
    return entries.map(([code, count]) => ({
      code,
      count,
      label: LEAD_REMARK_BY_CODE[code as LeadRemarkCode]?.label || code,
      pct: Math.round((count / max) * 100),
    }));
  }, [summary.pastOutcomes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAstroDesk ? 'Astrologer desk' : isTelecomDesk ? 'Telecaller desk' : 'Leads pipeline'}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isAstroDesk
              ? 'Write remedies for charts forwarded to you, then submit to the leads manager'
              : kind === 'contact'
                ? isTelecomDesk
                  ? 'Contact form messages — call the customer, log the outcome, then close.'
                  : 'Contact form messages → forward to any telecaller → they call & close'
                : kind === 'blog'
                  ? 'Blog Ask-an-expert popup enquiries — Not addressed → Addressed'
                  : isTelecomDesk
                  ? 'Filter by pipeline stage. Call status & dates are under More filters.'
                  : 'New → Telecaller → Verified → Astrologer → Remedies ready → Deliver → Explained → Conversion → Closed'}
          </p>
        </div>
        {isManagerDesk ? (
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/admin/leads?${exportQueryString()}`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </a>
            <Link
              href="/admin/leads/metrics"
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Lead metrics
            </Link>
          </div>
        ) : null}
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isAstroDesk ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <AdminStatCard label="Active for me" value={summary.activeQueue.toLocaleString('en-IN')} icon={User} tone="text-violet-700" bg="bg-violet-50" />
          <AdminStatCard label="To write" value={summary.withAstrologer.toLocaleString('en-IN')} icon={MessageSquare} tone="text-fuchsia-700" bg="bg-fuchsia-50" />
          <AdminStatCard label="Submitted" value={summary.remediesReady.toLocaleString('en-IN')} icon={CheckCircle2} tone="text-emerald-700" bg="bg-emerald-50" />
          <AdminStatCard label="Past closed" value={summary.pastClosed.toLocaleString('en-IN')} icon={Mail} tone="text-gray-700" bg="bg-gray-50" />
        </div>
      ) : isTelecomDesk ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <AdminStatCard label="Active calls" value={summary.activeQueue.toLocaleString('en-IN')} icon={Phone} tone="text-indigo-700" bg="bg-indigo-50" />
          <AdminStatCard label="Verifying" value={summary.verifying.toLocaleString('en-IN')} icon={MessageSquare} tone="text-amber-700" bg="bg-amber-50" />
          <AdminStatCard label="Deliver remedies" value={(summary.deliverRemedies ?? 0).toLocaleString('en-IN')} icon={CheckCircle2} tone="text-teal-700" bg="bg-teal-50" />
          <AdminStatCard label="Conversion" value={(summary.conversion ?? 0).toLocaleString('en-IN')} icon={CheckCircle2} tone="text-orange-700" bg="bg-orange-50" />
          <AdminStatCard label="Past closed" value={summary.pastClosed.toLocaleString('en-IN')} icon={User} tone="text-gray-700" bg="bg-gray-50" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <AdminStatCard
            label={
              kind === 'remedies'
                ? 'Remedies leads'
                : kind === 'consultation'
                  ? 'Consultations'
                  : kind === 'blog'
                    ? 'Blog enquiries'
                    : 'Contact messages'
            }
            value={summary.totalEnquiries.toLocaleString('en-IN')}
            icon={UsersIcon}
            tone="text-gray-900"
            bg="bg-gray-50"
          />
          <AdminStatCard label="New / unassigned" value={`${summary.newEnquiries} / ${summary.unassigned}`} icon={MessageSquare} tone="text-sky-700" bg="bg-sky-50" />
          <AdminStatCard label="With telecaller" value={summary.verifying.toLocaleString('en-IN')} icon={Phone} tone="text-amber-700" bg="bg-amber-50" />
          {kind === 'contact' ? (
            <AdminStatCard label="Past closed" value={summary.pastClosed.toLocaleString('en-IN')} icon={CheckCircle2} tone="text-gray-700" bg="bg-gray-50" />
          ) : (
            <>
              <AdminStatCard label="Verified" value={summary.verified.toLocaleString('en-IN')} icon={CheckCircle2} tone="text-emerald-700" bg="bg-emerald-50" />
              <AdminStatCard label="With astrologer" value={summary.withAstrologer.toLocaleString('en-IN')} icon={User} tone="text-violet-700" bg="bg-violet-50" />
              <AdminStatCard label="Conversion" value={(summary.conversion ?? 0).toLocaleString('en-IN')} icon={CheckCircle2} tone="text-orange-700" bg="bg-orange-50" />
            </>
          )}
        </div>
      )}

      {(isTelecomDesk || isAstroDesk) && pastOutcomeBars.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Past closed outcomes</p>
          <div className="mt-3 space-y-2">
            {pastOutcomeBars.map((bar) => (
              <div key={bar.code} className="grid grid-cols-[minmax(0,1fr)_3rem] items-center gap-3">
                <div>
                  <div className="mb-1 flex justify-between gap-2 text-[11px] text-gray-600">
                    <span className="truncate">{bar.label}</span>
                    <span className="font-semibold text-gray-800">{bar.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${bar.pct}%` }} />
                  </div>
                </div>
                <span className="text-right text-[10px] text-gray-400">{bar.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setKind('remedies'); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${kind === 'remedies' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Remedies leads (₹101)</button>
          <button type="button" onClick={() => { setKind('consultation'); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${kind === 'consultation' ? 'bg-violet-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Detailed consultations</button>
          <button type="button" onClick={() => { setKind('contact'); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${kind === 'contact' ? 'bg-sky-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Contact messages</button>
          <button type="button" onClick={() => { setKind('blog'); setPage(1); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${kind === 'blog' ? 'bg-rose-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Blog enquiries</button>
        </div>
        <button type="button" onClick={() => setShowFilters((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          <Filter className="h-3.5 w-3.5" />
          {showFilters ? 'Hide filters' : 'More filters'}
          {remarkFilter ? (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">on</span>
          ) : null}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { setPipeline(''); setQueue('all'); setPage(1); }} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${!pipeline ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All stages</button>
          {stageChips.map((stage) => (
            <button key={stage} type="button" onClick={() => { setPipeline(stage); setQueue('all'); setPage(1); }} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${pipeline === stage ? 'bg-amber-600 text-white' : `${STAGE_COLORS[stage]} hover:opacity-80`}`}>
              {kind === 'blog' ? leadStageLabel(stage, { source: 'blog_popup' }) : LEAD_PIPELINE_LABELS[stage]}
              {summary.byStage?.[stage] != null ? ` (${summary.byStage[stage]})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-gray-500">
            Search
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Name, email, phone..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </label>
          {!caps.scoped && (
            <label className="text-xs font-medium text-gray-500 sm:w-48">
              Assigned telecaller
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All telecallers</option>
                {staff.telecom.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          )}
          {!caps.scoped && (
            <label className="flex items-center gap-2 pb-2 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => { setUnassignedOnly(e.target.checked); setPage(1); }}
              />
              Unassigned only
            </label>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
            {isTelecomDesk && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">Call status</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => { setRemarkFilter(''); setPage(1); }} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${!remarkFilter ? 'bg-indigo-900 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'}`}>All</button>
                  {TELECOM_CALL_OUTCOMES.map((s) => (
                    <button key={s.code} type="button" onClick={() => { setRemarkFilter(s.code); setPage(1); }} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${remarkFilter === s.code ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200'}`}>{s.short}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {!caps.scoped && (
                <label className="text-xs font-medium text-gray-500">
                  Astrologer
                  <select
                    value={astrologerId}
                    onChange={(e) => { setAstrologerId(e.target.value); setPage(1); }}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    {staff.astrologers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </label>
              )}
              {!isAstroDesk && !isTelecomDesk && (
                <label className="text-xs font-medium text-gray-500">
                  Last remark
                  <select
                    value={remarkFilter}
                    onChange={(e) => { setRemarkFilter(e.target.value); setPage(1); }}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All remarks</option>
                    {LEAD_REMARK_CODES.map((r) => (
                      <option key={r.code} value={r.code}>{r.label}</option>
                    ))}
                  </select>
                </label>
              )}
              {!isAstroDesk && !isTelecomDesk && (
                <label className="text-xs font-medium text-gray-500">
                  Conversion
                  <select
                    value={conversionFilter}
                    onChange={(e) => { setConversionFilter(e.target.value); setPage(1); }}
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    <option value="converted">Converted</option>
                    <option value="not_converted">Not converted</option>
                    <option value="pending">Pending outcome</option>
                  </select>
                </label>
              )}
              <label className="text-xs font-medium text-gray-500">
                Date from
                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-500">
                Date to
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </label>
              {!isAstroDesk && (
                <label className="text-xs font-medium text-gray-500">
                  Follow-up
                  <select value={followUp} onChange={(e) => { setFollowUp(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                    <option value="">Any</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Today</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </label>
              )}
              <div className="flex items-end">
                <button type="button" onClick={resetFilters} className="text-xs font-medium text-amber-700 hover:underline">
                  Reset filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No leads match these filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => {
            const isEnquiry = lead._type === 'enquiry';
            const name = isEnquiry ? lead.name : lead.full_name;
            const expanded = expandedId === lead.id;
            const stage = isEnquiry ? (lead.pipeline_stage || 'new') : lead.status;

            return (
              <div key={`${lead._type}-${lead.id}`} className="rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : lead.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {isEnquiry && lead.lead_number ? `#${lead.lead_number}` : <User className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                      {isEnquiry ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          isBlogEnquiryLead(lead.source, lead.enquiry_type)
                            ? 'bg-rose-50 text-rose-800'
                            : isContactEnquiryLead(lead.source, lead.enquiry_type)
                            ? 'bg-sky-50 text-sky-800'
                            : (lead.enquiry_type || '').toLowerCase().includes('consultation')
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isBlogEnquiryLead(lead.source, lead.enquiry_type)
                            ? 'Blog'
                            : isContactEnquiryLead(lead.source, lead.enquiry_type)
                            ? 'Contact'
                            : (lead.enquiry_type || '').toLowerCase().includes('consultation')
                              ? 'Consultation'
                              : 'Remedies lead'}
                        </span>
                      ) : (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                          Payment booking
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100 text-gray-600'}`}>
                        {isEnquiry
                          ? leadStageLabel(stage as string, { source: lead.source, enquiryType: lead.enquiry_type })
                          : stage}
                      </span>
                      {isEnquiry && lead.details_confirmed && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Details OK</span>
                      )}
                      {isEnquiry && lead.last_remark_code && !isAstroDesk && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          {LEAD_REMARK_CODES.find((r) => r.code === lead.last_remark_code)?.label || lead.last_remark_code}
                        </span>
                      )}
                      {isEnquiry && lead.payment_received && !isAstroDesk && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">₹ paid</span>
                      )}
                      {isEnquiry &&
                        !lead.payment_received &&
                        Boolean(lead.consultation_id) &&
                        !isAstroDesk && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          Payment pending
                        </span>
                      )}
                      {isEnquiry && lead.conversion_status === 'converted' && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Converted{lead.order_number ? ` · ${lead.order_number}` : ''}
                        </span>
                      )}
                      {isEnquiry && lead.conversion_status === 'not_converted' && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          Not converted
                        </span>
                      )}
                      {isEnquiry && lead.duplicate_status === 'duplicate' && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                          Duplicate
                        </span>
                      )}
                      {isEnquiry && lead.duplicate_status === 'potential' && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          Potential duplicate
                        </span>
                      )}
                      {isEnquiry && lead.sale_close && !lead.conversion_status && !isTelecomDesk && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Sale closed</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {isAstroDesk && isEnquiry ? (
                        <>
                          <span>DOB: {formatDob(lead.date_of_birth)}</span>
                          <span>Time: {(lead.birth_time || '—').slice(0, 5)}</span>
                          <span>Place: {lead.birth_place || '—'}</span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                          {isEnquiry && lead.assigned_to && (
                            <span>Coord: {staffName.get(lead.assigned_to) || 'Assigned'}</span>
                          )}
                          {isEnquiry && lead.astrologer_name && <span>Astro: {lead.astrologer_name}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <span className="hidden text-xs text-gray-400 sm:block">{fmtDate(lead.created_at)}</span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {expanded && isEnquiry && (
                  <EnquiryDetail
                    lead={lead}
                    remarks={remarks}
                    staff={staff}
                    caps={caps}
                    saving={saving === lead.id}
                    remarkCode={remarkCode}
                    remarkNote={remarkNote}
                    copied={copied}
                    onRemarkCode={setRemarkCode}
                    onRemarkNote={setRemarkNote}
                    onAddRemark={(code, extras) => addRemark(lead.id, code, extras)}
                    onUpdate={(updates) => updateLead(lead.id, 'enquiry', updates)}
                    onOpenPrior={async (priorId) => {
                      if (leads.some((l) => l.id === priorId)) {
                        setExpandedId(priorId);
                        return;
                      }
                      try {
                        const res = await fetch(`/api/admin/leads/${priorId}`);
                        if (!res.ok) return;
                        const data = await res.json();
                        if (data?.lead) {
                          setLeads((prev) =>
                            prev.some((l) => l.id === priorId) ? prev : [data.lead as EnquiryLead, ...prev]
                          );
                          setExpandedId(priorId);
                        }
                      } catch {
                        /* ignore */
                      }
                    }}
                    onCopy={async () => {
                      await navigator.clipboard.writeText(buildAstroPacket(lead));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  />
                )}

                {expanded && !isEnquiry && (
                  <div className="border-t border-gray-100 p-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-800">{lead.plan_title_snapshot || 'Consultation'}</p>
                    <p className="mt-1">Payment: {lead.payment_status} · {lead.amount_inr != null ? formatChargedMoney(lead) : '—'}</p>
                    <label className="mt-3 block text-xs font-medium text-gray-500">
                      Status
                      <select
                        value={lead.status}
                        onChange={(e) => updateLead(lead.id, 'consultation', { status: e.target.value })}
                        className="mt-1 w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        {['pending_payment', 'pending', 'confirmed', 'payment_review', 'completed', 'cancelled'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="mt-3 block text-xs font-medium text-gray-500">
                      Notes
                      <textarea
                        defaultValue={lead.internal_notes || ''}
                        rows={3}
                        onBlur={(e) => {
                          if (e.target.value !== (lead.internal_notes || '')) {
                            updateLead(lead.id, 'consultation', { internal_notes: e.target.value || null });
                          }
                        }}
                        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
          <AdminPagination page={page} totalPages={totalPages} total={total} perPage={LEADS_PER_PAGE} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function UsersIcon(props: { className?: string }) {
  return <User {...props} />;
}
