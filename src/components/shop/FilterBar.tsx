'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useTransition, useState } from 'react';
import { ChevronDown, SlidersHorizontal, X, ChevronRight, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { SIDEBAR_CATEGORIES, useGemCategories } from '@/components/shop/ShopSidebar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Navaratna', value: 'navaratna' },
  { label: 'Upratna', value: 'upratna' },
  { label: 'Rudraksha', value: 'rudraksha' },
  { label: 'Jewelry', value: 'jewelry' },
  { label: 'Malas', value: 'mala' },
  { label: 'Idols', value: 'idol' },
] as const;

const PRICE_RANGES = [
  { label: 'Any Price', value: '' },
  { label: 'Under ₹25,000', value: '0-25000' },
  { label: '₹25,000 – ₹1,00,000', value: '25000-100000' },
  { label: '₹1,00,000 – ₹5,00,000', value: '100000-500000' },
  { label: '₹5,00,000+', value: '500000-' },
];

const ORIGINS = [
  'Sri Lanka',
  'Burma (Myanmar)',
  'Kashmir',
  'Zambia',
  'Colombia',
  'Thailand',
  'Brazil',
  'Australia',
  'India',
  'Nepal',
  'Italy',
];

const PLANETS = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
  'Rahu',
  'Ketu',
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Carat: Low to High', value: 'carat-asc' },
  { label: 'Carat: High to Low', value: 'carat-desc' },
];

// ─── Hook — sync state with URL ────────────────────────────────────────────

function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const get = (key: string) => searchParams.get(key) ?? '';

  const updateParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === '' || v == null) {
          params.delete(k);
        } else {
          params.set(k, v);
        }
      }
      // Reset to page 1 on any filter change
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  return { get, updateParam, clearAll };
}

// ─── Active filter badges ──────────────────────────────────────────────────

