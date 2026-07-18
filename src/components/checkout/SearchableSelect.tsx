'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export type SearchableOption = { value: string; label: string; hint?: string };

function normalize(value: string) {
  return value.trim().toLowerCase();
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  listLabel?: string;
  disabled?: boolean;
  hasError?: boolean;
  icon?: ReactNode;
  /** Pin these values at the top when the search box is empty. */
  popularValues?: string[];
  popularLabel?: string;
  allLabel?: string;
  maxResults?: number;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Type to search…',
  emptyLabel = 'No matches',
  listLabel = 'Options',
  disabled = false,
  hasError = false,
  icon,
  popularValues = [],
  popularLabel = 'Popular',
  allLabel = 'All',
  maxResults = 100,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const popularCount = useMemo(() => {
    if (!popularValues.length) return 0;
    return popularValues.filter((v) => options.some((o) => o.value === v)).length;
  }, [options, popularValues]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    const matches = q
      ? options.filter(
          (o) =>
            normalize(o.label).includes(q) ||
            normalize(o.value).includes(q) ||
            (o.hint ? normalize(o.hint).includes(q) : false)
        )
      : options;

    if (q) return matches.slice(0, maxResults);

    if (!popularValues.length) return matches.slice(0, maxResults);

    const popular = popularValues
      .map((v) => matches.find((o) => o.value === v))
      .filter((o): o is SearchableOption => Boolean(o));
    const popularSet = new Set(popular.map((o) => o.value));
    const rest = matches.filter((o) => !popularSet.has(o.value));
    return [...popular, ...rest].slice(0, maxResults);
  }, [options, query, popularValues, maxResults]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlight(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const choice = filtered[highlight];
      if (choice) pick(choice.value);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-lg border bg-brand-bg px-3 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pvg-accent)] disabled:cursor-not-allowed disabled:opacity-55 ${
          hasError ? 'border-red-400' : 'border-[var(--pvg-border)]'
        } ${selected ? 'text-[var(--pvg-text)]' : 'text-[var(--pvg-muted)]'}`}
      >
        {icon}
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.label : placeholder}
        </span>
        {selected?.hint ? (
          <span className="shrink-0 text-xs text-[var(--pvg-muted)]">{selected.hint}</span>
        ) : null}
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--pvg-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-lg border border-[var(--pvg-border)] bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-[var(--pvg-muted)]" />
            <input
              ref={inputRef}
              type="search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-[var(--pvg-text)] placeholder:text-[var(--pvg-muted)] focus:outline-none sm:text-sm"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="rounded p-1 text-[var(--pvg-muted)] hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <ul
            id={listId}
            role="listbox"
            aria-label={listLabel}
            className="max-h-[min(16rem,50vh)] overflow-y-auto overscroll-contain py-1 [-webkit-overflow-scrolling:touch]"
          >
            {!query && popularCount > 0 ? (
              <li className="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--pvg-muted)]">
                {popularLabel}
              </li>
            ) : null}
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-[var(--pvg-muted)]">
                {query ? `${emptyLabel} “${query}”` : emptyLabel}
              </li>
            ) : (
              filtered.map((option, index) => {
                const active = option.value === value;
                const highlighted = index === highlight;
                const showDivider = !query && popularCount > 0 && index === popularCount;
                return (
                  <li key={option.value}>
                    {showDivider ? (
                      <div className="my-1 border-t border-[var(--pvg-border)] px-3 pt-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--pvg-muted)]">
                        {allLabel}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => pick(option.value)}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm ${
                        highlighted ? 'bg-[rgba(138,100,0,0.1)]' : ''
                      } ${active ? 'font-semibold text-[#5c3d00]' : 'text-[var(--pvg-text)]'}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="shrink-0 text-xs text-[var(--pvg-muted)]">{option.hint}</span>
                      ) : null}
                      {active ? <Check className="h-4 w-4 shrink-0 text-[#8a6400]" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
