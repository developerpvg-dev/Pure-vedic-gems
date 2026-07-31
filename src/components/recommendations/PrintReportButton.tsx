'use client';

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white"
    >
      Print / Save PDF
    </button>
  );
}
