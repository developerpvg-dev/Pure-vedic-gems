interface OrnamentalDividerProps {
  gem?: string;
  className?: string;
}

export function OrnamentalDivider({ gem = '◆ ◆ ◆', className = '' }: OrnamentalDividerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-4 px-6 py-5 md:px-20 ${className}`}
    >
      <span className="h-px flex-1 bg-[var(--pvg-border)]" />
      <span className="text-[11px] tracking-[6px] text-[var(--pvg-accent)]">
        {gem}
      </span>
      <span className="h-px flex-1 bg-[var(--pvg-border)]" />
    </div>
  );
}
