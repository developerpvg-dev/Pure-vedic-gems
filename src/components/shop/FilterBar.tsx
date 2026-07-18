'use client';

import '@/app/shop-filter-bar.css';

import { FormEvent, useCallback, useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
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
  { label: 'Default order', value: 'catalog-asc' },
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
  | 'ratti'
  | 'origin'
  | 'planet'
  | 'shape'
  | 'certification'
  | 'certificate_lab'
  | 'treatment'
  | 'quality_tier'
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
  carat: 'Weight (ct)',
  ratti: 'Ratti',
  origin: 'Country',
  planet: 'Planet',
  shape: 'Shape',
  certification: 'Certificate',
  certificate_lab: 'Lab',
  treatment: 'Treatment',
  quality_tier: 'Quality Grade',
  quality_label: 'Quality',
  price_mode: 'Price mode',
  configurator_enabled: 'Jewellery',
};

const INLINE_FILTER_ORDER: FilterKey[] = [
  'price',
  'carat',
  'ratti',
  'certification',
  'quality_tier',
  'category',
  'sub_category',
];

const INLINE_FILTER_LABELS: Partial<Record<FilterKey, string>> = {
  price: 'Price',
  carat: 'Weight (Carat)',
  ratti: 'Weight (Ratti)',
  certification: 'Certification',
  origin: 'Country',
  quality_tier: 'Quality Grade',
  category: 'Category',
  sub_category: 'Family',
  certificate_lab: 'Lab',
  shape: 'Shape',
  treatment: 'Treatment',
  planet: 'Planet',
  availability_status: 'Availability',
  product_type: 'Type',
  quality_label: 'Quality',
  price_mode: 'Price mode',
  configurator_enabled: 'Jewellery',
};

