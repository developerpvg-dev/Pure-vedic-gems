'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CustomDesignBrief } from '@/lib/types/configurator';

interface CustomDesignDetailsFormProps {
  imageUrl: string;
  initial?: CustomDesignBrief | null;
  onSubmit: (brief: CustomDesignBrief) => void;
  onCancel: () => void;
}

export default function CustomDesignDetailsForm({
  imageUrl,
  initial,
  onSubmit,
  onCancel,
}: CustomDesignDetailsFormProps) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? '');
  const [preferredMetal, setPreferredMetal] = useState(initial?.preferred_metal ?? '');
  const [additionalStones, setAdditionalStones] = useState(initial?.additional_stones ?? '');
  const [additionalNotes, setAdditionalNotes] = useState(initial?.additional_notes ?? '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    const trimmedPhone = contactPhone.trim();

    if (trimmedDescription.length < 10) {
      setError('Please describe your design in at least 10 characters.');
      return;
    }
    if (trimmedPhone.length < 8) {
      setError('Please enter a valid contact phone number.');
      return;
    }

    setError(null);
    onSubmit({
      description: trimmedDescription,
      contact_phone: trimmedPhone,
      preferred_metal: preferredMetal.trim() || undefined,
      additional_stones: additionalStones.trim() || undefined,
      additional_notes: additionalNotes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-xl border border-accent/25 bg-accent/5 p-4">
      <div>
        <p className="text-sm font-semibold text-primary">Tell us about your custom design</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Our design team will review your reference, contact you with mounting pricing, and finalize metal weight and labour.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
          {imageUrl.toLowerCase().endsWith('.pdf') ? (
            <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted-foreground">
              PDF
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Custom design reference" className="h-full w-full object-contain p-1" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="block text-[11px] font-medium text-foreground">
            Design description <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the pendant style, motifs, stone placement, or any reference details…"
            className="min-h-[72px] text-xs"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-foreground">
            Contact phone <span className="text-destructive">*</span>
          </label>
          <Input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+91 …"
            className="h-9 text-xs"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-foreground">Preferred metal (optional)</label>
          <Input
            value={preferredMetal}
            onChange={(e) => setPreferredMetal(e.target.value)}
            placeholder="e.g. 18K gold, silver"
            className="h-9 text-xs"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground">Additional stones (optional)</label>
        <Input
          value={additionalStones}
          onChange={(e) => setAdditionalStones(e.target.value)}
          placeholder="e.g. side diamonds, melee accent stones"
          className="h-9 text-xs"
        />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-foreground">Additional notes (optional)</label>
        <Textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Budget range, timeline, or other preferences…"
          className="min-h-[56px] text-xs"
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" className="h-8 text-xs">
          Save design details
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onCancel}>
          Choose a different design
        </Button>
      </div>
    </form>
  );
}
