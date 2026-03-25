import Link from 'next/link';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <span className="text-[10px] font-semibold uppercase tracking-[5px] text-[var(--pvg-accent)]">
        Lost in the cosmos
      </span>
      <h1 className="mt-4 font-heading text-[clamp(72px,10vw,120px)] font-bold leading-none text-[var(--pvg-primary)]">
        404
      </h1>
      <OrnamentalDivider className="my-4 w-full max-w-xs" />
      <h2 className="font-heading text-2xl font-semibold text-[var(--pvg-primary)]">
        Page Not Found
      </h2>
      <p className="mt-2 max-w-md text-center text-[var(--pvg-muted)]">
        The page you are looking for does not exist or has been moved.
        Perhaps the stars will guide you back home.
      </p>
      <Link
        href="/"
        className="mt-8 bg-[var(--pvg-primary)] px-10 py-3.5 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-bg)] transition-all hover:-translate-y-0.5 hover:bg-[var(--pvg-accent)] hover:text-[var(--pvg-primary)]"
      >
        Return Home
      </Link>
    </main>
  );
}
