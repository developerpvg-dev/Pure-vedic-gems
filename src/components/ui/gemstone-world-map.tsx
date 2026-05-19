'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

type GemLocation = {
  country: string;
  gem: string;
  coordinates: [number, number];
  color: string;
};

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const GEM_SOURCES: GemLocation[] = [
  { country: 'India', gem: 'Ruby, Sapphire, Emerald, Rudraksha', coordinates: [78.9, 22.0], color: '#c24a3a' },
  { country: 'Myanmar', gem: 'Burmese Ruby', coordinates: [96.0, 18.5], color: '#b72435' },
  { country: 'Sri Lanka', gem: 'Ceylon Sapphire', coordinates: [80.8, 7.9], color: '#2f65c8' },
  { country: 'Nepal', gem: 'Himalayan Rudraksha', coordinates: [84.1, 28.4], color: '#7c4a21' },
  { country: 'Thailand', gem: 'Ruby and Sapphire cutting hubs', coordinates: [101.0, 14.0], color: '#8a4bb8' },
  { country: 'Indonesia', gem: 'Rudraksha and organic beads', coordinates: [117.0, -2.0], color: '#5f8c45' },
  { country: 'Australia', gem: 'Opal and Yellow Sapphire', coordinates: [134.0, -25.0], color: '#d49a24' },
  { country: 'Brazil', gem: 'Emerald, Amethyst, Citrine', coordinates: [-52.0, -14.0], color: '#168b5b' },
  { country: 'Colombia', gem: 'Emerald', coordinates: [-74.0, 4.5], color: '#0f9d6a' },
  { country: 'Tanzania', gem: 'Tanzanite and Ruby', coordinates: [34.9, -6.4], color: '#4c57c8' },
  { country: 'South Africa', gem: 'Diamond', coordinates: [25.0, -29.0], color: '#6aa5b8' },
  { country: 'Zambia', gem: 'Emerald', coordinates: [27.9, -13.1], color: '#2b9c5a' },
];

const COUNTRY_COLORS = new Map(GEM_SOURCES.map((source) => [source.country, `${source.color}33`]));
COUNTRY_COLORS.set('United Republic of Tanzania', '#4c57c833');
COUNTRY_COLORS.set('South Africa', '#6aa5b833');

export function GemstoneWorldMap() {
  const [activeLocation, setActiveLocation] = useState<GemLocation | null>(null);

  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-3xl border border-[#d7dfc4] bg-[#eef6e8] p-3 shadow-[0_16px_44px_rgba(61,43,31,0.08)] sm:min-h-96 lg:min-h-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(201,168,76,0.22),transparent_28%),radial-gradient(circle_at_80%_65%,rgba(90,148,104,0.18),transparent_30%)]" />
      <div className="relative h-full min-h-72 overflow-hidden rounded-2xl bg-[#f9f5e9]/85 sm:min-h-80 lg:min-h-full">
        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 138, center: [20, 9] }} className="h-full w-full" width={820} height={390}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geography) => {
                const countryName = String(geography.properties?.name ?? '');
                const fill = COUNTRY_COLORS.get(countryName) ?? '#dfd2b6';

                return (
                  <Geography
                    key={geography.rsmKey}
                    geography={geography}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={0.45}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: COUNTRY_COLORS.has(countryName) ? '#d8bd65' : '#eadfca', outline: 'none' },
                      pressed: { fill: '#c9a84c', outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {GEM_SOURCES.map((source) => {
            const isActive = activeLocation?.country === source.country;
            return (
              <Marker key={source.country} coordinates={source.coordinates}>
                <g
                  className="cursor-pointer"
                  onClick={() => setActiveLocation(source)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setActiveLocation(source);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${source.country}: ${source.gem}`}
                >
                  <circle r={isActive ? 11 : 8} fill={source.color} fillOpacity="0.2" />
                  <circle r={isActive ? 4.8 : 3.8} fill={source.color} stroke="#fffdf6" strokeWidth={1.8} />
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {activeLocation ? (
        <div className="absolute left-5 top-5 max-w-[calc(100%-2.5rem)] rounded-2xl border border-[#e8d5a3] bg-white/95 p-4 shadow-[0_14px_34px_rgba(38,26,16,0.18)] backdrop-blur sm:max-w-76">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a6400]">Gem Source</p>
              <h3 className="mt-1 text-xl font-black text-[#261a10]">{activeLocation.country}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveLocation(null)}
              className="rounded-full border border-[#e8d5a3] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a6400]"
            >
              Close
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#5a4a3a]">{activeLocation.gem}</p>
        </div>
      ) : null}
    </div>
  );
}