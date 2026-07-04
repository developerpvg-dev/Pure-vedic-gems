'use client';

/**
 * Step 7 — Energization & Puja
 */

import { useEffect, useState } from 'react';
import { AlertCircle, Video } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { EnergizationOption } from '@/lib/types/database';
import type { EnergizationFormData } from '@/lib/types/configurator';
import {
  isEnergizationAllowed,
  type ConfiguratorOptionRules,
} from '@/lib/utils/configurator-rules';

interface EnergizationSelectorProps {
  selected: EnergizationOption | null;
  energizationForm: EnergizationFormData | null;
  optionRules: ConfiguratorOptionRules | null;
  onSelect: (option: EnergizationOption | null) => void;
  onFormChange: (form: EnergizationFormData) => void;
}

interface EnergOptionProps {
  active: boolean;
  title: string;
  detail?: string | null;
  foot?: string | null;
  priceLabel: string;
  hasVideo?: boolean;
  onClick: () => void;
  className?: string;
}

function EnergOptionRow({
  active,
  title,
  detail,
  foot,
  priceLabel,
  hasVideo = false,
  onClick,
  className,
}: EnergOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn('pvg-energ-option', active && 'pvg-energ-option--active', className)}
    >
      <span className="pvg-energ-option-main">
        <span className={cn('pvg-energ-option-title', active && 'pvg-energ-option-title--active')}>
          {title}
        </span>
        {detail ? <span className="pvg-energ-option-detail">{detail}</span> : null}
        {(foot || hasVideo) && (
          <span className="pvg-energ-option-foot">
            {foot}
            {hasVideo ? (
              <span className="pvg-energ-foot-video">
                <Video className="h-3 w-3" aria-hidden />
                Includes video
              </span>
            ) : null}
          </span>
        )}
      </span>
      <span className={cn('pvg-energ-option-price', active && 'pvg-energ-option-price--active')}>
        {priceLabel}
      </span>
    </button>
  );
}

export default function EnergizationSelector({
  selected,
  energizationForm,
  optionRules,
  onSelect,
  onFormChange,
}: EnergizationSelectorProps) {
  const [options, setOptions] = useState<EnergizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const energizationEnabled = optionRules?.energization_enabled ?? false;
  const visibleOptions = energizationEnabled
    ? options.filter((option) => isEnergizationAllowed(optionRules, option.id))
    : [];

  useEffect(() => {
    async function fetchOptions() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
          .from('energization_options')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (fetchErr) throw fetchErr;
        setOptions((data as EnergizationOption[]) ?? []);
      } catch {
        setOptions([]);
        setError('Failed to load energization options.');
      } finally {
        setLoading(false);
      }
    }
    void fetchOptions();
  }, []);

  const formData: EnergizationFormData = energizationForm ?? {
    dob: '',
    birth_time: '',
    birth_place: '',
    gotra: '',
    record_ceremony: false,
  };

  const updateForm = (field: keyof EnergizationFormData, value: string | boolean) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="pvg-energ-step">
      {loading ? (
        <div className="pvg-energ-grid">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[4.25rem] w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="pvg-energ-error">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="pvg-energ-grid" role="radiogroup" aria-label="Energization option">
          <EnergOptionRow
            active={!selected}
            title="Skip energization"
            detail="No pooja or energization added"
            priceLabel="No charge"
            onClick={() => onSelect(null)}
            className="pvg-energ-option--span"
          />

          {!energizationEnabled && (
            <p className="pvg-energ-muted pvg-energ-option--span">
              Energization is not available for this product.
            </p>
          )}

          {visibleOptions.map((option) => {
            const isChosen = selected?.id === option.id;
            const includes = (option.includes ?? []) as string[];
            const footParts = [
              option.duration ? option.duration : null,
              includes.length > 0 ? includes.slice(0, 2).join(' · ') : null,
            ].filter(Boolean);

            return (
              <EnergOptionRow
                key={option.id}
                active={isChosen}
                title={option.name}
                detail={option.description}
                foot={footParts.join(' · ') || null}
                priceLabel={option.price > 0 ? `+${formatPrice(option.price)}` : 'Free'}
                hasVideo={option.includes_video}
                onClick={() => {
                  onSelect(option);
                  if (!option.includes_video && formData.record_ceremony) {
                    onFormChange({ ...formData, record_ceremony: false });
                  }
                }}
              />
            );
          })}

          {energizationEnabled && visibleOptions.length === 0 && (
            <p className="pvg-energ-muted pvg-energ-option--span">
              No energization options are enabled for this product.
            </p>
          )}
        </div>
      )}

      {selected && (
        <div className="pvg-energ-form">
          <p className="pvg-energ-form-title">Vedic birth details</p>
          <p className="pvg-energ-form-hint">Required for personalised pooja and mantra selection.</p>

          <div className="pvg-energ-form-grid">
            <div className="pvg-energ-field">
              <Label htmlFor="ener-dob">
                Date of birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ener-dob"
                type="date"
                value={formData.dob}
                onChange={(event) => updateForm('dob', event.target.value)}
                className="pvg-energ-input"
              />
            </div>

            <div className="pvg-energ-field">
              <Label htmlFor="ener-gotra">Gotra</Label>
              <Input
                id="ener-gotra"
                type="text"
                placeholder="e.g. Kashyap"
                value={formData.gotra}
                onChange={(event) => updateForm('gotra', event.target.value)}
                className="pvg-energ-input"
              />
            </div>

            <div className="pvg-energ-field">
              <Label htmlFor="ener-birth-time">
                Time of birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ener-birth-time"
                type="time"
                value={formData.birth_time}
                onChange={(event) => updateForm('birth_time', event.target.value)}
                className="pvg-energ-input"
              />
            </div>

            <div className="pvg-energ-field">
              <Label htmlFor="ener-birth-place">
                Place of birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ener-birth-place"
                type="text"
                placeholder="City, State"
                value={formData.birth_place}
                onChange={(event) => updateForm('birth_place', event.target.value)}
                className="pvg-energ-input"
              />
            </div>
          </div>

          {selected.includes_video && (
            <label className="pvg-energ-checkbox" htmlFor="ener-record">
              <input
                id="ener-record"
                type="checkbox"
                checked={formData.record_ceremony}
                onChange={(event) => updateForm('record_ceremony', event.target.checked)}
              />
              <span>Record ceremony and send video</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
