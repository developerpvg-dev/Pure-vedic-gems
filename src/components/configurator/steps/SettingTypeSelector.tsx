'use client';

/**
 * Step 3 — Select Setting Type
 * 4 options in a 2x2 / 4-col grid using product images.
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SETTING_TYPES, SETTING_TYPE_META } from '@/lib/types/configurator';
import type { SettingType } from '@/lib/types/configurator';

interface SettingTypeSelectorProps {
  selected: SettingType | null;
  onSelect: (type: SettingType) => void;
}

const SETTING_IMAGES: Record<SettingType, string> = {
  ring: '/config_img/ring.png',
  pendant: '/config_img/pandent.png',
  bracelet: '/config_img/bracelet.png',
  loose: '/config_img/loose.png',
};

export default function SettingTypeSelector({
  selected,
  onSelect,
}: SettingTypeSelectorProps) {
  return (
    <div>
      <div className="mt-0 grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Setting type">
        {SETTING_TYPES.map((type) => {
          const meta = SETTING_TYPE_META[type];
          const isSelected = selected === type;

          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              role="radio"
              aria-checked={isSelected}
              className={cn(
                'group flex flex-col overflow-hidden rounded-2xl border text-center transition-all duration-150',
                'hover:border-accent',
                isSelected
                  ? 'border-accent ring-1 ring-accent/30 shadow-sm'
                  : 'border-border bg-card'
              )}
            >
              {/* Image fills the card top — no padding */}
              <div className={cn(
                'relative aspect-4/3 w-full overflow-hidden bg-neutral-50 transition-transform duration-200',
                isSelected ? 'scale-[1.02]' : 'group-hover:scale-[1.02]'
              )}>
                <Image
                  src={SETTING_IMAGES[type]}
                  alt={meta.label}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 45vw, 160px"
                />
              </div>

              {/* Label area */}
              <div className={cn(
                'px-3 py-2.5',
                isSelected ? 'bg-accent/5' : ''
              )}>
                <span className={cn(
                  'block text-sm font-semibold font-heading',
                  isSelected ? 'text-accent' : 'text-primary'
                )}>
                  {meta.label}
                </span>
                {type === 'loose' && (
                  <span className="mt-0.5 block text-[11px] text-muted-foreground leading-tight">
                    Skips design &amp; metal
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
