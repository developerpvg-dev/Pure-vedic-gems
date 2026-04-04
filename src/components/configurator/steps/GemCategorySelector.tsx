'use client';

/**
 * Step 1 — Select Gemstone Category (Compact)
 * Shows gem cards with only the primary name, smaller size, more per row.
 */

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { NAVARATNA_CATEGORIES } from '@/lib/types/configurator';
import type { GemCategory, GemCategoryOption } from '@/lib/types/configurator';

interface GemCategorySelectorProps {
  selected: GemCategory | null;
  onSelect: (category: GemCategory) => void;
}

interface ExtendedCategoryOption extends GemCategoryOption {
  image_url?: string;
  hover_image_url?: string;
  type?: string;
}

function apiToOption(item: Record<string, unknown>): ExtendedCategoryOption {
  return {
    id: String(item.slug ?? item.id),
    name: String(item.name ?? ''),
    sanskrit: String(item.sanskrit_name ?? ''),
    planet: String(item.planet ?? ''),
    color: String(item.color ?? '#C9A84C'),
    image_url: item.image_url ? String(item.image_url) : undefined,
    hover_image_url: item.hover_image_url ? String(item.hover_image_url) : undefined,
    type: item.type ? String(item.type) : undefined,
  };
}

const FALLBACK: ExtendedCategoryOption[] = NAVARATNA_CATEGORIES.map((g) => ({
  id: g.id,
  name: g.name,
  sanskrit: g.sanskrit,
  planet: g.planet,
  color: g.color,
  type: 'navaratna',
}));

export default function GemCategorySelector({
  selected,
  onSelect,
}: GemCategorySelectorProps) {
  const [categories, setCategories] = useState<ExtendedCategoryOption[]>(FALLBACK);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data: { categories?: Record<string, unknown>[] }) => {
        const list = data?.categories;
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list.map(apiToOption));
        }
      })
      .catch(() => {});
  }, []);

  const navaratna = useMemo(
    () => categories.filter((c) => c.type === 'navaratna' || !c.type),
    [categories]
  );
  const upratna = useMemo(
    () => categories.filter((c) => c.type === 'upratna'),
    [categories]
  );

  const filterBySearch = (list: ExtendedCategoryOption[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (gem) =>
        gem.name.toLowerCase().includes(q) ||
        (gem.sanskrit && gem.sanskrit.toLowerCase().includes(q)) ||
        (gem.planet && gem.planet.toLowerCase().includes(q))
    );
  };

  const filteredNavaratna = filterBySearch(navaratna);
  const filteredUpratna = filterBySearch(upratna);

  const renderGemCard = (gem: ExtendedCategoryOption) => {
    const isSelected = selected === gem.id;
    return (
      <button
        key={gem.id}
        role="radio"
        aria-checked={isSelected}
        aria-label={gem.name}
        onClick={() => onSelect(gem.id)}
        className={cn(
          'group relative overflow-hidden rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          isSelected
            ? 'border-accent ring-2 ring-accent/30 shadow-md'
            : 'border-border hover:border-accent/50'
        )}
      >
        {/* Image area */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {gem.image_url ? (
            <Image
              src={gem.image_url}
              alt={gem.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center"
              style={{
                backgroundImage: `radial-gradient(circle, ${gem.color ?? '#C9A84C'}40, ${gem.color ?? '#C9A84C'}10)`,
              }}
            >
              <span className="h-8 w-8 rounded-full" style={{ backgroundColor: gem.color ?? '#C9A84C' }} />
            </span>
          )}

          {/* Hover image overlay — fades in + subtle scale */}
          {gem.hover_image_url && (
            <div className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <Image
                src={gem.hover_image_url}
                alt={gem.name}
                fill
                className="object-cover scale-100 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          )}

          {/* Selected checkmark badge */}
          {isSelected && (
            <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm">
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Name label */}
        <div className={cn(
          'px-2 py-1.5 text-center',
          isSelected ? 'bg-accent/5' : 'bg-card'
        )}>
          <span className={cn(
            'text-xs font-medium leading-tight',
            isSelected ? 'text-accent' : 'text-foreground'
          )}>
            {gem.name}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Inline search */}
        <div className="relative w-full sm:w-48">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      {/* Navaratna */}
      {filteredNavaratna.length > 0 && (
        <div className="mt-3">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[1.2px] text-accent">
            Navaratna — Sacred Nine Gems
          </h3>
          <div role="radiogroup" aria-label="Navaratna gemstones" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredNavaratna.map(renderGemCard)}
          </div>
        </div>
      )}

      {/* Upratna */}
      {filteredUpratna.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[1.2px] text-accent">
            Upratna — Semi-Precious Gems
          </h3>
          <div role="radiogroup" aria-label="Upratna gemstones" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredUpratna.map(renderGemCard)}
          </div>
        </div>
      )}

      {filteredNavaratna.length === 0 && filteredUpratna.length === 0 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No gemstones match your search.
        </p>
      )}
    </div>
  );
}
