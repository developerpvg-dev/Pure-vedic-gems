'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Loader2 } from 'lucide-react';
import {
  LEAD_ENQUIRY_TYPES,
  LEAD_PIPELINE_HELP,
  LEAD_PIPELINE_LABELS,
  LEAD_PIPELINE_STAGES,
  LEAD_REMARK_CODES,
  LEAD_STAGE_OWNER,
  REMEDIES_TEMPLATE,
  type LeadPipelineStage,
  type LeadRemarkCode,
} from '@/lib/leads/constants';

type StaffMember = { id: string; name: string; role: string };

export type EnquiryLead = {
  id: string;
  lead_number?: number;
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
  pipeline_stage?: string;
  enquiry_type?: string | null;
  ip_location?: string | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
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
  created_at: string;
  _type: 'enquiry';
};

type Remark = {
  id: string;
  remark_code: string;
  remark_label: string;
  note: string | null;
  created_by_name: string | null;
  created_at: string;
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
  follow_up: 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-600',
};

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PipelineStepper({ stage }: { stage: string }) {
  const active = (LEAD_PIPELINE_STAGES as readonly string[]).includes(stage) ? stage : 'new';
  const idx = LEAD_PIPELINE_STAGES.indexOf(active as LeadPipelineStage);
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-1">
        {LEAD_PIPELINE_STAGES.filter((s) => s !== 'closed').map((s, i) => {
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
  onAddRemark: () => void;
  onUpdate: (updates: Record<string, unknown>) => void;
  onCopy: () => void;
}) {
  const stage = (lead.pipeline_stage || 'new') as LeadPipelineStage;
  const role = caps.role || '';
  const isManager = caps.canAssign;
  const isTelecom = role === 'telecom';
  const isAstro = role === 'astrologer';
  const owner = LEAD_STAGE_OWNER[stage] ?? 'manager';

  const [telePick, setTelePick] = useState(lead.assigned_to || '');
  const [astroPick, setAstroPick] = useState(lead.astrologer_id || '');
  const [remedies, setRemedies] = useState(lead.remedies_text || REMEDIES_TEMPLATE);

  useEffect(() => {
    setTelePick(lead.assigned_to || '');
    setAstroPick(lead.astrologer_id || '');
    setRemedies(lead.remedies_text || REMEDIES_TEMPLATE);
  }, [lead.id, lead.assigned_to, lead.astrologer_id, lead.remedies_text]);

  const canEditDetails = isManager || isTelecom;
  const showRemarks = isManager || isTelecom;
  const showOutcomes = isManager || isTelecom;
  const showRemediesRead = Boolean(lead.remedies_text) || isAstro || caps.canEditRemedies;

  const nextHint =
    owner === 'manager' && isManager
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
        <PipelineStepper stage={stage} />
        <p className="text-xs text-amber-900/80">
          <span className="font-semibold">Your next step:</span> {nextHint}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer dossier</h3>
            {(isManager || isAstro) && (
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy packet'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Name" value={lead.name} disabled={!canEditDetails} onSave={(v) => onUpdate({ name: v })} />
            <Field label="Phone" value={lead.phone || ''} disabled={!canEditDetails} onSave={(v) => onUpdate({ phone: v || null })} />
            <Field label="Email" value={lead.email} disabled={!canEditDetails} onSave={(v) => onUpdate({ email: v })} />
            <Field label="IP location" value={lead.ip_location || ''} disabled={!canEditDetails} onSave={(v) => onUpdate({ ip_location: v || null })} />
            <Field label="DOB" value={lead.date_of_birth || ''} type="date" disabled={!canEditDetails} onSave={(v) => onUpdate({ date_of_birth: v || null })} />
            <Field label="Birth time" value={lead.birth_time || ''} disabled={!canEditDetails} onSave={(v) => onUpdate({ birth_time: v || null })} />
            <Field label="Birth place" value={lead.birth_place || ''} disabled={!canEditDetails} onSave={(v) => onUpdate({ birth_place: v || null })} />
            <Field label="Area of concern" value={lead.area_of_concern || ''} disabled={!canEditDetails} onSave={(v) => onUpdate({ area_of_concern: v || null })} />
          </div>

          {canEditDetails && (
            <label className="block text-xs font-medium text-gray-500">
              Enquiry type
              <select
                value={lead.enquiry_type || ''}
                onChange={(e) => onUpdate({ enquiry_type: e.target.value || null })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {LEAD_ENQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          )}

          {lead.message && (
            <div>
              <p className="text-xs font-medium text-gray-500">Original message</p>
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

          {/* MANAGER: assign telecaller */}
          {isManager && (stage === 'new' || stage === 'assigned' || stage === 'verifying' || stage === 'verified' || stage === 'closed') && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
              <p className="mb-2 text-xs font-semibold text-indigo-900">1. Assign telecaller</p>
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
                {lead.assigned_to ? 'Reassign telecaller' : 'Forward to telecaller'}
              </button>
            </div>
          )}

          {/* TELECOM: verify */}
          {(isTelecom || isManager) && (stage === 'assigned' || stage === 'verifying') && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-900">2. Verify customer details</p>
              <p className="text-[11px] text-emerald-800">Edit dossier if wrong. If fake / not interested, use remarks below.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onUpdate({ pipeline_stage: 'verifying' })}
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800"
                >
                  Mark verifying
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onUpdate({ action: 'mark_verified' })}
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Mark details verified
                </button>
              </div>
            </div>
          )}

          {/* MANAGER: forward to astrologer */}
          {caps.canForwardAstrologer && stage === 'verified' && (
            <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-3">
              <p className="mb-2 text-xs font-semibold text-violet-900">3. Forward to pandit / astrologer</p>
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

          {/* ASTROLOGER: write remedies */}
          {(isAstro || (isManager && stage === 'with_astrologer')) && (stage === 'with_astrologer' || stage === 'remedies_ready') && (
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
          {caps.canSendToTelecaller && stage === 'remedies_ready' && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/40 p-3">
              <p className="mb-2 text-xs font-semibold text-teal-900">5. Review remedies → send to same telecaller</p>
              <p className="mb-2 text-[11px] text-teal-800">
                Edit if needed, then forward the final text to the original telecaller to share with the customer.
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
                Send final remedies to telecaller
              </button>
              {!lead.assigned_to && (
                <p className="mt-1 text-[11px] text-red-600">No telecaller on this lead — assign one first.</p>
              )}
            </div>
          )}

          {/* TELECOM delivery: show final remedies */}
          {(isTelecom || isManager) && (stage === 'sent_to_customer' || stage === 'follow_up') && showRemediesRead && (
            <div className="rounded-lg border border-teal-100 bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-teal-900">Final remedies to share with customer</p>
              <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-800">
                {lead.remedies_text || '—'}
              </pre>
              {lead.forwarded_to_customer_at && (
                <p className="mt-1 text-[11px] text-teal-700">Received {fmtDate(lead.forwarded_to_customer_at)}</p>
              )}
              <label className="mt-2 block text-xs font-medium text-gray-500">
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

          {/* Astrologer read-only dossier note when waiting */}
          {isAstro && stage !== 'with_astrologer' && stage !== 'remedies_ready' && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              No active remedies work on this lead right now (stage: {LEAD_PIPELINE_LABELS[stage] || stage}).
            </p>
          )}

          {showRemarks && (
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-800">Add remark / status</p>
              <select
                value={remarkCode}
                onChange={(e) => onRemarkCode(e.target.value as LeadRemarkCode)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {LEAD_REMARK_CODES.map((r, i) => (
                  <option key={r.code} value={r.code}>
                    ({i + 1}) {r.label}
                  </option>
                ))}
              </select>
              <textarea
                value={remarkNote}
                onChange={(e) => onRemarkNote(e.target.value)}
                rows={2}
                placeholder="Optional note…"
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={saving}
                onClick={onAddRemark}
                className="mt-2 w-full rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Append remark
              </button>
            </div>
          )}

          {remarks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Remark timeline</p>
              <ol className="space-y-2">
                {remarks.map((r, idx) => (
                  <li key={r.id} className="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-800">({idx + 1}) {r.remark_label}</span>
                      <span className="shrink-0 text-gray-400">{fmtDate(r.created_at)}</span>
                    </div>
                    {r.note && <p className="mt-1 text-gray-600">{r.note}</p>}
                    {r.created_by_name && <p className="mt-0.5 text-[10px] text-gray-400">by {r.created_by_name}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

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
