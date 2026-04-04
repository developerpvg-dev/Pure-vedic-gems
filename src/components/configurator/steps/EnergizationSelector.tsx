'use client';

/**
 * Step 7 — Energization & Puja (Compact)
 * Options from the energization_options table. Compact cards.
 */

import { useEffect, useState } from 'react';
import { Flame, Video, Calendar, User, Star, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { EnergizationOption } from '@/lib/types/database';
import type { EnergizationFormData } from '@/lib/types/configurator';

const RASHI_OPTIONS = [
  { value: 'mesh', label: 'Mesh (Aries)', hindi: 'मेष' },
  { value: 'vrishabh', label: 'Vrishabh (Taurus)', hindi: 'वृषभ' },
  { value: 'mithun', label: 'Mithun (Gemini)', hindi: 'मिथुन' },
  { value: 'kark', label: 'Kark (Cancer)', hindi: 'कर्क' },
  { value: 'simha', label: 'Simha (Leo)', hindi: 'सिंह' },
  { value: 'kanya', label: 'Kanya (Virgo)', hindi: 'कन्या' },
  { value: 'tula', label: 'Tula (Libra)', hindi: 'तुला' },
  { value: 'vrishchik', label: 'Vrishchik (Scorpio)', hindi: 'वृश्चिक' },
  { value: 'dhanu', label: 'Dhanu (Sagittarius)', hindi: 'धनु' },
  { value: 'makar', label: 'Makar (Capricorn)', hindi: 'मकर' },
  { value: 'kumbh', label: 'Kumbh (Aquarius)', hindi: 'कुंभ' },
  { value: 'meen', label: 'Meen (Pisces)', hindi: 'मीन' },
];

interface EnergizationSelectorProps {
  selected: EnergizationOption | null;
  energizationForm: EnergizationFormData | null;
  onSelect: (option: EnergizationOption | null) => void;
  onFormChange: (form: EnergizationFormData) => void;
}

export default function EnergizationSelector({
  selected,
  energizationForm,
  onSelect,
  onFormChange,
}: EnergizationSelectorProps) {
  const [options, setOptions] = useState<EnergizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    fetchOptions();
  }, []);

  const formData: EnergizationFormData = energizationForm ?? {
    dob: '',
    gotra: '',
    rashi: '',
    record_ceremony: false,
  };

  const updateForm = (field: keyof EnergizationFormData, value: string | boolean) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div>
      {/* Skip option */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'mt-3 w-full flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all duration-150',
          'hover:border-accent',
          !selected
            ? 'border-accent bg-muted ring-1 ring-accent/30'
            : 'border-border'
        )}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">✕</span>
        <span className="text-xs font-medium text-primary">Skip Energization</span>
        <span className="text-[9px] text-muted-foreground ml-auto">Free</span>
      </button>

      {/* Tiers */}
      {loading ? (
        <div className="mt-2 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-3 flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-xs font-medium text-primary">{error}</p>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          {options.map((option) => {
            const isChosen = selected?.id === option.id;
            const includes = (option.includes ?? []) as string[];

            return (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option);
                  if (!option.includes_video && formData.record_ceremony) {
                    onFormChange({ ...formData, record_ceremony: false });
                  }
                }}
                className={cn(
                  'w-full flex flex-col rounded-lg border p-2.5 text-left transition-all duration-150',
                  'hover:border-accent',
                  isChosen
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Flame className={cn('h-3.5 w-3.5', isChosen ? 'text-accent' : 'text-muted-foreground')} />
                    <span className={cn('text-xs font-semibold', isChosen ? 'text-accent' : 'text-primary')}>
                      {option.name}
                    </span>
                    {option.duration && (
                      <span className="text-[9px] text-muted-foreground">· {option.duration}</span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    {formatPrice(option.price)}
                  </span>
                </div>

                {includes.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {includes.slice(0, 4).map((item, idx) => (
                      <span key={idx} className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] text-foreground">
                        <Sparkles className="inline mr-0.5 h-2 w-2 text-accent" />{item}
                      </span>
                    ))}
                    {includes.length > 4 && (
                      <span className="text-[8px] text-muted-foreground">+{includes.length - 4} more</span>
                    )}
                  </div>
                )}

                {option.includes_video && (
                  <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] text-accent">
                    <Video className="h-2.5 w-2.5" /> Includes video
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Vedic birth details form — compact */}
      {selected && (
        <div className="mt-3 rounded-lg border border-border bg-muted p-3 space-y-2.5">
          <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <Star className="h-3 w-3 text-accent" /> Vedic Birth Details
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="ener-dob" className="text-xs flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                DOB <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ener-dob"
                type="date"
                value={formData.dob}
                onChange={(e) => updateForm('dob', e.target.value)}
                className="h-7 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ener-gotra" className="text-xs flex items-center gap-1">
                <User className="h-2.5 w-2.5 text-muted-foreground" />
                Gotra
              </Label>
              <Input
                id="ener-gotra"
                type="text"
                placeholder="e.g. Kashyap"
                value={formData.gotra}
                onChange={(e) => updateForm('gotra', e.target.value)}
                className="h-7 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ener-rashi" className="text-xs">Rashi</Label>
              <select
                id="ener-rashi"
                value={formData.rashi}
                onChange={(e) => updateForm('rashi', e.target.value)}
                className="h-7 w-full rounded-md border border-border bg-card px-1.5 text-xs text-foreground"
              >
                <option value="">Select</option>
                {RASHI_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {selected.includes_video && (
            <div className="flex items-center gap-1.5">
              <input
                id="ener-record"
                type="checkbox"
                checked={formData.record_ceremony}
                onChange={(e) => updateForm('record_ceremony', e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-accent focus:ring-accent"
              />
              <Label htmlFor="ener-record" className="text-xs text-foreground">
                Record ceremony & send video
              </Label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
