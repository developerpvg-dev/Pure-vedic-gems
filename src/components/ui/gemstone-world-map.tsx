'use client';

import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

type GemLocation = {
  country: string;
  gem: string;
  coordinates: [number, number];
  color: string;
};

const GEO_URL = '/geo/countries-110m.json';
const MAP_WIDTH = 820;
const MAP_HEIGHT = 390;

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

const COUNTRY_COLORS = new Map(
  GEM_SOURCES.map((source) => [source.country, `${source.color}44`])
);

function getCountryFill(countryName: string) {
  return COUNTRY_COLORS.get(countryName) ?? '#dfd2b6';
}

export function GemstoneWorldMap() {
  const [activeLocation, setActiveLocation] = useState<GemLocation | null>(null);
  const [geoReady, setGeoReady] = useState(false);
  const [geoError, setGeoError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(GEO_URL)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load map data');
        return response.json();
      })
      .then(() => {
        if (!cancelled) setGeoReady(true);
      })
      .catch(() => {
        if (!cancelled) setGeoError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pvg-gemstone-world-map relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-3xl border border-[#d7dfc4] bg-[#eef6e8] p-3 shadow-[0_16px_44px_rgba(61,43,31,0.08)] sm:min-h-[340px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(201,168,76,0.22),transparent_28%),radial-gradient(circle_at_80%_65%,rgba(90,148,104,0.18),transparent_30%)]" />

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-[#f9f5e9]/90">
        {geoError ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-6 text-[#5a4a3a]">
            The sourcing map could not be loaded. Please refresh the page.
          </div>
        ) : !geoReady ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[#dfd2b6]" aria-hidden="true" />
            <p className="text-sm text-[#6b5b4e]">Loading gemstone sourcing map…</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 158, center: [18, 4] }}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              className="pvg-gemstone-world-map-svg h-full w-full max-h-full max-w-full"
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geography) => {
                    const countryName = String(geography.properties?.name ?? '');
                    const highlighted = COUNTRY_COLORS.has(countryName);
                    const fill = getCountryFill(countryName);

                    return (
                      <Geography
                        key={geography.rsmKey}
                        geography={geography}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={0.45}
                        style={{
                          default: { outline: 'none' },
                          hover: { fill: highlighted ? '#d8bd65' : '#eadfca', outline: 'none' },
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
        )}
      </div>

      {activeLocation ? (
        <div className="absolute left-4 top-4 z-10 max-w-[calc(100%-2rem)] rounded-2xl border border-[#e8d5a3] bg-white/95 p-4 shadow-[0_14px_34px_rgba(38,26,16,0.18)] backdrop-blur sm:left-5 sm:top-5 sm:max-w-xs">
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
