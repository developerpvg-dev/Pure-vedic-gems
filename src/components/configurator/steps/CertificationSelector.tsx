'use client';

/**
 * Step 6 — Certification Lab Selection
 */

import { useEffect, useState } from 'react';
import { ExternalLink, AlertCircle, BadgeCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { CertificationLab } from '@/lib/types/database';
import {
  isCertificationAllowed,
  type ConfiguratorOptionRules,
} from '@/lib/utils/configurator-rules';
import { productLooksPrecertified } from '@/lib/utils/legacy-certificate-options';

interface CertificationProductContext {
  certificate_number?: string | null;
  certificate_lab?: string | null;
  certification?: string | null;
}

interface CertificationSelectorProps {
  selected: CertificationLab | null;
  certificationSkipped: boolean;
  optionRules: ConfiguratorOptionRules | null;
  product?: CertificationProductContext | null;
  onSelect: (lab: CertificationLab) => void;
  onSkip: () => void;
}

interface CertOptionProps {
  active: boolean;
  title: string;
  detail?: string | null;
  priceLabel: string;
  recommended?: boolean;
  meta?: string[];
  sampleUrl?: string | null;
  onClick: () => void;
  className?: string;
}

function CertOption({
  active,
  title,
  detail,
  priceLabel,
  recommended = false,
  meta = [],
  sampleUrl,
  onClick,
  className,
}: CertOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn('pvg-cert-option', active && 'pvg-cert-option--active', className)}
    >
      <span className="pvg-cert-option-main">
        <span className="pvg-cert-option-top">
          <span className={cn('pvg-cert-option-title', active && 'pvg-cert-option-title--active')}>
            {title}
          </span>
          {recommended ? <span className="pvg-cert-tag">Recommended</span> : null}
        </span>

        {detail ? <span className="pvg-cert-option-detail">{detail}</span> : null}

        {(meta.length > 0 || sampleUrl) && (
          <span className="pvg-cert-option-foot">
            {meta.map((item) => (
              <span key={item} className="pvg-cert-foot-item">
                {item}
              </span>
            ))}
            {sampleUrl ? (
              <a
                href={sampleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pvg-cert-foot-link"
                onClick={(event) => event.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                Sample
              </a>
            ) : null}
          </span>
        )}
      </span>

      <span className={cn('pvg-cert-option-price', active && 'pvg-cert-option-price--active')}>
        {priceLabel}
      </span>
    </button>
  );
}

export default function CertificationSelector({
  selected,
  certificationSkipped,
  optionRules,
  product,
  onSelect,
  onSkip,
}: CertificationSelectorProps) {
  const [labs, setLabs] = useState<CertificationLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const certificateEnabled = optionRules?.certificate_enabled ?? false;
  const visibleLabs = certificateEnabled
    ? labs.filter((lab) => isCertificationAllowed(optionRules, lab.id))
    : [];
  const alreadyCertified = productLooksPrecertified(product ?? {});

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
    <div className="pvg-cert-step">
      {alreadyCertified && (
        <div className="pvg-cert-note" role="status">
          <BadgeCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <p>
            <strong>Already certified</strong>
            {' — '}
            {product?.certificate_lab || product?.certification || 'Certificate included'}
            {product?.certificate_number ? ` (${product.certificate_number})` : ''}.
            {visibleLabs.length > 0
              ? ' Add another lab below if needed.'
              : ' No extra certificates for this item.'}
          </p>
        </div>
      )}

      {loading ? (
        <div className="pvg-cert-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[4.25rem] w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="pvg-cert-error">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="pvg-cert-grid" role="radiogroup" aria-label="Certification lab">
          <CertOption
            active={certificationSkipped}
            title="Without certificate"
            detail="No additional lab report"
            priceLabel="No charge"
            onClick={onSkip}
            className="pvg-cert-option--span"
          />

          {!certificateEnabled && (
            <p className="pvg-cert-muted pvg-cert-option--span">
              Additional certificates are not available for this product.
            </p>
          )}

          {visibleLabs.map((lab) => {
            const isChosen = selected?.id === lab.id;
            const isFree = lab.extra_charge === 0;
            const detail = lab.description || lab.full_name || null;

            return (
              <CertOption
                key={lab.id}
                active={isChosen}
                title={lab.name}
                detail={detail}
                priceLabel={isFree ? 'Free' : `+${formatPrice(lab.extra_charge)}`}
                recommended={lab.is_default}
                meta={[`${lab.turnaround_days} day${lab.turnaround_days === 1 ? '' : 's'}`]}
                sampleUrl={lab.sample_cert_url}
                onClick={() => onSelect(lab)}
              />
            );
          })}

          {certificateEnabled && visibleLabs.length === 0 && (
            <p className="pvg-cert-muted pvg-cert-option--span">
              No lab options are enabled for this product.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