const FILTER_PARAM_KEYS: Partial<Record<FilterKey, string>> = {
  quality_tier: 'quality_label',
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

function InlineFilterChip({
  definition,
  value,
  onChange,
}: {
  definition: FilterDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  const label = INLINE_FILTER_LABELS[definition.key] ?? definition.label;
  const isActive = Boolean(value);

  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue ?? '')}>
      <SelectTrigger
        className={`shop-filter-chip ${isActive ? 'shop-filter-chip--active' : ''}`}
      >
        <SelectValue className="shop-filter-chip__value" placeholder={definition.placeholder} />
        <span className="shop-filter-chip__label">{label}</span>
      </SelectTrigger>
      <SelectContent
        className="shop-filter-dropdown z-[1010]"
        align="start"
        alignItemWithTrigger={false}
        sideOffset={6}
      >
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

function PanelFilterSelect({
  definition,
  value,
  onChange,
}: {
  definition: FilterDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="shop-filter-panel-select">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={definition.label}
        className="shop-filter-panel-select__input"
      >
        <option value="">{definition.placeholder}</option>
        {definition.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}{option.count > 0 ? ` (${option.count})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActiveFilters({
  definitions,
  getValue,
  onClear,
}: {
  definitions: FilterDefinition[];
  getValue: (key: FilterKey | 'q') => string;
  onClear: (key: FilterKey | 'q') => void;
}) {
  const optionMap = new Map(definitions.map((definition) => [definition.key, definition.options]));
  const activeEntries: Array<[FilterKey | 'q', string]> = [
    ['q', getValue('q')],
    ...definitions.map((definition) => [definition.key, getValue(definition.key)] as [FilterKey, string]),
  ];
  const entries = activeEntries.filter(([, value]) => value !== '');

  if (entries.length === 0) return null;

  return (
    <div className="shop-filter-active">
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
  if (
    definition.key === 'price'
    || definition.key === 'carat'
    || definition.key === 'ratti'
    || definition.key === 'configurator_enabled'
    || definition.key === 'origin'
  ) {
    return definition.options.length > 0 || currentValue !== '';
  }
  return definition.options.length > 1 || currentValue !== '';
}

function getFilterParamKey(key: FilterKey) {
  return FILTER_PARAM_KEYS[key] ?? key;
}

const FILTER_SHEET_CLASS =
  'flex h-full max-h-[100dvh] w-full max-w-md flex-col gap-0 overflow-hidden border-brand-border bg-brand-bg p-0 sm:max-w-sm';

function FilterSheetPanel({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
      <SheetContent side="right" className={FILTER_SHEET_CLASS}>
      <SheetHeader className="shrink-0 border-b border-brand-border px-5 py-4 pr-14">
        <SheetTitle className="text-lg text-brand-primary">{title}</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {children}
      </div>
      <div className="shrink-0 space-y-3 border-t border-brand-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {footer}
      </div>
    </SheetContent>
  );
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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [desktopSheetOpen, setDesktopSheetOpen] = useState(false);
  const [searchText, setSearchText] = useState(get('q'));

  useEffect(() => {
    setSearchText(get('q'));
  }, [get]);

  const getFilterValue = useCallback(
    (key: FilterKey) => get(getFilterParamKey(key)),
    [get],
  );

  const readFilterValue = useCallback(
    (key: FilterKey | 'q') => (key === 'q' ? get('q') : getFilterValue(key)),
    [get, getFilterValue],
  );

  const definitions = useMemo<FilterDefinition[]>(() => [
    ...(showCategoryFilter ? [{ key: 'category' as const, label: 'Category', placeholder: 'All categories', options: facets.categories }] : []),
    ...(showSubcategoryFilter ? [{ key: 'sub_category' as const, label: 'Family', placeholder: 'All families', options: facets.subcategories }] : []),
    { key: 'quality_tier', label: 'Quality Grade', placeholder: 'Any quality grade', options: facets.qualityTiers },
    { key: 'origin', label: 'Country', placeholder: 'Any country', options: facets.origins },
    { key: 'ratti', label: 'Ratti', placeholder: 'Any ratti', options: facets.rattiRanges },
    { key: 'price', label: 'Price', placeholder: 'Any price', options: facets.priceRanges },
    { key: 'carat', label: 'Weight (ct)', placeholder: 'Any weight', options: facets.caratRanges },
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

  const visibleDefinitions = definitions.filter((definition) => shouldRenderFilter(definition, getFilterValue(definition.key)));
  const inlineDefinitions = INLINE_FILTER_ORDER
    .map((key) => visibleDefinitions.find((definition) => definition.key === key))
    .filter((definition): definition is FilterDefinition => Boolean(definition));
  const inlineKeys = new Set(inlineDefinitions.map((definition) => definition.key));
  const sheetDefinitions = visibleDefinitions.filter((definition) => !inlineKeys.has(definition.key));

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
    if (definition.key === 'ratti') {
      const [minRatti, maxRatti] = nextValue.split('-');
      updateParam({ ratti: nextValue, min_ratti: minRatti ?? '', max_ratti: maxRatti ?? '' });
      return;
    }
    if (definition.key === 'category') {
      updateParam({ category: nextValue, sub_category: '' });
      return;
    }
    if (definition.key === 'quality_tier') {
      updateParam({ quality_label: nextValue });
      return;
    }
    updateParam({ [definition.key]: nextValue });
  }

  function clearFilter(key: FilterKey | 'q') {
    if (key === 'price') updateParam({ price: '', min_price: '', max_price: '' });
    else if (key === 'carat') updateParam({ carat: '', min_carat: '', max_carat: '' });
    else if (key === 'ratti') updateParam({ ratti: '', min_ratti: '', max_ratti: '' });
    else if (key === 'category') updateParam({ category: '', sub_category: '' });
    else if (key === 'quality_tier') updateParam({ quality_label: '' });
    else updateParam({ [key]: '' });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParam({ q: searchText.trim() });
  }

  const sortValue = get('sort') || `${get('sort_by') || 'catalog'}-${get('sort_order') || 'asc'}`;

  const filterOnlyCount = useMemo(() => {
    let count = 0;
    for (const definition of visibleDefinitions) {
      if (getFilterValue(definition.key)) count += 1;
    }
    return count;
  }, [getFilterValue, visibleDefinitions]);

  const sheetActiveCount = useMemo(() => {
    let count = 0;
    for (const definition of sheetDefinitions) {
      if (getFilterValue(definition.key)) count += 1;
    }
    return count;
  }, [getFilterValue, sheetDefinitions]);

  const inlineSearch = (
    <form onSubmit={submitSearch} className="shop-filter-bar__search">
      <input
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
        placeholder="Search products, SKU, tag..."
        aria-label="Search products"
      />
      {searchText ? (
        <button
          type="button"
          onClick={() => {
            setSearchText('');
            updateParam({ q: '' });
          }}
          className="shop-filter-bar__search-clear"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button type="submit" className="shop-filter-bar__search-submit" aria-label="Search">
        <Search className="shop-filter-bar__search-icon" aria-hidden />
      </button>
    </form>
  );

  const filterFields = (items: FilterDefinition[]) => (
    <div className="grid gap-4">
      {items.map((definition) => (
        <div key={definition.key}>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-brand-muted">
            {INLINE_FILTER_LABELS[definition.key] ?? definition.label}
          </p>
          <PanelFilterSelect
            definition={definition}
            value={getFilterValue(definition.key)}
            onChange={(nextValue) => updateDefinition(definition, nextValue)}
          />
        </div>
      ))}
    </div>
  );

  const sortField = (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-brand-muted">Sort by</p>
      <select
        value={sortValue}
        onChange={(event) => {
          const selectedSort = event.target.value || 'catalog-asc';
          const [sortBy, sortOrder] = selectedSort.split('-');
          updateParam({ sort: selectedSort, sort_by: sortBy ?? 'catalog', sort_order: sortOrder ?? 'asc' });
        }}
        aria-label="Sort products"
        className="shop-filter-panel-select__input"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  const filterSheetContent = (items: FilterDefinition[], includeBrowse = false) => (
    <>
      {includeBrowse ? (
        <div className="lg:hidden">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-brand-muted">Browse</p>
          <MobileCategoryNav />
          <div className="my-5 border-t border-brand-border" />
        </div>
      ) : null}
      {filterFields(items)}
      <div className="mt-4 lg:hidden">{sortField}</div>
    </>
  );

  const mobileFilterSheet = (
    <FilterSheetPanel
      title="Filters"
      footer={(
        <>
          <button
            type="button"
            onClick={() => {
              clearAll();
              setMobileSheetOpen(false);
            }}
            className="w-full rounded-sm border border-brand-border py-2.5 text-[12px] font-medium text-brand-muted transition hover:border-brand-primary hover:text-brand-primary"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={() => setMobileSheetOpen(false)}
            className="w-full rounded-sm bg-[#7A1515] py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#5f1010]"
          >
            Show results{total != null ? ` (${total.toLocaleString('en-IN')})` : ''}
          </button>
        </>
      )}
    >
      {filterSheetContent(visibleDefinitions, true)}
    </FilterSheetPanel>
  );

  const desktopFilterSheet = (
    <FilterSheetPanel
      title="More filters"
      footer={(
        <button
          type="button"
          onClick={clearAll}
          className="w-full rounded-sm border border-brand-border py-2.5 text-[12px] font-medium text-brand-muted transition hover:border-brand-primary hover:text-brand-primary"
        >
          Clear filters
        </button>
      )}
    >
      {filterSheetContent(sheetDefinitions)}
    </FilterSheetPanel>
  );

  return (
    <div className="shop-filter-bar space-y-2">
      <div className="shop-filter-bar__grid">
        {inlineSearch}

        <div className="shop-filter-bar__controls">
          <div className="shop-filter-bar__actions">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger
              className="shop-filter-more-btn shop-filter-bar__sheet-btn shop-filter-bar__sheet-btn--mobile relative"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="shop-filter-more-btn__icon" aria-hidden />
              <span className="shop-filter-more-btn__label">Filters</span>
              {filterOnlyCount > 0 ? (
                <span className="shop-filter-bar__icon-btn-badge">{filterOnlyCount}</span>
              ) : null}
            </SheetTrigger>
            {mobileFilterSheet}
          </Sheet>

          <Sheet open={desktopSheetOpen} onOpenChange={setDesktopSheetOpen}>
            <SheetTrigger
              className="shop-filter-more-btn shop-filter-bar__sheet-btn shop-filter-bar__sheet-btn--desktop relative"
              aria-label="More filters"
            >
              <SlidersHorizontal className="shop-filter-more-btn__icon" aria-hidden />
              <span className="shop-filter-more-btn__label">More filters</span>
              {sheetActiveCount > 0 ? (
                <span className="shop-filter-bar__icon-btn-badge">{sheetActiveCount}</span>
              ) : null}
            </SheetTrigger>
            {desktopFilterSheet}
          </Sheet>

          <div className="shop-filter-bar__chips">
            {inlineDefinitions.map((definition) => (
              <InlineFilterChip
                key={definition.key}
                definition={definition}
                value={getFilterValue(definition.key)}
                onChange={(nextValue) => updateDefinition(definition, nextValue)}
              />
            ))}
          </div>
          </div>

          <div className="shop-filter-bar__sort-wrap">
          <Select
            value={sortValue}
            onValueChange={(nextValue) => {
              const selectedSort = nextValue ?? 'catalog-asc';
              const [sortBy, sortOrder] = selectedSort.split('-');
              updateParam({ sort: selectedSort, sort_by: sortBy ?? 'catalog', sort_order: sortOrder ?? 'asc' });
            }}
          >
            <SelectTrigger className="shop-filter-sort">
              <span>Sort By</span>
              <SelectValue className="sr-only" placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="shop-filter-dropdown z-[1010]" align="start" alignItemWithTrigger={false}>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {total != null ? (
            <span className="shop-filter-bar__count">
              {total.toLocaleString('en-IN')} item{total === 1 ? '' : 's'}
            </span>
          ) : null}
          </div>
        </div>
      </div>

      <ActiveFilters
        definitions={visibleDefinitions}
        getValue={readFilterValue}
        onClear={clearFilter}
      />
    </div>
  );
}