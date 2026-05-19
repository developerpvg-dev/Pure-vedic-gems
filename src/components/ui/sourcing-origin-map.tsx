'use client';

import { useState } from 'react';

const ORIGIN_OPTIONS = [
  {
    gem: 'Burmese Rubies',
    summary: 'Classic ruby origin from the Myanmar ruby belt.',
    locations: [{ name: 'Myanmar (Burma)', note: 'Ruby belt', query: 'Mogok Myanmar ruby mines' }],
  },
  {
    gem: 'Kashmiri & Ceyloni Sapphires',
    summary: 'Two legendary sapphire regions selected for color and rarity.',
    locations: [
      { name: 'Kashmir, India', note: 'Kashmiri sapphires', query: 'Kashmir India sapphire region' },
      { name: 'Sri Lanka', note: 'Ceyloni sapphires', query: 'Ratnapura Sri Lanka sapphire mines' },
    ],
  },
  {
    gem: 'Colombian & Zambian Emeralds',
    summary: 'Emerald sourcing from both South American and African belts.',
    locations: [
      { name: 'Colombia', note: 'Muzo emerald region', query: 'Muzo Colombia emerald mines' },
      { name: 'Zambia', note: 'Zambian emerald belt', query: 'Kagem Zambia emerald mine' },
    ],
  },
  {
    gem: 'Australian Opals',
    summary: 'Opals chosen from trusted Australian supply routes.',
    locations: [{ name: 'Australia', note: 'Opal fields', query: 'Coober Pedy Australia opal fields' }],
  },
  {
    gem: 'Basra & South Sea Pearls',
    summary: 'Pearl sourcing across the Gulf and South Sea routes.',
    locations: [
      { name: 'Persian Gulf', note: 'Basra pearls', query: 'Basra Persian Gulf pearls' },
      { name: 'South Sea', note: 'South Sea pearls', query: 'South Sea pearl farms Australia Indonesia Philippines' },
    ],
  },
  {
    gem: 'Nepali & Indonesian Rudrakshas',
    summary: 'Original Rudraksha sourcing from Nepal and Indonesia.',
    locations: [
      { name: 'Nepal', note: 'Himalayan Rudraksha', query: 'Nepal Rudraksha farms' },
      { name: 'Indonesia', note: 'Java and Bali supply', query: 'Indonesia Rudraksha farms Java Bali' },
    ],
  },
  {
    gem: 'Yellow Sapphires & Hessonites',
    summary: 'Selected for Jyotish quality from Sri Lankan and African sources.',
    locations: [
      { name: 'Sri Lanka', note: 'Yellow sapphires', query: 'Sri Lanka yellow sapphire mines' },
      { name: 'East Africa', note: 'Hessonite sources', query: 'Tanzania hessonite garnet mines' },
    ],
  },
  {
    gem: 'Diamonds & Precious Gems',
    summary: 'A wider verified mine network for diamonds and premium gemstones.',
    locations: [
      { name: 'India', note: 'Cutting and trade route', query: 'Surat India diamond market' },
      { name: 'South Africa', note: 'Diamond belt', query: 'Kimberley South Africa diamond mines' },
      { name: 'Brazil', note: 'Precious gem fields', query: 'Minas Gerais Brazil gemstone mines' },
    ],
  },
] as const;

function mapEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function SourcingOriginMap() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = ORIGIN_OPTIONS[activeIndex];

  return (
    <div className="rounded-3xl border border-[#e8d5a3] bg-[#fdf7ee] p-4 shadow-[0_14px_42px_rgba(61,43,31,0.09)] sm:p-5">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {ORIGIN_OPTIONS.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.gem}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              className={`min-w-60 rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-[#8a6400] bg-[#fff8e6] shadow-[0_8px_22px_rgba(138,100,0,0.16)]'
                  : 'border-[#e8d5a3] bg-white hover:border-[#c9a84c] hover:bg-[#fffaf0]'
              }`}
            >
              <span className="block text-sm font-black text-[#261a10]">{item.gem}</span>
              <span className="mt-1 block text-xs leading-5 text-[#7a6250]">{item.summary}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-[#e8d5a3] bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a6400]">Real map view</p>
            <h3 className="mt-1 text-xl font-black text-[#261a10]">{active.gem}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {active.locations.map((location) => (
              <span key={location.name} className="rounded-full border border-[#e8d5a3] bg-[#fff8e6] px-3 py-1 text-[11px] font-black text-[#261a10]">
                {location.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {active.locations.map((location) => (
            <div key={location.name} className="overflow-hidden rounded-2xl border border-[#e8d5a3] bg-[#fdf7ee]">
              <iframe
                title={`${location.name} sourcing map`}
                src={mapEmbedUrl(location.query)}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-black text-[#261a10]">{location.name}</p>
                  <p className="text-xs text-[#7a6250]">{location.note}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.query)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-full border border-[#c9a84c] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8a6400] transition hover:bg-[#fff8e6]"
                >
                  Open map
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
