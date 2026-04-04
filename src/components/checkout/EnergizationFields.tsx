'use client';

import type { EnergizationFields } from '@/lib/validators/order';

interface EnergizationFieldsFormProps {
  value: EnergizationFields;
  onChange: (data: EnergizationFields) => void;
}

const RASHI_OPTIONS = [
  'Mesh (Aries)',
  'Vrishabh (Taurus)',
  'Mithun (Gemini)',
  'Kark (Cancer)',
  'Simha (Leo)',
  'Kanya (Virgo)',
  'Tula (Libra)',
  'Vrishchik (Scorpio)',
  'Dhanu (Sagittarius)',
  'Makar (Capricorn)',
  'Kumbh (Aquarius)',
  'Meen (Pisces)',
] as const;

export function EnergizationFieldsForm({ value, onChange }: EnergizationFieldsFormProps) {
  const update = (patch: Partial<EnergizationFields>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="bg-[var(--pvg-surface)] rounded-xl border border-[var(--pvg-accent)]/30 p-6">
      <h3 className="font-heading text-base font-semibold text-[var(--pvg-primary)] mb-1">
        🔱 Energization & Puja
      </h3>
      <p className="text-xs text-[var(--pvg-muted)] mb-4">
        Your cart contains items that can be energized with Vedic ceremonies. Fill in these
        details so our priests can perform the puja in your name.
      </p>

      {/* Toggle */}
      <label className="flex items-center gap-3 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={value.include_energization}
          onChange={(e) =>
            update({ include_energization: e.target.checked })
          }
          className="h-4 w-4 rounded border-[var(--pvg-border)] text-[var(--pvg-accent)] focus:ring-[var(--pvg-accent)]"
        />
        <span className="text-sm font-medium text-[var(--pvg-text)]">
          Include Vedic energization ceremony
        </span>
      </label>

      {value.include_energization && (
        <div className="space-y-4 pl-2 border-l-2 border-[var(--pvg-accent)]/20 ml-1.5">
          {/* DOB */}
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              value={value.ceremony_dob ?? ''}
              onChange={(e) => update({ ceremony_dob: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)]"
            />
          </div>

          {/* Gotra */}
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              Gotra
            </label>
            <input
              type="text"
              value={value.ceremony_gotra ?? ''}
              onChange={(e) => update({ ceremony_gotra: e.target.value })}
              placeholder="e.g., Kashyap, Bharadwaj, Vatsa"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] placeholder:text-[var(--pvg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)]"
            />
          </div>

          {/* Rashi */}
          <div>
            <label className="block text-sm font-medium text-[var(--pvg-text)] mb-1.5">
              Rashi (Moon Sign)
            </label>
            <select
              value={value.ceremony_rashi ?? ''}
              onChange={(e) => update({ ceremony_rashi: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--pvg-border)] text-sm text-[var(--pvg-text)] bg-[var(--pvg-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)]"
            >
              <option value="">Select your Rashi</option>
              {RASHI_OPTIONS.map((rashi) => (
                <option key={rashi} value={rashi}>
                  {rashi}
                </option>
              ))}
            </select>
          </div>

          {/* Record ceremony */}
          <label className="flex items-center gap-3 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={value.record_ceremony}
              onChange={(e) => update({ record_ceremony: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--pvg-border)] text-[var(--pvg-accent)] focus:ring-[var(--pvg-accent)]"
            />
            <div>
              <span className="text-sm font-medium text-[var(--pvg-text)]">
                Record the ceremony
              </span>
              <p className="text-xs text-[var(--pvg-muted)]">
                We&apos;ll share a video of the puja via WhatsApp
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
