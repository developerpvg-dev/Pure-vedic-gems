'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { useGemCategories } from '@/components/shop/ShopSidebar';
import type { ShopFilterOption, ShopFilterOptions } from '@/lib/shop/filters';

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest-desc' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Carat: low to high', value: 'carat-asc' },
  { label: 'Carat: high to low', value: 'carat-desc' },
];

type FilterKey =
  | 'category'
  | 'sub_category'
  | 'product_type'
  | 'availability_status'
  | 'price'
  | 'carat'
  | 'origin'
  | 'planet'
  | 'shape'
  | 'certification'
  | 'certificate_lab'
  | 'treatment'
  | 'quality_label'
  | 'price_mode'
  | 'configurator_enabled';

type FilterDefinition = {
  key: FilterKey;
  label: string;
  placeholder: string;
  options: ShopFilterOption[];
};

const FILTER_LABELS: Record<FilterKey | 'q', string> = {
  q: 'Search',
  category: 'Category',
  sub_category: 'Family',
  product_type: 'Type',
  availability_status: 'Availability',
  price: 'Price',
  carat: 'Weight',
  origin: 'Origin',
  planet: 'Planet',
  shape: 'Shape',
  certification: 'Certificate',
  certificate_lab: 'Lab',
  treatment: 'Treatment',
  quality_label: 'Quality',
  price_mode: 'Price mode',
  configurator_enabled: 'Jewellery',
};

function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const get = useCallback((key: string) => searchParams.get(key) ?? '', [searchParams]);

  const updateParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value == null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete('page');
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return { get, updateParam, clearAll };
}

