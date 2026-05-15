'use client';

import { useId, type ReactNode } from 'react';

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 flex items-center justify-between text-sm font-medium text-gray-700">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-gray-400">{hint}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';

export function FormInput({
  id, value, onChange, placeholder, type = 'text', required = false, maxLength,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      className={inputBase}
    />
  );
}

type Option = { value: string; label: string };

export function FormSelect({
  id, value, onChange, options, placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | readonly Option[];
  placeholder?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputBase}>
      <option value="">{placeholder ?? 'Select...'}</option>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const lbl = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={val} value={val}>
            {lbl}
          </option>
        );
      })}
    </select>
  );
}

export function FormTextarea({
  id, value, onChange, placeholder, rows = 3, maxLength,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      className={inputBase}
    />
  );
}

export function FormCheckbox({
  checked, onChange, label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-gray-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
      />
      {label}
    </label>
  );
}

export function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  const near = len > max * 0.85 && !over;
  return (
    <span className={`text-xs font-normal ${over ? 'text-red-600' : near ? 'text-amber-600' : 'text-gray-400'}`}>
      {len}/{max}
    </span>
  );
}

export function KeywordsInput({
  value, onChange, placeholder = 'Type and press Enter to add',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2 py-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((kw, i) => (
          <span key={`${kw}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
            {kw}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-amber-700 hover:text-amber-900"
              aria-label={`Remove ${kw}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder={placeholder}
          onKeyDown={(e) => {
            const input = e.currentTarget;
            const raw = input.value.trim();
            if ((e.key === 'Enter' || e.key === ',') && raw) {
              e.preventDefault();
              const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
              const next = [...value];
              for (const p of parts) {
                if (!next.includes(p)) next.push(p);
              }
              onChange(next);
              input.value = '';
            } else if (e.key === 'Backspace' && !raw && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={(e) => {
            const raw = e.currentTarget.value.trim();
            if (raw) {
              const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
              const next = [...value];
              for (const p of parts) {
                if (!next.includes(p)) next.push(p);
              }
              onChange(next);
              e.currentTarget.value = '';
            }
          }}
          className="min-w-35 flex-1 border-0 bg-transparent px-1.5 py-1 text-sm outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

export type FaqItem = { question: string; answer: string };

export function FaqEditor({
  value, onChange,
}: {
  value: FaqItem[];
  onChange: (v: FaqItem[]) => void;
}) {
  function update(i: number, patch: Partial<FaqItem>) {
    onChange(value.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { question: '', answer: '' }]);
  }
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">FAQ #{i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
          <input
            value={item.question}
            onChange={(e) => update(i, { question: e.target.value })}
            placeholder="Question (e.g. Is this gemstone natural?)"
            className={`${inputBase} mb-2`}
          />
          <textarea
            value={item.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
            placeholder="Direct answer (1–3 sentences, optimized for AI snippets)"
            rows={3}
            className={inputBase}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
      >
        + Add FAQ entry
      </button>
    </div>
  );
}

export function GeoChips({
  value, onChange, options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
