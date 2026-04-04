'use client';

/**
 * Step 4 — Select Design (Compact)
 * Smaller gallery cards, tighter grid layout.
 */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils/format';
import { createClient } from '@/lib/supabase/client';
import type { JewelryDesign } from '@/lib/types/database';
import type { SettingType } from '@/lib/types/configurator';

interface DesignSelectorProps {
  settingType: SettingType;
  selected: JewelryDesign | null;
  customDesignUrl: string | null;
  onSelectDesign: (design: JewelryDesign) => void;
  onCustomDesignUpload: (url: string) => void;
}

const MAX_CUSTOM_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_CUSTOM_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const ACCEPTED_CUSTOM_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf';

export default function DesignSelector({
  settingType,
  selected,
  customDesignUrl,
  onSelectDesign,
  onCustomDesignUpload,
}: DesignSelectorProps) {
  const [designs, setDesigns] = useState<JewelryDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customUploadError, setCustomUploadError] = useState<string | null>(null);
  const [customUploading, setCustomUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchDesigns() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: fetchErr } = await supabase
          .from('jewelry_designs')
          .select('*')
          .eq('setting_type', settingType)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (fetchErr) throw fetchErr;
        setDesigns((data as JewelryDesign[]) ?? []);
      } catch {
        setDesigns([]);
        setError('Failed to load designs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchDesigns();
  }, [settingType]);

  function getDisplayCharge(design: JewelryDesign): string {
    const charges = design.making_charges as Record<string, number> | null;
    if (!charges) return 'Included';
    const values = Object.values(charges).filter((v) => typeof v === 'number' && v > 0);
    if (values.length === 0) return 'Included';
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) return `+${formatPrice(min)}`;
    return `+${formatPrice(min)}–${formatPrice(max)}`;
  }

  function validateCustomFile(file: File): string | null {
    if (!ACCEPTED_CUSTOM_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, WebP, or PDF file.';
    }

    if (file.size > MAX_CUSTOM_FILE_SIZE) {
      return 'File size must be under 10MB.';
    }

    return null;
  }

  async function uploadCustomFile(file: File) {
    const validationError = validateCustomFile(file);
    if (validationError) {
      setCustomUploadError(validationError);
      return;
    }

    setCustomUploadError(null);
    setCustomUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/custom-design', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Upload failed. Please try again.');
      }

      const publicUrl = payload.publicUrl as string | undefined;
      if (!publicUrl) {
        throw new Error('Upload failed. Please try again.');
      }

      onCustomDesignUpload(publicUrl);
    } catch (uploadError) {
      setCustomUploadError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Upload failed. Please try again.'
      );
    } finally {
      setCustomUploading(false);
    }
  }

  async function handleCustomFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    await uploadCustomFile(file);
  }

  return (
    <div>
      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 flex flex-col items-center gap-2 py-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-xs font-medium text-primary">{error}</p>
          <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {designs.map((design) => {
              const isChosen = selected?.id === design.id;
              return (
                <button
                  key={design.id}
                  onClick={() => onSelectDesign(design)}
                  aria-pressed={isChosen}
                  className={cn(
                    'group relative overflow-hidden rounded-lg border text-left transition-all duration-150',
                    'hover:border-accent hover:shadow-sm',
                    isChosen
                      ? 'border-accent ring-1 ring-accent/30 shadow-sm'
                      : 'border-border'
                  )}
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {design.image_url ? (
                      <Image
                        src={design.image_url}
                        alt={design.name}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(max-width: 640px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">
                        {settingType === 'ring' ? '💍' : settingType === 'pendant' ? '📿' : '⌚'}
                      </div>
                    )}
                    {isChosen && (
                      <div className="absolute inset-0 bg-accent/15 flex items-center justify-center">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold text-accent-foreground">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-[11px] font-medium text-primary">{design.name}</p>
                    <p className="text-[9px] font-medium text-accent">{getDisplayCharge(design)}</p>
                  </div>
                </button>
              );
            })}

            {/* Upload custom */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={customUploading}
              className={cn(
                'group flex min-h-[152px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 text-center transition-all',
                'hover:border-accent hover:bg-accent/5',
                customDesignUrl ? 'border-accent bg-accent/5' : 'border-border',
                customUploading && 'cursor-wait opacity-80'
              )}
            >
              {customUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground group-hover:text-accent" />
              )}
              <span className="mt-2 text-[11px] font-semibold text-primary">
                {customUploading
                  ? 'Uploading...'
                  : customDesignUrl
                    ? 'Custom Uploaded ✓'
                    : 'Upload Custom'}
              </span>
              <span className="mt-1 text-[9px] text-muted-foreground">
                Tap once to choose your file directly
              </span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_CUSTOM_EXTENSIONS}
            onChange={handleCustomFileChange}
            className="hidden"
          />

          {customUploadError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4" />
              {customUploadError}
            </div>
          )}

          {designs.length === 0 && !customUploading && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              No designs available. Upload a custom design.
            </p>
          )}
        </>
      )}
    </div>
  );
}
