'use client';

import { useTheme } from '@/lib/theme-context';

const PALETTES = [
  { id: 1, name: 'Parchment & Antique Gold', swatches: ['#3D2B1F', '#C9A84C', '#FDF7EE', '#261A10'] },
  { id: 2, name: 'Espresso & Dark Gold', swatches: ['#4A2C2A', '#B8860B', '#FAF3E8', '#2E1B10'] },
  { id: 3, name: 'Warm Brown & Bright Gold', swatches: ['#5C3D2E', '#E0A830', '#FFF9F2', '#3A2215'] },
  { id: 4, name: 'Cognac & Bronze', swatches: ['#6B4226', '#A88234', '#FDF8F3', '#3D2417'] },
];

const FONTS = [
  { id: 1, heading: 'Playfair Display', body: 'DM Sans' },
  { id: 2, heading: 'Cormorant Garamond', body: 'Nunito Sans' },
  { id: 3, heading: 'Lora', body: 'Source Sans 3' },
  { id: 4, heading: 'Libre Baskerville', body: 'Karla' },
  { id: 5, heading: 'Merriweather', body: 'Open Sans' },
  { id: 6, heading: 'EB Garamond', body: 'Lato' },
];

export function ThemeSwitcher() {
  const { palette, font, setPalette, setFont } = useTheme();

  if (process.env.NEXT_PUBLIC_SHOW_THEME_SWITCHER !== 'true') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[10000] w-72 rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-surface)] p-5 shadow-xl">
      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[3px] text-[var(--pvg-primary)]">
        Theme Controls
      </h3>

      {/* Palette buttons */}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--pvg-muted)]">
        Colour Palette
      </p>
      <div className="mb-4 flex flex-col gap-1.5">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPalette(p.id)}
            className={`flex items-center gap-2.5 rounded px-3 py-2 text-left text-[13px] transition-all border ${
              palette === p.id
                ? 'border-[var(--pvg-accent)] bg-[var(--pvg-gold-light)]'
                : 'border-[var(--pvg-border)] bg-[var(--pvg-surface)] hover:border-[var(--pvg-accent)]'
            }`}
          >
            <span className="flex gap-1">
              {p.swatches.map((c, i) => (
                <span
                  key={i}
                  className="h-[18px] w-[18px] rounded-full border border-black/8"
                  style={{ background: c }}
                />
              ))}
            </span>
            <span className="text-[var(--pvg-text)]">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Font buttons */}
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-[var(--pvg-muted)]">
        Font Pairing
      </p>
      <div className="flex flex-col gap-1.5">
        {FONTS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFont(f.id)}
            className={`rounded px-3 py-2 text-left transition-all border ${
              font === f.id
                ? 'border-[var(--pvg-accent)] bg-[var(--pvg-gold-light)]'
                : 'border-[var(--pvg-border)] bg-[var(--pvg-surface)] hover:border-[var(--pvg-accent)]'
            }`}
          >
            <div className="text-[15px] text-[var(--pvg-text)]">{f.heading}</div>
            <div className="text-[11px] text-[var(--pvg-muted)]">{f.body} — body</div>
          </button>
        ))}
      </div>
    </div>
  );
}
