'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

/* ── 9 Navaratna gems with real images ── */
const NAVRATNA = [
  { src: '/stones_img/stone1.png', name: 'Ruby',            planet: 'Sun',     glow: '#FF1744', angle: 0   },
  { src: '/stones_img/stone2.png', name: 'Pearl',           planet: 'Moon',    glow: '#CFD8DC', angle: 40  },
  { src: '/stones_img/stone3.png', name: 'Blue Sapphire',   planet: 'Saturn',  glow: '#1565C0', angle: 80  },
  { src: '/stones_img/stone4.png', name: 'Emerald',         planet: 'Mercury', glow: '#00C853', angle: 120 },
  { src: '/stones_img/stone5.png', name: 'Yellow Sapphire', planet: 'Jupiter', glow: '#FFD600', angle: 160 },
  { src: '/stones_img/stone6.png', name: 'Red Coral',       planet: 'Mars',    glow: '#FF3D00', angle: 200 },
  { src: '/stones_img/stone7.png', name: 'Diamond',         planet: 'Venus',   glow: '#B0BEC5', angle: 240 },
  { src: '/stones_img/stone8.png', name: 'Hessonite',       planet: 'Rahu',    glow: '#E65100', angle: 280 },
  { src: '/stones_img/stone9.png', name: "Cat's Eye",       planet: 'Ketu',    glow: '#C5B358', angle: 320 },
] as const;

export function SplashAnimation() {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'done'>('enter');

  useEffect(() => {
    const seen = sessionStorage.getItem('pvg-splash-seen');
    if (seen) { setPhase('done'); return; }

    document.body.style.overflow = 'hidden';
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 4800);
    const t3 = setTimeout(() => {
      setPhase('done');
      document.body.style.overflow = '';
      sessionStorage.setItem('pvg-splash-seen', '1');
    }, 5600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); document.body.style.overflow = ''; };
  }, []);

  const handleSkip = useCallback(() => {
    setPhase('exit');
    setTimeout(() => {
      setPhase('done');
      document.body.style.overflow = '';
      sessionStorage.setItem('pvg-splash-seen', '1');
    }, 600);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-99999 flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(150deg, #0D0603 0%, #1C0A04 40%, #261408 70%, #0D0905 100%)' }}
      onClick={handleSkip}
      role="presentation"
    >
      {/* ── Deep-space atmosphere layers ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse at 25% 15%, rgba(201,168,76,0.10) 0%, transparent 45%)',
            'radial-gradient(ellipse at 75% 85%, rgba(139,69,19,0.08) 0%, transparent 45%)',
            'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* ── Central golden burst ── */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.16) 0%, rgba(201,168,76,0.06) 28%, transparent 65%)',
        }}
      />

      {/* ── 24 radiating golden rays ── */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2"
        style={{ transform: 'translate(-50%,-50%)', width: 0, height: 0 }}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="splash-ray"
            style={{
              position: 'absolute',
              width: '1px',
              height: `${110 + (i % 4) * 30}px`,
              background: i % 3 === 0
                ? 'linear-gradient(to bottom, rgba(201,168,76,0.55), transparent)'
                : 'linear-gradient(to bottom, rgba(201,168,76,0.20), transparent)',
              transformOrigin: 'top center',
              transform: `rotate(${i * 15}deg)`,
              animationDelay: `${(i * 0.06).toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* ── Decorative concentric rings ── */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {([520, 488, 456] as const).map((sz, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              width: `${sz}px`, height: `${sz}px`, borderRadius: '50%',
              border: `${idx === 0 ? '1px' : '0.5px'} solid rgba(201,168,76,${idx === 0 ? '0.20' : '0.09'})`,
              top: `-${sz / 2}px`, left: `-${sz / 2}px`,
            }}
          />
        ))}
      </div>

      {/* ── Orbiting gem ring with real stone images ── */}
      <div className="pointer-events-none absolute left-1/2 top-1/2">
        <div className="splash-orbit-ring-scaler">
          <div
            className="splash-orbit-ring"
            style={{ width: '480px', height: '480px', borderRadius: '50%', position: 'relative' }}
          >
            {NAVRATNA.map((gem, i) => {
              const rad = (gem.angle * Math.PI) / 180;
              const x   = Math.round(Math.cos(rad) * 240);
              const y   = Math.round(Math.sin(rad) * 240);
              return (
                <div
                  key={i}
                  className="splash-gem-particle"
                  style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    width: '64px', height: '64px',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    animationDelay: `${(i * 0.12).toFixed(2)}s`,
                  }}
                >
                  {/* Counter-rotating wrapper keeps image upright */}
                  <div className="splash-gem-img-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {/* Actual stone image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gem.src}
                      alt={gem.name}
                      style={{
                        width: '64px', height: '64px', objectFit: 'contain',
                        filter: `drop-shadow(0 0 10px ${gem.glow}99) drop-shadow(0 0 5px ${gem.glow}cc)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Center logos and bottom tagline ── */}
      <div
        className={`absolute left-1/2 top-1/2 z-10 flex flex-col items-center gap-3 transition-all duration-1000 -translate-x-1/2 -translate-y-1/2 ${
          phase === 'hold' || phase === 'exit' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Main logo */}
        <div className="splash-logo-img relative" style={{ width: '300px', height: '90px' }}>
          <Image
            src="/PVG NEW LOGO DESIGN.PNG"
            alt="PureVedicGems"
            fill
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 28px rgba(201,168,76,0.55)) drop-shadow(0 0 8px rgba(201,168,76,0.3))' }}
            priority
          />
        </div>

        {/* Brand name */}
        <div className="relative" style={{ width: '270px', height: '48px' }}>
          <Image
            src="/Algerian.png"
            alt="Pure Vedic Gems"
            fill
            className="object-contain"
            style={{ filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.45))' }}
            priority
          />
        </div>
      </div>

      {/* ── Bottom tagline ── */}
      <div
        className={`absolute bottom-16 left-0 right-0 z-10 transition-all duration-1000 ${
          phase === 'hold' || phase === 'exit' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        style={{ textAlign: 'center' }}
      >
        <p
          className="splash-tagline"
          style={{ color: 'rgba(201,168,76,0.85)', fontSize: '12px', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: '500' }}
        >
          Since 1937 · Four Generations of Sacred Trust
        </p>
      </div>

      {/* ── Twinkling star field ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="splash-star"
            style={{
              position: 'absolute',
              width: `${1 + (i % 3)}px`, height: `${1 + (i % 3)}px`,
              borderRadius: '50%',
              background: i % 7 === 0 ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.5)',
              left: `${(i * 19 + 11) % 100}%`,
              top: `${(i * 31 + 7) % 100}%`,
              animationDelay: `${((i * 37) % 30) / 10}s`,
              animationDuration: `${1.5 + ((i * 13) % 30) / 10}s`,
            }}
          />
        ))}
      </div>

      {/* Skip */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 z-20 text-[10px] uppercase tracking-[3px] transition-colors"
        style={{ color: 'rgba(255,255,255,0.25)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)'; }}
      >
        Skip →
      </button>
    </div>
  );
}
