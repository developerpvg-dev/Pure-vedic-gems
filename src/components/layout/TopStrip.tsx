const STRIP_ITEMS = [
  '\u{1F4DE} +91-9871582404',
  '\u2709 info@purevedicgems.com',
  '\u{1F4CD} Delhi \u00B7 Noida \u00B7 London',
  '\u{1F69A} Insured Worldwide Shipping',
  '\u{1F4DE} +91-9310172512',
  '\u2709 info@purevedicgems.com',
  '\u{1F4CD} Saket \u00B7 Sultanpur \u00B7 Hounslow UK',
  '\u{1F69A} Certified \u00B7 Energised \u00B7 Trusted Since 1937',
];

// Duplicate for seamless infinite loop (translate to -50%)
const MARQUEE_ITEMS = [...STRIP_ITEMS, ...STRIP_ITEMS];

export function TopStrip() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-[999] overflow-hidden bg-[var(--pvg-primary)] py-[6px]"
      style={{ height: '32px' }}
    >
      <div
        className="animate-marquee flex whitespace-nowrap text-[11px] tracking-wide text-white/90"
        style={{ animationDuration: '28s', width: 'max-content' }}
      >
        {MARQUEE_ITEMS.map((item, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-6 px-6">
            <span>{item}</span>
            <span className="opacity-25 text-sm leading-none">\u00B7</span>
          </span>
        ))}
      </div>
    </div>
  );
}
