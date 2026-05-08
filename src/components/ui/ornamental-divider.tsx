interface OrnamentalDividerProps {
  gem?: string;
  className?: string;
}

export function OrnamentalDivider({ gem = '◆ ◆ ◆', className = '' }: OrnamentalDividerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-4 px-6 py-5 md:px-20 ${className}`}
    >
      <span className="h-px flex-1 bg-brand-border" />
      <span className="text-[11px] text-brand-accent" style={{ letterSpacing: '6px' }}>
        {gem}
      </span>
      <span className="h-px flex-1 bg-brand-border" />
    </div>
  );
}
