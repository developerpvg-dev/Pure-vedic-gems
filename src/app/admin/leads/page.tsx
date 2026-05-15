'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Phone, Mail, MessageSquare, User, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminPagination } from '@/components/admin/AdminPagination';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  assigned_to: string | null;
  follow_up_date: string | null;
  internal_notes: string | null;
  created_at: string;
}

interface Consultation {
  id: string;
  customer_id: string | null;
  plan_id: string | null;
  plan_title_snapshot: string | null;
  plan_description_snapshot: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  life_situation: string | null;
  consultation_type: string | null;
  mode: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_mode: string | null;
  meeting_link: string | null;
  admin_schedule_notes: string | null;
  scheduled_at: string | null;
  scheduled_email_sent_at: string | null;
  scheduled_notification_sent_at: string | null;
  message: string | null;
  amount_inr: number | null;
  amount_paise: number | null;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  payment_failure_reason: string | null;
  payment_review_reason: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount_verified_at: string | null;
  completed_at: string | null;
  completed_email_sent_at: string | null;
  status: string;
  assigned_expert: string | null;
  internal_notes: string | null;
  created_at: string;
}

type Lead = (Enquiry & { _type: 'enquiry' }) | (Consultation & { _type: 'consultation' });

const STATUS_OPTIONS = ['new', 'contacted', 'resolved', 'closed'];
const CONSULT_STATUS_OPTIONS = ['pending_payment', 'pending', 'confirmed', 'payment_review', 'completed', 'cancelled'];
const LEADS_PER_PAGE = 20;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  pending: 'bg-blue-100 text-blue-700',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-amber-100 text-amber-700',
  payment_review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  captured: 'bg-green-100 text-green-700',
  created: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-600',
  amount_mismatch: 'bg-purple-100 text-purple-700',
};

function formatMoney(amount: number | null, currency = 'INR') {
  if (amount == null) return '-';
  return `${currency} ${amount.toLocaleString('en-IN')}`;
}

