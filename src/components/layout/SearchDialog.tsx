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
import { productHref } from '@/lib/categories/storefront';
import { trackStorefrontEvent } from '@/lib/utils/storefront-analytics';
import type { SearchResponse, SearchResult, SearchResultGroup, SearchResultType } from '@/lib/types/product';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_SEARCHES = ['yellow sapphire', 'ruby', '5.76ct', 'rudraksha', 'emerald'];
const GROUP_ORDER: SearchResultType[] = ['product', 'tool', 'knowledge', 'blog', 'category'];

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
    const source = groups.length > 0
      ? groups
      : results.length > 0
        ? [{ type: 'product' as const, label: 'Results', results }]
        : [];

    return source
      .slice()
      .sort((a, b) => GROUP_ORDER.indexOf(a.type) - GROUP_ORDER.indexOf(b.type))
      .map((group) => ({
        ...group,
        results: group.results.slice(0, group.type === 'product' ? 8 : 3),
      }))
      .filter((group) => group.results.length > 0);
  }, [groups, results]);

  const submitSearch = (value = trimmedQuery) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;

    trackStorefrontEvent('search_submit', { query: nextQuery, result_count: results.length });
    // Close first so Base UI unlocks body scroll before the soft navigation;
    // navigating while the dialog is still locking scroll left a permanent top gap.
    onOpenChange(false);
    window.setTimeout(() => {
      router.push(`/shop?q=${encodeURIComponent(nextQuery)}`);
    }, 0);
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
    if (result.slug) return productHref({ category: result.category, slug: result.slug });
    return '/shop';
  };

  return (
    // trap-focus: keep focus inside, but skip Base UI body scroll-lock.
    // modal scroll-lock + soft nav to /shop?q= left stuck body styles → gap under navbar site-wide.
    <Dialog open={open} onOpenChange={onOpenChange} modal="trap-focus">
      <DialogContent
        overlayClassName="z-[1200]"
        className="fixed top-24 left-1/2 z-[1200] flex max-h-[calc(100vh-6rem)] w-full max-w-2xl -translate-x-1/2 translate-y-0 flex-col overflow-hidden border border-[var(--pvg-border)] bg-brand-bg p-0 text-[var(--pvg-text)] sm:top-28 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b border-[var(--pvg-border)] px-5 py-4">
          <DialogTitle className="font-heading text-lg text-[var(--pvg-primary)]">Search the catalog</DialogTitle>
          <DialogDescription className="text-xs text-[var(--pvg-muted)]">
            Search by gemstone, weight (5.76ct / 6 ratti), SKU, tag number, origin, or planet.
          </DialogDescription>
        </DialogHeader>

        <form
          className="shrink-0 px-5 pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <label className="relative block">
            <input
              id="pvg-site-search"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search yellow sapphire, 5.76ct, GIA tag..."
              className="h-12 w-full rounded-xl border border-[var(--pvg-border)] bg-brand-surface pl-4 pr-12 text-sm outline-none transition focus:border-[var(--pvg-accent)]"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-[var(--pvg-primary)] text-white transition hover:opacity-90"
            >
              <Search className="h-4 w-4" />
            </button>
          </label>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
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
                          <p className="text-xs font-bold text-[var(--pvg-primary)]">
                            {result.type === 'product' && result.price <= 0 ? 'On Demand' : formatPrice(result.price)}
                          </p>
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