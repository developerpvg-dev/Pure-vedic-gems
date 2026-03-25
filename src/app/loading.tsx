import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      {/* Pulsing gem icon */}
      <div className="mb-6 animate-pulse text-4xl text-[var(--pvg-accent)]">◆</div>
      <Skeleton className="h-8 w-48 bg-[var(--pvg-gold-light)]" />
      <Skeleton className="mt-4 h-5 w-80 bg-[var(--pvg-gold-light)]" />
      <div className="mt-8 flex gap-4">
        <Skeleton className="h-11 w-40 bg-[var(--pvg-gold-light)]" />
        <Skeleton className="h-11 w-40 bg-[var(--pvg-gold-light)]" />
      </div>
    </main>
  );
}
