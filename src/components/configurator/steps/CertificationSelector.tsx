'use client';

/**
 * Step 6 — Certification Lab Selection (Compact)
 * Smaller cards, tighter spacing.
 */

import { useEffect, useState } from 'react';
import { Shield, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { CertificationLab } from '@/lib/types/database';

interface CertificationSelectorProps {
  selected: CertificationLab | null;
  certificationSkipped: boolean;
  onSelect: (lab: CertificationLab) => void;
  onSkip: () => void;
}

export default function CertificationSelector({
  selected,
  certificationSkipped,
  onSelect,
  onSkip,
}: CertificationSelectorProps) {
  const [labs, setLabs] = useState<CertificationLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLabs() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
          .from('certification_labs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (fetchErr) throw fetchErr;
        setLabs((data as CertificationLab[]) ?? []);
      } catch {
        setLabs([]);
        setError('Failed to load certification labs.');
      } finally {
        setLoading(false);
      }
    }
    fetchLabs();
  }, []);

  return (
    <div>
      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-3 flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-xs font-medium text-primary">{error}</p>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Certification lab">
          {/* Skip option */}
          <button
            onClick={onSkip}
            role="radio"
            aria-checked={certificationSkipped}
            className={cn(
              'flex flex-col rounded-lg border p-2.5 text-left transition-all duration-150',
              'hover:border-accent',
              certificationSkipped
                ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                : 'border-border bg-card'
            )}
          >
            <div className="flex items-center gap-1.5">
              <Shield className={cn('h-3.5 w-3.5', certificationSkipped ? 'text-accent' : 'text-muted-foreground')} />
              <span className={cn('text-xs font-semibold', certificationSkipped ? 'text-accent' : 'text-primary')}>
                No Certification
              </span>
            </div>
            <span className="mt-1 text-[9px] text-muted-foreground">Skip · No cost</span>
          </button>

          {labs.map((lab) => {
            const isChosen = selected?.id === lab.id;
            const isFree = lab.extra_charge === 0;

            return (
              <button
                key={lab.id}
                onClick={() => onSelect(lab)}
                role="radio"
                aria-checked={isChosen}
                className={cn(
                  'flex flex-col rounded-lg border p-2.5 text-left transition-all duration-150',
                  'hover:border-accent',
                  isChosen
                    ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Shield className={cn('h-3.5 w-3.5 shrink-0', isChosen ? 'text-accent' : 'text-muted-foreground')} />
                    <span className={cn('text-xs font-semibold truncate', isChosen ? 'text-accent' : 'text-primary')}>
                      {lab.name}
                    </span>
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                    isFree ? 'bg-green-50 text-green-700' : 'bg-muted text-foreground'
                  )}>
                    {isFree ? 'Free' : `+${formatPrice(lab.extra_charge)}`}
                  </span>
                </div>

                {lab.full_name && (
                  <p className="mt-0.5 text-[9px] text-muted-foreground truncate">{lab.full_name}</p>
                )}

                <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> {lab.turnaround_days}d
                  </span>
                  {lab.sample_cert_url && (
                    <a
                      href={lab.sample_cert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-accent hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-2.5 w-2.5" /> Sample
                    </a>
                  )}
                  {lab.is_default && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[8px] font-medium text-accent">
                      Recommended
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
