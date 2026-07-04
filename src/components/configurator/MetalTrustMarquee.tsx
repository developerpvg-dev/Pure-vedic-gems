import { METAL_TRUST_HIGHLIGHT, METAL_TRUST_POINTS } from '@/lib/constants/trust-credentials';

function BisHallmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
      <circle cx="17" cy="15" r="3" />
      <path d="M16 15l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MetalTrustMarquee() {
  return (
    <section className="pvg-metal-trust-banner" aria-label="BIS hallmark and metal purity certification">
      <div className="pvg-metal-trust-badge">
        <span className="pvg-metal-trust-badge-icon" aria-hidden="true">
          <BisHallmarkIcon />
        </span>
        <span className="pvg-metal-trust-badge-copy">
          <strong>{METAL_TRUST_HIGHLIGHT.title}</strong>
          <span className="pvg-metal-trust-badge-sep" aria-hidden="true">
            ·
          </span>
          <span className="pvg-metal-trust-badge-sub">{METAL_TRUST_HIGHLIGHT.subtitle}</span>
        </span>
      </div>

      <ul className="pvg-metal-trust-chips" role="list">
        {METAL_TRUST_POINTS.map((point) => (
          <li key={point} className="pvg-metal-trust-chip" role="listitem">
            <span className="pvg-metal-trust-chip-icon" aria-hidden="true">
              <CheckIcon />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
