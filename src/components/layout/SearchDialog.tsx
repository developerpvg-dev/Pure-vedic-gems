'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Gem, BookOpen, FolderSearch, Newspaper, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils/format';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import type { SearchResponse, SearchResult, SearchResultGroup, SearchResultType } from '@/lib/types/product';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_SEARCHES = ['yellow sapphire', 'ruby', 'rudraksha', 'emerald', 'cat eye'];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!open) return;
    setTimeout(() => document.getElementById('pvg-site-search')?.focus(), 0);
  }, [open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setGroups([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trimmedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { results: [] }))
        .then((data: SearchResponse) => {
          setResults(data.results ?? []);
          setGroups(data.groups ?? []);
        })
        .catch((error: unknown) => {
          if ((error as Error).name !== 'AbortError') {
            setResults([]);
            setGroups([]);
          }
        })
        .finally(() => setIsLoading(false));
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const visibleGroups = useMemo(() => {
    if (groups.length > 0) return groups.map((group) => ({ ...group, results: group.results.slice(0, 6) }));
    if (results.length === 0) return [];
    return [{ type: 'product' as const, label: 'Results', results: results.slice(0, 6) }];
  }, [groups, results]);

  const submitSearch = (value = trimmedQuery) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;

    trackStorefrontEvent('search_submit', { query: nextQuery, result_count: results.length });
    onOpenChange(false);
    router.push(`/shop?q=${encodeURIComponent(nextQuery)}`);
  };

  const getResultIcon = (type?: SearchResultType) => {
    if (type === 'knowledge') return <BookOpen className="h-5 w-5" />;
    if (type === 'blog') return <Newspaper className="h-5 w-5" />;
    if (type === 'tool') return <Wrench className="h-5 w-5" />;
    if (type === 'category') return <FolderSearch className="h-5 w-5" />;
    return <Gem className="h-5 w-5" />;
  };

  const getResultHref = (result: SearchResult) => {
    if (result.href) return result.href;
    if (result.slug) return `/shop/${result.category}/${result.slug}`;
    return '/shop';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border border-[var(--pvg-border)] bg-brand-bg p-0 text-[var(--pvg-text)] sm:max-w-2xl">
        <DialogHeader className="border-b border-[var(--pvg-border)] px-5 py-4">
          <DialogTitle className="font-heading text-lg text-[var(--pvg-primary)]">Search the catalog</DialogTitle>
          <DialogDescription className="text-xs text-[var(--pvg-muted)]">
            Search by gemstone, SKU, tag number, origin, planet, or collection.
          </DialogDescription>
        </DialogHeader>

        <form
          className="px-5 pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pvg-muted)]" />
            <input
              id="pvg-site-search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search yellow sapphire, GIA tag, Rahu, Nepal..."
              className="h-12 w-full rounded-xl border border-[var(--pvg-border)] bg-brand-surface pl-10 pr-4 text-sm outline-none transition focus:border-[var(--pvg-accent)]"
            />
          </label>
        </form>

        <div className="max-h-[60vh] overflow-y-auto px-5 pb-5 pt-4">
          {trimmedQuery.length < 2 ? (
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_SEARCHES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      submitSearch(item);
                    }}
                    className="rounded-full border border-[var(--pvg-border)] px-4 py-2 text-xs font-semibold text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)] hover:text-[var(--pvg-accent)]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-10 text-[var(--pvg-muted)]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : visibleGroups.length > 0 ? (
            <div className="space-y-5">
              {visibleGroups.map((group) => (
                <section key={group.type}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">{group.label}</p>
                  <div className="space-y-2">
                    {group.results.map((result) => (
                      <Link
                        key={result.id}
                        href={getResultHref(result)}
                        onClick={() => onOpenChange(false)}
                        className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border border-transparent p-2 transition hover:border-[var(--pvg-border)] hover:bg-brand-surface"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-brand-bg-alt">
                          {result.thumbnail_url ? (
                            <Image src={result.thumbnail_url} alt={result.name} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[var(--pvg-accent)]">
                              {getResultIcon(result.type)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--pvg-primary)]">{result.title ?? result.name}</p>
                          <p className="truncate text-[11px] text-[var(--pvg-muted)]">
                            {[result.categoryLabel, result.tag_number, result.origin, result.planet, result.description].filter(Boolean).join(' | ')}
                          </p>
                        </div>
                        {typeof result.price === 'number' ? (
                          <p className="text-xs font-bold text-[var(--pvg-primary)]">{formatPrice(result.price)}</p>
                        ) : (
                          <p className="text-[10px] font-bold uppercase tracking-[1.4px] text-[var(--pvg-accent)]">Open</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
              <button
                type="button"
                onClick={() => submitSearch()}
                className="mt-3 w-full rounded-lg border border-[var(--pvg-primary)] px-4 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)] transition hover:bg-brand-primary hover:text-[var(--pvg-bg)]"
              >
                View all results
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--pvg-border)] bg-brand-surface px-5 py-8 text-center">
              <p className="font-heading text-lg text-[var(--pvg-primary)]">No matching products</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--pvg-muted)]">
                Try a broader gemstone name, SKU, origin, planet, or contact us for a sourced recommendation.
              </p>
              <button
                type="button"
                onClick={() => submitSearch()}
                className="mt-5 rounded-lg bg-brand-primary px-5 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)]"
              >
                Search full catalog
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}