function timeInputValue(value: string | null) {
  return value ? value.slice(0, 5) : '';
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'enquiry' | 'consultation'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(LEADS_PER_PAGE) });
    if (filter !== 'all') params.set('type', filter);
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/admin/leads?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { leads?: Lead[]; total?: number; total_pages?: number };
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch {
      setLeads([]);
      setTotal(0);
      setTotalPages(1);
    }
    setLoading(false);
  }, [filter, page, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

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
        const data = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(data?.error || 'Unable to update lead');
      }
      await fetchLeads();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update lead');
    }
    setSaving(null);
  }

  const stats = {
    total,
    newCount: leads.filter((l) => l.status === 'new' || l.status === 'pending').length,
    enquiries: leads.filter((l) => l._type === 'enquiry').length,
    consultations: leads.filter((l) => l._type === 'consultation').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Leads & Enquiries</h1>
        <p className="mt-1 text-sm text-gray-500">Manage customer enquiries and consultation bookings</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Leads', value: stats.total, color: 'text-gray-900' },
          { label: 'New / Pending', value: stats.newCount, color: 'text-blue-600' },
          { label: 'Enquiries', value: stats.enquiries, color: 'text-amber-600' },
          { label: 'Consultations', value: stats.consultations, color: 'text-purple-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['all', 'enquiry', 'consultation'] as const).map((t) => (
            <button key={t} onClick={() => { setFilter(t); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === t ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {t === 'all' ? 'All' : t === 'enquiry' ? 'Enquiries' : 'Consultations'}
            </button>
          ))}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs">
            <option value="">All Status</option>
            {(filter === 'consultation' ? CONSULT_STATUS_OPTIONS : STATUS_OPTIONS).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, phone..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm sm:w-64" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No leads found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => {
            const isEnquiry = lead._type === 'enquiry';
            const name = isEnquiry ? lead.name : lead.full_name;
            const expanded = expandedId === lead.id;
            const statusOpts = isEnquiry ? STATUS_OPTIONS : CONSULT_STATUS_OPTIONS;

            return (
              <div key={lead.id} className="rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm">
                {/* Row */}
                <button type="button" onClick={() => setExpandedId(expanded ? null : lead.id)}
                  className="flex w-full items-center gap-3 p-4 text-left">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isEnquiry ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {isEnquiry ? 'Enquiry' : 'Consultation'}
                      </span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {!isEnquiry && (
                        <span className="hidden sm:inline">
                          {formatMoney(lead.amount_inr, lead.currency)} · {lead.payment_status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="hidden text-xs text-gray-400 sm:block">
                    {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Left: details */}
                      <div className="space-y-3 text-sm">
                        {isEnquiry && lead.subject && (
                          <div><span className="font-medium text-gray-700">Subject:</span> <span className="text-gray-600">{lead.subject}</span></div>
                        )}
                        {isEnquiry && (
                          <div><span className="font-medium text-gray-700">Message:</span><p className="mt-1 whitespace-pre-wrap text-gray-600">{lead.message}</p></div>
                        )}
                        {!isEnquiry && (
                          <>
                            <div><span className="font-medium text-gray-700">Plan:</span> <span className="text-gray-600">{lead.plan_title_snapshot || 'Vedic Consultation'}</span></div>
                            <div><span className="font-medium text-gray-700">Amount:</span> <span className="text-gray-600">{formatMoney(lead.amount_inr, lead.currency)}</span></div>
                            <div><span className="font-medium text-gray-700">Payment:</span> <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[lead.payment_status] || 'bg-gray-100 text-gray-600'}`}>{lead.payment_status.replace(/_/g, ' ')}</span></div>
                            {lead.payment_method && <div><span className="font-medium text-gray-700">Payment Method:</span> <span className="text-gray-600">{lead.payment_method}</span></div>}
                            {lead.razorpay_order_id && <div><span className="font-medium text-gray-700">Razorpay Order:</span> <span className="break-all text-gray-600">{lead.razorpay_order_id}</span></div>}
                            {lead.razorpay_payment_id && <div><span className="font-medium text-gray-700">Razorpay Payment:</span> <span className="break-all text-gray-600">{lead.razorpay_payment_id}</span></div>}
                            {lead.payment_review_reason && <div><span className="font-medium text-gray-700">Payment Review:</span> <span className="text-gray-600">{lead.payment_review_reason}</span></div>}
                            {lead.payment_failure_reason && <div><span className="font-medium text-gray-700">Payment Failure:</span> <span className="text-gray-600">{lead.payment_failure_reason}</span></div>}
                            {lead.customer_id && <div><span className="font-medium text-gray-700">Customer ID:</span> <span className="break-all text-gray-600">{lead.customer_id}</span></div>}
                            {lead.consultation_type && <div><span className="font-medium text-gray-700">Type:</span> <span className="text-gray-600 capitalize">{lead.consultation_type}</span></div>}
                            {lead.mode && <div><span className="font-medium text-gray-700">Mode:</span> <span className="text-gray-600 capitalize">{lead.mode.replace('_', ' ')}</span></div>}
                            {lead.preferred_date && <div><span className="font-medium text-gray-700">Preferred Date:</span> <span className="text-gray-600">{lead.preferred_date}</span></div>}
                            {lead.preferred_time && <div><span className="font-medium text-gray-700">Preferred Time:</span> <span className="text-gray-600">{lead.preferred_time}</span></div>}
                            {lead.scheduled_date && <div><span className="font-medium text-gray-700">Scheduled Date:</span> <span className="text-gray-600">{lead.scheduled_date}</span></div>}
                            {lead.scheduled_time && <div><span className="font-medium text-gray-700">Scheduled Time:</span> <span className="text-gray-600">{lead.scheduled_time}</span></div>}
                            {lead.scheduled_mode && <div><span className="font-medium text-gray-700">Scheduled Mode:</span> <span className="text-gray-600 capitalize">{lead.scheduled_mode.replace('_', ' ')}</span></div>}
                            {lead.meeting_link && <div><span className="font-medium text-gray-700">Meeting Link / Venue:</span> <span className="break-all text-gray-600">{lead.meeting_link}</span></div>}
                            {lead.admin_schedule_notes && <div><span className="font-medium text-gray-700">Schedule Notes:</span><p className="mt-1 text-gray-600">{lead.admin_schedule_notes}</p></div>}
                            {lead.scheduled_at && <div><span className="font-medium text-gray-700">Scheduled At:</span> <span className="text-gray-600">{new Date(lead.scheduled_at).toLocaleString('en-IN')}</span></div>}
                            {lead.scheduled_email_sent_at && <div><span className="font-medium text-gray-700">Schedule Email:</span> <span className="text-gray-600">Sent {new Date(lead.scheduled_email_sent_at).toLocaleString('en-IN')}</span></div>}
                            {lead.scheduled_notification_sent_at && <div><span className="font-medium text-gray-700">Schedule Notification:</span> <span className="text-gray-600">Sent {new Date(lead.scheduled_notification_sent_at).toLocaleString('en-IN')}</span></div>}
                            {lead.date_of_birth && <div><span className="font-medium text-gray-700">DOB:</span> <span className="text-gray-600">{lead.date_of_birth}</span></div>}
                            {lead.birth_time && <div><span className="font-medium text-gray-700">Birth Time:</span> <span className="text-gray-600">{lead.birth_time}</span></div>}
                            {lead.birth_place && <div><span className="font-medium text-gray-700">Birth Place:</span> <span className="text-gray-600">{lead.birth_place}</span></div>}
                            {lead.completed_at && <div><span className="font-medium text-gray-700">Completed At:</span> <span className="text-gray-600">{new Date(lead.completed_at).toLocaleString('en-IN')}</span></div>}
                            {lead.completed_email_sent_at && <div><span className="font-medium text-gray-700">Completion Email:</span> <span className="text-gray-600">Sent {new Date(lead.completed_email_sent_at).toLocaleString('en-IN')}</span></div>}
                            {lead.life_situation && <div><span className="font-medium text-gray-700">Life Situation:</span><p className="mt-1 text-gray-600">{lead.life_situation}</p></div>}
                            {lead.message && <div><span className="font-medium text-gray-700">Message:</span><p className="mt-1 text-gray-600">{lead.message}</p></div>}
                          </>
                        )}
                        {isEnquiry && lead.source && (
                          <div><span className="font-medium text-gray-700">Source:</span> <span className="text-gray-600">{lead.source}</span></div>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                          <select value={lead.status}
                            onChange={(e) => updateLead(lead.id, lead._type, { status: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                            {statusOpts.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                          </select>
                        </div>

                        {isEnquiry && (
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-500">Follow-up Date</label>
                            <input type="date" value={lead.follow_up_date || ''}
                              onChange={(e) => updateLead(lead.id, lead._type, { follow_up_date: e.target.value || null })}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                          </div>
                        )}

                        {!isEnquiry && (
                          <form
                            className="rounded-xl border border-amber-100 bg-amber-50/40 p-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const formData = new FormData(event.currentTarget);
                              const field = (key: string) => {
                                const value = formData.get(key);
                                return typeof value === 'string' && value.trim() ? value.trim() : null;
                              };
                              updateLead(lead.id, lead._type, {
                                scheduled_date: field('scheduled_date'),
                                scheduled_time: field('scheduled_time'),
                                scheduled_mode: field('scheduled_mode'),
                                meeting_link: field('meeting_link'),
                                admin_schedule_notes: field('admin_schedule_notes'),
                              });
                            }}
                          >
                            <p className="mb-3 text-xs font-semibold text-amber-800">Schedule Consultation</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <label className="text-xs font-medium text-gray-500">
                                Date
                                <input name="scheduled_date" type="date" defaultValue={lead.scheduled_date || ''} required className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                              </label>
                              <label className="text-xs font-medium text-gray-500">
                                Time
                                <input name="scheduled_time" type="time" defaultValue={timeInputValue(lead.scheduled_time)} required className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                              </label>
                            </div>
                            <label className="mt-2 block text-xs font-medium text-gray-500">
                              Mode
                              <select name="scheduled_mode" defaultValue={lead.scheduled_mode || lead.mode || 'video'} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                                <option value="video">Video</option>
                                <option value="phone">Phone</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="in_person">In Person</option>
                              </select>
                            </label>
                            <label className="mt-2 block text-xs font-medium text-gray-500">
                              Meeting Link / Venue
                              <input name="meeting_link" defaultValue={lead.meeting_link || ''} placeholder="Zoom/Meet link or venue" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                            </label>
                            <label className="mt-2 block text-xs font-medium text-gray-500">
                              Customer Notes
                              <textarea name="admin_schedule_notes" defaultValue={lead.admin_schedule_notes || ''} rows={3} placeholder="Any details to include in the customer email" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                            </label>
                            <button type="submit" disabled={saving === lead.id} className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60">
                              Save Schedule & Notify Customer
                            </button>
                          </form>
                        )}

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">Internal Notes</label>
                          <textarea defaultValue={lead.internal_notes || ''} rows={3} placeholder="Add notes..."
                            onBlur={(e) => {
                              if (e.target.value !== (lead.internal_notes || '')) {
                                updateLead(lead.id, lead._type, { internal_notes: e.target.value || null });
                              }
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                        </div>

                        {lead.phone && (
                          <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(name)}, this is PureVedicGems. Following up on your ${isEnquiry ? 'enquiry' : 'consultation request'}.`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700">
                            💬 WhatsApp
                          </a>
                        )}

                        {saving === lead.id && (
                          <p className="flex items-center gap-1 text-xs text-amber-600"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</p>
                        )}
                      </div>
                    </div>
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