function ActiveFilters({
  filters,
  onClear,
}: {
  filters: Record<string, string>;
  onClear: (key: string) => void;
}) {
  const entries = Object.entries(filters).filter(([, v]) => v !== '');
  if (entries.length === 0) return null;

  const LABELS: Record<string, string> = {
    category: 'Category',
    price: 'Price',
    origin: 'Origin',
    planet: 'Planet',
    sort: 'Sort',
  };

  const VALUES: Record<string, Record<string, string>> = {
    category: Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])),
    price: Object.fromEntries(PRICE_RANGES.map((p) => [p.value, p.label])),
    sort: Object.fromEntries(SORT_OPTIONS.map((s) => [s.value, s.label])),
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--pvg-muted)]">
        Active:
      </span>
      {entries.map(([key, val]) => (
        <Badge
          key={key}
          variant="secondary"
          className="flex items-center gap-1 rounded-full bg-[var(--pvg-gold-light)] px-3 py-1 text-[11px] font-medium text-[var(--pvg-primary)] hover:bg-[var(--pvg-accent)] hover:text-white"
        >
          <span>
            {LABELS[key] ?? key}: {VALUES[key]?.[val] ?? val}
          </span>
          <button
            onClick={() => onClear(key)}
            className="ml-1 rounded-full p-0.5 hover:bg-black/10"
            aria-label={`Remove ${key} filter`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

// ─── FilterContent — shared between desktop bar and mobile sheet ───────────

function FilterContent({
  get,
  updateParam,
  clearAll,
  hideCategory,
}: {
  get: (k: string) => string;
  updateParam: (u: Record<string, string>) => void;
  clearAll: () => void;
  hideCategory?: boolean;
}) {
  const hasFilters = ['category', 'price', 'origin', 'planet'].some((k) => get(k) !== '');

  return (
    <div className="flex flex-col gap-5">
      {/* Category — hidden inside mobile sheet since MobileCategoryNav already handles it */}
      {!hideCategory && <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = get('category') === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => updateParam({ category: cat.value })}
                className="rounded-full border px-4 py-1.5 text-[12px] font-semibold tracking-wide transition-all"
                style={{
                  borderColor: active ? 'var(--pvg-primary)' : 'var(--pvg-border)',
                  background: active ? 'var(--pvg-primary)' : 'transparent',
                  color: active ? 'var(--pvg-bg)' : 'var(--pvg-text)',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>}

      {/* Price Range */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">
          Price Range
        </p>
        <Select
          value={get('price') ?? ''}
          onValueChange={(v) => {
            if (!v || v === '') {
              updateParam({ min_price: '', max_price: '', price: '' });
            } else {
              const [min, max] = v.split('-');
              updateParam({ min_price: min ?? '', max_price: max ?? '', price: v });
            }
          }}
        >
          <SelectTrigger className="w-full border-[var(--pvg-border)] bg-[var(--pvg-surface)] text-[13px] text-[var(--pvg-text)]">
            <SelectValue placeholder="Any Price" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Origin */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">
          Origin
        </p>
        <Select value={get('origin') ?? ''} onValueChange={(v) => updateParam({ origin: v ?? '' })}>
          <SelectTrigger className="w-full border-[var(--pvg-border)] bg-[var(--pvg-surface)] text-[13px] text-[var(--pvg-text)]">
            <SelectValue placeholder="Any Origin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Origin</SelectItem>
            {ORIGINS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Planet */}
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">
          Ruling Planet
        </p>
        <Select value={get('planet') ?? ''} onValueChange={(v) => updateParam({ planet: v ?? '' })}>
          <SelectTrigger className="w-full border-[var(--pvg-border)] bg-[var(--pvg-surface)] text-[13px] text-[var(--pvg-text)]">
            <SelectValue placeholder="Any Planet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Planet</SelectItem>
            {PLANETS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full rounded border border-[var(--pvg-border)] py-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--pvg-muted)] transition hover:border-[var(--pvg-primary)] hover:text-[var(--pvg-primary)]"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

// ─── Mobile category tree ────────────────────────────────────────────────────

function MobileCategoryNav() {
  const pathname = usePathname();
  const currentSlug = pathname.split('/shop/')[1]?.split('/')[0] ?? '';
  const categories = useGemCategories();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const cat of SIDEBAR_CATEGORIES) {
      if (cat.slug === currentSlug || cat.subcategories.some(s => s.slug === currentSlug)) {
        init[cat.slug] = true;
      }
    }
    return init;
  });

  return (
    <div className="mb-6">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">Browse Categories</p>
      <div className="space-y-0.5">
        <Link
          href="/shop"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium"
          style={{ color: !currentSlug ? 'var(--pvg-accent)' : 'var(--pvg-text)', background: !currentSlug ? 'var(--pvg-gold-light)' : 'transparent' }}
        >
          All Products
          <ChevronRight className="h-3.5 w-3.5 opacity-40" />
        </Link>
        {categories.map(cat => {
          const isActive = cat.slug === currentSlug;
          const isExpanded = expanded[cat.slug] ?? false;
          const hasSubs = cat.subcategories.length > 0;
          return (
            <div key={cat.slug}>
              <div className="flex items-center">
                <Link
                  href={`/shop/${cat.slug}`}
                  className="flex-1 rounded-lg px-3 py-2 text-[13px] font-medium"
                  style={{ color: isActive ? 'var(--pvg-accent)' : 'var(--pvg-text)', background: isActive ? 'var(--pvg-gold-light)' : 'transparent' }}
                >
                  {cat.label}
                </Link>
                {hasSubs && (
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [cat.slug]: !prev[cat.slug] }))}
                    className="mr-1 flex h-7 w-7 items-center justify-center rounded text-[var(--pvg-muted)]"
                  >
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {hasSubs && isExpanded && (
                <div className="ml-3 space-y-0.5 border-l border-[var(--pvg-border)] pl-3">
                  {cat.subcategories.map(sub => {
                    const isSubActive = sub.slug === currentSlug;
                    return (
                      <Link
                        key={sub.slug}
                        href={`/shop/${sub.slug}`}
                        className="block rounded px-2 py-1.5 text-[12px] transition-colors"
                        style={{ color: isSubActive ? 'var(--pvg-accent)' : 'var(--pvg-muted)', fontWeight: isSubActive ? 600 : 400, background: isSubActive ? 'var(--pvg-gold-light)' : 'transparent' }}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  total?: number;
}

export function FilterBar({ total }: FilterBarProps) {
  const { get, updateParam, clearAll } = useFilters();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeFilters = {
    category: get('category'),
    price: get('price'),
    origin: get('origin'),
    planet: get('planet'),
  };

  return (
    <div className="space-y-3">
      {/* ── Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] px-4 py-3 shadow-sm">
        {/* Left — mobile filter trigger + count */}
        <div className="flex items-center gap-3">
          {/* Mobile: Sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
<SheetTrigger className="flex items-center gap-2 rounded-lg border border-[var(--pvg-border)] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--pvg-primary)] transition hover:border-[var(--pvg-primary)] lg:hidden">
              <LayoutGrid className="h-3.5 w-3.5" />
              Browse
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[90vh] overflow-y-auto rounded-t-2xl border-[var(--pvg-border)] bg-[var(--pvg-bg)] px-5 pb-10 pt-6"
            >
              <SheetHeader className="mb-5">
                <SheetTitle className="font-heading text-lg text-[var(--pvg-primary)]">
                  Browse & Filter
                </SheetTitle>
              </SheetHeader>
              {/* Full category tree — mobile only */}
              <MobileCategoryNav />
              {/* Divider */}
              <div className="mb-5 border-t border-[var(--pvg-border)]" />
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[2px] text-[var(--pvg-muted)]">Filters</p>
              <FilterContent get={get} updateParam={updateParam} clearAll={clearAll} hideCategory />
            </SheetContent>
          </Sheet>

          {/* Count */}
          {total != null && (
            <span className="text-[12px] text-[var(--pvg-muted)]">
              {total.toLocaleString('en-IN')} item{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Right — sort + desktop dropdowns */}
        <div className="flex items-center gap-2">
          {/* Desktop extra filters */}
          <div className="hidden items-center gap-2 lg:flex">
            <Select value={get('price') ?? ''} onValueChange={(v) => {
              if (!v || v === '') {
                updateParam({ min_price: '', max_price: '', price: '' });
              } else {
                const [min, max] = v.split('-');
                updateParam({ min_price: min ?? '', max_price: max ?? '', price: v });
              }
            }}>
              <SelectTrigger className="h-8 w-[160px] border-[var(--pvg-border)] text-[12px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={get('origin') ?? ''} onValueChange={(v) => updateParam({ origin: v ?? '' })}>
              <SelectTrigger className="h-8 w-[140px] border-[var(--pvg-border)] text-[12px]">
                <SelectValue placeholder="Origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Origin</SelectItem>
                {ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={get('planet') ?? ''} onValueChange={(v) => updateParam({ planet: v ?? '' })}>
              <SelectTrigger className="h-8 w-[140px] border-[var(--pvg-border)] text-[12px]">
                <SelectValue placeholder="Planet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Planet</SelectItem>
                {PLANETS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <Select
            value={get('sort') ?? 'newest-desc'}
            onValueChange={(v) => {
              const sv = v ?? 'newest-desc';
              const parts = sv.split('-');
              updateParam({ sort: sv, sort_by: parts[0] ?? '', sort_order: parts[1] ?? '' });
            }}
          >
            <SelectTrigger className="h-8 w-[170px] border-[var(--pvg-border)] text-[12px]">
              <ChevronDown className="mr-1 h-3 w-3 shrink-0 text-[var(--pvg-muted)]" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Mobile / tablet inline filter scroll row (Price, Origin, Planet) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 lg:hidden" style={{ scrollbarWidth: 'none' }}>
        <Select
          value={get('price') ?? ''}
          onValueChange={(v) => {
            if (!v || v === '') {
              updateParam({ min_price: '', max_price: '', price: '' });
            } else {
              const [min, max] = v.split('-');
              updateParam({ min_price: min ?? '', max_price: max ?? '', price: v });
            }
          }}
        >
          <SelectTrigger
            className="h-8 shrink-0 min-w-[128px] rounded-full text-[11px] font-semibold"
            style={{
              borderColor: get('price') ? 'var(--pvg-accent)' : 'var(--pvg-border)',
              color: get('price') ? 'var(--pvg-accent)' : 'var(--pvg-muted)',
              background: get('price') ? 'var(--pvg-gold-light)' : 'var(--pvg-surface)',
            }}
          >
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={get('origin') ?? ''}
          onValueChange={(v) => updateParam({ origin: v ?? '' })}
        >
          <SelectTrigger
            className="h-8 shrink-0 min-w-[116px] rounded-full text-[11px] font-semibold"
            style={{
              borderColor: get('origin') ? 'var(--pvg-accent)' : 'var(--pvg-border)',
              color: get('origin') ? 'var(--pvg-accent)' : 'var(--pvg-muted)',
              background: get('origin') ? 'var(--pvg-gold-light)' : 'var(--pvg-surface)',
            }}
          >
            <SelectValue placeholder="Origin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Origin</SelectItem>
            {ORIGINS.map((o) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={get('planet') ?? ''}
          onValueChange={(v) => updateParam({ planet: v ?? '' })}
        >
          <SelectTrigger
            className="h-8 shrink-0 min-w-[128px] rounded-full text-[11px] font-semibold"
            style={{
              borderColor: get('planet') ? 'var(--pvg-accent)' : 'var(--pvg-border)',
              color: get('planet') ? 'var(--pvg-accent)' : 'var(--pvg-muted)',
              background: get('planet') ? 'var(--pvg-gold-light)' : 'var(--pvg-surface)',
            }}
          >
            <SelectValue placeholder="Ruling Planet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Planet</SelectItem>
            {PLANETS.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Active filter badges ── */}
      <ActiveFilters
        filters={activeFilters}
        onClear={(key) => {
          if (key === 'price') {
            updateParam({ price: '', min_price: '', max_price: '' });
          } else {
            updateParam({ [key]: '' });
          }
        }}
      />
    </div>
  );
}
