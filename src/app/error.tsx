'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <span className="text-[10px] font-semibold uppercase tracking-[5px] text-[var(--pvg-accent)]">
        An unexpected error
      </span>
      <h1 className="mt-4 font-heading text-4xl font-bold text-[var(--pvg-primary)]">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-center text-[var(--pvg-muted)]">
        We apologise for the inconvenience. Please try again or return home.
      </p>
      <button
        onClick={reset}
        className="mt-8 bg-[var(--pvg-primary)] px-10 py-3.5 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-bg)] transition-all hover:-translate-y-0.5 hover:bg-[var(--pvg-accent)] hover:text-[var(--pvg-primary)]"
      >
        Try Again
      </button>
    </main>
  );
}
