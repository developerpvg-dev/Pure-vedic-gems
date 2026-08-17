'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Loader2, Pencil, Save, X } from 'lucide-react';
import {
  BLOG_STAGE_CHIPS,
  CONTACT_STAGE_CHIPS,
  LEAD_ENQUIRY_TYPES,
  LEAD_FOLLOWUP_CHANNEL_LABEL,
  LEAD_FOLLOWUP_CHANNELS,
  LEAD_NOT_CONVERTED_BY_CODE,
  LEAD_NOT_CONVERTED_REASONS,
  LEAD_PIPELINE_HELP,
  LEAD_PIPELINE_LABELS,
  LEAD_PIPELINE_STAGES,
  LEAD_REMARK_BY_CODE,
  LEAD_REMARK_CODES,
  LEAD_STAGE_OWNER,
  REMEDIES_TEMPLATE,
  TELECOM_CALL_OUTCOMES,
  TELECOM_DELIVERY_OUTCOMES,
  isBlogEnquiryLead,
  isContactEnquiryLead,
  leadStageLabel,
  type LeadFollowUpChannel,
  type LeadNotConvertedReason,
  type LeadPipelineStage,
  type LeadRemarkCode,
} from '@/lib/leads/constants';
import { formatDob } from '@/lib/utils/format';

type StaffMember = { id: string; name: string; role: string };

export type EnquiryLead = {
  id: string;
  lead_number?: number;
  name: string;
  email: string;
  phone: string | null;
  additional_phones?: string[] | null;
  additional_emails?: string[] | null;
  subject: string | null;
  message: string;
  source: string;
  status: string;
  assigned_to: string | null;
  follow_up_date: string | null;
  internal_notes: string | null;
  pipeline_stage?: string;
  enquiry_type?: string | null;
  consultation_id?: string | null;
  ip_location?: string | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  customer_city?: string | null;
  customer_state?: string | null;
  customer_country?: string | null;
  area_of_concern?: string | null;
  details_confirmed?: boolean;
  payment_received?: boolean;
  payment_note?: string | null;
  astrologer_id?: string | null;
  astrologer_name?: string | null;
  astrologer_forwarded_at?: string | null;
  astrologer_replied_at?: string | null;
  remedies_text?: string | null;
  forwarded_to_customer_at?: string | null;
  astrologer_help?: boolean | null;
  product_purchase?: boolean | null;
  sale_close?: boolean | null;
  feedback_received?: boolean | null;
  last_remark_code?: string | null;
  conversion_status?: string | null;
  conversion_reason_code?: string | null;
  conversion_reason_note?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  converted_at?: string | null;
  not_converted_at?: string | null;
  conversion_recorded_by_name?: string | null;
  created_at: string;
  duplicate_status?: 'duplicate' | 'potential' | null;
  duplicate_matches?: DuplicateMatchSummary[];
  _type: 'enquiry';
};

export type DuplicateMatchSummary = {
  id: string;
  lead_number: number | null;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  pipeline_stage: string;
  assigned_to: string | null;
  telecaller_name: string | null;
  created_at: string;
  status: 'duplicate' | 'potential';
  matched_fields: ('dob' | 'time' | 'place' | 'email' | 'phone')[];
};

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

export type RemarkExtras = {
  note?: string | null;
  channel?: LeadFollowUpChannel | null;
  occurred_at?: string | null;
  follow_up_date?: string | null;
};

export type LeadCaps = {
  canAssign: boolean;
  canForwardAstrologer: boolean;
  canEditRemedies: boolean;
  canSendToTelecaller: boolean;
  role?: string;
  scoped: boolean;
};

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

const MATCH_FIELD_LABEL: Record<'dob' | 'time' | 'place' | 'email' | 'phone', string> = {
  dob: 'DOB',
  time: 'Time of birth',
  place: 'Place of birth',
  email: 'Email',
  phone: 'Phone',
};

