'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminStatCard } from '@/components/admin/AdminPageShell';
import { EnquiryDetail, type EnquiryLead, type LeadCaps } from '@/components/admin/leads/EnquiryDetail';
import {
  LEAD_PIPELINE_LABELS,
  LEAD_PIPELINE_STAGES,
  LEAD_REMARK_CODES,
  type LeadPipelineStage,
  type LeadRemarkCode,
} from '@/lib/leads/constants';

type StaffMember = { id: string; name: string; role: string };

type ConsultationLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  amount_inr: number | null;
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
  follow_up: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-600',
};

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildAstroPacket(lead: EnquiryLead) {
  return [
    `SR. No. ${lead.lead_number ?? '—'}`,
    `Date: ${fmtDate(lead.created_at)}`,
    `Enquiry Type: ${lead.enquiry_type || lead.subject || 'Enquiry'}`,
    lead.ip_location ? `IP Location: ${lead.ip_location}` : null,
    `Name: ${lead.name}`,
    `Phone No: ${lead.phone || '—'}`,
    `Email ID: ${lead.email}`,
    `Date of Birth: ${lead.date_of_birth || '—'}`,
    `Time of Birth: ${lead.birth_time || '—'}`,
    `Place of Birth: ${lead.birth_place || '—'}`,
    `Area of Concern: ${lead.area_of_concern || '—'}`,
    lead.payment_received ? `Payment: Received${lead.payment_note ? ` — ${lead.payment_note}` : ''}` : 'Payment: Pending',
  ]
    .filter(Boolean)
    .join('\n');
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'enquiry' | 'consultation' | 'all'>('enquiry');
  const [pipeline, setPipeline] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [astrologerId, setAstrologerId] = useState('');
  const [remarkFilter, setRemarkFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saleClose, setSaleClose] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [detailsConfirmed, setDetailsConfirmed] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    newEnquiries: number;
    unassigned: number;
    needsFollowUp: number;
    verifying: number;
    verified: number;
    withAstrologer: number;
    remediesReady: number;
    saleClosed: number;
    byStage?: Record<string, number>;
  }>({
    total: 0,
    totalEnquiries: 0,
    totalConsultations: 0,
    newEnquiries: 0,
    unassigned: 0,
    needsFollowUp: 0,
    verifying: 0,
    verified: 0,
    withAstrologer: 0,
    remediesReady: 0,
    saleClosed: 0,
    byStage: {},
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
    const params = new URLSearchParams({ page: String(page), per_page: String(LEADS_PER_PAGE), type: filter });
    if (pipeline) params.set('pipeline', pipeline);
    if (assignedTo) params.set('assigned_to', assignedTo);
    if (astrologerId) params.set('astrologer_id', astrologerId);
    if (remarkFilter) params.set('remark', remarkFilter);
    if (sourceFilter) params.set('source', sourceFilter);
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    if (followUp) params.set('follow_up', followUp);
    if (saleClose) params.set('sale_close', saleClose);
    if (paymentReceived) params.set('payment_received', paymentReceived);
    if (detailsConfirmed) params.set('details_confirmed', detailsConfirmed);
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
    filter,
    pipeline,
    assignedTo,
    astrologerId,
    remarkFilter,
    sourceFilter,
    dateFrom,
    dateTo,
    followUp,
    saleClose,
    paymentReceived,
    detailsConfirmed,
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

  async function addRemark(id: string) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${id}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: remarkCode, note: remarkNote || null }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || 'Unable to add remark');
      }
      setRemarkNote('');
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

  function resetFilters() {
    setPipeline('');
    setAssignedTo('');
    setAstrologerId('');
    setRemarkFilter('');
    setSourceFilter('');
    setDateFrom('');
    setDateTo('');
    setFollowUp('');
    setSaleClose('');
    setPaymentReceived('');
    setDetailsConfirmed('');
    setUnassignedOnly(false);
    setSearch('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads CRM</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manager assigns → Telecaller verifies → Manager → Astrologer → Manager edits → Telecaller delivers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Filter className="h-3.5 w-3.5" />
          {showFilters ? 'Hide filters' : 'Show filters'}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <AdminStatCard label="Total enquiries" value={summary.totalEnquiries.toLocaleString('en-IN')} icon={UsersIcon} tone="text-gray-900" bg="bg-gray-50" />
        <AdminStatCard label="New / unassigned" value={`${summary.newEnquiries} / ${summary.unassigned}`} icon={MessageSquare} tone="text-sky-700" bg="bg-sky-50" />
        <AdminStatCard label="Verifying" value={summary.verifying.toLocaleString('en-IN')} icon={Phone} tone="text-amber-700" bg="bg-amber-50" />
        <AdminStatCard label="Verified" value={summary.verified.toLocaleString('en-IN')} icon={CheckCircle2} tone="text-emerald-700" bg="bg-emerald-50" />
        <AdminStatCard label="With astrologer" value={summary.withAstrologer.toLocaleString('en-IN')} icon={User} tone="text-violet-700" bg="bg-violet-50" />
        <AdminStatCard label="Follow-ups due" value={summary.needsFollowUp.toLocaleString('en-IN')} icon={Mail} tone="text-orange-700" bg="bg-orange-50" />
      </div>

      {/* Pipeline quick filters */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => { setPipeline(''); setPage(1); }}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${!pipeline ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All stages
        </button>
        {LEAD_PIPELINE_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => { setPipeline(stage); setFilter('enquiry'); setPage(1); }}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              pipeline === stage ? 'bg-amber-600 text-white' : `${STAGE_COLORS[stage]} hover:opacity-80`
            }`}
          >
            {LEAD_PIPELINE_LABELS[stage]}
            {summary.byStage?.[stage] != null ? ` (${summary.byStage[stage]})` : ''}
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(['enquiry', 'consultation', 'all'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setFilter(t); setPage(1); }}
                  disabled={caps.scoped && t !== 'enquiry'}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                    filter === t ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'all' ? 'All types' : t === 'enquiry' ? 'Enquiry CRM' : 'Consultations'}
                </button>
              ))}
            </div>
            <button type="button" onClick={resetFilters} className="text-xs font-medium text-amber-700 hover:underline">
              Reset filters
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="text-xs font-medium text-gray-500">
              Search
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Name, email, phone, place..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm"
                />
              </div>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Coordinator
              <select
                value={assignedTo}
                onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
                disabled={caps.scoped}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                onChange={(e) => { setAstrologerId(e.target.value); setPage(1); }}
                disabled={caps.scoped && !caps.canEditRemedies}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                <option value="">All</option>
                {staff.astrologers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
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
            <label className="text-xs font-medium text-gray-500">
              Date from
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Date to
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-medium text-gray-500">
              Follow-up
              <select value={followUp} onChange={(e) => { setFollowUp(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">Any</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Source
              <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">All sources</option>
                <option value="homepage_recommendation">Homepage recommendation</option>
                <option value="contact_form">Contact form</option>
                <option value="yagya_booking">Yagya booking</option>
                <option value="agent_chat">Ratna AI</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Payment
              <select value={paymentReceived} onChange={(e) => { setPaymentReceived(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">Any</option>
                <option value="1">Received</option>
                <option value="0">Pending</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Details confirmed
              <select value={detailsConfirmed} onChange={(e) => { setDetailsConfirmed(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">Any</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </label>
            <label className="text-xs font-medium text-gray-500">
              Sale close
              <select value={saleClose} onChange={(e) => { setSaleClose(e.target.value); setPage(1); }} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <option value="">Any</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-xs font-medium text-gray-700">
              <input type="checkbox" checked={unassignedOnly} onChange={(e) => { setUnassignedOnly(e.target.checked); setPage(1); }} disabled={caps.scoped} />
              Unassigned only
            </label>
          </div>
        </div>
      )}

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
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isEnquiry ? 'bg-amber-50 text-amber-700' : 'bg-purple-50 text-purple-700'}`}>
                        {isEnquiry ? 'Enquiry' : 'Consultation'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100 text-gray-600'}`}>
                        {isEnquiry ? LEAD_PIPELINE_LABELS[stage as LeadPipelineStage] || stage : stage}
                      </span>
                      {isEnquiry && lead.payment_received && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">₹ paid</span>
                      )}
                      {isEnquiry && lead.sale_close && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Sale closed</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {isEnquiry && lead.assigned_to && (
                        <span>Coord: {staffName.get(lead.assigned_to) || 'Assigned'}</span>
                      )}
                      {isEnquiry && lead.astrologer_name && <span>Astro: {lead.astrologer_name}</span>}
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
                    onAddRemark={() => addRemark(lead.id)}
                    onUpdate={(updates) => updateLead(lead.id, 'enquiry', updates)}
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
                    <p className="mt-1">Payment: {lead.payment_status} · {lead.amount_inr != null ? `₹${lead.amount_inr}` : '—'}</p>
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
