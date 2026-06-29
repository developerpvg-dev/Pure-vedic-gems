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
  /* RUDRAKSHA_CONFIGURATOR — re-enable with RUDRAKSHA_CONFIGURATOR_ENABLED
  const rudraksha = useMemo(
    () => categories.filter((c) => c.type === 'rudraksha'),
    [categories]
  );
  const filteredRudraksha = filterBySearch(rudraksha);
  */

  const renderGemTile = (gem: ExtendedCategoryOption, compactImage = false) => {
    const isSelected = selected === gem.id;
    return (
      <button
        key={gem.id}
        role="radio"
        aria-checked={isSelected}
        aria-label={gem.name}
        onClick={() => onSelect(gem.id)}
        className={cn(
          'group flex flex-col items-center text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          isSelected && 'rounded-xl ring-2 ring-accent/35 ring-offset-2 ring-offset-background'
        )}
      >
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-lg',
            compactImage ? 'aspect-[10/9] bg-muted/40' : 'aspect-square bg-muted'
          )}
        >
          {gem.image_url ? (
            compactImage ? (
              <div className="absolute inset-2 sm:inset-3">
                <div className="relative h-full w-full">
                  <Image
                    src={gem.image_url}
                    alt={gem.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              </div>
            ) : (
              <Image
                src={gem.image_url}
                alt={gem.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )
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

          {isSelected && (
            <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm">
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <span
          className={cn(
            'mt-1 px-1 text-xs font-medium leading-tight',
            isSelected ? 'text-accent' : 'text-foreground group-hover:text-accent/80'
          )}
        >
          {gem.name}
        </span>
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
            {filteredNavaratna.map((gem) => renderGemTile(gem, true))}
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
            {filteredUpratna.map((gem) => renderGemTile(gem, false))}
          </div>
        </div>
      )}

      {/* RUDRAKSHA_CONFIGURATOR — uncomment when RUDRAKSHA_CONFIGURATOR_ENABLED is true
      {(filteredRudraksha.length > 0 || !searchQuery.trim()) && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[1.2px] text-accent">
            Rudraksha — Sacred Beads
          </h3>
          <div role="radiogroup" aria-label="Rudraksha categories" className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {renderGemTile(
              {
                id: 'rudraksha',
                name: 'All Rudraksha',
                sanskrit: '',
                planet: '',
                color: '#5C4A2A',
                type: 'rudraksha',
              },
              false
            )}
            {filteredRudraksha.map((gem) => renderGemTile(gem, false))}
          </div>
        </div>
      )}
      */}

      {filteredNavaratna.length === 0 && filteredUpratna.length === 0 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No gemstones match your search.
        </p>
      )}
    </div>
  );
}
