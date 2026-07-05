import { ShieldCheck } from 'lucide-react';
import { METAL_TRUST_HIGHLIGHT } from '@/lib/constants/trust-credentials';

export default function MetalTrustMarquee() {
  return (
    <div className="pvg-metal-trust" role="status">
      <ShieldCheck className="pvg-metal-trust-icon" aria-hidden />
      <p className="pvg-metal-trust-copy">
        <strong>{METAL_TRUST_HIGHLIGHT.title}</strong>
        {' — '}
        {METAL_TRUST_HIGHLIGHT.detail}
      </p>
    </div>
  );
}