function getOptionLabel(options: ShopFilterOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function MobileCategoryNav() {
  const pathname = usePathname();
  const categories = useGemCategories();
  const shopParts = pathname.split('/shop/')[1]?.split('/').filter(Boolean) ?? [];
  const currentParentSlug = shopParts[0] ?? '';
  const currentChildSlug = shopParts[1] ?? '';
  const currentSlug = currentChildSlug || currentParentSlug;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const category of categories) {
      if (category.slug === currentParentSlug || category.subcategories.some((subcategory) => subcategory.slug === currentSlug)) {
        init[category.slug] = true;
      }
    }
    return init;
  });

  return (
    <div className="space-y-1">
      <Link
        href="/shop"
        className="flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition"
        style={{
          color: !currentSlug ? 'var(--pvg-primary)' : 'var(--pvg-text)',
          background: !currentSlug ? 'var(--pvg-gold-light)' : 'transparent',
        }}
      >
        All Products
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
      </Link>
      <Link
        href="/shop/directors-pick"
        className="flex items-center justify-between rounded-md px-3 py-2 text-[13px] transition"
        style={{
          color: currentParentSlug === 'directors-pick' ? 'var(--pvg-primary)' : 'var(--pvg-text)',
          background: currentParentSlug === 'directors-pick' ? 'var(--pvg-gold-light)' : 'transparent',
        }}
      >
        Director&apos;s Pick
        <ChevronRight className="h-3.5 w-3.5 opacity-40" />
      </Link>
      {categories.map((category) => {
        const isActive = category.slug === currentParentSlug && !currentChildSlug;
        const isExpanded = expanded[category.slug] ?? false;
        const hasSubcategories = category.subcategories.length > 0;

        return (
          <div key={category.slug}>
            <div className="flex items-center">
              <Link
                href={category.href}
                className="flex-1 rounded-md px-3 py-2 text-[13px] transition"
                style={{
                  color: isActive ? 'var(--pvg-primary)' : 'var(--pvg-text)',
                  background: isActive ? 'var(--pvg-gold-light)' : 'transparent',
                }}
              >
                {category.label}
              </Link>
              {hasSubcategories ? (
                <button
                  type="button"
                  onClick={() => setExpanded((current) => ({ ...current, [category.slug]: !current[category.slug] }))}
                  className="mr-1 flex h-7 w-7 items-center justify-center rounded text-brand-muted transition hover:bg-brand-gold-light"
                  aria-label={`Toggle ${category.label} subcategories`}
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : null}
            </div>
            {hasSubcategories && isExpanded ? (
              <div className="ml-3 space-y-0.5 border-l border-brand-border pl-3">
                {category.subcategories.map((subcategory) => {
                  const isSubActive = subcategory.slug === currentChildSlug || (!currentChildSlug && subcategory.slug === currentParentSlug);
                  return (
                    <Link
                      key={subcategory.slug}
                      href={subcategory.href}
                      className="block rounded px-2 py-1.5 text-[12px] transition-colors"
                      style={{
                        color: isSubActive ? 'var(--pvg-primary)' : 'var(--pvg-muted)',
                        background: isSubActive ? 'var(--pvg-gold-light)' : 'transparent',
                      }}
                    >
                      {subcategory.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FilterSelect({ definition, value, onChange }: { definition: FilterDefinition; value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue ?? '')}>
      <SelectTrigger className="h-10 min-w-35 shrink-0 rounded-md border-brand-border bg-white text-[12px] font-medium text-brand-text shadow-none">
        <SelectValue placeholder={definition.placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">{definition.placeholder}</SelectItem>
        {definition.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}{option.count > 0 ? ` (${option.count})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ActiveFilters({
  definitions,
  get,
  onClear,
}: {
  definitions: FilterDefinition[];
  get: (key: string) => string;
  onClear: (key: FilterKey | 'q') => void;
}) {
  const optionMap = new Map(definitions.map((definition) => [definition.key, definition.options]));
  const activeEntries: Array<[FilterKey | 'q', string]> = [
    ['q', get('q')],
    ...definitions.map((definition) => [definition.key, get(definition.key)] as [FilterKey, string]),
  ];
  const entries = activeEntries.filter(([, value]) => value !== '');

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(([key, value]) => (
        <Badge
          key={key}
          variant="secondary"
          className="flex items-center gap-1 rounded-full bg-brand-gold-light px-3 py-1 text-[11px] font-medium text-brand-primary hover:bg-brand-gold-light"
        >
          <span>
            {FILTER_LABELS[key]}: {key === 'q' ? value : getOptionLabel(optionMap.get(key) ?? [], value)}
          </span>
          <button
            type="button"
            onClick={() => onClear(key)}
            className="ml-1 rounded-full p-0.5 transition hover:bg-black/10"
            aria-label={`Remove ${FILTER_LABELS[key]} filter`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

function shouldRenderFilter(definition: FilterDefinition, currentValue: string) {
  if (definition.key === 'price' || definition.key === 'carat' || definition.key === 'configurator_enabled') {
    return definition.options.length > 0 || currentValue !== '';
  }
  return definition.options.length > 1 || currentValue !== '';
}

interface FilterBarProps {
  total?: number;
  facets: ShopFilterOptions;
  showCategoryFilter?: boolean;
  showSubcategoryFilter?: boolean;
}

export function FilterBar({
  total,
  facets,
  showCategoryFilter = false,
  showSubcategoryFilter = false,
}: FilterBarProps) {
  const { get, updateParam, clearAll } = useFilters();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchText, setSearchText] = useState(get('q'));

  useEffect(() => {
    setSearchText(get('q'));
  }, [get]);

  const definitions = useMemo<FilterDefinition[]>(() => [
    ...(showCategoryFilter ? [{ key: 'category' as const, label: 'Category', placeholder: 'All categories', options: facets.categories }] : []),
    ...(showSubcategoryFilter ? [{ key: 'sub_category' as const, label: 'Family', placeholder: 'All families', options: facets.subcategories }] : []),
    { key: 'price', label: 'Price', placeholder: 'Any price', options: facets.priceRanges },
    { key: 'carat', label: 'Weight', placeholder: 'Any weight', options: facets.caratRanges },
    { key: 'origin', label: 'Origin', placeholder: 'Any origin', options: facets.origins },
    { key: 'planet', label: 'Planet', placeholder: 'Any planet', options: facets.planets },
    { key: 'shape', label: 'Shape', placeholder: 'Any shape', options: facets.shapes },
    { key: 'certification', label: 'Certificate', placeholder: 'Any certificate', options: facets.certifications },
    { key: 'certificate_lab', label: 'Lab', placeholder: 'Any lab', options: facets.certificateLabs },
    { key: 'treatment', label: 'Treatment', placeholder: 'Any treatment', options: facets.treatments },
    { key: 'quality_label', label: 'Quality', placeholder: 'Any quality', options: facets.qualityLabels },
    { key: 'availability_status', label: 'Availability', placeholder: 'In stock', options: facets.availabilityStatuses },
    { key: 'product_type', label: 'Type', placeholder: 'Any type', options: facets.productTypes },
    { key: 'price_mode', label: 'Price mode', placeholder: 'Any price mode', options: facets.priceModes },
    { key: 'configurator_enabled', label: 'Jewellery', placeholder: 'Any jewellery option', options: facets.configuratorOptions },
  ], [facets, showCategoryFilter, showSubcategoryFilter]);

  const visibleDefinitions = definitions.filter((definition) => shouldRenderFilter(definition, get(definition.key)));
  const primaryOrder: FilterKey[] = ['category', 'sub_category', 'price', 'carat', 'origin', 'availability_status'];
  const primaryDefinitions = primaryOrder
    .map((key) => visibleDefinitions.find((definition) => definition.key === key))
    .filter((definition): definition is FilterDefinition => Boolean(definition))
    .slice(0, 4);
  const primaryKeys = new Set(primaryDefinitions.map((definition) => definition.key));
  const moreDefinitions = visibleDefinitions.filter((definition) => !primaryKeys.has(definition.key));

  function updateDefinition(definition: FilterDefinition, nextValue: string) {
    if (definition.key === 'price') {
      const [minPrice, maxPrice] = nextValue.split('-');
      updateParam({ price: nextValue, min_price: minPrice ?? '', max_price: maxPrice ?? '' });
      return;
    }
    if (definition.key === 'carat') {
      const [minCarat, maxCarat] = nextValue.split('-');
      updateParam({ carat: nextValue, min_carat: minCarat ?? '', max_carat: maxCarat ?? '' });
      return;
    }
    if (definition.key === 'category') {
      updateParam({ category: nextValue, sub_category: '' });
      return;
    }
    updateParam({ [definition.key]: nextValue });
  }

  function clearFilter(key: FilterKey | 'q') {
    if (key === 'price') updateParam({ price: '', min_price: '', max_price: '' });
    else if (key === 'carat') updateParam({ carat: '', min_carat: '', max_carat: '' });
    else if (key === 'category') updateParam({ category: '', sub_category: '' });
    else updateParam({ [key]: '' });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam({ q: searchText.trim() });
  }

  const sortValue = get('sort') || `${get('sort_by') || 'newest'}-${get('sort_order') || 'desc'}`;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-brand-border bg-white px-3 py-3 shadow-[0_10px_26px_rgba(61,43,31,0.06)]">
        <div className="flex items-center gap-2 overflow-x-auto lg:overflow-visible" style={{ scrollbarWidth: 'none' }}>
          <form onSubmit={submitSearch} className="relative min-w-60 flex-1 lg:min-w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search products, SKU, tag..."
              className="h-10 w-full rounded-md border border-brand-border bg-brand-bg/60 pl-9 pr-9 text-[13px] text-brand-text outline-none transition focus:border-brand-accent"
            />
            {searchText ? (
              <button
                type="button"
                onClick={() => {
                  setSearchText('');
                  updateParam({ q: '' });
                }}
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brand-muted transition hover:bg-brand-gold-light hover:text-brand-primary"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </form>

          {primaryDefinitions.map((definition) => (
            <FilterSelect
              key={definition.key}
              definition={definition}
              value={get(definition.key)}
              onChange={(nextValue) => updateDefinition(definition, nextValue)}
            />
          ))}

          {moreDefinitions.length > 0 ? (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-brand-border bg-white px-3 text-[12px] font-medium text-brand-primary transition hover:border-brand-accent hover:text-brand-accent">
                <SlidersHorizontal className="h-4 w-4" />
                More filters
              </SheetTrigger>
              <SheetContent side="right" className="w-[92vw] max-w-md overflow-y-auto border-brand-border bg-brand-bg px-5 pb-8 pt-5">
                <SheetHeader className="px-0 pb-2 pt-0">
                  <SheetTitle className="text-lg text-brand-primary">More filters</SheetTitle>
                </SheetHeader>
                <div className="lg:hidden">
                  <p className="mb-2 text-[11px] font-medium text-brand-muted">Browse</p>
                  <MobileCategoryNav />
                  <div className="my-5 border-t border-brand-border" />
                </div>
                <div className="grid gap-4">
                  {moreDefinitions.map((definition) => (
                    <div key={definition.key}>
                      <p className="mb-2 text-[11px] font-medium text-brand-muted">
                        {definition.label}
                      </p>
                      <FilterSelect
                        definition={definition}
                        value={get(definition.key)}
                        onChange={(nextValue) => updateDefinition(definition, nextValue)}
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-6 w-full rounded-md border border-brand-border py-2.5 text-[12px] font-medium text-brand-muted transition hover:border-brand-primary hover:text-brand-primary"
                >
                  Clear filters
                </button>
              </SheetContent>
            </Sheet>
          ) : null}

          <Select
            value={sortValue}
            onValueChange={(nextValue) => {
              const selectedSort = nextValue ?? 'newest-desc';
              const [sortBy, sortOrder] = selectedSort.split('-');
              updateParam({ sort: selectedSort, sort_by: sortBy ?? 'newest', sort_order: sortOrder ?? 'desc' });
            }}
          >
            <SelectTrigger className="h-10 min-w-42 shrink-0 rounded-md border-brand-border bg-white text-[12px] font-medium text-brand-text shadow-none">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {total != null ? (
            <span className="shrink-0 whitespace-nowrap pl-1 text-[12px] text-brand-muted">
              {total.toLocaleString('en-IN')} item{total === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </div>

      <ActiveFilters definitions={visibleDefinitions} get={get} onClear={clearFilter} />
    </div>
  );
}