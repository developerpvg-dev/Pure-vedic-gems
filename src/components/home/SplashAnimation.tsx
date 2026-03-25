'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

export function SplashAnimation() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'done'>('enter');

  useEffect(() => {
    // Only show on first visit per session
    const seen = sessionStorage.getItem('pvg-splash-seen');
    if (seen) {
      setPhase('done');
      return;
    }
    setVisible(true);
    document.body.style.overflow = 'hidden';

    // Phase timing
    const holdTimer = setTimeout(() => setPhase('hold'), 100);
    const exitTimer = setTimeout(() => setPhase('exit'), 3400);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      setVisible(false);
      document.body.style.overflow = '';
      sessionStorage.setItem('pvg-splash-seen', '1');
    }, 4200);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = '';
    };
  }, []);

  const handleSkip = useCallback(() => {
    setPhase('exit');
    setTimeout(() => {
      setPhase('done');
      setVisible(false);
      document.body.style.overflow = '';
      sessionStorage.setItem('pvg-splash-seen', '1');
    }, 600);
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #1a0f05 0%, #2C1A0E 40%, #3D2B1F 100%)' }}
      onClick={handleSkip}
      role="presentation"
    >
      {/* Radial cosmic glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Orbiting gems ring */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="splash-orbit-ring"
          style={{
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            border: '1px solid rgba(201,168,76,0.15)',
            position: 'relative',
          }}
        >
          {/* 9 Navaratna gems orbiting */}
          {[
            { emoji: '🔴', angle: 0, color: '#E0115F' },
            { emoji: '⚪', angle: 40, color: '#FDEBD0' },
            { emoji: '🟠', angle: 80, color: '#FF4500' },
            { emoji: '💚', angle: 120, color: '#50C878' },
            { emoji: '💛', angle: 160, color: '#FFD700' },
            { emoji: '💎', angle: 200, color: '#B9F2FF' },
            { emoji: '💙', angle: 240, color: '#0F52BA' },
            { emoji: '🟤', angle: 280, color: '#A0522D' },
            { emoji: '🟡', angle: 320, color: '#C5B358' },
          ].map((gem, i) => {
            const rad = (gem.angle * Math.PI) / 180;
            const x = Math.cos(rad) * 210;
            const y = Math.sin(rad) * 210;
            return (
              <span
                key={i}
                className="splash-gem-particle"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  fontSize: '24px',
                  filter: `drop-shadow(0 0 8px ${gem.color}88)`,
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                {gem.emoji}
              </span>
            );
          })}
        </div>
      </div>

      {/* Radiating golden lines */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="splash-ray"
            style={{
              position: 'absolute',
              width: '1px',
              height: '180px',
              background: 'linear-gradient(to bottom, rgba(201,168,76,0.4), transparent)',
              transformOrigin: 'top center',
              transform: `rotate(${i * 30}deg)`,
              left: '0',
              top: '0',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Centre content — Logo */}
      <div
        className={`relative z-10 flex flex-col items-center gap-6 transition-all duration-1000 ${
          phase === 'hold' || phase === 'exit' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Om symbol — cosmic aura */}
        <div
          className="splash-om-glow mb-2 text-6xl"
          style={{ color: 'rgba(201,168,76,0.7)', textShadow: '0 0 40px rgba(201,168,76,0.5)' }}
        >
          🕉️
        </div>

        {/* Logo image */}
        <div className="relative h-[80px] w-[280px] sm:h-[100px] sm:w-[360px]">
          <Image
            src="/PVG NEW LOGO DESIGN.PNG"
            alt="PureVedicGems Logo"
            fill
            className="object-contain drop-shadow-[0_0_20px_rgba(201,168,76,0.4)]"
            priority
          />
        </div>

        {/* Brand text logo */}
        <div className="relative h-[40px] w-[260px] sm:h-[50px] sm:w-[340px]">
          <Image
            src="/Algerian.png"
            alt="Pure Vedic Gems"
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(201,168,76,0.3)]"
            priority
          />
        </div>

        {/* Tagline */}
        <p
          className="splash-tagline mt-2 text-center font-body text-sm tracking-[6px] uppercase"
          style={{ color: 'rgba(201,168,76,0.65)' }}
        >
          Since 1937 · Four Generations of Trust
        </p>

        {/* Decorative line */}
        <div className="flex items-center gap-3 opacity-40">
          <span className="h-px w-12 bg-[#C9A84C]" />
          <span className="text-xs text-[#C9A84C]">✦</span>
          <span className="h-px w-12 bg-[#C9A84C]" />
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 z-20 text-[10px] uppercase tracking-[3px] text-white/30 transition-colors hover:text-white/60"
      >
        Skip →
      </button>

      {/* Subtle star particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="splash-star"
            style={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.6)',
              left: `${(i * 17 + 13) % 100}%`,
              top: `${(i * 23 + 7) % 100}%`,
              animationDelay: `${((i * 37) % 30) / 10}s`,
              animationDuration: `${2 + ((i * 13) % 30) / 10}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
