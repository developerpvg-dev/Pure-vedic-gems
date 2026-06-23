'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

type TrustCardData = {
  value: string;
  label: string;
  sub: string;
  icon: ReactNode;
};

const TRUST_CARDS: TrustCardData[] = [
  {
    value: '1937',
    label: 'Established Since',
    sub: '4th Generation Family',
    icon: (
      <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1" />
        <circle cx="36" cy="36" r="26" stroke="#D4A843" strokeWidth="0.7" />
        <circle cx="36" cy="36" r="10" stroke="#D4A843" strokeWidth="0.7" />
        <circle cx="36" cy="36" r="5" fill="#D4A843" opacity="0.3" />
        <line x1="36" y1="2" x2="36" y2="70" stroke="#D4A843" strokeWidth="0.8" />
        <line x1="2" y1="36" x2="70" y2="36" stroke="#D4A843" strokeWidth="0.8" />
        <line x1="11.5" y1="11.5" x2="60.5" y2="60.5" stroke="#D4A843" strokeWidth="0.8" />
        <line x1="60.5" y1="11.5" x2="11.5" y2="60.5" stroke="#D4A843" strokeWidth="0.8" />
        <polygon points="36,8 39,28 36,32 33,28" fill="#B8861E" opacity="0.5" />
        <polygon points="64,36 44,39 40,36 44,33" fill="#B8861E" opacity="0.5" />
        <polygon points="36,64 33,44 36,40 39,44" fill="#B8861E" opacity="0.5" />
        <polygon points="8,36 28,33 32,36 28,39" fill="#B8861E" opacity="0.5" />
        <polygon points="55.5,16.5 41,32 37,30 43,20" fill="#B8861E" opacity="0.35" />
        <polygon points="55.5,55.5 40,41 42,37 52,43" fill="#B8861E" opacity="0.35" />
        <polygon points="16.5,55.5 31,40 35,42 29,52" fill="#B8861E" opacity="0.35" />
        <polygon points="16.5,16.5 31,32 29,36 19,30" fill="#B8861E" opacity="0.35" />
      </svg>
    ),
  },
  {
    value: '87+',
    label: 'Years of Legacy',
    sub: 'Unbroken Heritage',
    icon: (
      <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1" />
        <circle cx="36" cy="36" r="7" fill="#D4A843" opacity="0.25" />
        <circle cx="36" cy="36" r="3" fill="#D4A843" opacity="0.5" />
        <ellipse cx="36" cy="14" rx="5" ry="11" fill="#D4A843" opacity="0.22" />
        <ellipse cx="36" cy="58" rx="5" ry="11" fill="#D4A843" opacity="0.22" />
        <ellipse cx="14" cy="36" rx="11" ry="5" fill="#D4A843" opacity="0.22" />
        <ellipse cx="58" cy="36" rx="11" ry="5" fill="#D4A843" opacity="0.22" />
        <ellipse cx="16.5" cy="16.5" rx="8" ry="5" transform="rotate(-45 16.5 16.5)" fill="#D4A843" opacity="0.18" />
        <ellipse cx="55.5" cy="55.5" rx="8" ry="5" transform="rotate(-45 55.5 55.5)" fill="#D4A843" opacity="0.18" />
        <ellipse cx="55.5" cy="16.5" rx="8" ry="5" transform="rotate(45 55.5 16.5)" fill="#D4A843" opacity="0.18" />
        <ellipse cx="16.5" cy="55.5" rx="8" ry="5" transform="rotate(45 16.5 55.5)" fill="#D4A843" opacity="0.18" />
        <circle cx="36" cy="36" r="20" stroke="#B8861E" strokeWidth="0.5" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    value: '40+',
    label: 'Countries Served',
    sub: 'Global Clientele',
    icon: (
      <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1" />
        <ellipse cx="36" cy="36" rx="22" ry="34" stroke="#D4A843" strokeWidth="0.7" />
        <ellipse cx="36" cy="36" rx="10" ry="34" stroke="#D4A843" strokeWidth="0.5" />
        <line x1="2" y1="36" x2="70" y2="36" stroke="#D4A843" strokeWidth="0.6" />
        <ellipse cx="36" cy="36" rx="34" ry="12" stroke="#D4A843" strokeWidth="0.5" />
        <ellipse cx="36" cy="36" rx="34" ry="22" stroke="#D4A843" strokeWidth="0.4" />
        <circle cx="36" cy="36" r="4" fill="#B8861E" opacity="0.5" />
      </svg>
    ),
  },
  {
    value: '6',
    label: 'Lab Certifications',
    sub: 'GIA · IGI · GRS · IIGJ',
    icon: (
      <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1" />
        <path d="M36 10 L52 18 L52 36 C52 48 36 60 36 60 C36 60 20 48 20 36 L20 18 Z" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.08" />
        <path d="M36 20 L44 24 L44 36 C44 43 36 50 36 50 C36 50 28 43 28 36 L28 24 Z" fill="#D4A843" fillOpacity="0.12" />
        <path d="M29 35 L34 40 L43 28" stroke="#B8861E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    value: 'Vedic',
    label: 'Energized',
    sub: 'Authentic Puja · Video Proof',
    icon: (
      <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1" />
        <polygon points="36,14 56,52 16,52" stroke="#D4A843" strokeWidth="1" fill="#D4A843" fillOpacity="0.07" />
        <polygon points="36,58 56,20 16,20" stroke="#D4A843" strokeWidth="1" fill="#D4A843" fillOpacity="0.07" />
        <circle cx="36" cy="36" r="6" fill="#D4A843" opacity="0.3" />
        <circle cx="36" cy="36" r="2.5" fill="#B8861E" opacity="0.7" />
        <circle cx="36" cy="8" r="1.8" fill="#D4A843" opacity="0.5" />
        <circle cx="64" cy="36" r="1.8" fill="#D4A843" opacity="0.5" />
        <circle cx="36" cy="64" r="1.8" fill="#D4A843" opacity="0.5" />
        <circle cx="8" cy="36" r="1.8" fill="#D4A843" opacity="0.5" />
      </svg>
    ),
  },
  {
    value: '1.5 L+',
    label: 'Certified Customers',
    sub: 'Trusted · Verified · Happy',
    icon: (
      <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1" />
        <circle cx="24" cy="26" r="7" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.12" />
        <circle cx="48" cy="26" r="7" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.12" />
        <circle cx="36" cy="22" r="8" stroke="#B8861E" strokeWidth="1.5" fill="#D4A843" fillOpacity="0.18" />
        <path d="M12 52 C12 42 20 36 28 36 L44 36 C52 36 60 42 60 52" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.1" />
        <path d="M20 52 C20 45 26 40 32 40 L40 40 C46 40 52 45 52 52" stroke="#B8861E" strokeWidth="1.5" fill="#D4A843" fillOpacity="0.15" />
        <circle cx="54" cy="20" r="8" fill="#138808" fillOpacity="0.85" />
        <path d="M50 20 L53 23 L58 17" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
];

const ROTATE_MS = 4000;

function getVisibleCount(width: number) {
  if (width <= 767) return 2;
  if (width <= 1024) return 3;
  return TRUST_CARDS.length;
}

function chunkCards(cards: TrustCardData[], size: number) {
  const pages: TrustCardData[][] = [];
  for (let index = 0; index < cards.length; index += size) {
    pages.push(cards.slice(index, index + size));
  }
  return pages;
}

function TrustCard({ card, revealDelayMs }: { card: TrustCardData; revealDelayMs?: number }) {
  return (
    <div
      className="trust-card trust-card-reveal"
      style={revealDelayMs !== undefined ? { animationDelay: `${revealDelayMs}ms` } : undefined}
    >
      {card.icon}
      <div className="trust-card-value">{card.value}</div>
      <div className="trust-card-label">{card.label}</div>
      <div className="trust-card-sub">{card.sub}</div>
    </div>
  );
}

export function TrustCardsSection() {
  const [visibleCount, setVisibleCount] = useState(TRUST_CARDS.length);
  const [page, setPage] = useState(0);
  const [pageKey, setPageKey] = useState(0);

  const isCarousel = visibleCount < TRUST_CARDS.length;

  const pages = useMemo(
    () => (isCarousel ? chunkCards(TRUST_CARDS, visibleCount) : [TRUST_CARDS]),
    [isCarousel, visibleCount]
  );

  const activePage = isCarousel ? page % pages.length : 0;
  const cardsToShow = pages[activePage] ?? TRUST_CARDS;

  const advancePage = useCallback(() => {
    setPage((current) => (current + 1) % pages.length);
    setPageKey((key) => key + 1);
  }, [pages.length]);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(getVisibleCount(window.innerWidth));
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount, { passive: true });
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  useEffect(() => {
    setPage(0);
    setPageKey((key) => key + 1);
  }, [visibleCount]);

  useEffect(() => {
    if (!isCarousel || pages.length <= 1) return undefined;

    const timer = window.setInterval(advancePage, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [advancePage, isCarousel, pages.length]);

  return (
    <section className="trust-section" aria-label="Trust credentials">
      <div className="trust-inner">
        <div
          key={isCarousel ? `trust-page-${pageKey}` : 'trust-all'}
          className={`trust-cards${isCarousel ? ' trust-cards--rotating' : ''}`}
          id="trustCards"
          data-columns={isCarousel ? visibleCount : TRUST_CARDS.length}
          aria-live={isCarousel ? 'polite' : undefined}
          aria-atomic={isCarousel ? 'true' : undefined}
        >
          {cardsToShow.map((card, cardIndex) => (
            <TrustCard
              key={card.value}
              card={card}
              revealDelayMs={isCarousel ? cardIndex * 120 : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
