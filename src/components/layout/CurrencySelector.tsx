'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { getStorefrontCurrency } from '@/lib/currency/catalog';
import { CurrencyFlag } from '@/components/currency/CurrencyFlag';

type Variant = 'nav' | 'topbar' | 'mobile';

export function CurrencySelector({ variant = 'nav' }: { variant?: Variant }) {
  const { currency, currencies, setCurrency, rates } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = getStorefrontCurrency(currency) ?? currencies[0];
  const isTopbar = variant === 'topbar';
  const isMobile = variant === 'mobile';

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const btnSize = isMobile ? 30 : isTopbar ? 26 : 34;
  const flagW = isMobile ? 14 : isTopbar ? 14 : 16;
  const flagH = isMobile ? 10 : isTopbar ? 10 : 11;

  return (
    <div
      ref={rootRef}
      className={`pvg-fx-root pvg-fx-${variant}`}
      style={{ position: 'relative', flexShrink: 0, display: 'block' }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Currency: ${current?.name ?? currency}`}
        title={current?.name ?? currency}
        onClick={() => setOpen((v) => !v)}
        className="pvg-fx-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          height: btnSize,
          padding: isMobile ? '0 7px' : isTopbar ? '0 7px' : '0 8px',
          borderRadius: isMobile ? 999 : 4,
          border: isTopbar
            ? '1px solid rgba(255,255,255,0.22)'
            : isMobile
              ? '1px solid #e5e5e5'
              : '1px solid #e5e5e5',
          background: isTopbar
            ? 'rgba(255,255,255,0.08)'
            : '#fff',
          color: isTopbar ? 'rgba(255,255,255,0.95)' : '#1a1a1a',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          fontFamily: "'Roboto', sans-serif",
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}
      >
        <CurrencyFlag code={currency} width={flagW} height={flagH} />
        <span className="pvg-fx-code" style={{ fontSize: 11, fontWeight: 700 }}>
          {currency}
        </span>
        <span aria-hidden="true" style={{ fontSize: 8, opacity: 0.65, marginLeft: 1 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Select currency"
          className="pvg-fx-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 1300,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            minWidth: 200,
            maxWidth: 'min(260px, calc(100vw - 24px))',
            maxHeight: 'min(280px, 60vh)',
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 6,
            boxShadow: '0 10px 28px rgba(0,0,0,0.14)',
            color: '#1a1a1a',
            scrollbarWidth: 'thin',
            scrollbarColor: '#c4b8a4 transparent',
          }}
        >
          {currencies.map((item) => {
            const selected = item.code === currency;
            const hasRate = item.code === 'INR' || (rates[item.code] != null && rates[item.code] > 0);
            return (
              <li key={item.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={!hasRate}
                  onClick={() => {
                    setCurrency(item.code);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    border: 'none',
                    background: selected ? '#f7f1ea' : 'transparent',
                    color: hasRate ? '#1a1a1a' : '#aaa',
                    fontSize: 12,
                    fontWeight: selected ? 700 : 500,
                    cursor: hasRate ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    fontFamily: "'Roboto', sans-serif",
                  }}
                >
                  <CurrencyFlag code={item.code} width={18} height={12} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', lineHeight: 1.25 }}>{item.name}</span>
                    <span style={{ color: '#888', fontWeight: 500, fontSize: 11 }}>{item.code}</span>
                    {!hasRate ? (
                      <span style={{ display: 'block', fontSize: 10, color: '#b45309' }}>
                        Rate not loaded
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