function DuplicateBanner({
  matches,
  canAssign,
  unassigned,
  saving,
  onAssignSame,
  onOpenPrior,
}: {
  matches: DuplicateMatchSummary[];
  canAssign: boolean;
  unassigned: boolean;
  saving: boolean;
  onAssignSame: (telecallerId: string) => void;
  onOpenPrior: (id: string) => void;
}) {
  if (!matches.length) return null;
  const best = matches[0];
  const exact = best.status === 'duplicate';
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        exact ? 'border-rose-200 bg-rose-50/70' : 'border-amber-200 bg-amber-50/70'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            exact ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {exact ? 'Duplicate lead' : 'Potential duplicate'}
        </span>
        <span className="text-[11px] text-gray-600">
          Matched: {best.matched_fields.map((f) => MATCH_FIELD_LABEL[f]).join(' + ')}
        </span>
      </div>
      <p className={`text-xs ${exact ? 'text-rose-900' : 'text-amber-950'}`}>
        {best.matched_fields.some((f) => f === 'email' || f === 'phone')
          ? 'Same contact details as earlier lead '
          : 'Same birth details as earlier lead '}
        <button
          type="button"
          onClick={() => onOpenPrior(best.id)}
          className="font-semibold underline underline-offset-2"
        >
          SR #{best.lead_number ?? '—'} · {best.name}
        </button>
        {best.telecaller_name
          ? ` — handled by telecaller ${best.telecaller_name}`
          : ' — prior lead had no telecaller assigned'}
        .
      </p>
      <div className="grid gap-2 rounded-md border border-white/60 bg-white/70 p-2 text-[11px] text-gray-700 sm:grid-cols-2">
        <p>
          <span className="font-medium text-gray-500">Prior DOB:</span> {formatDob(best.date_of_birth)}
        </p>
        <p>
          <span className="font-medium text-gray-500">Prior time:</span>{' '}
          {(best.birth_time || '—').slice(0, 5)}
        </p>
        <p>
          <span className="font-medium text-gray-500">Prior place:</span> {best.birth_place || '—'}
        </p>
        <p>
          <span className="font-medium text-gray-500">Prior stage:</span> {best.pipeline_stage}
        </p>
        <p className="sm:col-span-2">
          <span className="font-medium text-gray-500">Prior contact:</span> {best.phone || '—'} ·{' '}
          {best.email}
        </p>
      </div>
      {canAssign && unassigned && best.assigned_to ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => onAssignSame(best.assigned_to!)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
            exact ? 'bg-rose-700 hover:bg-rose-800' : 'bg-amber-700 hover:bg-amber-800'
          }`}
        >
          Assign to same telecaller ({best.telecaller_name || 'prior'})
        </button>
      ) : null}
      {matches.length > 1 ? (
        <ul className="space-y-1 border-t border-black/5 pt-2 text-[11px] text-gray-600">
          {matches.slice(1).map((m) => (
            <li key={m.id}>
              Also {m.status === 'duplicate' ? 'duplicate' : 'potential'} of{' '}
              <button type="button" onClick={() => onOpenPrior(m.id)} className="font-medium underline">
                SR #{m.lead_number ?? '—'}
              </button>
              {m.telecaller_name ? ` (${m.telecaller_name})` : ''} ·{' '}
              {m.matched_fields.map((f) => MATCH_FIELD_LABEL[f]).join('+')}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function remarkWhen(r: Remark) {
  return r.occurred_at || r.created_at;
}

function channelLabel(channel: string | null | undefined) {
  if (!channel) return null;
  return LEAD_FOLLOWUP_CHANNEL_LABEL[channel as LeadFollowUpChannel] || channel;
}

function toLocalDateTimeInput(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FollowUpTimeline({ remarks, title = 'Follow-up history' }: { remarks: Remark[]; title?: string }) {
  if (!remarks.length) return null;
  const counts = { call: 0, whatsapp: 0, email: 0 };
  for (const r of remarks) {
    if (r.channel === 'call' || r.channel === 'whatsapp' || r.channel === 'email') counts[r.channel] += 1;
  }
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <p className="mb-2 text-[11px] text-gray-500">
        {remarks.length} follow-up{remarks.length === 1 ? '' : 's'}
        {counts.call || counts.whatsapp || counts.email
          ? ` · Call ${counts.call} · WhatsApp ${counts.whatsapp} · Email ${counts.email}`
          : ''}
      </p>
      <ol className="space-y-2">
        {remarks.map((r, idx) => (
          <li key={r.id} className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-gray-800">
                ({idx + 1}) {r.remark_label}
              </span>
              <span className="shrink-0 text-gray-400">{fmtDateTime(remarkWhen(r))}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {channelLabel(r.channel) ? (
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
                  {channelLabel(r.channel)}
                </span>
              ) : null}
              {r.created_by_name ? (
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-gray-500 ring-1 ring-gray-200">
                  by {r.created_by_name}
                </span>
              ) : null}
            </div>
            {r.note ? <p className="mt-1 text-gray-600">{r.note}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FollowUpLogPanel({
  saving,
  defaultCode = 'call_not_answering',
  defaultFollowUpDate,
  onSubmit,
}: {
  saving: boolean;
  defaultCode?: LeadRemarkCode;
  defaultFollowUpDate?: string | null;
  onSubmit: (code: LeadRemarkCode, extras: RemarkExtras) => void;
}) {
  const [channel, setChannel] = useState<LeadFollowUpChannel>('call');
  const [whenLocal, setWhenLocal] = useState(toLocalDateTimeInput());
  const [code, setCode] = useState<LeadRemarkCode>(defaultCode);
  const [note, setNote] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState(defaultFollowUpDate || '');

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">Log follow-up</p>
        <p className="mt-0.5 text-[11px] text-indigo-900/80">
          Record each call / WhatsApp / email separately with date &amp; time so the full history is visible.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-medium text-gray-600">
          Date &amp; time
          <input
            type="datetime-local"
            value={whenLocal}
            onChange={(e) => setWhenLocal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Medium
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as LeadFollowUpChannel)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {LEAD_FOLLOWUP_CHANNELS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-xs font-medium text-gray-600">
        Status / response
        <select
          value={code}
          onChange={(e) => setCode(e.target.value as LeadRemarkCode)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          {LEAD_REMARK_CODES.map((r) => (
            <option key={r.code} value={r.code}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-gray-600">
        Notes / remarks
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="What happened on this follow-up…"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-medium text-gray-600">
        Next follow-up date (optional)
        <input
          type="date"
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={saving || (code === 'custom' && !note.trim())}
        onClick={() => {
          const occurred = whenLocal ? new Date(whenLocal) : new Date();
          onSubmit(code, {
            channel,
            note: note.trim() || null,
            occurred_at: Number.isNaN(occurred.getTime()) ? null : occurred.toISOString(),
            // only update lead follow_up_date when telecaller sets one
            ...(nextFollowUp ? { follow_up_date: nextFollowUp } : {}),
          });
          setNote('');
          setWhenLocal(toLocalDateTimeInput());
        }}
        className="w-full rounded-lg bg-indigo-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
      >
        Save follow-up
      </button>
    </div>
  );
}

function ConversionBanner({ lead }: { lead: EnquiryLead }) {
  if (lead.conversion_status === 'converted') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <p className="font-semibold">Sale converted</p>
        <p className="mt-0.5 text-xs">
          Order{' '}
          {lead.order_id ? (
            <a href={`/admin/orders/${lead.order_id}`} className="font-semibold underline underline-offset-2">
              {lead.order_number || '—'}
            </a>
          ) : (
            <span className="font-semibold">{lead.order_number || '—'}</span>
          )}
          {lead.converted_at ? ` · ${fmtDate(lead.converted_at)}` : ''}
          {lead.conversion_recorded_by_name ? ` · by ${lead.conversion_recorded_by_name}` : ''}
        </p>
      </div>
    );
  }
  if (lead.conversion_status === 'not_converted') {
    const reason =
      LEAD_NOT_CONVERTED_BY_CODE[lead.conversion_reason_code as LeadNotConvertedReason]?.label ||
      lead.conversion_reason_code ||
      'Not converted';
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        <p className="font-semibold">Not converted</p>
        <p className="mt-0.5 text-xs">
          {reason}
          {lead.conversion_reason_note ? ` — ${lead.conversion_reason_note}` : ''}
          {lead.not_converted_at ? ` · ${fmtDate(lead.not_converted_at)}` : ''}
          {lead.conversion_recorded_by_name ? ` · by ${lead.conversion_recorded_by_name}` : ''}
        </p>
      </div>
    );
  }
  return null;
}

function NotConvertedPanel({
  saving,
  onUpdate,
}: {
  saving: boolean;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const [reason, setReason] = useState<LeadNotConvertedReason>('budget_issue');
  const [note, setNote] = useState('');
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-950">Not converted — pick a reason</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {LEAD_NOT_CONVERTED_REASONS.map((r) => (
          <button
            key={r.code}
            type="button"
            disabled={saving}
            onClick={() => setReason(r.code)}
            className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition disabled:opacity-50 ${
              reason === r.code
                ? 'border-amber-500 bg-amber-100 text-amber-950'
                : 'border-gray-200 bg-white text-gray-800 hover:bg-amber-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder={reason === 'other' ? 'Write why not converted (required)…' : 'Optional note…'}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={saving || (reason === 'other' && !note.trim())}
        onClick={() =>
          onUpdate({
            action: 'mark_not_converted',
            conversion_reason_code: reason,
            conversion_reason_note: note.trim() || null,
          })
        }
        className="w-full rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
      >
        Save not converted &amp; close lead
      </button>
    </div>
  );
}

function ConvertedPanel({
  saving,
  onUpdate,
}: {
  saving: boolean;
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const [orderNumber, setOrderNumber] = useState('');
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
      <p className="text-xs font-semibold text-emerald-950">Converted — link a real order</p>
      <p className="text-[11px] text-emerald-900/80">Order number must exist in the system (e.g. PVG-2026-00001).</p>
      <input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="Order number"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono uppercase"
      />
      <button
        type="button"
        disabled={saving || !orderNumber.trim()}
        onClick={() => onUpdate({ action: 'mark_converted', order_number: orderNumber.trim() })}
        className="w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        Link order &amp; mark converted
      </button>
    </div>
  );
}

function PipelineStepper({
  stage,
  stages = LEAD_PIPELINE_STAGES,
}: {
  stage: string;
  stages?: readonly LeadPipelineStage[];
}) {
  const list = stages.filter((s) => s !== 'closed');
  const active = (stages as readonly string[]).includes(stage) ? stage : list[0] || 'new';
  const idx = list.indexOf(active as (typeof list)[number]);
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-1">
        {list.map((s, i) => {
          const done = i < idx || active === 'closed';
          const current = s === active;
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <div className={`h-0.5 w-4 ${done || current ? 'bg-amber-400' : 'bg-gray-200'}`} />}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  current ? 'bg-amber-600 text-white' : done ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                }`}
                title={LEAD_PIPELINE_HELP[s]}
              >
                {LEAD_PIPELINE_LABELS[s].replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EnquiryDetail({
  lead,
  remarks,
  staff,
  caps,
  saving,
  remarkCode,
  remarkNote,
  copied,
  onRemarkCode,
  onRemarkNote,
  onAddRemark,
  onUpdate,
  onCopy,
  onOpenPrior,
}: {
  lead: EnquiryLead;
  remarks: Remark[];
  staff: { telecom: StaffMember[]; astrologers: StaffMember[] };
  caps: LeadCaps;
  saving: boolean;
  remarkCode: LeadRemarkCode;
  remarkNote: string;
  copied: boolean;
  onRemarkCode: (v: LeadRemarkCode) => void;
  onRemarkNote: (v: string) => void;
  onAddRemark: (code?: LeadRemarkCode, extras?: RemarkExtras) => void;
  onUpdate: (updates: Record<string, unknown>) => void;
  onCopy: () => void;
  onOpenPrior?: (id: string) => void;
}) {
  const stage = (lead.pipeline_stage || 'new') as LeadPipelineStage;
  const role = caps.role || '';
  const isManager = caps.canAssign;
  const isTelecom = role === 'telecom';
  const isAstro = role === 'astrologer';
  const isContact = isContactEnquiryLead(lead.source, lead.enquiry_type);
  const isBlog = isBlogEnquiryLead(lead.source, lead.enquiry_type);
  const owner = LEAD_STAGE_OWNER[stage] ?? 'manager';
  const duplicateMatches = lead.duplicate_matches ?? [];

  const [telePick, setTelePick] = useState(
    lead.assigned_to || lead.duplicate_matches?.[0]?.assigned_to || ''
  );
  const [astroPick, setAstroPick] = useState(lead.astrologer_id || '');
  const [remedies, setRemedies] = useState(lead.remedies_text || REMEDIES_TEMPLATE);
  const [editingDetails, setEditingDetails] = useState(false);
  const [details, setDetails] = useState({
    name: lead.name,
    phone: lead.phone || '',
    email: lead.email,
    additional_phones: lead.additional_phones || [],
    additional_emails: lead.additional_emails || [],
    ip_location: lead.ip_location || '',
    date_of_birth: lead.date_of_birth || '',
    birth_time: lead.birth_time || '',
    birth_place: lead.birth_place || '',
    customer_city: lead.customer_city || '',
    customer_state: lead.customer_state || '',
    customer_country: lead.customer_country || '',
    area_of_concern: lead.area_of_concern || '',
    enquiry_type: lead.enquiry_type || '',
  });

  useEffect(() => {
    setTelePick(lead.assigned_to || lead.duplicate_matches?.[0]?.assigned_to || '');
    setAstroPick(lead.astrologer_id || '');
    setRemedies(lead.remedies_text || REMEDIES_TEMPLATE);
    setEditingDetails(false);
    setDetails({
      name: lead.name,
      phone: lead.phone || '',
      email: lead.email,
      additional_phones: lead.additional_phones || [],
      additional_emails: lead.additional_emails || [],
      ip_location: lead.ip_location || '',
      date_of_birth: lead.date_of_birth || '',
      birth_time: lead.birth_time || '',
      birth_place: lead.birth_place || '',
      customer_city: lead.customer_city || '',
      customer_state: lead.customer_state || '',
      customer_country: lead.customer_country || '',
      area_of_concern: lead.area_of_concern || '',
      enquiry_type: lead.enquiry_type || '',
    });
  }, [
    lead.id,
    lead.name,
    lead.phone,
    lead.email,
    lead.additional_phones,
    lead.additional_emails,
    lead.ip_location,
    lead.date_of_birth,
    lead.birth_time,
    lead.birth_place,
    lead.customer_city,
    lead.customer_state,
    lead.customer_country,
    lead.area_of_concern,
    lead.enquiry_type,
    lead.assigned_to,
    lead.astrologer_id,
    lead.remedies_text,
    lead.duplicate_matches,
  ]);

  // ── Blog Ask-an-expert popup (Not addressed → Addressed) ─────────────────
  if (isBlog) {
    const open = stage !== 'closed';
    return (
      <div className="border-t border-gray-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100'}`}>
            {leadStageLabel(stage, { source: lead.source, enquiryType: lead.enquiry_type })}
          </span>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-900">
            Blog enquiry
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {BLOG_STAGE_CHIPS.map((s) => {
            const active = (stage === 'closed' ? 'closed' : 'new') === s;
            return (
              <button
                key={s}
                type="button"
                disabled={saving || active}
                onClick={() =>
                  onUpdate(
                    s === 'closed'
                      ? { pipeline_stage: 'closed', status: 'resolved' }
                      : { pipeline_stage: 'new', status: 'new' },
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                  active ? 'bg-rose-700 text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-rose-50'
                }`}
              >
                {leadStageLabel(s, { source: 'blog_popup' })}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-600">
          {open
            ? 'This enquiry came from the blog Ask-an-expert popup. Contact the customer, then mark it Addressed.'
            : 'This blog enquiry has been marked Addressed.'}
        </p>

        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ResponseField label="Name" value={lead.name} />
          <ResponseField label="Phone" value={lead.phone || ''} />
          <ResponseField label="Email" value={lead.email || '—'} />
          <ResponseField label="Source" value={lead.source || 'blog_popup'} />
          <ResponseField label="Blog / subject" value={lead.subject || ''} wide />
        </div>

        {lead.message ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Their query</p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-rose-100 bg-rose-50/40 p-3 text-sm text-gray-800">
              {lead.message}
            </p>
          </div>
        ) : null}

        {open ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => onUpdate({ pipeline_stage: 'closed', status: 'resolved' })}
            className="w-full rounded-lg bg-rose-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
          >
            Mark as Addressed
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => onUpdate({ pipeline_stage: 'new', status: 'new' })}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Reopen as Not addressed
          </button>
        )}
      </div>
    );
  }

  // ── Contact form pipeline (no chart / remedies) ─────────────────────────
  if (isTelecom && isContact) {
    const active = stage === 'assigned' || stage === 'verifying';
    const lastLabel = lead.last_remark_code
      ? LEAD_REMARK_BY_CODE[lead.last_remark_code as LeadRemarkCode]?.label || lead.last_remark_code
      : null;

    return (
      <div className="border-t border-gray-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100'}`}>
            {LEAD_PIPELINE_LABELS[stage] || stage}
          </span>
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-900">
            Contact message
          </span>
          {lastLabel ? (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
              Status: {lastLabel}
            </span>
          ) : null}
        </div>

        <p className="text-sm text-gray-600">
          {stage === 'closed'
            ? 'This contact lead is closed.'
            : 'Call or email this customer about their message. Log the call result, then mark handled when done.'}
        </p>

        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <ResponseField label="Name" value={lead.name} />
          <ResponseField label="Phone" value={lead.phone || ''} />
          <ResponseField label="Email" value={lead.email} />
          <ResponseField label="Source" value={lead.source || 'contact_form'} />
          {(lead.additional_phones?.length || lead.additional_emails?.length) ? (
            <>
              <ResponseField label="Extra phones" value={(lead.additional_phones || []).join(', ')} />
              <ResponseField label="Extra emails" value={(lead.additional_emails || []).join(', ')} />
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Additional contacts (for duplicate tracking)</p>
          <p className="text-[11px] text-amber-900/80">
            Add other numbers/emails the customer uses. Future leads from those contacts will flag as duplicates of this one.
          </p>
          <AdditionalContactsEditor
            phones={details.additional_phones}
            emails={details.additional_emails}
            onPhones={(additional_phones) => setDetails((v) => ({ ...v, additional_phones }))}
            onEmails={(additional_emails) => setDetails((v) => ({ ...v, additional_emails }))}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onUpdate({
                additional_phones: details.additional_phones,
                additional_emails: details.additional_emails,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save additional contacts
          </button>
        </div>

        {lead.message ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Their message</p>
            <p className="mt-1 whitespace-pre-wrap rounded-lg border border-sky-100 bg-sky-50/40 p-3 text-sm text-gray-800">
              {lead.message}
            </p>
          </div>
        ) : null}

        {active ? (
          <div className="space-y-3">
            <FollowUpLogPanel
              saving={saving}
              defaultFollowUpDate={lead.follow_up_date}
              onSubmit={(code, extras) => onAddRemark(code, extras)}
            />
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">Quick call result</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {TELECOM_CALL_OUTCOMES.map((o) => (
                  <button
                    key={o.code}
                    type="button"
                    disabled={saving || (o.code === 'custom' && !remarkNote.trim())}
                    title={o.hint}
                    onClick={() => onAddRemark(o.code)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition disabled:opacity-50 ${
                      lead.last_remark_code === o.code
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-200 hover:bg-indigo-50/40'
                    }`}
                  >
                    {o.short}
                  </button>
                ))}
              </div>
              <textarea
                value={remarkNote}
                onChange={(e) => onRemarkNote(e.target.value)}
                rows={2}
                placeholder="Note (required for Custom remark on quick chips)…"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => onUpdate({ pipeline_stage: 'closed', status: 'resolved' })}
                className="w-full rounded-lg bg-sky-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
              >
                Mark handled — close lead
              </button>
            </div>
          </div>
        ) : null}

        {stage === 'closed' ? (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            Lead closed
            {lead.last_remark_code
              ? ` (${LEAD_REMARK_BY_CODE[lead.last_remark_code as LeadRemarkCode]?.label || lead.last_remark_code})`
              : ''}
            .
          </p>
        ) : null}

        <FollowUpTimeline remarks={remarks} />
      </div>
    );
  }

  // ── Restricted telecaller desk ──────────────────────────────────────────
  if (isTelecom) {
    // ponytail: follow_up stage retired — verify/deliver cover those rows
    const verifyPhase = stage === 'assigned' || stage === 'verifying';
    const deliveryPhase = stage === 'sent_to_customer' && Boolean(lead.remedies_text);
    const explainedPhase = stage === 'remedies_explained';
    const conversionPhase = stage === 'conversion';
    const lastLabel = lead.last_remark_code
      ? LEAD_REMARK_BY_CODE[lead.last_remark_code as LeadRemarkCode]?.label || lead.last_remark_code
      : null;

    return (
      <div className="border-t border-gray-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100'}`}>
            {LEAD_PIPELINE_LABELS[stage] || stage}
          </span>
          {lead.details_confirmed ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              Details confirmed
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
              Details not confirmed yet
            </span>
          )}
          {lastLabel ? (
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
              Status: {lastLabel}
            </span>
          ) : null}
        </div>

        {duplicateMatches.length > 0 ? (
          <DuplicateBanner
            matches={duplicateMatches}
            canAssign={false}
            unassigned={false}
            saving={saving}
            onAssignSame={() => undefined}
            onOpenPrior={(id) => onOpenPrior?.(id)}
          />
        ) : null}

        <p className="text-sm text-gray-600">
          {deliveryPhase
            ? 'Explain the remedies on the call, then tap Remedies explained. That moves the lead to Explained Remedies so the manager can close it.'
            : explainedPhase
              ? 'Remedies already explained — waiting for the leads manager to close this lead.'
            : verifyPhase
              ? 'Call the customer, correct any wrong form fields, mark the call result, then mark verified only when details are confirmed and they want to proceed. The leads manager sees every status you set.'
              : conversionPhase
                ? 'Remedies were explained. Record Not converted (with reason) or wait for the leads manager / parcel dispatch to link the order when converted.'
              : stage === 'verified'
                ? 'This lead is with the manager. No action needed until remedies come back for delivery.'
                : 'Review this lead’s current status below.'}
        </p>

        {/* Customer details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer form details</h3>
            {!editingDetails ? (
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Correct details
              </button>
            ) : null}
          </div>

          {editingDetails ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Name" value={details.name} onChange={(name) => setDetails((v) => ({ ...v, name }))} />
                <EditField label="Phone" value={details.phone} onChange={(phone) => setDetails((v) => ({ ...v, phone }))} />
                <EditField label="Email" value={details.email} onChange={(email) => setDetails((v) => ({ ...v, email }))} />
                <EditField label="DOB" type="date" value={details.date_of_birth} onChange={(date_of_birth) => setDetails((v) => ({ ...v, date_of_birth }))} />
                <EditField label="Birth time" value={details.birth_time} onChange={(birth_time) => setDetails((v) => ({ ...v, birth_time }))} />
                <EditField label="Birth place" value={details.birth_place} onChange={(birth_place) => setDetails((v) => ({ ...v, birth_place }))} />
                <EditField label="City / District" value={details.customer_city} onChange={(customer_city) => setDetails((v) => ({ ...v, customer_city }))} />
                <EditField label="State" value={details.customer_state} onChange={(customer_state) => setDetails((v) => ({ ...v, customer_state }))} />
                <EditField label="Country" value={details.customer_country} onChange={(customer_country) => setDetails((v) => ({ ...v, customer_country }))} />
                <EditField label="Purpose / area of concern" value={details.area_of_concern} onChange={(area_of_concern) => setDetails((v) => ({ ...v, area_of_concern }))} />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-amber-900">Additional contacts (duplicate tracking)</p>
                <AdditionalContactsEditor
                  phones={details.additional_phones}
                  emails={details.additional_emails}
                  onPhones={(additional_phones) => setDetails((v) => ({ ...v, additional_phones }))}
                  onEmails={(additional_emails) => setDetails((v) => ({ ...v, additional_emails }))}
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingDetails(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !details.name.trim() || !details.email.trim()}
                  onClick={() => {
                    onUpdate({
                      name: details.name.trim(),
                      phone: details.phone.trim() || null,
                      email: details.email.trim(),
                      additional_phones: details.additional_phones,
                      additional_emails: details.additional_emails,
                      date_of_birth: details.date_of_birth || null,
                      birth_time: details.birth_time.trim() || null,
                      birth_place: details.birth_place.trim() || null,
                      customer_city: details.customer_city.trim() || null,
                      customer_state: details.customer_state.trim() || null,
                      customer_country: details.customer_country.trim() || null,
                      area_of_concern: details.area_of_concern.trim() || null,
                    });
                    setEditingDetails(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save corrections
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ResponseField label="Name" value={lead.name} />
              <ResponseField label="Phone" value={lead.phone || ''} />
              <ResponseField label="Email" value={lead.email} />
              <ResponseField label="Extra phones" value={(lead.additional_phones || []).join(', ')} />
              <ResponseField label="Extra emails" value={(lead.additional_emails || []).join(', ')} />
              <ResponseField label="DOB" value={formatDob(lead.date_of_birth)} />
              <ResponseField label="Birth time" value={(lead.birth_time || '').slice(0, 5)} />
              <ResponseField label="Birth place" value={lead.birth_place || ''} />
              <ResponseField label="City / District" value={lead.customer_city || ''} />
              <ResponseField label="State" value={lead.customer_state || ''} />
              <ResponseField label="Country" value={lead.customer_country || ''} />
              <ResponseField label="Purpose / area of concern" value={lead.area_of_concern || ''} wide />
            </div>
          )}
        </div>

        {stage !== 'closed' ? (
          <FollowUpLogPanel
            saving={saving}
            defaultFollowUpDate={lead.follow_up_date}
            onSubmit={(code, extras) => onAddRemark(code, extras)}
          />
        ) : null}

        {verifyPhase && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Step 1 — Form details</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || Boolean(lead.details_confirmed)}
                onClick={() => onUpdate({ details_confirmed: true })}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {lead.details_confirmed ? 'Details marked correct' : 'Details are correct'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditingDetails(true)}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900"
              >
                Details wrong — edit
              </button>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 pt-1">Step 2 — Call result</p>
            <p className="text-[11px] text-emerald-800/90">Tap the situation that matches this call. Manager sees this status instantly. Invalid number keeps the lead open — use email options or a custom remark.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TELECOM_CALL_OUTCOMES.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  disabled={saving || (o.code === 'custom' && !remarkNote.trim())}
                  title={o.hint}
                  onClick={() => onAddRemark(o.code)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition disabled:opacity-50 ${
                    lead.last_remark_code === o.code
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-200 hover:bg-indigo-50/40'
                  }`}
                >
                  {o.short}
                </button>
              ))}
            </div>
            <textarea
              value={remarkNote}
              onChange={(e) => onRemarkNote(e.target.value)}
              rows={2}
              placeholder="Note for manager (required for Custom remark; otherwise saved with the next status you tap)…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            {remarkNote.trim() ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => onAddRemark('custom')}
                className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-50"
              >
                Save custom remark
              </button>
            ) : null}

            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900 pt-1">Step 3 — Ready for manager</p>
            <p className="text-[11px] text-emerald-800/90">
              Only after details are confirmed and the customer wants to proceed.
            </p>
            <button
              type="button"
              disabled={saving || !lead.details_confirmed}
              onClick={() => onUpdate({ action: 'mark_verified' })}
              className="w-full rounded-lg bg-indigo-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              Mark verified — hand to leads manager
            </button>
            {!lead.details_confirmed ? (
              <p className="text-[11px] text-amber-700">Confirm details (Step 1) before verifying.</p>
            ) : null}
          </div>
        )}

        {stage === 'verified' && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Verified — waiting for leads manager to forward to the astrologer. No further action needed from you yet.
          </p>
        )}

        {explainedPhase && (
          <p className="rounded-lg border border-lime-200 bg-lime-50 px-3 py-2 text-sm text-lime-900">
            Remedies explained — this lead should move to Conversion for the sale outcome.
          </p>
        )}

        {/* ponytail: mark-explained moves stage to conversion — keep remedies visible after delivery */}
        {Boolean(lead.remedies_text) && (explainedPhase || conversionPhase || stage === 'closed') && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Remedies</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-teal-100 bg-white p-3 font-mono text-xs text-gray-800">
              {lead.remedies_text}
            </pre>
          </div>
        )}

        {conversionPhase && (
          <div className="space-y-3">
            <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-950">
              <span className="font-semibold">Conversion:</span> Was this sale converted? If not, pick a reason. If yes, the leads manager / parcel dispatch will enter the order number.
            </p>
            <NotConvertedPanel saving={saving} onUpdate={onUpdate} />
          </div>
        )}

        {stage === 'closed' && (
          <div className="space-y-2">
            <ConversionBanner lead={lead} />
            {!lead.conversion_status ? (
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Lead closed
                {lead.last_remark_code
                  ? ` (${LEAD_REMARK_BY_CODE[lead.last_remark_code as LeadRemarkCode]?.label || lead.last_remark_code})`
                  : ''}
                .
              </p>
            ) : null}
          </div>
        )}

        {deliveryPhase && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Deliver remedies</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-teal-100 bg-white p-3 font-mono text-xs text-gray-800">
              {lead.remedies_text}
            </pre>
            <p className="text-[11px] text-teal-800">Mark what happened on this delivery call. Callbacks stay on Deliver Remedies — set a follow-up date if needed. Invalid number keeps the lead open — use email options or a custom remark.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {TELECOM_DELIVERY_OUTCOMES.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  disabled={saving || (o.code === 'custom' && !remarkNote.trim())}
                  title={o.hint}
                  onClick={() =>
                    o.code === 'remedies_explain' || o.code === 'satisfied' || o.code === 'remedies_forwarded'
                      ? onUpdate({ action: 'mark_remedies_explained', remark_code: o.code })
                      : onAddRemark(o.code)
                  }
                  className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition disabled:opacity-50 ${
                    lead.last_remark_code === o.code
                      ? 'border-teal-500 bg-teal-50 text-teal-900'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-teal-50'
                  }`}
                >
                  {o.short}
                </button>
              ))}
            </div>
            <textarea
              value={remarkNote}
              onChange={(e) => onRemarkNote(e.target.value)}
              rows={2}
              placeholder="Note for manager (required for Custom remark; otherwise saved with the next status you tap)…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            {remarkNote.trim() ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => onAddRemark('custom')}
                className="rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-50"
              >
                Save custom remark
              </button>
            ) : null}
            <label className="block text-xs font-medium text-gray-500">
              Follow-up date
              <input
                type="date"
                value={lead.follow_up_date || ''}
                onChange={(e) => onUpdate({ follow_up_date: e.target.value || null })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        {remarks.length > 0 && (
          <FollowUpTimeline remarks={remarks} title="Follow-up history" />
        )}

        {(lead.phone || lead.email) ? (
          <div className="flex flex-wrap gap-2">
            {lead.phone ? (
              <>
                <a href={`tel:${lead.phone}`} className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                  Call
                </a>
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, this is Pure Vedic Gems.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                >
                  WhatsApp
                </a>
              </>
            ) : null}
            {lead.email ? (
              <a
                href={`mailto:${lead.email}?subject=${encodeURIComponent('Pure Vedic Gems')}&body=${encodeURIComponent(`Hello ${lead.name},\n\n`)}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Email
              </a>
            ) : null}
          </div>
        ) : null}

        {saving && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </p>
        )}
      </div>
    );
  }

  // ── Restricted astrologer desk: read the chart, write remedies, submit ──
  if (isAstro) {
    const writing = stage === 'with_astrologer' || stage === 'remedies_ready';
    const submitted = stage === 'remedies_ready';

    return (
      <div className="border-t border-gray-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100'}`}>
            {LEAD_PIPELINE_LABELS[stage] || stage}
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200">
            {(lead.enquiry_type || '').toLowerCase().includes('consultation')
              ? 'Detailed consultation'
              : 'Remedies lead (₹101)'}
          </span>
          {submitted ? (
            <span className="rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-[11px] font-semibold text-fuchsia-800">
              Submitted — manager reviewing
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Birth details (verified by telecaller)</h3>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ResponseField label="Name" value={lead.name} />
              <ResponseField label="DOB" value={formatDob(lead.date_of_birth)} />
              <ResponseField label="Birth time" value={(lead.birth_time || '').slice(0, 5)} />
              <ResponseField label="Birth place" value={lead.birth_place || ''} />
              <ResponseField label="City / District" value={lead.customer_city || ''} />
              <ResponseField label="State" value={lead.customer_state || ''} />
              <ResponseField label="Country" value={lead.customer_country || ''} />
              <ResponseField label="Purpose / area of concern" value={lead.area_of_concern || ''} wide />
            </div>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy chart details'}
            </button>
          </div>

          <div className="space-y-2">
            {writing ? (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Remedies</h3>
                <textarea
                  value={remedies}
                  onChange={(e) => setRemedies(e.target.value)}
                  rows={16}
                  className="w-full rounded-lg border border-fuchsia-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onUpdate({ remedies_text: remedies })}
                    className="rounded-lg border border-fuchsia-200 bg-white px-3 py-2 text-xs font-semibold text-fuchsia-800 disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    disabled={saving || !remedies.trim()}
                    onClick={() => onUpdate({ action: 'submit_remedies', remedies_text: remedies })}
                    className="rounded-lg bg-fuchsia-700 px-3 py-2 text-xs font-semibold text-white hover:bg-fuchsia-800 disabled:opacity-50"
                  >
                    {submitted ? 'Resubmit remedies (notify manager)' : 'Submit remedies (notify manager)'}
                  </button>
                </div>
              </>
            ) : lead.remedies_text ? (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Your submitted remedies (read-only)
                </h3>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800">
                  {lead.remedies_text}
                </pre>
                <p className="text-[11px] text-gray-500">
                  {stage === 'remedies_explained'
                    ? 'These remedies were explained to the customer by the telecaller.'
                    : stage === 'sent_to_customer'
                      ? 'Being delivered to the customer by the telecaller.'
                      : 'This lead is closed.'}
                </p>
              </>
            ) : (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                No remedies work on this lead right now (stage: {LEAD_PIPELINE_LABELS[stage] || stage}).
              </p>
            )}
          </div>
        </div>

        {saving && (
          <p className="flex items-center gap-1 text-xs text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </p>
        )}
      </div>
    );
  }

  const canEditDetails = isManager || isTelecom;
  const showRemarks = isManager || isTelecom;
  const showOutcomes = isManager;

  const nextHint = isContact
    ? stage === 'new'
      ? 'Forward this contact message to any telecaller so they can call the customer.'
      : stage === 'closed'
        ? 'Contact lead closed.'
        : 'Telecaller is handling this contact message — they call and close when done.'
    : owner === 'manager' && isManager
      ? LEAD_PIPELINE_HELP[stage]
      : owner === 'telecom' && isTelecom
        ? LEAD_PIPELINE_HELP[stage]
        : owner === 'astrologer' && isAstro
          ? LEAD_PIPELINE_HELP[stage]
          : `Waiting on ${owner === 'done' ? 'closure' : owner}`;

  return (
    <div className="border-t border-gray-100 p-4 space-y-4">
      <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Pipeline</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[stage] || 'bg-gray-100'}`}>
            {LEAD_PIPELINE_LABELS[stage] || stage}
          </span>
        </div>
        <PipelineStepper stage={stage} stages={isContact ? CONTACT_STAGE_CHIPS : LEAD_PIPELINE_STAGES} />
        <p className="text-xs text-amber-900/80">
          <span className="font-semibold">Your next step:</span> {nextHint}
        </p>
      </div>

      {(isManager || isTelecom) && duplicateMatches.length > 0 ? (
        <DuplicateBanner
          matches={duplicateMatches}
          canAssign={isManager}
          unassigned={!lead.assigned_to && (stage === 'new' || stage === 'closed')}
          saving={saving}
          onAssignSame={(telecallerId) =>
            onUpdate({ action: 'assign_telecaller', assigned_to: telecallerId })
          }
          onOpenPrior={(id) => onOpenPrior?.(id)}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer response</h3>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {isContact
                  ? 'Website contact form message'
                  : (lead.enquiry_type || '').toLowerCase().includes('consultation')
                    ? 'Vedic Consultation booking'
                    : '₹101 remedies / recommendation form'}
                {lead.payment_received
                  ? ' · payment received'
                  : lead.consultation_id
                    ? ' · payment pending'
                    : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canEditDetails && !editingDetails ? (
                <button
                  type="button"
                  onClick={() => setEditingDetails(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit details
                </button>
              ) : null}
              {(isManager || isAstro) && !editingDetails && !isContact ? (
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                  title="Copies birth details only — phone and email are never included"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy chart for astrologer'}
                </button>
              ) : null}
            </div>
          </div>

          {editingDetails ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
              <div className="grid grid-cols-2 gap-3">
                <EditField label="Name" value={details.name} onChange={(name) => setDetails((v) => ({ ...v, name }))} />
                <EditField label="Phone" value={details.phone} onChange={(phone) => setDetails((v) => ({ ...v, phone }))} />
                <EditField label="Email" value={details.email} onChange={(email) => setDetails((v) => ({ ...v, email }))} />
                <EditField label="IP location" value={details.ip_location} onChange={(ip_location) => setDetails((v) => ({ ...v, ip_location }))} />
                <EditField label="DOB" type="date" value={details.date_of_birth} onChange={(date_of_birth) => setDetails((v) => ({ ...v, date_of_birth }))} />
                <EditField label="Birth time" value={details.birth_time} onChange={(birth_time) => setDetails((v) => ({ ...v, birth_time }))} />
                <EditField label="Birth place" value={details.birth_place} onChange={(birth_place) => setDetails((v) => ({ ...v, birth_place }))} />
                <EditField label="City / District" value={details.customer_city} onChange={(customer_city) => setDetails((v) => ({ ...v, customer_city }))} />
                <EditField label="State" value={details.customer_state} onChange={(customer_state) => setDetails((v) => ({ ...v, customer_state }))} />
                <EditField label="Country" value={details.customer_country} onChange={(customer_country) => setDetails((v) => ({ ...v, customer_country }))} />
                <EditField label="Purpose / area of concern" value={details.area_of_concern} onChange={(area_of_concern) => setDetails((v) => ({ ...v, area_of_concern }))} />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-amber-900">Additional contacts (duplicate tracking)</p>
                <AdditionalContactsEditor
                  phones={details.additional_phones}
                  emails={details.additional_emails}
                  onPhones={(additional_phones) => setDetails((v) => ({ ...v, additional_phones }))}
                  onEmails={(additional_emails) => setDetails((v) => ({ ...v, additional_emails }))}
                />
              </div>
              <label className="mt-3 block text-xs font-medium text-gray-500">
                Enquiry type
                <select
                  value={details.enquiry_type}
                  onChange={(e) => setDetails((v) => ({ ...v, enquiry_type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="" />
                  {LEAD_ENQUIRY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDetails(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || !details.name.trim() || !details.email.trim()}
                  onClick={() => {
                    onUpdate({
                      name: details.name.trim(),
                      phone: details.phone.trim() || null,
                      email: details.email.trim(),
                      additional_phones: details.additional_phones,
                      additional_emails: details.additional_emails,
                      ip_location: details.ip_location.trim() || null,
                      date_of_birth: details.date_of_birth || null,
                      birth_time: details.birth_time.trim() || null,
                      birth_place: details.birth_place.trim() || null,
                      customer_city: details.customer_city.trim() || null,
                      customer_state: details.customer_state.trim() || null,
                      customer_country: details.customer_country.trim() || null,
                      area_of_concern: details.area_of_concern.trim() || null,
                      enquiry_type: details.enquiry_type || null,
                    });
                    setEditingDetails(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save corrected details
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <ResponseField label="Name" value={lead.name} />
              <ResponseField label="Phone" value={lead.phone || ''} />
              <ResponseField label="Email" value={lead.email} />
              <ResponseField label="Extra phones" value={(lead.additional_phones || []).join(', ')} />
              <ResponseField label="Extra emails" value={(lead.additional_emails || []).join(', ')} />
              <ResponseField label="IP location" value={lead.ip_location || ''} />
              <ResponseField label="DOB" value={formatDob(lead.date_of_birth)} />
              <ResponseField label="Birth time" value={(lead.birth_time || '').slice(0, 5)} />
              <ResponseField label="Birth place" value={lead.birth_place || ''} />
              <ResponseField label="City / District" value={lead.customer_city || ''} />
              <ResponseField label="State" value={lead.customer_state || ''} />
              <ResponseField label="Country" value={lead.customer_country || ''} />
              <ResponseField label="Purpose / area of concern" value={lead.area_of_concern || ''} />
              <ResponseField label="Enquiry type" value={lead.enquiry_type || ''} wide />
              {lead.payment_received ? (
                <ResponseField label="Payment" value={lead.payment_note || 'Received'} wide />
              ) : lead.consultation_id ? (
                <ResponseField label="Payment" value={lead.payment_note || 'Pending'} wide />
              ) : null}
            </div>
          )}

          {lead.message && (
            <div>
              <p className="text-xs font-medium text-gray-500">Additional submitted information</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{lead.message}</p>
            </div>
          )}

          {showOutcomes && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
              <Toggle label="Payment received" value={Boolean(lead.payment_received)} onChange={(v) => onUpdate({ payment_received: v })} />
              <Toggle label="Astrologer help" value={Boolean(lead.astrologer_help)} onChange={(v) => onUpdate({ astrologer_help: v })} />
              <Toggle label="Product purchase" value={Boolean(lead.product_purchase)} onChange={(v) => onUpdate({ product_purchase: v })} />
              <Toggle label="Sale close" value={Boolean(lead.sale_close)} onChange={(v) => onUpdate({ sale_close: v })} />
              <Toggle label="Feedback received" value={Boolean(lead.feedback_received)} onChange={(v) => onUpdate({ feedback_received: v })} />
            </div>
          )}

          {canEditDetails && (
            <Field label="Payment note" value={lead.payment_note || ''} onSave={(v) => onUpdate({ payment_note: v || null })} />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Actions for your role</h3>

          {/* MANAGER: assign telecaller (once only) */}
          {isManager && !lead.assigned_to && (stage === 'new' || stage === 'closed') && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="mb-2 text-xs font-semibold text-indigo-900">1. Assign telecaller</p>
              <p className="mb-2 text-[11px] text-indigo-800">Assignment is permanent — cannot be changed later.</p>
              {duplicateMatches[0]?.assigned_to ? (
                <p className="mb-2 text-[11px] text-indigo-900">
                  Suggested from prior lead: <span className="font-semibold">{duplicateMatches[0].telecaller_name}</span>
                </p>
              ) : null}
              <select
                value={telePick}
                onChange={(e) => setTelePick(e.target.value)}
                className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select telecaller</option>
                {staff.telecom.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!telePick || saving}
                onClick={() => onUpdate({ action: 'assign_telecaller', assigned_to: telePick })}
                className="mt-2 w-full rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                Forward to telecaller
              </button>
            </div>
          )}
          {isManager && lead.assigned_to && (
            <p className="rounded-lg border border-indigo-100 bg-indigo-50/40 px-3 py-2 text-xs text-indigo-900">
              Telecaller locked:{' '}
              <span className="font-semibold">
                {staff.telecom.find((m) => m.id === lead.assigned_to)?.name || 'Assigned'}
              </span>
              {' '}— cannot reassign.
            </p>
          )}

          {isManager && isContact && lead.assigned_to && stage !== 'closed' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onUpdate({ pipeline_stage: 'closed', status: 'resolved' })}
              className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
            >
              Close contact lead
            </button>
          )}

          {/* TELECOM: verify (managers also see when helping) — skipped for contact messages */}
          {!isContact && (isTelecom || isManager) && (stage === 'assigned' || stage === 'verifying') && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-900">2. Telecaller verification</p>
              <p className="text-[11px] text-emerald-800">
                Telecaller confirms/corrects form details and marks call status. Lead moves forward only after they mark it verified.
                {lead.last_remark_code
                  ? ` Current status: ${LEAD_REMARK_BY_CODE[lead.last_remark_code as LeadRemarkCode]?.label || lead.last_remark_code}.`
                  : ''}
                {lead.details_confirmed ? ' Details confirmed.' : ' Details not confirmed yet.'}
              </p>
              {isManager ? (
                <button
                  type="button"
                  disabled={saving || !lead.details_confirmed}
                  onClick={() => onUpdate({ action: 'mark_verified' })}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Mark verified (manager override)
                </button>
              ) : null}
            </div>
          )}

          {/* MANAGER: forward to astrologer (once only) */}
          {!isContact && caps.canForwardAstrologer && stage === 'verified' && !lead.astrologer_id && (
            <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-3">
              <p className="mb-2 text-xs font-semibold text-violet-900">3. Forward to pandit / astrologer</p>
              <p className="mb-2 text-[11px] text-violet-800">Assignment is permanent — cannot be changed later.</p>
              <button type="button" onClick={onCopy} className="mb-2 text-[11px] font-medium text-violet-700 underline">
                Copy customer packet first
              </button>
              <select
                value={astroPick}
                onChange={(e) => setAstroPick(e.target.value)}
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select astrologer</option>
                {staff.astrologers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!astroPick || saving}
                onClick={() => onUpdate({ action: 'forward_to_astrologer', astrologer_id: astroPick })}
                className="mt-2 w-full rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
              >
                Forward to astrologer
              </button>
            </div>
          )}
          {!isContact && isManager && lead.astrologer_id && (
            <p className="rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2 text-xs text-violet-900">
              Astrologer locked:{' '}
              <span className="font-semibold">
                {lead.astrologer_name || staff.astrologers.find((m) => m.id === lead.astrologer_id)?.name || 'Assigned'}
              </span>
              {' '}— cannot reassign.
            </p>
          )}

          {/* ASTROLOGER: write remedies */}
          {!isContact && (isAstro || (isManager && stage === 'with_astrologer')) && (stage === 'with_astrologer' || stage === 'remedies_ready') && (
            <div className="rounded-lg border border-fuchsia-100 bg-fuchsia-50/30 p-3">
              <p className="mb-2 text-xs font-semibold text-fuchsia-900">4. Write remedies</p>
              <textarea
                value={remedies}
                onChange={(e) => setRemedies(e.target.value)}
                rows={14}
                className="w-full rounded-lg border border-fuchsia-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onUpdate({ remedies_text: remedies })}
                  className="rounded-lg border border-fuchsia-200 bg-white px-3 py-1.5 text-xs font-semibold text-fuchsia-800"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={saving || !remedies.trim()}
                  onClick={() => onUpdate({ action: 'submit_remedies', remedies_text: remedies })}
                  className="rounded-lg bg-fuchsia-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-800 disabled:opacity-50"
                >
                  Submit remedies (notify manager)
                </button>
              </div>
            </div>
          )}

          {/* MANAGER: edit + send to same telecaller */}
          {!isContact && caps.canSendToTelecaller && stage === 'remedies_ready' && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3">
              <p className="mb-2 text-xs font-semibold text-teal-900">6. Review remedies → send for delivery</p>
              <p className="mb-2 text-[11px] text-teal-800">
                Edit if needed, then send to the telecaller. After the customer is briefed, mark Explained Remedies (next step).
              </p>
              <textarea
                value={remedies}
                onChange={(e) => setRemedies(e.target.value)}
                rows={12}
                className="w-full rounded-lg border border-teal-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
              />
              <button
                type="button"
                disabled={saving || !remedies.trim() || !lead.assigned_to}
                onClick={() => onUpdate({ action: 'send_to_telecaller', remedies_text: remedies })}
                className="mt-2 w-full rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Send remedies to telecaller (→ Deliver)
              </button>
              {!lead.assigned_to && (
                <p className="mt-1 text-[11px] text-red-600">No telecaller on this lead — assign one first.</p>
              )}
            </div>
          )}

          {/* MANAGER / telecom: deliver + mark explained */}
          {!isContact && (isManager || isTelecom) && stage === 'sent_to_customer' && Boolean(lead.remedies_text) && (
            <div className="rounded-lg border border-lime-200 bg-lime-50/40 p-3 space-y-3">
              <p className="text-xs font-semibold text-lime-900">7. Deliver remedies → mark explained</p>
              {isManager ? (
                <>
                  <textarea
                    value={remedies}
                    onChange={(e) => setRemedies(e.target.value)}
                    rows={12}
                    className="w-full rounded-lg border border-lime-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
                  />
                  <button
                    type="button"
                    disabled={saving || !remedies.trim()}
                    onClick={() => onUpdate({ remedies_text: remedies })}
                    className="rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-xs font-semibold text-lime-900 hover:bg-lime-50 disabled:opacity-50"
                  >
                    Update remedies
                  </button>
                </>
              ) : (
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-lime-100 bg-white p-3 font-mono text-xs text-gray-800">
                  {lead.remedies_text}
                </pre>
              )}
              {lead.forwarded_to_customer_at && (
                <p className="text-[11px] text-lime-800">Sent for delivery {fmtDate(lead.forwarded_to_customer_at)}</p>
              )}
              <p className="text-[11px] text-lime-800">
                After explaining on the call, mark Explained. If final remedies were emailed/forwarded instead, mark Remedies Forwarded/Emailed.
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => onUpdate({ action: 'mark_remedies_explained' })}
                className="w-full rounded-lg bg-lime-700 px-3 py-2 text-xs font-semibold text-white hover:bg-lime-800 disabled:opacity-50"
              >
                Mark remedies explained
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => onUpdate({ action: 'mark_remedies_explained', remark_code: 'remedies_forwarded' })}
                className="w-full rounded-lg border border-lime-600 bg-white px-3 py-2 text-xs font-semibold text-lime-900 hover:bg-lime-50 disabled:opacity-50"
              >
                Remedies Forwarded/Emailed
              </button>
            </div>
          )}

          {/* ponytail: managers can still edit remedies after email / conversion */}
          {!isContact &&
            isManager &&
            Boolean(lead.remedies_text) &&
            (stage === 'conversion' || stage === 'remedies_explained') && (
              <div className="rounded-lg border border-lime-200 bg-lime-50/40 p-3 space-y-2">
                <p className="text-xs font-semibold text-lime-900">Remedies (update after email)</p>
                <textarea
                  value={remedies}
                  onChange={(e) => setRemedies(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-lime-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed"
                />
                <button
                  type="button"
                  disabled={saving || !remedies.trim()}
                  onClick={() => onUpdate({ remedies_text: remedies })}
                  className="rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-xs font-semibold text-lime-900 hover:bg-lime-50 disabled:opacity-50"
                >
                  Save updated remedies
                </button>
              </div>
            )}

          {!isContact &&
            isTelecom &&
            !isManager &&
            Boolean(lead.remedies_text) &&
            (stage === 'conversion' || stage === 'remedies_explained' || stage === 'closed') && (
              <div className="rounded-lg border border-lime-200 bg-lime-50/40 p-3 space-y-2">
                <p className="text-xs font-semibold text-lime-900">Remedies</p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-lime-100 bg-white p-3 font-mono text-xs text-gray-800">
                  {lead.remedies_text}
                </pre>
              </div>
            )}

          {/* Conversion outcome — stage 9 */}
          {!isContact && (isManager || isTelecom) && (stage === 'conversion' || stage === 'remedies_explained') && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-orange-950">9. Conversion</p>
              <p className="text-[11px] text-orange-900/80">
                Record whether the customer bought. Not converted (with reason) is available to telecaller and manager. Linking a real order (Converted) is manager / parcel dispatch only.
              </p>
              {lead.conversion_status ? (
                <ConversionBanner lead={lead} />
              ) : (
                <>
                  <NotConvertedPanel saving={saving} onUpdate={onUpdate} />
                  {isManager ? <ConvertedPanel saving={saving} onUpdate={onUpdate} /> : null}
                </>
              )}
            </div>
          )}

          {stage === 'closed' && (lead.conversion_status || isManager || isTelecom) ? (
            <ConversionBanner lead={lead} />
          ) : null}

          {/* Astrologer read-only dossier note when waiting */}
          {isAstro && stage !== 'with_astrologer' && stage !== 'remedies_ready' && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              No active remedies work on this lead right now (stage: {LEAD_PIPELINE_LABELS[stage] || stage}).
            </p>
          )}

          {showRemarks && (
            <FollowUpLogPanel
              saving={saving}
              defaultCode={remarkCode}
              defaultFollowUpDate={lead.follow_up_date}
              onSubmit={(code, extras) => {
                onRemarkCode(code);
                onAddRemark(code, extras);
              }}
            />
          )}

          <FollowUpTimeline remarks={remarks} title="Follow-up history" />

          {lead.phone && (isTelecom || isManager) && (
            <a
              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.name}, this is Pure Vedic Gems.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          )}

          {saving && (
            <p className="flex items-center gap-1 text-xs text-amber-600">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ResponseField({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  const display = value.trim() || '—';
  return (
    <div className={`min-w-0 border-b border-r border-gray-100 px-3 py-2.5 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 min-h-5 break-words text-sm font-medium ${value.trim() ? 'text-gray-900' : 'text-gray-400'}`}>
        {display}
      </p>
    </div>
  );
}

function EditField({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-gray-500">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
      />
    </label>
  );
}

function AdditionalContactsEditor({
  phones,
  emails,
  onPhones,
  onEmails,
}: {
  phones: string[];
  emails: string[];
  onPhones: (phones: string[]) => void;
  onEmails: (emails: string[]) => void;
}) {
  const [phoneDraft, setPhoneDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');

  const addPhone = () => {
    const v = phoneDraft.trim();
    if (!v || phones.includes(v)) return;
    onPhones([...phones, v]);
    setPhoneDraft('');
  };
  const addEmail = () => {
    const v = emailDraft.trim().toLowerCase();
    if (!v || emails.includes(v)) return;
    onEmails([...emails, v]);
    setEmailDraft('');
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-[11px] font-medium text-gray-600">Extra phones</p>
        {phones.length ? (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {phones.map((p) => (
              <li key={p} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-800 ring-1 ring-gray-200">
                {p}
                <button type="button" onClick={() => onPhones(phones.filter((x) => x !== p))} className="text-gray-400 hover:text-red-600" aria-label={`Remove ${p}`}>
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-2">
          <input
            type="tel"
            value={phoneDraft}
            onChange={(e) => setPhoneDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPhone();
              }
            }}
            placeholder="Add phone"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <button type="button" onClick={addPhone} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            Add
          </button>
        </div>
      </div>
      <div>
        <p className="mb-1 text-[11px] font-medium text-gray-600">Extra emails</p>
        {emails.length ? (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {emails.map((em) => (
              <li key={em} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-gray-800 ring-1 ring-gray-200">
                {em}
                <button type="button" onClick={() => onEmails(emails.filter((x) => x !== em))} className="text-gray-400 hover:text-red-600" aria-label={`Remove ${em}`}>
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-2">
          <input
            type="email"
            value={emailDraft}
            onChange={(e) => setEmailDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEmail();
              }
            }}
            placeholder="Add email"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <button type="button" onClick={addEmail} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  type = 'text',
  disabled,
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onSave: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-gray-500">
      {label}
      <input
        key={`${label}:${value}`}
        type={type}
        defaultValue={value}
        disabled={disabled}
        onBlur={(e) => {
          if (!disabled && e.target.value !== value) onSave(e.target.value);
        }}
        className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
